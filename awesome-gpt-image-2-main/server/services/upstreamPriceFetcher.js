import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROVIDERS_PATH = path.join(__dirname, '..', 'data', 'upstreamProviders.json');
const FETCHED_PRICES_PATH = path.join(__dirname, '..', 'data', 'fetchedUpstreamPrices.json');

let providers = null;
let fetchedPrices = null;

function loadProviders() {
  if (providers) return providers;
  try {
    if (fs.existsSync(PROVIDERS_PATH)) {
      providers = JSON.parse(fs.readFileSync(PROVIDERS_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[UpstreamPriceFetcher] Failed to load providers:', e.message);
  }
  providers = providers || { providers: [] };
  return providers;
}

function saveProviders(data) {
  try {
    const dir = path.dirname(PROVIDERS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROVIDERS_PATH, JSON.stringify(data, null, 2), 'utf8');
    providers = data;
  } catch (e) {
    console.error('[UpstreamPriceFetcher] Failed to save providers:', e.message);
  }
}

function loadFetchedPrices() {
  if (fetchedPrices) return fetchedPrices;
  try {
    if (fs.existsSync(FETCHED_PRICES_PATH)) {
      fetchedPrices = JSON.parse(fs.readFileSync(FETCHED_PRICES_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('[UpstreamPriceFetcher] Failed to load fetched prices:', e.message);
  }
  fetchedPrices = fetchedPrices || { lastFetch: null, providers: {} };
  return fetchedPrices;
}

function saveFetchedPrices(data) {
  try {
    const dir = path.dirname(FETCHED_PRICES_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FETCHED_PRICES_PATH, JSON.stringify(data, null, 2), 'utf8');
    fetchedPrices = data;
  } catch (e) {
    console.error('[UpstreamPriceFetcher] Failed to save fetched prices:', e.message);
  }
}

async function fetchFromProvider(provider) {
  const { url, apiKey, name } = provider;
  const baseUrl = url.replace(/\/+$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const result = {
    providerName: name,
    providerUrl: url,
    fetchTime: new Date().toISOString(),
    models: {},
    errors: []
  };

  try {
    const modelsRes = await fetch(`${baseUrl}/v1/skills/models`, { headers, timeout: 30000 });
    if (!modelsRes.ok) {
      result.errors.push(`获取模型列表失败: HTTP ${modelsRes.status}`);
      return result;
    }
    const modelsData = await modelsRes.json();
    const models = modelsData?.data || modelsData || [];

    for (const model of models) {
      const modelName = model.model_name || model.name || model.id;
      if (!modelName) continue;

      try {
        const pricingRes = await fetch(`${baseUrl}/v1/skills/models/${modelName}/pricing`, { headers, timeout: 15000 });
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          if (pricingData?.data) {
            result.models[modelName] = {
              display_name: pricingData.data.display_name || model.display_name || modelName,
              type: model.type || 'unknown',
              channel_groups: pricingData.data.channel_groups || [],
              billing_method: pricingData.data.billing_method || 'per_call'
            };
          }
        }
      } catch (e) {
        result.errors.push(`模型 ${modelName} 价格获取失败: ${e.message}`);
      }

      await new Promise(r => setTimeout(r, 200));
    }
  } catch (err) {
    result.errors.push(`连接失败: ${err.message}`);
  }

  return result;
}

function addProvider(name, url, apiKey) {
  const data = loadProviders();
  const existing = data.providers.findIndex(p => p.name === name);
  const provider = { name, url, apiKey, addedAt: new Date().toISOString() };
  if (existing >= 0) {
    data.providers[existing] = provider;
  } else {
    data.providers.push(provider);
  }
  saveProviders(data);
  return provider;
}

function removeProvider(name) {
  const data = loadProviders();
  data.providers = data.providers.filter(p => p.name !== name);
  saveProviders(data);
  return { success: true };
}

function getProviders() {
  const data = loadProviders();
  return data.providers.map(p => ({ ...p, apiKey: p.apiKey ? p.apiKey.substring(0, 8) + '...' : '' }));
}

async function fetchAllProviderPrices() {
  const data = loadProviders();
  const fetched = loadFetchedPrices();
  const results = {};

  for (const provider of data.providers) {
    console.log(`[UpstreamPriceFetcher] Fetching prices from ${provider.name}...`);
    const result = await fetchFromProvider(provider);
    results[provider.name] = result;
  }

  fetched.lastFetch = new Date().toISOString();
  fetched.providers = results;
  saveFetchedPrices(fetched);

  return results;
}

async function fetchSingleProviderPrices(providerName) {
  const data = loadProviders();
  const provider = data.providers.find(p => p.name === providerName);
  if (!provider) return { error: `供应商 ${providerName} 不存在` };

  const result = await fetchFromProvider(provider);

  const fetched = loadFetchedPrices();
  fetched.lastFetch = new Date().toISOString();
  fetched.providers[providerName] = result;
  saveFetchedPrices(fetched);

  return result;
}

function getFetchedPrices() {
  return loadFetchedPrices();
}

function matchUpstreamPrice(providerName, modelName) {
  const fetched = loadFetchedPrices();
  const providerData = fetched.providers?.[providerName];
  if (!providerData) return null;

  const modelPricing = providerData.models?.[modelName];
  if (!modelPricing) return null;

  return {
    model: modelName,
    display_name: modelPricing.display_name,
    channel_groups: modelPricing.channel_groups,
    billing_method: modelPricing.billing_method,
    cheapest: modelPricing.channel_groups
      ?.filter(g => g.is_active !== false)
      ?.reduce((min, g) => g.base_price < min.base_price ? g : min, { base_price: Infinity }) || null
  };
}

function applyUpstreamPrices(providerName, modelMappings) {
  const fetched = loadFetchedPrices();
  const providerData = fetched.providers?.[providerName];
  if (!providerData) return { success: false, error: `供应商 ${providerName} 不存在` };

  const results = [];
  for (const mapping of modelMappings) {
    const { upstreamModel, localModel, groupIndex, markupPercent } = mapping;
    const modelPricing = providerData.models?.[upstreamModel];
    if (!modelPricing) {
      results.push({ localModel, success: false, error: `上游模型 ${upstreamModel} 不存在` });
      continue;
    }

    const group = modelPricing.channel_groups?.[groupIndex || 0];
    if (!group) {
      results.push({ localModel, success: false, error: `分组索引 ${groupIndex} 不存在` });
      continue;
    }

    const upstreamPrice = group.base_price;
    const finalPrice = markupPercent !== undefined
      ? Math.round(upstreamPrice * (1 + markupPercent / 100) * 10000) / 10000
      : upstreamPrice;

    results.push({
      localModel,
      success: true,
      upstreamPrice,
      markupPercent: markupPercent || 0,
      finalPrice,
      groupName: group.group_name
    });
  }

  return { success: true, results };
}

export {
  addProvider,
  removeProvider,
  getProviders,
  fetchAllProviderPrices,
  fetchSingleProviderPrices,
  getFetchedPrices,
  matchUpstreamPrice,
  applyUpstreamPrices
};
