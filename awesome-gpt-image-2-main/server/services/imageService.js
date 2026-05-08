import { lingkeClient } from './lingkeClient.js';
import { taskManager } from '../utils/taskManager.js';

const SYNC_MODELS = ['gpt-image-2', 'dall-e-3', 'stable-diffusion-xl', 'doubao-seedream-4-0-250828'];
const ASYNC_QUEUE_MODELS = ['flux-pro'];
const EDIT_MODELS = ['doubao-seededit-3-0-i2i-250628', 'gpt-image-1', 'gpt-image-1-all', 'flux-kontext-pro', 'flux-kontext-max'];

export class ImageService {
  async generate(model, prompt, options = {}) {
    if (SYNC_MODELS.includes(model)) {
      return this._syncGenerate(model, prompt, options);
    } else if (ASYNC_QUEUE_MODELS.includes(model)) {
      return this._asyncQueueGenerate(model, prompt, options);
    }
    return this._syncGenerate(model, prompt, options);
  }

  async edit(model, prompt, image, options = {}) {
    if (model === 'doubao-seededit-3-0-i2i-250628') {
      return this._seededitEdit(model, prompt, image, options);
    }
    if (model === 'flux-kontext-pro' || model === 'flux-kontext-max') {
      return this._fluxKontextEdit(model, prompt, image, options);
    }
    return this._genericEdit(model, prompt, image, options);
  }

  async inpaint(model, prompt, image, mask, options = {}) {
    return lingkeClient.multipartImageEdit(image, prompt, model, { mask, ...options });
  }

  async _syncGenerate(model, prompt, options) {
    const result = await lingkeClient.syncImageGenerate(model, prompt, {
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality,
      style: options.style,
      response_format: 'url'
    });

    if (!result.success) return result;

    const images = (result.data?.data || []).map(img => ({
      url: img.url || img.b64_json,
      revisedPrompt: img.revised_prompt
    }));

    return {
      success: true,
      images,
      model,
      usage: result.data?.usage,
      timestamp: Date.now()
    };
  }

  async _asyncQueueGenerate(model, prompt, options) {
    const result = await lingkeClient.fluxTextToImage(prompt, {
      guidance_scale: options.guidance_scale || 3.5,
      num_images: options.n || 1,
      aspect_ratio: options.aspect_ratio || '1:1',
      output_format: options.output_format || 'jpeg'
    });

    if (!result.success) return result;

    const requestId = result.data?.request_id;
    if (!requestId) {
      return { success: false, error: 'No request_id returned' };
    }

    const taskId = `flux_${requestId}`;
    const modelName = 'flux-pro';

    taskManager.createTask(taskId, async () => {
      return lingkeClient.queryFluxTask(modelName, requestId);
    });

    return {
      success: true,
      taskId,
      status: 'pending',
      model,
      timestamp: Date.now()
    };
  }

  async _seededitEdit(model, prompt, image, options) {
    const result = await lingkeClient.syncImageEdit(model, prompt, image, {
      response_format: 'url',
      size: 'adaptive',
      guidance_scale: options.guidance_scale || 5.5,
      watermark: false
    });

    if (!result.success) return result;

    const images = (result.data?.data || []).map(img => ({
      url: img.url
    }));

    return {
      success: true,
      images,
      model,
      timestamp: Date.now()
    };
  }

  async _fluxKontextEdit(model, prompt, image, options) {
    const imageUrls = Array.isArray(image) ? image : [image];
    const result = await lingkeClient.fluxImageEdit(prompt, imageUrls, {
      num_images: options.n || 1
    });

    if (!result.success) return result;

    const requestId = result.data?.request_id;
    if (!requestId) {
      return { success: false, error: 'No request_id returned' };
    }

    const taskId = `flux_edit_${requestId}`;

    taskManager.createTask(taskId, async () => {
      return lingkeClient.queryFluxTask('nano-banana', requestId);
    });

    return {
      success: true,
      taskId,
      status: 'pending',
      model,
      timestamp: Date.now()
    };
  }

  async _genericEdit(model, prompt, image, options) {
    if (Buffer.isBuffer(image)) {
      return lingkeClient.multipartImageEdit(image, prompt, model, options);
    }
    return lingkeClient.syncImageEdit(model, prompt, image, options);
  }

  async getTaskResult(taskId) {
    const task = taskManager.getTaskStatus(taskId);
    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    if (task.status === 'completed') {
      const images = task.result?.images || [];
      return {
        success: true,
        status: 'completed',
        images: images.map(img => ({ url: img.url })),
        model: 'flux-pro',
        timestamp: Date.now()
      };
    }

    return {
      success: true,
      status: task.status,
      progress: task.progress,
      error: task.error
    };
  }
}

export const imageService = new ImageService();
