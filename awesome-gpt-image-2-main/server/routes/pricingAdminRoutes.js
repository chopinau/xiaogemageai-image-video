import { Router } from 'express';
import * as PricingEngine from '../services/pricingEngine.js';
import * as UpstreamFetcher from '../services/upstreamPriceFetcher.js';
import { lingkeClient } from '../services/lingkeClient.js';

const router = Router();

function requireAuth(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  const configuredKey = process.env.ADMIN_KEY || 'admin123';
  if (adminKey !== configuredKey) {
    return res.status(401).json({ success: false, error: '需要管理员权限' });
  }
  next();
}

router.get('/', (req, res) => {
  const data = PricingEngine.loadPricingData();
  res.json({ success: true, data });
});

router.get('/models', (req, res) => {
  const models = PricingEngine.getAllModels();
  const markupConfig = PricingEngine.getMarkupConfig();
  res.json({ success: true, models, markupConfig });
});

router.put('/price', requireAuth, (req, res) => {
  const { category, modelId, resolution, newPrice, reason } = req.body;
  if (!category || !modelId || newPrice === undefined) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  const result = PricingEngine.updateModelPrice(category, modelId, resolution, newPrice, reason || '手动调整');
  res.json({ success: result.success, ...result });
});

router.put('/batch-prices', requireAuth, (req, res) => {
  const { updates, reason } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ success: false, error: '缺少更新列表' });
  }
  const results = PricingEngine.batchUpdatePrices(updates, reason || '批量调整');
  res.json({ success: true, results });
});

router.get('/markup', (req, res) => {
  const config = PricingEngine.getMarkupConfig();
  res.json({ success: true, config });
});

router.put('/markup', requireAuth, (req, res) => {
  const { defaultPercent, perModel } = req.body;
  const current = PricingEngine.getMarkupConfig();
  const newConfig = {
    defaultPercent: defaultPercent !== undefined ? defaultPercent : current.defaultPercent,
    perModel: perModel !== undefined ? perModel : current.perModel
  };
  const result = PricingEngine.setMarkupConfig(newConfig);
  res.json(result);
});

router.put('/markup/:modelId', requireAuth, (req, res) => {
  const { modelId } = req.params;
  const { markupPercent } = req.body;
  if (markupPercent === undefined) {
    return res.status(400).json({ success: false, error: '缺少 markupPercent 参数' });
  }
  const result = PricingEngine.setModelMarkup(modelId, markupPercent);
  res.json(result);
});

router.get('/history', (req, res) => {
  const { type, model, page, limit } = req.query;
  const history = PricingEngine.getPriceHistory({ type, model, page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
  res.json({ success: true, ...history });
});

router.get('/alerts', (req, res) => {
  const alerts = PricingEngine.getPriceAlerts();
  res.json({ success: true, alerts });
});

router.post('/reload', requireAuth, (req, res) => {
  const data = PricingEngine.reloadPricing();
  res.json({ success: true, data });
});

router.get('/upstream/providers', (req, res) => {
  const providers = UpstreamFetcher.getProviders();
  res.json({ success: true, providers });
});

router.post('/upstream/providers', requireAuth, (req, res) => {
  const { name, url, apiKey } = req.body;
  if (!name || !url || !apiKey) {
    return res.status(400).json({ success: false, error: '缺少 name, url 或 apiKey' });
  }
  const provider = UpstreamFetcher.addProvider(name, url, apiKey);
  res.json({ success: true, provider: { ...provider, apiKey: provider.apiKey.substring(0, 8) + '...' } });
});

router.delete('/upstream/providers/:name', requireAuth, (req, res) => {
  const result = UpstreamFetcher.removeProvider(req.params.name);
  res.json(result);
});

router.post('/upstream/fetch', requireAuth, async (req, res) => {
  try {
    const { providerName } = req.body;
    let result;
    if (providerName) {
      result = await UpstreamFetcher.fetchSingleProviderPrices(providerName);
    } else {
      result = await UpstreamFetcher.fetchAllProviderPrices();
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/upstream/prices', (req, res) => {
  const prices = UpstreamFetcher.getFetchedPrices();
  res.json({ success: true, data: prices });
});

router.get('/upstream/match', (req, res) => {
  const { provider, model } = req.query;
  if (!provider || !model) {
    return res.status(400).json({ success: false, error: '缺少 provider 或 model 参数' });
  }
  const match = UpstreamFetcher.matchUpstreamPrice(provider, model);
  if (!match) {
    return res.json({ success: false, error: '未找到匹配的价格数据' });
  }
  const markup = PricingEngine.getEffectiveMarkup(model);
  const sellingPrice = PricingEngine.calculateSellingPrice(match.cheapest?.base_price || 0, model);
  res.json({ success: true, match, markup, sellingPrice });
});

router.post('/upstream/apply', requireAuth, (req, res) => {
  const { providerName, modelMappings } = req.body;
  if (!providerName || !Array.isArray(modelMappings)) {
    return res.status(400).json({ success: false, error: '缺少 providerName 或 modelMappings' });
  }
  const upstreamResult = UpstreamFetcher.applyUpstreamPrices(providerName, modelMappings);
  if (!upstreamResult.success) {
    return res.json(upstreamResult);
  }

  const savedResults = [];
  for (const item of upstreamResult.results) {
    if (!item.success) {
      savedResults.push(item);
      continue;
    }
    const { category, resolution } = resolveModelCategory(item.localModel);
    const saveResult = PricingEngine.updateModelPrice(
      category, item.localModel, resolution, item.finalPrice,
      `上游同步: ${providerName} - ${item.groupName} (上游价: ${item.upstreamPrice})`
    );
    savedResults.push({ ...item, saved: saveResult.success, ...saveResult });
  }

  res.json({ success: true, results: savedResults });
});

function resolveModelCategory(modelId) {
  if (!modelId) return { category: 'imageModels', resolution: '1k' };
  const lower = modelId.toLowerCase();
  if (lower.includes('video') || ['kling', 'sora', 'runway', 'pika', 'hailuo', 'veo', 'luma', 'seedance'].some(k => lower.includes(k))) {
    return { category: 'videoModels', resolution: 'perSecond' };
  }
  if (lower.includes('psd') || lower.includes('layer') || ['bria', 'color-splitting', 'image-assembly'].some(k => lower.includes(k))) {
    return { category: 'psdServices', resolution: 'perRequest' };
  }
  if (lower.includes('gpt-4') || lower.includes('claude') || lower.includes('llama') || lower.includes('qwen') || (lower.includes('deepseek') && !lower.includes('image'))) {
    return { category: 'textModels', resolution: 'perRequest' };
  }
  if (lower.includes('edit') || lower.includes('inpaint') || lower.includes('remove') || lower.includes('restore') || lower.includes('kontext')) {
    return { category: 'editModels', resolution: '1k' };
  }
  return { category: 'imageModels', resolution: '1k' };
}

router.get('/live/:model', async (req, res) => {
  try {
    const { model } = req.params;
    const apiKey = req.headers['x-api-key'] || process.env.LINGKE_API_KEY;
    const result = await lingkeClient.getModelPricing(model, apiKey);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/live/fetch-all', requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.LINGKE_API_KEY;
    let result = await lingkeClient.getAllModelPricings(apiKey);
    if (!result.success || !result.data || Object.keys(result.data).length === 0) {
      result = await lingkeClient.getApiPricing(apiKey);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
