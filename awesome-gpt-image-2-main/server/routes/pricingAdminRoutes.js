import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as PricingEngine from '../services/pricingEngine.js';
import * as UpstreamFetcher from '../services/upstreamPriceFetcher.js';
import { lingkeClient } from '../services/lingkeClient.js';
import * as HealthMonitor from '../services/providerHealthMonitor.js';
import apiProtection from '../services/apiProtectionService.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROVIDERS_PATH = path.join(__dirname, '..', 'data', 'upstreamProviders.json');

const router = Router();

const requireAdmin = [authMiddleware, adminMiddleware];

router.get('/', (req, res) => {
  const data = PricingEngine.loadPricingData();
  res.json({ success: true, data });
});

router.get('/models', (req, res) => {
  const models = PricingEngine.getAllModels();
  const markupConfig = PricingEngine.getMarkupConfig();
  res.json({ success: true, models, markupConfig });
});

router.put('/price', requireAdmin, (req, res) => {
  const { category, modelId, resolution, newPrice, reason } = req.body;
  if (!category || !modelId || newPrice === undefined) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  const result = PricingEngine.updateModelPrice(category, modelId, resolution, newPrice, reason || '手动调整');
  res.json({ success: result.success, ...result });
});

router.put('/batch-prices', requireAdmin, (req, res) => {
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

router.put('/markup', requireAdmin, (req, res) => {
  const { defaultPercent, perModel } = req.body;
  const current = PricingEngine.getMarkupConfig();
  const newConfig = {
    defaultPercent: defaultPercent !== undefined ? defaultPercent : current.defaultPercent,
    perModel: perModel !== undefined ? perModel : current.perModel
  };
  const result = PricingEngine.setMarkupConfig(newConfig);
  res.json(result);
});

router.put('/markup/:modelId', requireAdmin, (req, res) => {
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

router.post('/reload', requireAdmin, (req, res) => {
  const data = PricingEngine.reloadPricing();
  res.json({ success: true, data });
});

router.get('/strategy-pricing/:modelId', (req, res) => {
  const { modelId } = req.params;
  const allPricing = PricingEngine.getAllPricing();
  let basePrice = 0;
  for (const category of ['imageModels', 'videoModels', 'editModels']) {
    if (allPricing[category]?.[modelId]) {
      const model = allPricing[category][modelId];
      basePrice = model.prices?.[model.defaultResolution || '1k'] || model.pricePerSecond * (model.minDuration || 5) || 0;
      break;
    }
  }
  const strategyPricing = PricingEngine.getStrategyPricing(basePrice, modelId);
  res.json({ success: true, modelId, basePrice, strategies: strategyPricing });
});

router.get('/upstream/providers', (req, res) => {
  const providers = UpstreamFetcher.getProviders();
  res.json({ success: true, providers });
});

router.post('/upstream/providers', requireAdmin, (req, res) => {
  try {
    const { name, url, apiKey } = req.body;
    if (!name || !url || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少 name, url 或 apiKey' });
    }
    const provider = UpstreamFetcher.addProvider(name, url, apiKey);
    if (!provider) {
      return res.status(500).json({ success: false, error: '供应商添加失败，请检查数据目录权限' });
    }
    res.json({ success: true, provider: { ...provider, apiKey: provider.apiKey.substring(0, 8) + '...' } });
  } catch (err) {
    res.status(500).json({ success: false, error: `添加供应商失败: ${err.message}` });
  }
});

router.delete('/upstream/providers/:name', requireAdmin, (req, res) => {
  const result = UpstreamFetcher.removeProvider(req.params.name);
  res.json(result);
});

router.post('/upstream/fetch', requireAdmin, async (req, res) => {
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

router.post('/upstream/apply', requireAdmin, (req, res) => {
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

router.post('/live/fetch-all', requireAdmin, async (req, res) => {
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

router.get('/upstream/health', async (req, res) => {
  try {
    const healthData = await HealthMonitor.checkAllProviders();
    res.json({ success: true, data: healthData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/upstream/health/:name', async (req, res) => {
  try {
    const fullData = JSON.parse(fs.readFileSync(PROVIDERS_PATH, 'utf8'));
    const provider = fullData.providers.find(p => p.name === req.params.name);
    if (!provider) {
      return res.status(404).json({ success: false, error: '供应商不存在' });
    }
    const health = await HealthMonitor.checkProviderHealth(provider);
    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/upstream/compare', (req, res) => {
  const { model } = req.query;
  try {
    let data;
    if (model) {
      data = HealthMonitor.compareModelPrices(model);
    } else {
      data = HealthMonitor.compareAllModels();
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/upstream/fallback/:provider/:model', (req, res) => {
  const { provider, model } = req.params;
  const fallback = HealthMonitor.getFallbackProvider(provider, model);
  res.json({ success: true, hasFallback: !!fallback, fallback });
});

router.get('/usage/stats', (req, res) => {
  const protectionStatus = apiProtection.getProtectionStatus();
  const usageMap = {};

  for (const [key, stats] of apiProtection.usageStats.entries()) {
    usageMap[key] = stats;
  }

  const modelStats = {};
  for (const [, stats] of Object.entries(usageMap)) {
    if (stats.models) {
      for (const [model, count] of Object.entries(stats.models)) {
        if (!modelStats[model]) modelStats[model] = { totalCalls: 0, totalSpent: 0 };
        modelStats[model].totalCalls += count;
        modelStats[model].totalSpent += stats.dailySpent || 0;
      }
    }
  }

  const dailySummary = {};
  for (const [key, stats] of Object.entries(usageMap)) {
    dailySummary[key] = {
      dailySpent: stats.dailySpent,
      requestCount: stats.requestCount,
      models: stats.models
    };
  }

  res.json({
    success: true,
    data: {
      modelStats: Object.entries(modelStats).sort((a, b) => b[1].totalCalls - a[1].totalCalls),
      dailyUsage: dailySummary,
      circuitBreakers: protectionStatus.circuitBreakers,
      globalRateLimit: protectionStatus.globalRateLimit,
      activeUsers: protectionStatus.activeUsers
    }
  });
});

router.get('/dashboard', (req, res) => {
  const protectionStatus = apiProtection.getProtectionStatus();
  const pricingData = PricingEngine.getAllPricing();
  const markupConfig = PricingEngine.getMarkupConfig();

  const totalModels = Object.keys(pricingData.imageModels || {}).length
    + Object.keys(pricingData.videoModels || {}).length
    + Object.keys(pricingData.editModels || {}).length
    + Object.keys(pricingData.textModels || {}).length
    + Object.keys(pricingData.psdServices || {}).length;

  let totalDailySpent = 0;
  let totalRequests = 0;
  const modelCallCounts = {};

  for (const [, stats] of apiProtection.usageStats.entries()) {
    totalDailySpent += stats.dailySpent || 0;
    totalRequests += stats.requestCount || 0;
    if (stats.models) {
      for (const [model, count] of Object.entries(stats.models)) {
        modelCallCounts[model] = (modelCallCounts[model] || 0) + count;
      }
    }
  }

  const topModels = Object.entries(modelCallCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([model, calls]) => ({ model, calls }));

  const cbStatuses = protectionStatus.circuitBreakers || {};
  const activeAlerts = Object.entries(cbStatuses)
    .filter(([, cb]) => cb.state === 'open' || cb.state === 'half-open')
    .map(([provider, cb]) => ({ provider, state: cb.state, failCount: cb.failCount }));

  res.json({
    success: true,
    data: {
      totalModels,
      activeUsers: protectionStatus.activeUsers || 0,
      totalDailySpent: Math.round(totalDailySpent * 100) / 100,
      totalDailyRequests: totalRequests,
      defaultMarkup: markupConfig.defaultPercent,
      topModels,
      circuitBreakerAlerts: activeAlerts,
      providers: UpstreamFetcher.getProviders().length,
      priceAlerts: PricingEngine.getPriceAlerts().length
    }
  });
});

export default router;
