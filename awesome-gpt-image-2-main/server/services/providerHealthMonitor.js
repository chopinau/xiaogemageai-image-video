import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as UpstreamFetcher from './upstreamPriceFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROVIDERS_PATH = path.join(__dirname, '..', 'data', 'upstreamProviders.json');

const HEALTH_CHECK_INTERVAL = 60000;
const MAX_CONSECUTIVE_FAILURES = 3;

const providerHealth = new Map();
let healthCheckTimer = null;

function loadFullProviders() {
  try {
    if (fs.existsSync(PROVIDERS_PATH)) {
      return JSON.parse(fs.readFileSync(PROVIDERS_PATH, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return { providers: [] };
}

function getProviderHealth(providerName) {
  if (!providerHealth.has(providerName)) {
    providerHealth.set(providerName, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      lastError: null,
      responseTime: null,
      uptime24h: 100,
      checks24h: 0,
      failures24h: 0
    });
  }
  return providerHealth.get(providerName);
}

async function checkProviderHealth(provider) {
  const health = getProviderHealth(provider.name);
  const startTime = Date.now();

  try {
    const baseUrl = provider.url.replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${baseUrl}/v1/models`, {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeout);

    const responseTime = Date.now() - startTime;

    if (res.ok) {
      health.status = 'healthy';
      health.consecutiveFailures = 0;
      health.lastError = null;
      health.responseTime = responseTime;
    } else {
      health.consecutiveFailures++;
      health.lastError = `HTTP ${res.status}`;
      health.status = health.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES ? 'down' : 'degraded';
    }
  } catch (err) {
    health.consecutiveFailures++;
    health.lastError = err.name === 'AbortError' ? 'timeout(10s)' : err.message;
    health.status = health.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES ? 'down' : 'degraded';
    health.responseTime = null;
  }

  health.lastCheck = Date.now();
  health.checks24h++;
  if (health.status !== 'healthy') {
    health.failures24h++;
  }
  health.uptime24h = health.checks24h > 0
    ? Math.round(((health.checks24h - health.failures24h) / health.checks24h) * 100)
    : 100;

  return health;
}

async function checkAllProviders() {
  const data = loadFullProviders();
  const results = {};

  for (const provider of data.providers) {
    results[provider.name] = await checkProviderHealth(provider);
  }

  return results;
}

function getFallbackProvider(currentProviderName, modelName) {
  const data = loadFullProviders();
  const providers = data.providers;
  const healthyAlternatives = providers.filter(p => {
    if (p.name === currentProviderName) return false;
    const health = getProviderHealth(p.name);
    return health.status === 'healthy' || health.status === 'unknown';
  });

  if (healthyAlternatives.length === 0) return null;

  const fetchedPrices = UpstreamFetcher.getFetchedPrices();
  for (const altProvider of healthyAlternatives) {
    const providerData = fetchedPrices?.providers?.[altProvider.name];
    if (providerData?.models?.[modelName]) {
      return {
        provider: { name: altProvider.name, url: altProvider.url },
        modelData: providerData.models[modelName]
      };
    }
  }

  return null;
}

function compareModelPrices(modelName) {
  const fetchedPrices = UpstreamFetcher.getFetchedPrices();
  const comparison = [];

  if (!fetchedPrices?.providers) return comparison;

  for (const [providerName, providerData] of Object.entries(fetchedPrices.providers)) {
    const modelData = providerData.models?.[modelName];
    if (!modelData) continue;

    const health = getProviderHealth(providerName);
    const activeGroups = (modelData.channel_groups || []).filter(g => g.is_active !== false);
    const cheapest = activeGroups.length > 0
      ? Math.min(...activeGroups.map(g => g.base_price))
      : null;

    comparison.push({
      provider: providerName,
      displayName: modelData.display_name || modelName,
      cheapestPrice: cheapest,
      groupCount: activeGroups.length,
      groups: activeGroups.map(g => ({
        name: g.group_name,
        price: g.base_price,
        successRate: g.success_rate_24h,
        avgResponse: g.avg_response_seconds
      })),
      providerHealth: health.status,
      responseTime: health.responseTime
    });
  }

  comparison.sort((a, b) => {
    if (a.cheapestPrice === null) return 1;
    if (b.cheapestPrice === null) return -1;
    return a.cheapestPrice - b.cheapestPrice;
  });

  return comparison;
}

function compareAllModels() {
  const fetchedPrices = UpstreamFetcher.getFetchedPrices();
  const allModels = new Map();

  if (!fetchedPrices?.providers) return [];

  for (const [providerName, providerData] of Object.entries(fetchedPrices.providers)) {
    for (const [modelName, modelData] of Object.entries(providerData.models || {})) {
      if (!allModels.has(modelName)) {
        allModels.set(modelName, { model: modelName, displayName: modelData.display_name || modelName, type: modelData.type, providers: [] });
      }
      const entry = allModels.get(modelName);
      const activeGroups = (modelData.channel_groups || []).filter(g => g.is_active !== false);
      const cheapest = activeGroups.length > 0 ? Math.min(...activeGroups.map(g => g.base_price)) : null;
      const health = getProviderHealth(providerName);

      entry.providers.push({
        name: providerName,
        cheapestPrice: cheapest,
        groupCount: activeGroups.length,
        health: health.status
      });
    }
  }

  return Array.from(allModels.values()).map(entry => {
    const withPrice = entry.providers.filter(p => p.cheapestPrice !== null);
    const bestPrice = withPrice.length > 0 ? Math.min(...withPrice.map(p => p.cheapestPrice)) : null;
    const worstPrice = withPrice.length > 0 ? Math.max(...withPrice.map(p => p.cheapestPrice)) : null;
    return {
      ...entry,
      bestPrice,
      worstPrice,
      priceDiff: (bestPrice !== null && worstPrice !== null) ? Math.round(((worstPrice - bestPrice) / bestPrice) * 10000) / 100 : 0,
      providerCount: entry.providers.length
    };
  });
}

function startHealthCheckLoop() {
  if (healthCheckTimer) return;
  checkAllProviders();
  healthCheckTimer = setInterval(async () => {
    await checkAllProviders();
  }, HEALTH_CHECK_INTERVAL);
}

function stopHealthCheckLoop() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

export {
  checkProviderHealth,
  checkAllProviders,
  getProviderHealth,
  getFallbackProvider,
  compareModelPrices,
  compareAllModels,
  startHealthCheckLoop,
  stopHealthCheckLoop
};
