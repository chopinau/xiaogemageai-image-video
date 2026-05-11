import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRICE_CONFIG_PATH = path.join(__dirname, '..', 'data', 'pricing.json');
const PRICE_HISTORY_PATH = path.join(__dirname, '..', 'data', 'priceHistory.json');

let pricingData = null;
let priceHistory = null;
let lastLoadTime = 0;
const CACHE_TTL = 5000;

function loadPricingData() {
  if (pricingData && Date.now() - lastLoadTime < CACHE_TTL) {
    return pricingData;
  }
  try {
    if (fs.existsSync(PRICE_CONFIG_PATH)) {
      pricingData = JSON.parse(fs.readFileSync(PRICE_CONFIG_PATH, 'utf8'));
      lastLoadTime = Date.now();
      return pricingData;
    }
  } catch (e) {
    console.error('[PricingEngine] Failed to load pricing data:', e.message);
  }
  pricingData = getDefaultPricing();
  lastLoadTime = Date.now();
  return pricingData;
}

function loadPriceHistory() {
  if (priceHistory) return priceHistory;
  try {
    if (fs.existsSync(PRICE_HISTORY_PATH)) {
      priceHistory = JSON.parse(fs.readFileSync(PRICE_HISTORY_PATH, 'utf8'));
      return priceHistory;
    }
  } catch (e) {
    console.error('[PricingEngine] Failed to load price history:', e.message);
  }
  priceHistory = [];
  return priceHistory;
}

function savePriceHistory(history) {
  try {
    const dir = path.dirname(PRICE_HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const toSave = history.slice(-1000);
    fs.writeFileSync(PRICE_HISTORY_PATH, JSON.stringify(toSave, null, 2), 'utf8');
  } catch (e) {
    console.error('[PricingEngine] Failed to save price history:', e.message);
  }
}

function recordPriceChange(type, model, oldPrice, newPrice, reason = '') {
  const history = loadPriceHistory();
  history.push({
    timestamp: Date.now(),
    type,
    model,
    oldPrice,
    newPrice,
    changePercent: oldPrice ? Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100 : 0,
    reason
  });
  savePriceHistory(history);
}

function getDefaultPricing() {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    currency: 'CNY',
    creditToRmbRatio: 1,
    priceChangeNotifications: { enabled: true, thresholds: { percent: 20, absolute: 0.1 } },
    imageModels: {
      'gpt-image-2': { displayName: 'GPT Image 2', provider: 'openai', prices: { '1k': 0.05, '2k': 0.10, '4k': 0.20 }, defaultResolution: '1k', enabled: true },
      'dall-e-3': { displayName: 'DALL-E 3', provider: 'openai', prices: { '1k': 0.10, '2k': 0.20 }, defaultResolution: '1k', enabled: true },
      'flux-pro': { displayName: 'Flux Pro', provider: 'black-forest-labs', prices: { '1k': 0.08, '2k': 0.16 }, defaultResolution: '1k', enabled: true },
      'doubao-seedream': { displayName: '豆包 Seedream 4.0', provider: 'bytedance', prices: { '1k': 0.03, '2k': 0.06 }, defaultResolution: '1k', enabled: true },
      'stable-diffusion-xl': { displayName: 'Stable Diffusion XL', provider: 'stability-ai', prices: { '1k': 0.03, '2k': 0.06 }, defaultResolution: '1k', enabled: true }
    },
    videoModels: {
      'kling': { displayName: '可灵 V1.6', provider: 'kuaishou', pricePerSecond: 0.02, minDuration: 1, maxDuration: 30, enabled: true },
      'veo3': { displayName: 'Veo 3.1', provider: 'google', pricePerSecond: 0.03, minDuration: 1, maxDuration: 60, enabled: true },
      'sora': { displayName: 'Sora 2', provider: 'openai', pricePerSecond: 0.03, minDuration: 1, maxDuration: 60, enabled: true },
      'seedance-2.0': { displayName: 'Seedance 2.0', provider: 'bytedance', pricePerSecond: 0.02, minDuration: 1, maxDuration: 30, enabled: true },
      'runway-gen3': { displayName: 'Runway Gen4', provider: 'runway', pricePerSecond: 0.02, minDuration: 1, maxDuration: 30, enabled: true },
      'hailuo': { displayName: '海螺视频', provider: 'minimax', pricePerSecond: 0.02, minDuration: 1, maxDuration: 30, enabled: true },
      'luma': { displayName: 'Luma Dream Machine', provider: 'luma', pricePerSecond: 0.02, minDuration: 1, maxDuration: 10, enabled: true }
    },
    editModels: {
      'doubao-seededit': { displayName: '豆包 SeedEdit 3.0', prices: { '1k': 0.04, '2k': 0.08 }, enabled: true },
      'flux-kontext-pro': { displayName: 'Flux Kontext Pro', prices: { '1k': 0.06, '2k': 0.12 }, enabled: true },
      'gpt-image-1-all': { displayName: 'GPT Image 1', prices: { '1k': 0.05, '2k': 0.10 }, enabled: true }
    },
    textModels: {
      'gpt-4o': { displayName: 'GPT-4o', provider: 'openai', pricePerToken: { input: 0.000025, output: 0.00005 }, enabled: true },
      'deepseek': { displayName: 'DeepSeek', provider: 'deepseek', pricePerToken: { input: 0.00001, output: 0.00002 }, enabled: true }
    },
    psdServices: {
      'bria-rmbg-inpainting': { displayName: 'PSD 智能拆层', pricePerRequest: 0.15, enabled: true },
      'color-splitting': { displayName: 'PSD 颜色拆层', pricePerRequest: 0.10, enabled: true },
      'image-assembly': { displayName: 'PSD 多图组装', pricePerRequest: 0.12, enabled: true }
    },
    creditPacks: [
      { id: 'pack-10', credits: 10, price: 10.00, label: '10 积分', bonus: 0, popular: false },
      { id: 'pack-50', credits: 50, price: 50.00, label: '50 积分', bonus: 2, popular: true },
      { id: 'pack-200', credits: 200, price: 200.00, label: '200 积分', bonus: 10, popular: false },
      { id: 'pack-500', credits: 500, price: 500.00, label: '500 积分', bonus: 30, popular: false }
    ],
    subscriptions: {
      free: { name: '免费版', monthlyCredits: 0, price: 0 },
      basic: { name: '基础版', monthlyCredits: 20, price: 29 },
      pro: { name: '专业版', monthlyCredits: 80, price: 99 },
      enterprise: { name: '企业版', monthlyCredits: 300, price: 299 }
    }
  };
}

