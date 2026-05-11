import * as PricingEngine from './pricingEngine.js';

const DEFAULT_BUFFER_PERCENT = 15;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 15;
const GLOBAL_RATE_LIMIT_PER_SECOND = 50;
const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5;
const CIRCUIT_BREAKER_RECOVERY_MS = 60000;

class APIProtectionService {
  constructor() {
    this.priceBuffers = {};
    this.userRateLimiters = new Map();
    this.globalRateLimiter = { count: 0, resetAt: Date.now() + 1000 };
    this.priceCache = new Map();
    this.priceCacheTTL = 300000;
    this.circuitBreakers = new Map();
    this.usageStats = new Map();
  }

  getBufferedPrice(type, model, params) {
    const cacheKey = `${type}:${model}:${JSON.stringify(params)}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.priceCacheTTL) {
      return cached;
    }
    const basePrice = PricingEngine.calculateCost(type, model, params);
    const bufferPercent = this.getPriceBuffer(type, model);
    const bufferedPrice = Math.round(basePrice * (1 + bufferPercent / 100) * 100) / 100;
    const result = { basePrice, bufferedPrice, bufferPercent };
    this.priceCache.set(cacheKey, { ...result, timestamp: Date.now() });
    return result;
  }

  getPriceBuffer(type, model) {
    const key = `${type}:${model}`;
    return this.priceBuffers[key] !== undefined ? this.priceBuffers[key] : DEFAULT_BUFFER_PERCENT;
  }

  setPriceBuffer(type, model, bufferPercent) {
    const key = `${type}:${model}`;
    this.priceBuffers[key] = Math.max(0, Math.min(50, bufferPercent));
    this.priceCache.clear();
    return { success: true, bufferPercent: this.priceBuffers[key] };
  }

  checkUserRateLimit(userId) {
    const now = Date.now();
    const userLimiter = this.userRateLimiters.get(userId);
    if (userLimiter && now < userLimiter.resetAt) {
      if (userLimiter.count >= DEFAULT_RATE_LIMIT_PER_MINUTE) {
        return { allowed: false, error: '请求过于频繁，请稍后再试', retryAfter: Math.ceil((userLimiter.resetAt - now) / 1000) };
      }
      userLimiter.count++;
      return { allowed: true, remaining: DEFAULT_RATE_LIMIT_PER_MINUTE - userLimiter.count };
    }
    this.userRateLimiters.set(userId, { count: 1, resetAt: now + 60000 });
    return { allowed: true, remaining: DEFAULT_RATE_LIMIT_PER_MINUTE - 1 };
  }

  checkGlobalRateLimit() {
    const now = Date.now();
    if (now >= this.globalRateLimiter.resetAt) {
      this.globalRateLimiter = { count: 0, resetAt: now + 1000 };
    }
    if (this.globalRateLimiter.count >= GLOBAL_RATE_LIMIT_PER_SECOND) {
      return { allowed: false, error: '系统繁忙，请稍后再试', retryAfter: Math.ceil((this.globalRateLimiter.resetAt - now) / 1000) };
    }
    this.globalRateLimiter.count++;
    return { allowed: true, remaining: GLOBAL_RATE_LIMIT_PER_SECOND - this.globalRateLimiter.count };
  }

  checkCircuitBreaker(provider) {
    const cb = this.circuitBreakers.get(provider);
    if (!cb) return { allowed: true };
    const now = Date.now();
    if (cb.state === 'open' && now < cb.resetAt) {
      return { allowed: false, error: `${provider} 服务暂时不可用，请稍后再试`, retryAfter: Math.ceil((cb.resetAt - now) / 1000) };
    }
    if (cb.state === 'open' && now >= cb.resetAt) {
      cb.state = 'half-open';
      cb.failCount = 0;
      this.circuitBreakers.set(provider, cb);
    }
    return { allowed: true };
  }

  recordSuccess(provider) {
    const cb = this.circuitBreakers.get(provider);
    if (cb) {
      cb.failCount = 0;
      cb.successCount = (cb.successCount || 0) + 1;
      cb.state = 'closed';
      this.circuitBreakers.set(provider, cb);
    } else {
      this.circuitBreakers.set(provider, { state: 'closed', failCount: 0, successCount: 1, resetAt: 0 });
    }
  }

  recordFailure(provider) {
    let cb = this.circuitBreakers.get(provider);
    if (!cb) cb = { state: 'closed', failCount: 0, successCount: 0, resetAt: 0 };
    cb.failCount++;
    if (cb.failCount >= CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
      cb.state = 'open';
      cb.resetAt = Date.now() + CIRCUIT_BREAKER_RECOVERY_MS;
      console.warn(`[CircuitBreaker] ${provider} 已熔断，${CIRCUIT_BREAKER_RECOVERY_MS / 1000}秒后重试`);
    } else if (cb.failCount >= 3) {
      cb.state = 'half-open';
    }
    this.circuitBreakers.set(provider, cb);
  }

  recordUsage(userId, type, model, cost) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    const stats = this.usageStats.get(key) || { dailySpent: 0, requestCount: 0, models: {} };
    stats.dailySpent += cost;
    stats.requestCount++;
    stats.models[model] = (stats.models[model] || 0) + 1;
    this.usageStats.set(key, stats);
    return stats;
  }

  getUserDailyUsage(userId) {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}:${today}`;
    return this.usageStats.get(key) || { dailySpent: 0, requestCount: 0, models: {} };
  }

  getProtectionStatus() {
    const cbStatus = {};
    for (const [provider, cb] of this.circuitBreakers.entries()) {
      cbStatus[provider] = cb;
    }
    return {
      circuitBreakers: cbStatus,
      globalRateLimit: { count: this.globalRateLimiter.count, limit: GLOBAL_RATE_LIMIT_PER_SECOND },
      priceBuffers: this.priceBuffers,
      activeRateLimiters: this.userRateLimiters.size,
      activeUsers: this.usageStats.size
    };
  }
}

const apiProtection = new APIProtectionService();
export default apiProtection;
