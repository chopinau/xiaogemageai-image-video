import { API_BASE } from './api.js';

let dynamicPricingCache = null;
let dynamicPricingTimestamp = 0;
const DYNAMIC_CACHE_TTL = 60000;

const FALLBACK_PRICING = {
  'gpt-image-2': { billingMethod: 'per_call', basePriceCNY: 0.0576, baseCredits: 6, optionPricing: {} },
  'doubao-seedream-5-0': { billingMethod: 'per_call', basePriceCNY: 0.1584, baseCredits: 16, optionPricing: {} },
  'doubao-seedream-4-5': { billingMethod: 'per_call', basePriceCNY: 0.18, baseCredits: 18, optionPricing: {} },
  'gemini-3-pro-image': { billingMethod: 'per_call', basePriceCNY: 0.2016, baseCredits: 20, optionPricing: {} },
  'kling-v3-image': { billingMethod: 'per_call', basePriceCNY: 0.1728, baseCredits: 17, optionPricing: {} },
  'kling-v3-omni-image': { billingMethod: 'per_call', basePriceCNY: 0.1728, baseCredits: 17, optionPricing: { resolution: { '4k': { multiplier: 2 } } } },
  'wan2.7-image': { billingMethod: 'per_call', basePriceCNY: 0.144, baseCredits: 14, optionPricing: { quality: { 'pro': { multiplier: 2.5 } } } },
  'kling-v3-video': { billingMethod: 'per_call', basePriceCNY: 3.2386, baseCredits: 324, optionPricing: { duration: { '10': { multiplier: 2 }, '15': { multiplier: 3 } }, mode: { 'pro': { multiplier: 1.3333 } } } },
  'kling-v2-6': { billingMethod: 'per_call', basePriceCNY: 5.2602, baseCredits: 526, optionPricing: { duration: { '10': { multiplier: 2 } }, sound: { 'off': { multiplier: 0.6 } } } },
  'seedance-2.0': { billingMethod: 'per_token', basePriceCNY: 53.28, baseCredits: 5328, optionPricing: { version: { '标准': { multiplier: 1.2432 } } }, note: '按输出token计费' },
  'veo3.1-lite': { billingMethod: 'per_call', basePriceCNY: 0.36, baseCredits: 36, optionPricing: { quality: { '4k': { multiplier: 1.1 } } } },
  'grok-video-3-plus': { billingMethod: 'per_call', basePriceCNY: 0.4032, baseCredits: 40, optionPricing: { duration: { '15': { multiplier: 2 }, '20': { multiplier: 2 }, '25': { multiplier: 3 }, '30': { multiplier: 3 } } } },
  'hailuo-2.3': { billingMethod: 'per_call', basePriceCNY: 1.6128, baseCredits: 161, optionPricing: { model_version: { '2.3-fast': { multiplier: 0.6964 } }, duration: { '10': { multiplier: 1.6696 } }, resolution: { '1080P': { multiplier: 1.7589 } } } },
  'wan2.6-video': { billingMethod: 'per_call', basePriceCNY: 0.4536, baseCredits: 45, optionPricing: { resolution: { '1080P': { multiplier: 1.6667 } }, duration: { '6': { multiplier: 2 }, '9': { multiplier: 3 }, '12': { multiplier: 4 }, '15': { multiplier: 5 } } } },
  'wan2.7-video': { billingMethod: 'per_call', basePriceCNY: 1.296, baseCredits: 130, optionPricing: { resolution: { '1080P': { multiplier: 1.6667 } }, duration: { '6': { multiplier: 2 }, '9': { multiplier: 3 }, '12': { multiplier: 4 }, '15': { multiplier: 5 } } } },
  'pixverse-v5.6': { billingMethod: 'per_second', basePriceCNY: 0.5414, baseCredits: 54, optionPricing: { resolution: { '720P': { addCNY: 0.048, addCredits: 5 }, '1080P': { addCNY: 0.184, addCredits: 18 } } }, note: '按秒计费' }
};

const CREDITS_PER_CNY = 100;

