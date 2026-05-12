import { lingkeClient } from './lingkeClient.js';
import fetch from 'node-fetch';

const MODEL_ID_MAP = {
  'gpt-image-2': 'gpt-image-2',
  'gpt-image-2-all': 'gpt-image-2-all',
  'gpt-image-1.5': 'gpt-image-1.5',
  'gpt-image-1.5-all': 'gpt-image-1.5-all',
  'doubao-seedream-5-0': 'doubao-seedream-5-0-260128',
  'doubao-seedream-5-0-260128': 'doubao-seedream-5-0-260128',
  'doubao-seedream-4-5': 'doubao-seedream-4-5-251128',
  'doubao-seedream-4-5-251128': 'doubao-seedream-4-5-251128',
  'gemini-3-pro-image': 'gemini-2.0-flash-exp',
  'gemini-3-pro-image-preview': 'gemini-2.0-flash-exp',
  'kling-v3-image': 'kling-image',
  'kling-v3': 'kling-image',
  'kling-v3-omni-image': 'kling-omni-image',
  'kling-v3-omni': 'kling-omni-image',
  'wan2.7-image': 'wan2.1-t2i-14b',
  'mj_imagine': 'mj_imagine',
  'grok-4.2-image': 'grok-4.2-image',
};

function resolveApiModelId(frontendModelId) {
  return MODEL_ID_MAP[frontendModelId] || frontendModelId;
}

/**
 * Map system parameter names to API parameter names.
 * The frontend uses unified names (resolution, aspect_ratio), but different
 * API models expect different names. This function bridges the gap.
 */
function mapParamsToApi(model, params) {
  const mapped = { ...params };

  if (mapped.n !== undefined) {
    delete mapped.n;
  }

  if (mapped.aspectRatio !== undefined && !mapped.aspect_ratio) {
    mapped.aspect_ratio = mapped.aspectRatio;
    delete mapped.aspectRatio;
  }

  if (mapped.ratio !== undefined && !mapped.aspect_ratio) {
    mapped.aspect_ratio = mapped.ratio;
    delete mapped.ratio;
  }

  const imageSizeModels = [
    'kling-v3-omni', 'kling-v3-omni-image',
    'gemini-3-pro-image', 'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview'
  ];
  if (imageSizeModels.includes(model) && mapped.resolution && !mapped.imageSize) {
    mapped.imageSize = mapped.resolution;
    delete mapped.resolution;
  }

  const camelAspectModels = [
    'mj_imagine',
    'gemini-3-pro-image', 'gemini-3-pro-image-preview',
    'gemini-3.1-flash-image-preview'
  ];
  if (camelAspectModels.includes(model) && mapped.aspect_ratio && !mapped.aspectRatio) {
    mapped.aspectRatio = mapped.aspect_ratio;
    delete mapped.aspect_ratio;
  }

  const sizeModels = ['gpt-image-2', 'gpt-image-1.5-all', 'gpt-image-2-guan', 'gpt-image-2-all'];
  if (sizeModels.includes(model)) {
    if (mapped.aspect_ratio && !mapped.size) {
      const sizeMap = {
        '1:1': '1024x1024', '2:3': '1024x1536', '3:2': '1536x1024',
        '3:4': '960x1280', '4:3': '1280x960', '9:16': '1088x1920', '16:9': '1920x1088'
      };
      if (sizeMap[mapped.aspect_ratio]) {
        mapped.size = sizeMap[mapped.aspect_ratio];
      }
      delete mapped.aspect_ratio;
    }
    if (mapped.resolution) {
      delete mapped.resolution;
    }
  }

  const doubaoImageModels = ['doubao-seedream-5-0-260128', 'doubao-seedream-4-5-251128', 'doubao-seedream-5-0', 'doubao-seedream-4-5'];
  if (doubaoImageModels.includes(model)) {
    if (mapped.resolution) {
      mapped.resolution = mapped.resolution;
    }
  }

  const klingImageModels = ['kling-v3', 'kling-v3-omni', 'kling-v3-image', 'kling-v3-omni-image'];
  if (klingImageModels.includes(model)) {
    if (mapped.resolution) {
      mapped.resolution = mapped.resolution.toLowerCase();
    }
  }

  return mapped;
}

