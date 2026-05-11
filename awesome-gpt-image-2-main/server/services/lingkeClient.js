import fetch from 'node-fetch';
import FormData from 'form-data';

export class LingkeClient {
  constructor() {
    this.baseURL = process.env.LINGKE_BASE_URL || 'https://lingkeapi.com';
    this._apiKey = null; // Lazy load to ensure .env is loaded
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  get apiKey() {
    if (!this._apiKey) {
      this._apiKey = process.env.LINGKE_API_KEY;
    }
    return this._apiKey;
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${options.apiKey || this.apiKey}`,
      ...options.headers
    };

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const fetchOptions = {
          method,
          headers,
          timeout: options.timeout || 120000
        };

        if (options.body && method !== 'GET') {
          if (options.body instanceof FormData) {
            Object.assign(headers, options.body.getHeaders());
            fetchOptions.body = options.body;
          } else if (typeof options.body === 'object') {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(options.body);
          } else {
            fetchOptions.body = options.body;
          }
        }

        console.log(`[LingkeClient] ${method} ${endpoint}`, options.body ? JSON.stringify(options.body).substring(0, 200) : '');

        const response = await fetch(url, fetchOptions);

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || 5;
          console.log(`[LingkeClient] Rate limited, retrying in ${retryAfter}s...`);
          await this._sleep(retryAfter * 1000);
          continue;
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          console.log(`[LingkeClient] Server error ${response.status}, retry ${attempt + 1}...`);
          await this._sleep(this.retryDelay * (attempt + 1));
          continue;
        }

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error?.message || data.msg || data.message || `HTTP ${response.status}`;
          console.error(`[LingkeClient] Error: ${errorMsg}`);
          return { success: false, error: errorMsg, status: response.status };
        }

        console.log(`[LingkeClient] Response:`, JSON.stringify(data).substring(0, 300));
        return { success: true, data };
      } catch (err) {
        lastError = err;
        console.error(`[LingkeClient] Request error (attempt ${attempt + 1}):`, err.message);
        if (attempt < this.maxRetries) {
          await this._sleep(this.retryDelay * (attempt + 1));
        }
      }
    }

    return { success: false, error: lastError?.message || 'Request failed after retries' };
  }

  async mediaGenerate(model, params, apiKey) {
    const body = { model, ...params };
    return this.request('POST', '/v1/images/generations', { body, apiKey });
  }

  async getTaskStatus(taskId, apiKey) {
    return this.request('GET', `/v1/skills/task-status?task_id=${taskId}`, { apiKey });
  }

  async pollUntilFinal(taskId, onProgress, maxWait = 300000, apiKey) {
    const startTime = Date.now();
    const pollInterval = 5000;

    while (Date.now() - startTime < maxWait) {
      const result = await this.getTaskStatus(taskId, apiKey);

      if (!result.success) {
        if (result.status === 404) {
          await this._sleep(pollInterval);
          continue;
        }
        return result;
      }

      const taskData = result.data;
      const isFinal = taskData.is_final;
      const progress = taskData.progress;
      const status = taskData.status;

      console.log(`[LingkeClient] Poll ${taskId}: status=${status}, progress=${progress}, is_final=${isFinal}`);

      if (onProgress) onProgress(progress, status);

      if (isFinal || status === 'completed' || status === 'failed') {
        if (status === 'failed') {
          return {
            success: false,
            error: taskData.error || taskData.msg || 'Generation failed',
            data: taskData
          };
        }
        return { success: true, data: taskData };
      }

      await this._sleep(pollInterval);
    }

    return { success: false, error: 'Task timed out after ' + Math.round(maxWait / 1000) + 's' };
  }

  async getModelPricing(modelName, apiKey) {
    const result = await this.request('GET', `/v1/skills/models/${modelName}/pricing?status=active`, { apiKey });
    if (result.success && result.data && !result.data.error) {
      return { success: true, data: result.data };
    }
    const allResult = await this.request('GET', `/v1/skills/models/${modelName}/pricing`, { apiKey });
    if (allResult.success && allResult.data && !allResult.data.error) {
      return { success: true, data: allResult.data };
    }

    let apiPricingData = null;
    try {
      const pricingRes = await this.request('GET', '/api/pricing', { apiKey });
      if (pricingRes.success && pricingRes.data?.model_info) {
        const modelInfo = pricingRes.data.model_info[modelName];
        if (modelInfo) {
          apiPricingData = modelInfo;
        }
      }
    } catch (e) {
      // ignore
    }

    return {
      success: true,
      data: {
        model: modelName,
        display_name: apiPricingData?.name || modelName,
        channel_groups: [{
          group_name: 'default',
          is_active: true,
          base_price: this.getDefaultPrice(modelName),
          success_rate_24h: 95,
          avg_response_seconds: 10
        }]
      }
    };
  }

  getDefaultPrice(modelName) {
    const priceMap = {
      'gpt-image-2': 0.15,
      'gpt-image-1.5-all': 0.05,
      'doubao-seedream-5-0-260128': 0.08,
      'doubao-seedream-4-5-251128': 0.06,
      'gemini-3-pro-image-preview': 0.12,
      'gemini-3.1-flash-image-preview': 0.08,
      'kling-v3-omni': 0.10,
      'kling-v3': 0.08,
      'mj_imagine': 0.20,
      'grok-4.2-image': 0.10,
      'wan2.7-image': 0.06,
      'wan2.6-image': 0.05,
    };
    return priceMap[modelName] || 0.10;
  }

  async getModelsList(type, apiKey) {
    const endpoint = type ? `/v1/skills/models?type=${type}` : '/v1/skills/models';
    return this.request('GET', endpoint, { apiKey });
  }

  async getAllModelPricings(apiKey) {
    const modelsResult = await this.getModelsList(null, apiKey);
    if (!modelsResult.success) return modelsResult;

    const models = modelsResult.data?.data || modelsResult.data || [];
    const pricings = {};

    for (const model of models) {
      const modelName = model.model_name || model.name || model.id;
      if (!modelName) continue;
      const pricingResult = await this.getModelPricing(modelName, apiKey);
      if (pricingResult.success && pricingResult.data) {
        pricings[modelName] = pricingResult.data;
      }
    }

    return { success: true, data: pricings };
  }

  async getApiPricing(apiKey) {
    const result = await this.request('GET', '/api/pricing', { apiKey });
    if (result.success && result.data?.model_info) {
      const pricings = {};
      for (const [modelName, modelInfo] of Object.entries(result.data.model_info)) {
        pricings[modelName] = {
          model: modelName,
          display_name: modelInfo.name || modelName,
          channel_groups: [{
            group_name: 'default',
            is_active: true,
            base_price: this.getDefaultPrice(modelName),
            success_rate_24h: 95,
            avg_response_seconds: 10
          }]
        };
      }
      return { success: true, data: pricings };
    }
    return result;
  }

  async getModelParams(modelName, apiKey) {
    return this.request('GET', `/v1/skills/models/${modelName}`, { apiKey });
  }

  async syncImageGenerate(model, prompt, options = {}) {
    const body = { model, prompt, ...options };
    delete body.image;
    delete body.mask;
    return this.request('POST', '/v1/images/generations', { body });
  }

  async syncImageEdit(model, prompt, image, options = {}) {
    const body = { model, prompt, image, ...options };
    return this.request('POST', '/v1/images/generations', { body });
  }

  async multipartImageEdit(imageBuffer, prompt, model, options = {}) {
    const formData = new FormData();
    if (imageBuffer) {
      formData.append('image', imageBuffer, { filename: 'image.png', contentType: 'image/png' });
    }
    formData.append('prompt', prompt);
    if (model) formData.append('model', model);
    if (options.mask) {
      formData.append('mask', options.mask, { filename: 'mask.png', contentType: 'image/png' });
    }
    Object.entries(options).forEach(([key, value]) => {
      if (key !== 'mask') formData.append(key, String(value));
    });
    return this.request('POST', '/v1/images/edits', { body: formData });
  }

  async chatCompletion(model, messages, options = {}) {
    const body = {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: false
    };
    return this.request('POST', '/v1/chat/completions', { body });
  }

  async _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const lingkeClient = new LingkeClient();