function convertBackendPricingToCredits(backendPricing) {
  const result = {};
  const imageModels = backendPricing.imageModels || {};
  for (const [modelId, modelData] of Object.entries(imageModels)) {
    if (!modelData.enabled) continue;
    const defaultRes = modelData.defaultResolution || '1k';
    const basePrice = modelData.prices?.[defaultRes] || 0.05;
    result[modelId] = {
      billingMethod: 'per_call',
      basePriceCNY: basePrice,
      baseCredits: Math.max(1, Math.round(basePrice * CREDITS_PER_CNY)),
      optionPricing: {}
    };
    if (modelData.prices) {
      const resolutions = Object.keys(modelData.prices);
      if (resolutions.length > 1) {
        result[modelId].optionPricing.resolution = {};
        for (const res of resolutions) {
          if (res !== defaultRes) {
            const multiplier = modelData.prices[res] / basePrice;
            result[modelId].optionPricing.resolution[res] = { multiplier: Math.round(multiplier * 10000) / 10000 };
          }
        }
      }
    }
  }

  const videoModels = backendPricing.videoModels || {};
  for (const [modelId, modelData] of Object.entries(videoModels)) {
    if (!modelData.enabled) continue;
    const pps = modelData.pricePerSecond || 0.05;
    const minDur = modelData.minDuration || 5;
    const basePrice = pps * minDur;
    result[modelId] = {
      billingMethod: 'per_call',
      basePriceCNY: basePrice,
      baseCredits: Math.max(1, Math.round(basePrice * CREDITS_PER_CNY)),
      optionPricing: {}
    };
    if (modelData.maxDuration && modelData.maxDuration > minDur) {
      result[modelId].optionPricing.duration = {};
      for (let d = minDur + 1; d <= modelData.maxDuration; d++) {
        result[modelId].optionPricing.duration[String(d)] = { multiplier: d / minDur };
      }
    }
  }

  const editModels = backendPricing.editModels || {};
  for (const [modelId, modelData] of Object.entries(editModels)) {
    if (!modelData.enabled) continue;
    const defaultRes = modelData.defaultResolution || '1k';
    const basePrice = modelData.prices?.[defaultRes] || 0.05;
    result[modelId] = {
      billingMethod: 'per_call',
      basePriceCNY: basePrice,
      baseCredits: Math.max(1, Math.round(basePrice * CREDITS_PER_CNY)),
      optionPricing: {}
    };
  }

  return result;
}

export async function fetchDynamicPricing() {
  try {
    const response = await fetch(`${API_BASE}/api/pricing`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.success) {
      const converted = convertBackendPricingToCredits(result);
      dynamicPricingCache = { ...FALLBACK_PRICING, ...converted };
      dynamicPricingTimestamp = Date.now();
      return dynamicPricingCache;
    }
  } catch (err) {
    console.error('[ModelPricing] Failed to fetch dynamic pricing:', err.message);
  }
  return FALLBACK_PRICING;
}

export function getModelPricing(modelId) {
  const source = dynamicPricingCache || FALLBACK_PRICING;
  return source[modelId] || null;
}

export function getAllModelPricing() {
  return dynamicPricingCache || FALLBACK_PRICING;
}

export function calculateComputeCost(modelId, params = {}) {
  const source = dynamicPricingCache || FALLBACK_PRICING;
  const pricing = source[modelId];
  if (!pricing) return 0;

  let credits = pricing.baseCredits;

  for (const [paramKey, paramValue] of Object.entries(params)) {
    const optionPricing = pricing.optionPricing[paramKey];
    if (!optionPricing) continue;

    const valuePricing = optionPricing[String(paramValue)];
    if (!valuePricing) continue;

    if (valuePricing.multiplier) {
      credits = Math.round(credits * valuePricing.multiplier);
    }
    if (valuePricing.addCredits) {
      credits += valuePricing.addCredits;
    }
  }

  if (pricing.billingMethod === 'per_second') {
    const duration = params.duration ? parseInt(params.duration) : 5;
    credits = credits * duration;
  }

  if (pricing.billingMethod === 'per_call' && params.n != null) {
    const n = parseInt(params.n) || 1;
    credits = credits * n;
  }

  return credits;
}

export function formatCredits(credits) {
  if (credits >= 10000) {
    return (credits / 10000).toFixed(1) + '万';
  }
  return credits.toString();
}

export function creditsToCNY(credits) {
  return (credits * 0.01).toFixed(2);
}

export function invalidatePricingCache() {
  dynamicPricingCache = null;
  dynamicPricingTimestamp = 0;
}

export async function ensurePricingLoaded() {
  if (dynamicPricingCache && Date.now() - dynamicPricingTimestamp < DYNAMIC_CACHE_TTL) {
    return dynamicPricingCache;
  }
  return await fetchDynamicPricing();
}

if (typeof window !== 'undefined') {
  ensurePricingLoaded();
  setInterval(() => {
    fetchDynamicPricing().catch(() => {});
  }, DYNAMIC_CACHE_TTL);
}
