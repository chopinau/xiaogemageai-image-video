import { lingkeClient } from './lingkeClient.js';
import fetch from 'node-fetch';

const MODEL_ALIASES = {
  'kling-v3-video': 'kling-video',
  'kling-v2-6': 'kling-video',
  'doubao-seedance-1-0-pro-250528': 'doubao-seedance-1-0-pro-250528',
  'veo3.1-lite': 'veo_3_1-lite',
  'grok-video-3-plus': 'grok-video-3',
  'MiniMax-Hailuo-02': 'MiniMax-Hailuo-02',
  'wan2.6-video': 'wan2.6-i2v',
  'wan2.7-video': 'wan2.6-i2v',
  'pixverse-v5.6': 'viduq3-turbo',
  'sora': 'sora-2',
  'sora-2': 'sora-2',
  'veo3': 'veo3',
  'veo3.1-fast': 'veo3.1-fast',
  'veo3.1-pro': 'veo3.1-pro',
  'kling': 'kling-video',
  'kling-v1-6': 'kling-video',
  'seedance-2.0': 'doubao-seedance-1-0-pro-250528',
  'hailuo': 'MiniMax-Hailuo-02',
  'hailuo-2.3': 'MiniMax-Hailuo-2.3',
  'runway-gen3': 'runwayml-gen4_turbo-10',
  'luma': 'viduq3-turbo'
};

function resolveModel(model) {
  return MODEL_ALIASES[model] || model;
}

function extractVideosFromResult(resultData) {
  if (!resultData) return [];

  const videos = [];

  if (resultData.videos && Array.isArray(resultData.videos)) {
    for (const v of resultData.videos) {
      if (v.url) videos.push({ url: v.url, duration: v.duration });
    }
  }

  if (resultData.data && Array.isArray(resultData.data)) {
    for (const v of resultData.data) {
      const url = v.url || v.video_url;
      if (url) videos.push({ url, duration: v.duration });
    }
  }

  if (resultData.output && resultData.output.data) {
    const outputData = Array.isArray(resultData.output.data) ? resultData.output.data : [resultData.output.data];
    for (const v of outputData) {
      const url = v.url || v.video_url;
      if (url && !videos.some(e => e.url === url)) videos.push({ url, duration: v.duration });
    }
  }

  if (resultData.output && resultData.output.url) {
    const url = resultData.output.url || resultData.output.video_url;
    if (url && !videos.some(e => e.url === url)) videos.push({ url });
  }

  if (resultData.result_url) {
    if (typeof resultData.result_url === 'string') {
      videos.push({ url: resultData.result_url });
    } else if (Array.isArray(resultData.result_url)) {
      for (const u of resultData.result_url) {
        const url = typeof u === 'string' ? u : (u.url || u.video_url);
        if (url && !videos.some(e => e.url === url)) videos.push({ url });
      }
    }
  }

  if (videos.length === 0 && (resultData.url || resultData.video_url)) {
    videos.push({ url: resultData.url || resultData.video_url });
  }

  return videos;
}

async function fetchResultFromUrl(resultUrl) {
  try {
    console.log(`[VideoService] Fetching result from: ${resultUrl}`);
    const response = await fetch(resultUrl, { timeout: 30000 });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error(`[VideoService] Error fetching result:`, err.message);
    return null;
  }
}