function normalizeImageUrl(img) {
  if (!img) return null;
  if (typeof img === 'string') {
    if (img.startsWith('data:') || img.startsWith('http')) return img;
    return `data:image/png;base64,${img}`;
  }
  if (img.url) {
    if (img.url.startsWith('data:') || img.url.startsWith('http')) return img.url;
    return `data:image/png;base64,${img.url}`;
  }
  if (img.b64_json) {
    if (img.b64_json.startsWith('data:')) return img.b64_json;
    return `data:image/${img.mime_type || 'png'};base64,${img.b64_json}`;
  }
  return null;
}

function extractImagesFromResult(resultData) {
  if (!resultData) return [];

  const images = [];

  if (resultData.data && Array.isArray(resultData.data)) {
    for (const img of resultData.data) {
      const url = normalizeImageUrl(img);
      if (url) images.push({ url, revisedPrompt: img.revised_prompt });
    }
  }

  if (resultData.output && resultData.output.data) {
    const outputData = Array.isArray(resultData.output.data) ? resultData.output.data : [resultData.output.data];
    for (const img of outputData) {
      const url = normalizeImageUrl(img);
      if (url && !images.some(e => e.url === url)) images.push({ url });
    }
  }

  if (resultData.output && resultData.output.url) {
    const url = normalizeImageUrl(resultData.output);
    if (url && !images.some(e => e.url === url)) images.push({ url });
  }

  if (resultData.images && Array.isArray(resultData.images)) {
    for (const img of resultData.images) {
      const url = normalizeImageUrl(img);
      if (url && !images.some(e => e.url === url)) images.push({ url });
    }
  }

  if (resultData.result_url) {
    if (typeof resultData.result_url === 'string') {
      images.push({ url: resultData.result_url });
    } else if (Array.isArray(resultData.result_url)) {
      for (const u of resultData.result_url) {
        const url = typeof u === 'string' ? u : normalizeImageUrl(u);
        if (url && !images.some(e => e.url === url)) images.push({ url });
      }
    }
  }

  if (images.length === 0 && resultData.url) {
    const url = normalizeImageUrl(resultData);
    if (url) images.push({ url });
  }

  return images;
}

