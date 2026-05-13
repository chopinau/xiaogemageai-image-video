import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as PricingEngine from './pricingEngine.js';
import * as UpstreamFetcher from './upstreamPriceFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STRATEGY_CONFIG_PATH = path.join(__dirname, '..', 'data', 'strategyConfig.json');

const STRATEGY_DEFINITIONS = {
  economy: { id: 'economy', label: '经济', markupPercent: 0, description: '最低价格，适合批量生成' },
  balanced: { id: 'balanced', label: '均衡', markupPercent: 15, description: '性价比最优，成功率优先' },
  premium: { id: 'premium', label: '品质', markupPercent: 30, description: '最高品质，速度优先' }
};

function loadStrategyConfig() {
  try {
    if (fs.existsSync(STRATEGY_CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(STRATEGY_CONFIG_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[StrategyConfig] Failed to load:', e.message);
  }
  return initializeStrategyConfig();
}

function saveStrategyConfig(config) {
  try {
    const dir = path.dirname(STRATEGY_CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STRATEGY_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[StrategyConfig] Failed to save:', e.message);
    return false;
  }
}

function initializeStrategyConfig() {
  const config = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    strategies: {}
  };

  for (const [id, def] of Object.entries(STRATEGY_DEFINITIONS)) {
    config.strategies[id] = {
      ...def,
      providers: [],
      modelMappings: {},
      autoSync: false,
      lastSyncAt: null
    };
  }

  saveStrategyConfig(config);
  return config;
}

function getStrategyConfig() {
  return loadStrategyConfig();
}

function getStrategy(strategyId) {
  const config = loadStrategyConfig();
  return config.strategies?.[strategyId] || null;
}

function updateStrategyProviders(strategyId, providers) {
  const config = loadStrategyConfig();
  if (!config.strategies?.[strategyId]) return { success: false, error: '策略不存在' };

  config.strategies[strategyId].providers = providers;
  config.strategies[strategyId].lastUpdated = new Date().toISOString();
  saveStrategyConfig(config);
  return { success: true, strategy: config.strategies[strategyId] };
}

function updateStrategyMarkup(strategyId, markupPercent) {
  const config = loadStrategyConfig();
  if (!config.strategies?.[strategyId]) return { success: false, error: '策略不存在' };

  config.strategies[strategyId].markupPercent = markupPercent;
  config.strategies[strategyId].lastUpdated = new Date().toISOString();
  saveStrategyConfig(config);

  PricingEngine.updateStrategyMarkup(strategyId, markupPercent);

  return { success: true, strategy: config.strategies[strategyId] };
}

function updateModelMapping(strategyId, modelId, providerName, upstreamModelId, upstreamPrice) {
  const config = loadStrategyConfig();
  if (!config.strategies?.[strategyId]) return { success: false, error: '策略不存在' };

  if (!config.strategies[strategyId].modelMappings) {
    config.strategies[strategyId].modelMappings = {};
  }

  config.strategies[strategyId].modelMappings[modelId] = {
    providerName,
    upstreamModelId: upstreamModelId || modelId,
    upstreamPrice: upstreamPrice || 0,
    sellingPrice: Math.round(upstreamPrice * (1 + config.strategies[strategyId].markupPercent / 100) * 10000) / 10000,
    updatedAt: new Date().toISOString()
  };

  config.strategies[strategyId].lastUpdated = new Date().toISOString();
  saveStrategyConfig(config);
  return { success: true, mapping: config.strategies[strategyId].modelMappings[modelId] };
}

function removeModelMapping(strategyId, modelId) {
  const config = loadStrategyConfig();
  if (!config.strategies?.[strategyId]?.modelMappings?.[modelId]) {
    return { success: false, error: '映射不存在' };
  }

  delete config.strategies[strategyId].modelMappings[modelId];
  config.strategies[strategyId].lastUpdated = new Date().toISOString();
  saveStrategyConfig(config);
  return { success: true };
}

async function syncStrategyFromProviders(strategyId) {
  const config = loadStrategyConfig();
  const strategy = config.strategies?.[strategyId];
  if (!strategy) return { success: false, error: '策略不存在' };
  if (!strategy.providers || strategy.providers.length === 0) {
    return { success: false, error: '未配置供应商' };
  }

  const results = [];
  for (const providerName of strategy.providers) {
    try {
      const fetchResult = await UpstreamFetcher.fetchSingleProviderPrices(providerName);
      if (fetchResult && fetchResult.models) {
        for (const [modelId, modelData] of Object.entries(fetchResult.models)) {
          const upstreamPrice = modelData.cheapest?.base_price || modelData.basePrice || 0;
          if (upstreamPrice > 0) {
            const sellingPrice = Math.round(upstreamPrice * (1 + strategy.markupPercent / 100) * 10000) / 10000;

            if (!strategy.modelMappings) strategy.modelMappings = {};
            strategy.modelMappings[modelId] = {
              providerName,
              upstreamModelId: modelId,
              upstreamPrice,
              sellingPrice,
              syncedAt: new Date().toISOString()
            };

            results.push({ modelId, providerName, upstreamPrice, sellingPrice, success: true });
          }
        }
      }
    } catch (e) {
      results.push({ providerName, error: e.message, success: false });
    }
  }

  strategy.lastSyncAt = new Date().toISOString();
  strategy.autoSync = true;
  strategy.lastUpdated = new Date().toISOString();
  saveStrategyConfig(config);

  return { success: true, syncedCount: results.filter(r => r.success).length, results };
}

async function syncAllStrategies() {
  const config = loadStrategyConfig();
  const results = {};

  for (const strategyId of Object.keys(config.strategies)) {
    results[strategyId] = await syncStrategyFromProviders(strategyId);
  }

  return results;
}

function getStrategyPriceForModel(strategyId, modelId) {
  const config = loadStrategyConfig();
  const strategy = config.strategies?.[strategyId];
  if (!strategy) return null;

  const mapping = strategy.modelMappings?.[modelId];
  if (mapping) {
    return {
      strategyId,
      modelId,
      providerName: mapping.providerName,
      upstreamPrice: mapping.upstreamPrice,
      markupPercent: strategy.markupPercent,
      sellingPrice: mapping.sellingPrice,
      source: 'strategy_mapping'
    };
  }

  const allPricing = PricingEngine.getAllPricing();
  for (const category of ['imageModels', 'videoModels', 'editModels']) {
    if (allPricing[category]?.[modelId]) {
      const model = allPricing[category][modelId];
      const basePrice = model.prices?.[model.defaultResolution || '1k'] || model.pricePerSecond * (model.minDuration || 5) || 0;
      return {
        strategyId,
        modelId,
        providerName: model.provider || 'default',
        upstreamPrice: basePrice,
        markupPercent: strategy.markupPercent,
        sellingPrice: Math.round(basePrice * (1 + strategy.markupPercent / 100) * 10000) / 10000,
        source: 'default_pricing'
      };
    }
  }

  return null;
}

function compareModelAcrossStrategies(modelId) {
  const result = {};
  for (const strategyId of Object.keys(STRATEGY_DEFINITIONS)) {
    result[strategyId] = getStrategyPriceForModel(strategyId, modelId);
  }
  return result;
}

function applyStrategyPricesToEngine(strategyId) {
  const config = loadStrategyConfig();
  const strategy = config.strategies?.[strategyId];
  if (!strategy || !strategy.modelMappings) return { success: false, error: '策略或映射不存在' };

  const results = [];
  for (const [modelId, mapping] of Object.entries(strategy.modelMappings)) {
    if (mapping.sellingPrice > 0) {
      const categoryInfo = resolveModelCategory(modelId);
      const updateResult = PricingEngine.updateModelPrice(
        categoryInfo.category, modelId, categoryInfo.resolution,
        mapping.sellingPrice,
        `策略同步: ${strategyId} - 供应商 ${mapping.providerName}`
      );
      results.push({ modelId, ...updateResult });
    }
  }

  return { success: true, appliedCount: results.filter(r => r.success).length, results };
}

function resolveModelCategory(modelId) {
  if (!modelId) return { category: 'imageModels', resolution: '1k' };
  const lower = modelId.toLowerCase();
  if (lower.includes('video') || ['kling', 'sora', 'runway', 'pika', 'hailuo', 'veo', 'luma', 'seedance'].some(k => lower.includes(k))) {
    return { category: 'videoModels', resolution: 'perSecond' };
  }
  if (lower.includes('psd') || lower.includes('layer') || ['bria', 'color-splitting', 'image-assembly'].some(k => lower.includes(k))) {
    return { category: 'psdServices', resolution: 'perRequest' };
  }
  if (lower.includes('edit') || lower.includes('inpaint') || lower.includes('remove') || lower.includes('restore') || lower.includes('kontext')) {
    return { category: 'editModels', resolution: '1k' };
  }
  return { category: 'imageModels', resolution: '1k' };
}

function getOptimalStrategyForModel(modelId) {
  const comparisons = compareModelAcrossStrategies(modelId);
  let bestStrategy = null;
  let bestMargin = -Infinity;
  let bestRevenue = 0;

  for (const [strategyId, data] of Object.entries(comparisons)) {
    if (!data || !data.upstreamPrice) continue;
    const margin = data.sellingPrice - data.upstreamPrice;
    const revenue = data.sellingPrice;
    if (margin > bestMargin || (margin === bestMargin && revenue > bestRevenue)) {
      bestMargin = margin;
      bestRevenue = revenue;
      bestStrategy = strategyId;
    }
  }

  return {
    modelId,
    bestStrategy,
    comparisons,
    recommendation: bestStrategy ? `推荐 ${STRATEGY_DEFINITIONS[bestStrategy]?.label} 策略，利润最大化` : '暂无推荐'
  };
}

export {
  STRATEGY_DEFINITIONS,
  getStrategyConfig,
  getStrategy,
  updateStrategyProviders,
  updateStrategyMarkup,
  updateModelMapping,
  removeModelMapping,
  syncStrategyFromProviders,
  syncAllStrategies,
  getStrategyPriceForModel,
  compareModelAcrossStrategies,
  applyStrategyPricesToEngine,
  getOptimalStrategyForModel
};
