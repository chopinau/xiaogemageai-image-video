import APIProtectionService from './apiProtectionService.js';
import * as PricingEngine from './pricingEngine.js';
import CreditsManager from './creditsManager.js';
import * as HealthMonitor from './providerHealthMonitor.js';

const FallbackModels = {
  'gpt-image-2': ['doubao-seedream-4-5', 'kling-v3-image', 'wan2.7-image'],
  'doubao-seedream-4-5': ['gpt-image-2', 'kling-v3-image'],
  'kling-v3-image': ['gpt-image-2', 'doubao-seedream-4-5'],
  'kling-v3-video': ['seedance-2.0', 'hailuo-2.3'],
  'seedance-2.0': ['kling-v3-video', 'hailuo-2.3'],
  'veo3.1-lite': ['kling-v3-video', 'seedance-2.0'],
  'hailuo-2.3': ['kling-v3-video', 'seedance-2.0'],
  'gpt-4o': ['deepseek'],
  'deepseek': ['gpt-4o']
};

class AIGatewayMiddleware {
  constructor(options = {}) {
    this.userStore = options.userStore || {
      data: {},
      async getUserStats(userId) { return this.data[userId] || { dailySpent: 0, monthlySpent: 0, totalRequests: 0 }; },
      async updateUserStats(userId, stats) { this.data[userId] = { ...(this.data[userId] || {}), ...stats }; },
      resetAllDailyStats() { for (const k of Object.keys(this.data)) { this.data[k].dailySpent = 0; } },
      resetAllMonthlyStats() { for (const k of Object.keys(this.data)) { this.data[k].monthlySpent = 0; } }
    };
    this.protectionService = new APIProtectionService(this.userStore);
    this.creditsManager = new CreditsManager({
      data: {},
      async get(userId) { return this.data[userId] || { balance: 0 }; },
      async set(userId, data) { this.data[userId] = data; },
      async update(userId, updates) { this.data[userId] = { ...(this.data[userId] || { balance: 0 }), ...updates }; }
    });
    this.auditLog = [];
    this.maxAuditEntries = 10000;
  }