function calculateImageCost(modelId, resolution, count = 1) {
  const data = loadPricingData();
  const model = data.imageModels[modelId];
  if (!model || !model.enabled) throw new Error(`模型 ${modelId} 不存在或已禁用`);
  const price = model.prices[resolution] || model.prices[model.defaultResolution] || 0.05;
  return roundToCents(price * count);
}

function calculateVideoCost(modelId, duration) {
  const data = loadPricingData();
  const model = data.videoModels[modelId];
  if (!model || !model.enabled) throw new Error(`模型 ${modelId} 不存在或已禁用`);
  return roundToCents(model.pricePerSecond * duration);
}

function calculateEditCost(modelId, resolution, count = 1) {
  const data = loadPricingData();
  const model = data.editModels[modelId];
  if (!model || !model.enabled) throw new Error(`模型 ${modelId} 不存在或已禁用`);
  const price = model.prices[resolution] || model.prices['1k'] || 0.05;
  return roundToCents(price * count);
}

function calculateTextCost(modelId, inputTokens, outputTokens) {
  const data = loadPricingData();
  const model = data.textModels[modelId];
  if (!model || !model.enabled) throw new Error(`模型 ${modelId} 不存在或已禁用`);
  return roundToCents((inputTokens * model.pricePerToken.input) + (outputTokens * model.pricePerToken.output));
}

function calculatePsdCost(serviceId) {
  const data = loadPricingData();
  const service = data.psdServices[serviceId];
  if (!service || !service.enabled) throw new Error(`服务 ${serviceId} 不存在或已禁用`);
  return service.pricePerRequest;
}

function calculateCost(type, modelId, params = {}) {
  switch (type) {
    case 'image': return calculateImageCost(modelId, params.resolution || '1k', params.count || 1);
    case 'video': return calculateVideoCost(modelId, params.duration || 5);
    case 'edit': return calculateEditCost(modelId, params.resolution || '1k', params.count || 1);
    case 'text': return calculateTextCost(modelId, params.inputTokens || 0, params.outputTokens || 0);
    case 'psd': return calculatePsdCost(modelId);
    default: return 0.05;
  }
}

function getAllModels() {
  const data = loadPricingData();
  return { imageModels: data.imageModels, videoModels: data.videoModels, editModels: data.editModels, textModels: data.textModels, psdServices: data.psdServices };
}

function getCreditPacks() { return loadPricingData().creditPacks; }
function getSubscriptions() { return loadPricingData().subscriptions; }
function getPackById(packId) { return loadPricingData().creditPacks.find(p => p.id === packId); }
function getSubscriptionById(subId) { return loadPricingData().subscriptions[subId]; }