export class VideoService {
  async generate(model, prompt, options = {}, apiKey) {
    const resolvedModel = resolveModel(model);
    console.log(`[VideoService] generate: model=${model}→${resolvedModel}, prompt="${prompt.substring(0, 50)}..."`);

    const params = { prompt };
    if (options.duration) params.duration = String(options.duration);
    if (options.aspect_ratio || options.aspectRatio) params.aspect_ratio = options.aspect_ratio || options.aspectRatio;
    if (options.resolution) params.resolution = options.resolution;
    if (options.mode || options.quality) params.mode = options.mode || options.quality;
    if (options.enhance_prompt !== undefined) params.enhance_prompt = options.enhance_prompt;
    if (options.prompt_extend !== undefined) params.prompt_extend = options.prompt_extend;

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !params[key]) {
        params[key] = value;
      }
    });

    const submitResult = await lingkeClient.mediaGenerate(resolvedModel, params, apiKey);

    if (!submitResult.success) {
      console.error(`[VideoService] Submit failed:`, submitResult.error);
      return submitResult;
    }

    const taskId = submitResult.data?.task_id || submitResult.data?.data?.task_id || submitResult.data?.id;
    if (!taskId) {
      const directVideos = extractVideosFromResult(submitResult.data);
      if (directVideos.length > 0) {
        return { success: true, videos: directVideos, model: resolvedModel, timestamp: Date.now() };
      }
      return { success: false, error: 'No task_id returned and no videos in response', data: submitResult.data };
    }

    console.log(`[VideoService] Task submitted: ${taskId}, polling...`);

    const pollResult = await lingkeClient.pollUntilFinal(taskId, (progress, status) => {
      console.log(`[VideoService] Progress: ${progress}%, status: ${status}`);
    }, 600000, apiKey);

    if (!pollResult.success) {
      console.error(`[VideoService] Poll failed:`, pollResult.error);
      return pollResult;
    }

    const taskData = pollResult.data;
    let videos = [];

    if (taskData.result_url) {
      const resultData = await fetchResultFromUrl(taskData.result_url);
      if (resultData) videos = extractVideosFromResult(resultData);
    }

    if (videos.length === 0) {
      videos = extractVideosFromResult(taskData);
    }

    console.log(`[VideoService] Extracted ${videos.length} videos`);

    return {
      success: true,
      videos,
      model: resolvedModel,
      taskId,
      timestamp: Date.now()
    };
  }

  async fromImage(model, imageUrl, prompt, options = {}, apiKey) {
    const resolvedModel = resolveModel(model);
    console.log(`[VideoService] fromImage: model=${model}→${resolvedModel}`);

    const params = { prompt };
    if (imageUrl) {
      params.image_url = imageUrl;
      params.image_role = 'first_frame';
    }
    if (options.duration) params.duration = String(options.duration);
    if (options.aspect_ratio || options.aspectRatio) params.aspect_ratio = options.aspect_ratio || options.aspectRatio;
    if (options.resolution) params.resolution = options.resolution;
    if (options.mode || options.quality) params.mode = options.mode || options.quality;

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && !params[key]) {
        params[key] = value;
      }
    });

    const submitResult = await lingkeClient.mediaGenerate(resolvedModel, params, apiKey);

    if (!submitResult.success) return submitResult;

    const taskId = submitResult.data?.task_id || submitResult.data?.data?.task_id || submitResult.data?.id;
    if (!taskId) {
      const directVideos = extractVideosFromResult(submitResult.data);
      if (directVideos.length > 0) {
        return { success: true, videos: directVideos, model: resolvedModel, timestamp: Date.now() };
      }
      return { success: false, error: 'No task_id returned', data: submitResult.data };
    }

    const pollResult = await lingkeClient.pollUntilFinal(taskId, (progress, status) => {
      console.log(`[VideoService] fromImage Progress: ${progress}%, status: ${status}`);
    }, 600000, apiKey);

    if (!pollResult.success) return pollResult;

    const taskData = pollResult.data;
    let videos = [];

    if (taskData.result_url) {
      const resultData = await fetchResultFromUrl(taskData.result_url);
      if (resultData) videos = extractVideosFromResult(resultData);
    }
    if (videos.length === 0) videos = extractVideosFromResult(taskData);

    return { success: true, videos, model: resolvedModel, taskId, timestamp: Date.now() };
  }

  async getTaskResult(taskId, apiKey) {
    const result = await lingkeClient.getTaskStatus(taskId, apiKey);
    if (!result.success) return result;

    const taskData = result.data;
    if (!taskData.is_final) {
      return { success: true, status: 'pending', progress: taskData.progress };
    }

    let videos = [];
    if (taskData.result_url) {
      const resultData = await fetchResultFromUrl(taskData.result_url);
      if (resultData) videos = extractVideosFromResult(resultData);
    }
    if (videos.length === 0) videos = extractVideosFromResult(taskData);

    return { success: true, status: 'completed', videos, model: taskData.model };
  }

  async getPricing(modelName, apiKey) {
    return lingkeClient.getModelPricing(modelName, apiKey);
  }
}

export const videoService = new VideoService();