  async handleGenerationRequest(req, res, next) {
    const { userId, type, model, params } = req.body;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const auditEntry = { requestId, userId, type, model, params, timestamp: Date.now(), steps: [] };

    try {
      // Step 1: Global rate limit
      auditEntry.steps.push({ step: 'global_rate_limit', status: 'checking' });
      const globalLimit = this.protectionService.checkGlobalRateLimit();
      if (!globalLimit.allowed) {
        auditEntry.steps.push({ step: 'global_rate_limit', status: 'rejected', reason: globalLimit.error });
        this._logAudit(auditEntry);
        return res.status(429).json({ success: false, error: globalLimit.error, retryAfter: globalLimit.retryAfter });
      }
      auditEntry.steps.push({ step: 'global_rate_limit', status: 'passed' });

      // Step 2: User rate limit
      auditEntry.steps.push({ step: 'user_rate_limit', status: 'checking' });
      const userRateLimit = await this.protectionService.checkUserRateLimit(userId);
      if (!userRateLimit.allowed) {
        auditEntry.steps.push({ step: 'user_rate_limit', status: 'rejected', reason: userRateLimit.error });
        this._logAudit(auditEntry);
        return res.status(429).json({ success: false, error: userRateLimit.error, retryAfter: userRateLimit.retryAfter });
      }
      auditEntry.steps.push({ step: 'user_rate_limit', status: 'passed' });

      // Step 3: User spending limit
      auditEntry.steps.push({ step: 'spending_limit', status: 'checking' });
      const spendingLimit = await this.protectionService.checkUserSpendingLimit(userId);
      if (!spendingLimit.allowed) {
        auditEntry.steps.push({ step: 'spending_limit', status: 'rejected', reason: spendingLimit.error });
        this._logAudit(auditEntry);
        return res.status(403).json({ success: false, error: spendingLimit.error });
      }
      auditEntry.steps.push({ step: 'spending_limit', status: 'passed' });

      // Step 4: Circuit breaker check
      auditEntry.steps.push({ step: 'circuit_breaker', status: 'checking' });
      const circuitCheck = this.protectionService.checkCircuitBreaker(model);
      if (!circuitCheck.allowed) {
        auditEntry.steps.push({ step: 'circuit_breaker', status: 'rejected', reason: circuitCheck.error });
        this._logAudit(auditEntry);
        return res.status(503).json({ success: false, error: circuitCheck.error, retryAfter: circuitCheck.retryAfter });
      }
      auditEntry.steps.push({ step: 'circuit_breaker', status: 'passed' });

      // Step 5: Calculate buffered price (protects against price increases)
      auditEntry.steps.push({ step: 'price_calculation', status: 'checking' });
      const { basePrice, bufferedPrice, bufferPercent } = this.protectionService.getBufferedPrice(type, model, params);
      auditEntry.priceInfo = { basePrice, bufferedPrice, bufferPercent };
      auditEntry.steps.push({ step: 'price_calculation', status: 'passed', price: bufferedPrice });

      // Step 6: Pre-deduct credits (with buffer)
      auditEntry.steps.push({ step: 'credit_pre_deduct', status: 'checking' });
      const preDeductResult = await this.creditsManager.preDeduct(userId, bufferedPrice, `${type}生成 - ${model}`, requestId);
      if (!preDeductResult.success) {
        auditEntry.steps.push({ step: 'credit_pre_deduct', status: 'rejected', reason: preDeductResult.error });
        this._logAudit(auditEntry);
        return res.status(402).json({ success: false, error: preDeductResult.error, needRecharge: preDeductResult.needRecharge });
      }
      auditEntry.steps.push({ step: 'credit_pre_deduct', status: 'passed', deductionId: preDeductResult.deductionId });
      auditEntry.deductionId = preDeductResult.deductionId;

      // Step 7: Allow request to proceed
      req.aiGateway = {
        requestId,
        deductionId: preDeductResult.deductionId,
        bufferedPrice,
        basePrice,
        model,
        type,
        params
      };

      auditEntry.steps.push({ step: 'gateway', status: 'passed' });
      this._logAudit(auditEntry);

      // Attach middleware to response for post-processing
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        this._handleResponse(req, res, body, originalJson, auditEntry);
      };

      next();
    } catch (error) {
      auditEntry.steps.push({ step: 'error', status: 'failed', error: error.message });
      this._logAudit(auditEntry);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  _handleResponse(req, res, body, originalJson, auditEntry) {
    const { deductionId, bufferedPrice, basePrice, model } = req.aiGateway;

    if (body.success || (body.data && !body.error)) {
      // Generation succeeded - confirm deduction and record usage
      this.protectionService.recordSuccess(model);
      this.creditsManager.confirmDeduct(deductionId);
      this.protectionService.recordUsage(req.body.userId, req.body.type, model, basePrice);
      auditEntry.steps.push({ step: 'response', status: 'success', actualCost: basePrice });

      // Return price difference info to frontend
      const refundAmount = bufferedPrice - basePrice;
      if (refundAmount > 0) {
        // Refund the buffer difference
        this.creditsManager.addCredits(req.body.userId, refundAmount, '价格缓冲返还', 'refund');
        auditEntry.steps.push({ step: 'buffer_refund', status: 'completed', amount: refundAmount });
      }
    } else {
      this.protectionService.recordFailure(model);
      this.creditsManager.rollbackDeduct(deductionId);
      auditEntry.steps.push({ step: 'response', status: 'failed', reason: body.error });

      const fallbacks = FallbackModels[model] || [];
      const availableFallback = this._findAvailableFallback(fallbacks);

      if (availableFallback) {
        auditEntry.steps.push({ step: 'fallback_available', originalModel: model, fallbackModel: availableFallback });
        body.fallbackModel = availableFallback;
        body.fallbackHint = `模型 ${model} 暂时不可用，建议切换到 ${availableFallback}`;
      } else if (fallbacks.length > 0) {
        auditEntry.steps.push({ step: 'fallback_listed', models: fallbacks, note: '备选模型也未通过健康检查' });
      }
    }

    this._logAudit(auditEntry);
    originalJson(body);
  }

  _findAvailableFallback(fallbackModels) {
    for (const fallbackModel of fallbackModels) {
      const cbState = this.protectionService.circuitBreakers.get(fallbackModel);
      if (!cbState || cbState.state === 'closed') {
        return fallbackModel;
      }
    }
    return null;
  }

  _logAudit(entry) {
    this.auditLog.push(entry);
    if (this.auditLog.length > this.maxAuditEntries) {
      this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
    }
  }

  getAuditLog(options = {}) {
    const { page = 1, limit = 20, userId, requestId } = options;
    let filtered = this.auditLog;
    if (userId) filtered = filtered.filter(e => e.userId === userId);
    if (requestId) filtered = filtered.filter(e => e.requestId === requestId);
    const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp);
    const start = (page - 1) * limit;
    return { entries: sorted.slice(start, start + limit), total: sorted.length, page, limit };
  }

  getProtectionStatus() {
    return this.protectionService.getProtectionStatus();
  }

  setPriceBuffer(type, model, bufferPercent) {
    return this.protectionService.setPriceBuffer(type, model, bufferPercent);
  }
}

export default AIGatewayMiddleware;
