const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const PRICING_CACHE = {};
const CACHE_TTL = 5 * 60 * 1000;

export async function getModelPricing(modelName) {
  const cacheKey = `pricing:${modelName}`;
  const cached = PRICING_CACHE[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE}/pricing/${modelName}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success && result.data) {
      PRICING_CACHE[cacheKey] = { data: result.data, timestamp: Date.now() };
      return result.data;
    }
    return null;
  } catch (err) {
    console.error('[PricingService] Failed to get pricing:', err.message);
    return null;
  }
}

export async function getAllModelPricings() {
  const cacheKey = 'pricing:all';
  const cached = PRICING_CACHE[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE}/pricing`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (result.success && result.data) {
      PRICING_CACHE[cacheKey] = { data: result.data, timestamp: Date.now() };
      return result.data;
    }
    return null;
  } catch (err) {
    console.error('[PricingService] Failed to get all pricings:', err.message);
    return null;
  }
}

export function getActiveGroups(pricingData) {
  if (!pricingData?.channel_groups) return [];
  return pricingData.channel_groups.filter(g => g.is_active !== false);
}

export function getCheapestGroup(pricingData) {
  const active = getActiveGroups(pricingData);
  if (active.length === 0) return null;
  return active.reduce((min, g) => g.base_price < min.base_price ? g : min, active[0]);
}

export function getFastestGroup(pricingData) {
  const active = getActiveGroups(pricingData).filter(g => g.avg_response_seconds > 0);
  if (active.length === 0) return null;
  return active.reduce((min, g) => g.avg_response_seconds < min.avg_response_seconds ? g : min, active[0]);
}

export function getMostReliableGroup(pricingData) {
  const active = getActiveGroups(pricingData).filter(g => g.success_rate_24h > 0);
  if (active.length === 0) return null;
  return active.reduce((max, g) => g.success_rate_24h > max.success_rate_24h ? g : max, active[0]);
}

export function formatPrice(price) {
  if (price === undefined || price === null) return '--';
  if (price < 0.01) return `¥${(price * 1000).toFixed(1)}m`;
  if (price < 1) return `¥${price.toFixed(4)}`;
  return `¥${price.toFixed(2)}`;
}

export function calculateFinalPrice(group, params = {}) {
  if (!group) return 0;
  let price = group.base_price;
  if (group.option_prices) {
    for (const opt of group.option_prices) {
      const paramValue = params[opt.param_name];
      if (paramValue !== undefined && String(paramValue) === String(opt.option_value)) {
        price = price * (opt.price_multiplier || 1) + (opt.price_addition || 0);
      }
    }
  }
  return price;
}

export function getGroupTypeLabel(group) {
  const name = (group.group_name || '').toLowerCase();
  if (name.includes('特价') || name.includes('经济') || name.includes('优惠') || name.includes('discount') || name.includes('economy')) return { label: '经济', color: '#34d399' };
  if (name.includes('官转') || name.includes('官方') || name.includes('premium') || name.includes('品质')) return { label: '品质', color: '#fbbf24' };
  if (name.includes('快速') || name.includes('速度') || name.includes('fast') || name.includes('speed')) return { label: '快速', color: '#42e6ff' };
  if (name.includes('标准') || name.includes('默认') || name.includes('standard') || name.includes('default')) return { label: '标准', color: '#9eeeff' };
  return { label: '通用', color: '#73859f' };
}

export function clearPricingCache() {
  Object.keys(PRICING_CACHE).forEach(key => delete PRICING_CACHE[key]);
}
