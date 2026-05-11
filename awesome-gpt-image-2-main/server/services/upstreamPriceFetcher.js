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

  let isSkillsApi = false;
  let modelsArray = null;
  let pricingModelInfo = null;

  try {
    const skillsRes = await fetch(`${baseUrl}/v1/skills/models`, { headers, timeout: 30000 });
    if (skillsRes.ok) {
      const skillsData = await skillsRes.json();
      if (!skillsData.error) {
        isSkillsApi = true;
        modelsArray = Array.isArray(skillsData) ? skillsData
          : Array.isArray(skillsData?.data) ? skillsData.data
          : Array.isArray(skillsData?.models) ? skillsData.models
          : null;
      }
    }
  } catch (e) {
    // not a skills API
  }

  if (!isSkillsApi || !modelsArray) {
    try {
      const pricingRes = await fetch(`${baseUrl}/api/pricing`, { headers, timeout: 30000 });
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        if (pricingData.data?.model_info && !pricingData.error) {
          pricingModelInfo = pricingData.data.model_info;
          console.log(`[UpstreamPriceFetcher] Found /api/pricing with ${Object.keys(pricingModelInfo).length} models`);
        }
      }
    } catch (e) {
      // no /api/pricing endpoint
    }

    try {
      const openaiRes = await fetch(`${baseUrl}/v1/models`, { headers, timeout: 30000 });
      if (openaiRes.ok) {
        const openaiData = await openaiRes.json();
        modelsArray = Array.isArray(openaiData) ? openaiData
          : Array.isArray(openaiData?.data) ? openaiData.data
          : null;
      } else {
        const errText = await openaiRes.text();
        result.errors.push(`/v1/models 也无法访问: HTTP ${openaiRes.status} - ${errText.substring(0, 200)}`);
        return result;
      }
    } catch (err) {
      result.errors.push(`连接失败: ${err.message}`);
      return result;
    }
  }

  if (!modelsArray || modelsArray.length === 0) {
    result.errors.push('模型列表为空');
    return result;
  }

  const KNOWN_MODEL_PRICES = {
    'gpt-image-2': 0.15,
    'gpt-image-2-all': 0.15,
    'gpt-image-1.5': 0.05,
    'gpt-image-1.5-all': 0.05,
    'doubao-seedream-5-0-260128': 0.08,
    'doubao-seedream-4-5-251128': 0.06,
    'kling-image': 0.08,
    'kling-omni-image': 0.10,
    'kling-video': 0.10,
    'kling-omni-video': 0.12,
    'veo_3_1-lite': 0.08,
    'veo3.1-fast': 0.06,
    'veo3.1-pro': 0.15,
    'grok-video-3': 0.08,
    'grok-4.2-image': 0.10,
    'MiniMax-Hailuo-02': 0.10,
    'MiniMax-Hailuo-2.3': 0.10,
    'wan2.6-i2v': 0.06,
    'mj_imagine': 0.20,
    'sora-2': 0.15,
    'viduq3-turbo': 0.08,
    'doubao-seedance-1-0-pro-250528': 0.15,
  };

  for (const model of modelsArray) {
    const modelName = model.model_name || model.name || model.id;
    if (!modelName) continue;

    if (isSkillsApi) {
      try {
        const pricingRes = await fetch(`${baseUrl}/v1/skills/models/${modelName}/pricing`, { headers, timeout: 15000 });
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          const pData = pricingData?.data || pricingData;
          if (pData?.channel_groups || pData?.groups) {
            result.models[modelName] = {
              display_name: pData.display_name || model.display_name || modelName,
              type: model.type || pData.type || 'unknown',
              channel_groups: pData.channel_groups || pData.groups || [],
              billing_method: pData.billing_method || pData.price_type || 'per_call'
            };
          }
        }
      } catch (e) {
        result.errors.push(`模型 ${modelName} 价格获取失败: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 150));
    } else {
      const modelType = guessModelType(modelName, model);
      const pricingInfo = extractPricingFromModel(model);
      const knownPrice = KNOWN_MODEL_PRICES[modelName];
      const apiPricingInfo = pricingModelInfo?.[modelName];
      const basePrice = pricingInfo?.base_price || knownPrice || (apiPricingInfo?.price ? parseFloat(apiPricingInfo.price) : 0);

      result.models[modelName] = {
        display_name: apiPricingInfo?.name || model.display_name || model.description?.substring(0, 30) || modelName,
        type: modelType,
        channel_groups: pricingInfo ? [pricingInfo] : [{
          group_name: 'default',
          is_active: true,
          base_price: basePrice,
          success_rate_24h: 0,
          avg_response_seconds: 0
        }],
        billing_method: guessBillingMethod(modelName, model),
        openai_compatible: true
      };
    }
  }

  return result;
}

function guessModelType(modelName, model) {
  const n = (modelName || '').toLowerCase();
  const t = (model?.model_type || model?.type || '').toLowerCase();
  if (t.includes('图') || t.includes('image') || t.includes('视觉')) return 'image';
  if (t.includes('视频') || t.includes('video') || t.includes('影')) return 'video';
  if (t.includes('音频') || t.includes('audio') || t.includes('语音') || t.includes('tts') || t.includes('音乐') || t.includes('music')) return 'audio';
  if (t.includes('文本') || t.includes('text') || t.includes('对话') || t.includes('chat')) return 'text';
  if (['dall-e', 'midjourney', 'stable-diffusion', 'flux', 'sd', 'imagen', 'gpt-image', 'ideogram', 'playground', 'recraft', 'bria', 'kolors', 'cogview'].some(k => n.includes(k))) return 'image';
  if (['sora', 'runway', 'kling', 'pika', 'hailuo', 'veo', 'luma', 'video', 'vidu', 'seedance', 'cogvideox', 'wanx'].some(k => n.includes(k))) return 'video';
  if (['tts', 'music', 'audio', 'bark', 'elevenlabs', 'suno', 'udio'].some(k => n.includes(k))) return 'audio';
  if (['mj_', 'midjourney'].some(k => n.includes(k))) return 'image';
  return 'text';
}

function guessBillingMethod(modelName, model) {
  const n = (modelName || '').toLowerCase();
  if (guessModelType(n, model) === 'video') return 'per_second';
  if (guessModelType(n, model) === 'image') return 'per_call';
  if (guessModelType(n, model) === 'audio') return 'per_call';
  return 'per_token';
}

function extractPricingFromModel(model) {
  if (model.pricing || model.price) {
    const p = model.pricing || model.price;
    if (typeof p === 'object') {
      return {
        group_name: 'default',
        is_active: true,
        base_price: parseFloat(p.input || p.price || p.base_price || 0),
        input_price: parseFloat(p.input || 0),
        output_price: parseFloat(p.output || 0),
        success_rate_24h: 0,
        avg_response_seconds: 0
      };
    }
    if (typeof p === 'number') {
      return {
        group_name: 'default',
        is_active: true,
        base_price: p,
        success_rate_24h: 0,
        avg_response_seconds: 0
      };
    }
  }
  return null;
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
