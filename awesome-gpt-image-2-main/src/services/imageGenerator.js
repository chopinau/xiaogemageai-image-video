import { API_CONFIG, API_ENDPOINTS, createAPIHeaders, buildURL } from '../config/api';
import { getModelById } from '../config/models';

function normalizeImageUrl(img) {
  if (typeof img === 'string') {
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `data:image/png;base64,${img}`;
  }
  if (img.url) {
    if (img.url.startsWith('data:') || img.url.startsWith('http')) return img.url;
    return `data:image/png;base64,${img.url}`;
  }
  if (img.b64_json) {
    if (img.b64_json.startsWith('data:') || img.b64_json.startsWith('http')) return img.b64_json;
    return `data:image/${img.mime_type || 'png'};base64,${img.b64_json}`;
  }
  return null;
}

function parseResponseImages(result) {
  if (!result) return [];
  if (result.images && result.images.length > 0) {
    return result.images.map(img => ({ url: normalizeImageUrl(img) })).filter(img => img.url);
  }
  if (result.data && result.data.images) {
    return result.data.images.map(img => ({ url: normalizeImageUrl(img) })).filter(img => img.url);
  }
  if (result.data && Array.isArray(result.data)) {
    return result.data.map(img => ({ url: normalizeImageUrl(img) })).filter(img => img.url);
  }
  if (result.output && result.output.data) {
    return result.output.data.map(img => ({ url: normalizeImageUrl(img) })).filter(img => img.url);
  }
  if (result.output && result.output.url) {
    return [{ url: normalizeImageUrl(result.output) }];
  }
  return [];
}

export class ImageGenerator {
  constructor(apiKey, modelId = 'gpt-image-2') {
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.model = getModelById(modelId, 'image');
  }

  setModel(modelId) {
    this.modelId = modelId;
    this.model = getModelById(modelId, 'image');
  }

  async generate(prompt, options = {}) {
    if (!this.model) {
      throw new Error(`Model ${this.modelId} not found`);
    }

    const params = {
      model: this.model.lingkeModel || this.modelId,
      prompt,
      ...this.model.defaultParams,
      ...options
    };

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.image.generate), {
          method: 'POST',
          headers: createAPIHeaders(this.apiKey),
          body: JSON.stringify(params)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const errorMsg = result.error || result.message || `HTTP error! status: ${response.status}`;
          throw new Error(errorMsg);
        }

      if (result.taskId) {
        return await this._pollAsyncTask(result.taskId, prompt);
      }

      const images = parseResponseImages(result);

      return {
        success: true,
        images,
        prompt: result.prompt || prompt,
        model: this.modelId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async edit(image, prompt, options = {}) {
    const isFileInput = image instanceof File || image instanceof Blob;

    try {
      let response;
      if (isFileInput) {
        const formData = new FormData();
        formData.append('images', image);
        formData.append('prompt', prompt);
        formData.append('model', this.model?.lingkeModel || this.modelId);
        Object.entries(options).forEach(([key, value]) => {
          formData.append(key, value);
        });

        response = await fetch(buildURL(API_ENDPOINTS.image.edit), {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          body: formData
        });
      } else {
        response = await fetch(buildURL(API_ENDPOINTS.image.edit), {
          method: 'POST',
          headers: createAPIHeaders(this.apiKey),
          body: JSON.stringify({
            model: this.model?.lingkeModel || this.modelId,
            prompt,
            imageUrl: image,
            ...options
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.taskId) {
        return await this._pollAsyncTask(result.taskId, prompt);
      }

      const images = parseResponseImages(result);

      return {
        success: true,
        images,
        prompt: result.prompt || prompt,
        model: this.modelId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async inpaint(image, mask, prompt, options = {}) {
    const formData = new FormData();
    if (image) formData.append('images', image);
    if (mask) formData.append('images', mask);
    formData.append('prompt', prompt);
    formData.append('model', this.model?.lingkeModel || this.modelId);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.image.inpaint), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const images = parseResponseImages(result);
      return {
        success: true,
        images,
        prompt: result.prompt || prompt,
        model: this.modelId,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        model: this.modelId
      };
    }
  }

  async _pollAsyncTask(taskId, prompt, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));

      const response = await fetch(buildURL(`${API_ENDPOINTS.image.taskStatus}/${taskId}`), {
        method: 'GET',
        headers: createAPIHeaders(this.apiKey)
      });

      if (!response.ok) continue;

      const result = await response.json();

      if (result.status === 'completed') {
        const images = parseResponseImages(result);
        return {
          success: true,
          images,
          prompt: prompt,
          model: this.modelId,
          timestamp: Date.now()
        };
      }

      if (result.status === 'failed') {
        return {
          success: false,
          error: result.error || 'Generation failed',
          model: this.modelId
        };
      }
    }

    return {
      success: false,
      error: 'Generation timed out',
      model: this.modelId
    };
  }

  estimateCost(options = {}) {
    const numImages = options.numImages || 1;
    const basePrice = this.model?.pricing?.perImage || 0;
    return basePrice * numImages;
  }
}

export const createImageGenerator = (apiKey, modelId) => {
  return new ImageGenerator(apiKey, modelId);
};
