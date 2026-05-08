import fetch from 'node-fetch';
import FormData from 'form-data';
import { createReadStream } from 'fs';

export class LingkeClient {
  constructor() {
    this.apiKey = process.env.LINGKE_API_KEY;
    this.baseURL = process.env.LINGKE_BASE_URL || 'https://lingkeapi.com';
    this.uploadURL = process.env.UPLOAD_BASE_URL || 'https://imageproxy.zhongzhuan.chat/api/upload';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  async request(method, endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const fetchOptions = {
          method,
          headers,
          timeout: options.timeout || 60000
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

        const response = await fetch(url, fetchOptions);

        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || 5;
          await this._sleep(retryAfter * 1000);
          continue;
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          await this._sleep(this.retryDelay * (attempt + 1));
          continue;
        }

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error?.message || data.message || `HTTP ${response.status}`;
          return { success: false, error: errorMsg, status: response.status };
        }

        return { success: true, data };
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          await this._sleep(this.retryDelay * (attempt + 1));
        }
      }
    }

    return { success: false, error: lastError?.message || 'Request failed after retries' };
  }

  async syncImageGenerate(model, prompt, options = {}) {
    const body = {
      model,
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      response_format: options.response_format || 'url',
      ...options
    };
    delete body.image;
    delete body.mask;

    return this.request('POST', '/v1/images/generations', { body });
  }

  async syncImageEdit(model, prompt, image, options = {}) {
    const body = {
      model,
      prompt,
      image,
      response_format: options.response_format || 'url',
      size: options.size || 'adaptive',
      guidance_scale: options.guidance_scale || 5.5,
      watermark: options.watermark || false,
      ...options
    };

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
    if (options.n) formData.append('n', String(options.n));
    if (options.aspect_ratio) formData.append('aspect_ratio', options.aspect_ratio);
    if (options.background) formData.append('background', options.background);

    return this.request('POST', '/v1/images/edits', { body: formData });
  }

  async fluxTextToImage(prompt, options = {}) {
    const body = {
      prompt,
      guidance_scale: options.guidance_scale || 3.5,
      num_images: options.num_images || 1,
      output_format: options.output_format || 'jpeg',
      safety_tolerance: options.safety_tolerance || '2',
      aspect_ratio: options.aspect_ratio || '1:1'
    };

    return this.request('POST', '/fal-ai/flux-pro/kontext/text-to-image', { body });
  }

  async fluxImageEdit(prompt, imageUrls, options = {}) {
    const body = {
      prompt,
      image_urls: imageUrls,
      num_images: options.num_images || 1
    };

    return this.request('POST', '/fal-ai/nano-banana/edit', { body });
  }

  async queryFluxTask(modelName, requestId) {
    return this.request('GET', `/fal-ai/${modelName}/requests/${requestId}`);
  }

  async createVeoVideo(model, prompt, options = {}) {
    const body = {
      model,
      prompt,
      enable_upsample: options.enable_upsample !== false,
      enhance_prompt: options.enhance_prompt !== false
    };
    if (options.images) body.images = options.images;
    if (options.aspect_ratio) body.aspect_ratio = options.aspect_ratio;

    return this.request('POST', '/v1/video/create', { body });
  }

  async createSoraVideo(model, prompt, options = {}) {
    const body = {
      model: model || 'sora-2',
      prompt,
      orientation: options.orientation || 'landscape',
      size: options.size || 'small',
      duration: String(options.duration || 10),
      images: options.images || [],
      watermark: String(options.watermark || 'false')
    };

    return this.request('POST', '/v1/video/create', { body });
  }

  async queryVideoTask(taskId) {
    return this.request('GET', `/v1/video/query?id=${encodeURIComponent(taskId)}`);
  }

  async createKlingVideo(modelName, prompt, options = {}) {
    const body = {
      model_name: modelName || 'kling-v1-6',
      prompt,
      duration: options.duration || 5,
      mode: options.mode || 'std',
      aspect_ratio: options.aspect_ratio || '16:9',
      cfg_scale: options.cfg_scale || 0.5
    };
    if (options.negative_prompt) body.negative_prompt = options.negative_prompt;

    return this.request('POST', '/kling/v1/videos/text2video', { body });
  }

  async createKlingImage2Video(modelName, prompt, imageUrl, options = {}) {
    const body = {
      model_name: modelName || 'kling-v1-6',
      prompt,
      image: imageUrl,
      duration: options.duration || 5,
      mode: options.mode || 'std'
    };

    return this.request('POST', '/kling/v1/videos/image2video', { body });
  }

  async queryKlingTask(action, action2, taskId) {
    return this.request('GET', `/kling/v1/${action}/${action2}/${taskId}`);
  }

  async createRunwayVideo(promptImage, promptText, options = {}) {
    const body = {
      promptImage,
      model: options.model || 'gen4_turbo',
      promptText: promptText || '',
      duration: options.duration || 5,
      ratio: options.ratio || '1280:768'
    };

    return this.request('POST', '/runwayml/v1/image_to_video', { body });
  }

  async queryLumaTask(taskId) {
    return this.request('GET', `/luma/generations/${taskId}`);
  }

  async createSeedanceVideo(model, prompt, options = {}) {
    const content = [{ type: 'text', text: prompt }];
    if (options.imageUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: options.imageUrl },
        role: options.imageRole || 'first_frame'
      });
    }

    const body = { model, content };

    return this.request('POST', '/volc/v1/contents/generations/tasks', { body });
  }

  async querySeedanceTask(taskId) {
    return this.request('GET', `/volc/v1/contents/generations/tasks/${taskId}`);
  }

  async createHailuoVideo(prompt, options = {}) {
    const body = {
      model: 'MiniMax-Hailuo-02',
      prompt,
      duration: options.duration || 6
    };

    return this.request('POST', '/minimax/v1/video_generation', { body });
  }

  async queryHailuoTask(taskId) {
    return this.request('GET', `/minimax/v1/video_generation/query?task_id=${taskId}`);
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

  async uploadImage(fileBuffer, filename, mimetype) {
    const formData = new FormData();
    formData.append('file', fileBuffer, { filename, contentType: mimetype });

    const url = this.uploadURL;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...formData.getHeaders()
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        timeout: 30000
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Upload failed' };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const lingkeClient = new LingkeClient();