async function fetchResultFromUrl(resultUrl) {
  try {
    console.log(`[ImageService] Fetching result from: ${resultUrl}`);
    const response = await fetch(resultUrl, { timeout: 30000 });
    if (!response.ok) {
      console.error(`[ImageService] Failed to fetch result: HTTP ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log(`[ImageService] Result data keys:`, Object.keys(data));
    return data;
  } catch (err) {
    console.error(`[ImageService] Error fetching result:`, err.message);
    return null;
  }
}

export class ImageService {
  async generate(model, prompt, options = {}, apiKey) {
    console.log(`[ImageService] generate: model=${model}, prompt="${prompt.substring(0, 50)}...", options=`, JSON.stringify(options));

    const params = { prompt };
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'image' && key !== 'mask') {
        params[key] = value;
      }
    });

    if (options.image_url) {
      params.image_url = options.image_url;
    }

    const apiParams = mapParamsToApi(model, params);
    const apiModelId = resolveApiModelId(model);
    console.log(`[ImageService] Resolved model: ${model} → ${apiModelId}`);

    const submitResult = await lingkeClient.mediaGenerate(apiModelId, apiParams, apiKey);

    if (!submitResult.success) {
      console.error(`[ImageService] Submit failed:`, submitResult.error);
      return submitResult;
    }

    // LingKe API /v1/images/generations returns sync response with data array
    const images = extractImagesFromResult(submitResult.data);
    if (images.length > 0) {
      console.log(`[ImageService] Extracted ${images.length} images (sync)`);
      return { success: true, images, model, timestamp: Date.now() };
    }

    // Fallback: if there's a task_id, try async polling (for /v1/media/generate style APIs)
    const taskId = submitResult.data?.task_id || submitResult.data?.data?.task_id;
    if (taskId) {
      console.log(`[ImageService] Task submitted: ${taskId}, polling...`);
      const pollResult = await lingkeClient.pollUntilFinal(taskId, (progress, status) => {
        console.log(`[ImageService] Progress: ${progress}%, status: ${status}`);
      }, 300000, apiKey);

      if (!pollResult.success) return pollResult;

      const taskData = pollResult.data;
      let finalImages = [];
      if (taskData.result_url) {
        const resultData = await fetchResultFromUrl(taskData.result_url);
        if (resultData) finalImages = extractImagesFromResult(resultData);
      }
      if (finalImages.length === 0) finalImages = extractImagesFromResult(taskData);
      console.log(`[ImageService] Extracted ${finalImages.length} images (async)`);
      return { success: true, images: finalImages, model, taskId, timestamp: Date.now() };
    }

    return { success: false, error: 'No images returned', data: submitResult.data };
  }

  async getTaskResult(taskId, apiKey) {
    const result = await lingkeClient.getTaskStatus(taskId, apiKey);
    if (!result.success) return result;

    const taskData = result.data;
    if (!taskData.is_final) {
      return { success: true, status: 'pending', progress: taskData.progress };
    }

    let images = [];
    if (taskData.result_url) {
      const resultData = await fetchResultFromUrl(taskData.result_url);
      if (resultData) images = extractImagesFromResult(resultData);
    }
    if (images.length === 0) images = extractImagesFromResult(taskData);

    return { success: true, status: 'completed', images, model: taskData.model };
  }

  async edit(model, prompt, image, options = {}, apiKey) {
    console.log(`[ImageService] edit: model=${model}`);
    const params = { prompt };
    if (image) params.image = image;
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'mask') {
        params[key] = value;
      }
    });

    const apiParams = mapParamsToApi(model, params);

    const submitResult = await lingkeClient.mediaGenerate(model, apiParams, apiKey);
    if (!submitResult.success) return submitResult;

    const taskId = submitResult.data?.task_id || submitResult.data?.data?.task_id;
    if (!taskId) {
      const directImages = extractImagesFromResult(submitResult.data);
      if (directImages.length > 0) return { success: true, images: directImages, model, timestamp: Date.now() };
      return { success: false, error: 'No task_id returned', data: submitResult.data };
    }

    const pollResult = await lingkeClient.pollUntilFinal(taskId, null, 300000, apiKey);
    if (!pollResult.success) return pollResult;

    let images = [];
    if (pollResult.data.result_url) {
      const resultData = await fetchResultFromUrl(pollResult.data.result_url);
      if (resultData) images = extractImagesFromResult(resultData);
    }
    if (images.length === 0) images = extractImagesFromResult(pollResult.data);

    return { success: true, images, model, taskId, timestamp: Date.now() };
  }

  async inpaint(model, prompt, image, mask, options = {}, apiKey) {
    console.log(`[ImageService] inpaint: model=${model}`);
    const params = { prompt };
    if (image) params.image = image;
    if (mask) params.mask = mask;
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    const apiParams = mapParamsToApi(model, params);

    const submitResult = await lingkeClient.mediaGenerate(model, apiParams, apiKey);
    if (!submitResult.success) return submitResult;

    const taskId = submitResult.data?.task_id || submitResult.data?.data?.task_id;
    if (!taskId) {
      const directImages = extractImagesFromResult(submitResult.data);
      if (directImages.length > 0) return { success: true, images: directImages, model, timestamp: Date.now() };
      return { success: false, error: 'No task_id returned', data: submitResult.data };
    }

    const pollResult = await lingkeClient.pollUntilFinal(taskId, null, 300000, apiKey);
    if (!pollResult.success) return pollResult;

    let images = [];
    if (pollResult.data.result_url) {
      const resultData = await fetchResultFromUrl(pollResult.data.result_url);
      if (resultData) images = extractImagesFromResult(resultData);
    }
    if (images.length === 0) images = extractImagesFromResult(pollResult.data);

    return { success: true, images, model, taskId, timestamp: Date.now() };
  }

  async getPricing(modelName, apiKey) {
    return lingkeClient.getModelPricing(modelName, apiKey);
  }
}

export const imageService = new ImageService();