function reloadPricing() { pricingData = null; return loadPricingData(); }

function updateModelPrice(category, modelId, resolution, newPrice, reason = '手动调整') {
  const data = loadPricingData();
  if (!data[category] || !data[category][modelId]) return { success: false, error: '模型不存在' };
  const model = data[category][modelId];
  let oldPrice;
  if (resolution === 'perSecond') {
    oldPrice = model.pricePerSecond;
    model.pricePerSecond = newPrice;
  } else if (resolution === 'perRequest') {
    oldPrice = model.pricePerRequest;
    model.pricePerRequest = newPrice;
  } else {
    oldPrice = model.prices[resolution];
    model.prices[resolution] = newPrice;
  }
  data.lastUpdated = new Date().toISOString();

  const changePercent = oldPrice ? Math.round(((newPrice - oldPrice) / oldPrice) * 10000) / 100 : 0;
  const notifications = data.priceChangeNotifications;
  let shouldNotify = false;
  if (notifications.enabled) {
    if (Math.abs(changePercent) >= notifications.thresholds.percent || Math.abs(newPrice - oldPrice) >= notifications.thresholds.absolute) {
      shouldNotify = true;
    }
  }

  recordPriceChange(category, modelId, oldPrice, newPrice, reason);
  savePricingData(data);

  return { success: true, oldPrice, newPrice, changePercent, shouldNotify };
}

function getPriceHistory(options = {}) {
  const { type, model, page = 1, limit = 20 } = options;
  let history = loadPriceHistory();
  if (type) history = history.filter(h => h.type === type);
  if (model) history = history.filter(h => h.model === model);
  const sorted = history.sort((a, b) => b.timestamp - a.timestamp);
  const start = (page - 1) * limit;
  return { entries: sorted.slice(start, start + limit), total: sorted.length, page, limit };
}

function getPriceAlerts() {
  const data = loadPricingData();
  const history = loadPriceHistory();
  const recentChanges = history.filter(h => Date.now() - h.timestamp < 86400000);
  const alerts = [];
  for (const change of recentChanges) {
    if (Math.abs(change.changePercent) >= (data.priceChangeNotifications?.thresholds?.percent || 20)) {
      alerts.push(change);
    }
  }
  return alerts;
}

function savePricingData(data) {
  try {
    const dir = path.dirname(PRICE_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PRICE_CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
    pricingData = data;
    lastLoadTime = Date.now();
    return true;
  } catch (e) {
    console.error('[PricingEngine] Failed to save pricing data:', e.message);
    return false;
  }
}

function roundToCents(amount) { return Math.round(amount * 100) / 100; }

function getMarkupConfig() {
  const data = loadPricingData();
  return data.markupConfig || { defaultPercent: 15, perModel: {} };
}

function setMarkupConfig(config) {
  const data = loadPricingData();
  data.markupConfig = config;
  data.lastUpdated = new Date().toISOString();
  savePricingData(data);
  return { success: true, config: data.markupConfig };
}

function setModelMarkup(modelId, markupPercent) {
  const data = loadPricingData();
  if (!data.markupConfig) data.markupConfig = { defaultPercent: 15, perModel: {} };
  data.markupConfig.perModel[modelId] = markupPercent;
  data.lastUpdated = new Date().toISOString();
  savePricingData(data);
  return { success: true, modelId, markupPercent };
}

function getEffectiveMarkup(modelId) {
  const config = getMarkupConfig();
  return config.perModel?.[modelId] ?? config.defaultPercent;
}

function calculateSellingPrice(upstreamPrice, modelId) {
  const markup = getEffectiveMarkup(modelId);
  return Math.round(upstreamPrice * (1 + markup / 100) * 10000) / 10000;
}

function batchUpdatePrices(updates, reason = '批量调整') {
  const results = [];
  for (const update of updates) {
    const { category, modelId, resolution, newPrice } = update;
    const result = updateModelPrice(category, modelId, resolution, newPrice, reason);
    results.push({ ...update, ...result });
  }
  return results;
}

export {
  calculateCost, calculateImageCost, calculateVideoCost, calculateEditCost,
  calculateTextCost, calculatePsdCost, getAllModels, getCreditPacks,
  getSubscriptions, getPackById, getSubscriptionById, reloadPricing,
  updateModelPrice, getDefaultPricing, loadPricingData,
  getPriceHistory, getPriceAlerts, recordPriceChange,
  getMarkupConfig, setMarkupConfig, setModelMarkup, getEffectiveMarkup,
  calculateSellingPrice, batchUpdatePrices
};
