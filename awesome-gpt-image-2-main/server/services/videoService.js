import { lingkeClient } from './lingkeClient.js';
import { taskManager } from '../utils/taskManager.js';

export class VideoService {
  async generate(model, prompt, options = {}) {
    const modelMapping = {
      'sora': () => this._createSoraVideo(prompt, options),
      'sora-2': () => this._createSoraVideo(prompt, options),
      'veo3': () => this._createVeoVideo('veo3.1-fast', prompt, options),
      'veo3.1-fast': () => this._createVeoVideo('veo3.1-fast', prompt, options),
      'veo3.1-pro': () => this._createVeoVideo('veo3.1-pro', prompt, options),
      'veo2': () => this._createVeoVideo('veo2', prompt, options),
      'veo2-fast': () => this._createVeoVideo('veo2-fast', prompt, options),
      'kling': () => this._createKlingVideo(prompt, options),
      'kling-v1-6': () => this._createKlingVideo(prompt, options),
      'runway-gen3': () => this._createRunwayVideo(prompt, options),
      'seedance-2.0': () => this._createSeedanceVideo(prompt, options),
      'luma': () => this._createLumaVideo(prompt, options),
      'hailuo': () => this._createHailuoVideo(prompt, options)
    };

    const createFn = modelMapping[model];
    if (!createFn) {
      return { success: false, error: `不支持的视频模型: ${model}` };
    }

    return createFn();
  }

  async fromImage(model, imageUrl, prompt, options = {}) {
    const modelMapping = {
      'kling': () => this._createKlingImage2Video(imageUrl, prompt, options),
      'kling-v1-6': () => this._createKlingImage2Video(imageUrl, prompt, options),
      'runway-gen3': () => this._createRunwayImage2Video(imageUrl, prompt, options),
      'veo3': () => this._createVeoVideo('veo3.1-fast', prompt, { ...options, images: [imageUrl] }),
      'seedance-2.0': () => this._createSeedanceVideo(prompt, { ...options, imageUrl, imageRole: 'first_frame' }),
      'sora': () => this._createSoraVideo(prompt, { ...options, images: [imageUrl] }),
      'luma': () => this._createLumaVideo(prompt, { ...options, imageUrl })
    };

    const createFn = modelMapping[model];
    if (!createFn) {
      return { success: false, error: `不支持的图生视频模型: ${model}` };
    }

    return createFn();
  }

  async _createSoraVideo(prompt, options) {
    const result = await lingkeClient.createSoraVideo('sora-2', prompt, {
      orientation: options.orientation || 'landscape',
      size: options.size || 'small',
      duration: options.duration || 10,
      images: options.images || []
    });

    if (!result.success) return result;

    const taskId = result.data?.id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `sora_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryVideoTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'sora-2',
      timestamp: Date.now()
    };
  }

  async _createVeoVideo(model, prompt, options) {
    const result = await lingkeClient.createVeoVideo(model, prompt, {
      images: options.images,
      aspect_ratio: options.aspect_ratio || '16:9'
    });

    if (!result.success) return result;

    const taskId = result.data?.id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `veo_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryVideoTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model,
      timestamp: Date.now()
    };
  }

  async _createKlingVideo(prompt, options) {
    const result = await lingkeClient.createKlingVideo('kling-v1-6', prompt, {
      duration: options.duration || 5,
      mode: options.mode || 'std',
      aspect_ratio: options.aspect_ratio || '16:9'
    });

    if (!result.success) return result;

    const taskId = result.data?.data?.task_id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `kling_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryKlingTask('videos', 'text2video', taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'kling-v1-6',
      timestamp: Date.now()
    };
  }

  async _createKlingImage2Video(imageUrl, prompt, options) {
    const result = await lingkeClient.createKlingImage2Video('kling-v1-6', prompt, imageUrl, {
      duration: options.duration || 5,
      mode: options.mode || 'std'
    });

    if (!result.success) return result;

    const taskId = result.data?.data?.task_id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `kling_i2v_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryKlingTask('videos', 'image2video', taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'kling-v1-6',
      timestamp: Date.now()
    };
  }

  async _createRunwayVideo(prompt, options) {
    const result = await lingkeClient.createRunwayVideo(
      options.promptImage || '',
      prompt,
      { model: 'gen4_turbo', duration: options.duration || 5, ratio: options.ratio || '1280:768' }
    );

    if (!result.success) return result;

    const taskId = result.data?.id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `runway_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryLumaTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'runway-gen4',
      timestamp: Date.now()
    };
  }

  async _createRunwayImage2Video(imageUrl, prompt, options) {
    return this._createRunwayVideo(prompt, { ...options, promptImage: imageUrl });
  }

  async _createSeedanceVideo(prompt, options) {
    const model = options.imageUrl
      ? 'doubao-seedance-1-0-lite-i2v-250428'
      : 'doubao-seedance-1-0-pro-250528';

    const result = await lingkeClient.createSeedanceVideo(model, prompt, {
      imageUrl: options.imageUrl,
      imageRole: options.imageRole
    });

    if (!result.success) return result;

    const taskId = result.data?.id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `seedance_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.querySeedanceTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model,
      timestamp: Date.now()
    };
  }

  async _createLumaVideo(prompt, options) {
    const body = { prompt };
    if (options.imageUrl) body.image_url = options.imageUrl;
    if (options.expand_prompt !== undefined) body.expand_prompt = options.expand_prompt;

    const result = await lingkeClient.request('POST', '/luma/generations', { body });
    if (!result.success) return result;

    const taskId = result.data?.id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `luma_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryLumaTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'luma',
      timestamp: Date.now()
    };
  }

  async _createHailuoVideo(prompt, options) {
    const result = await lingkeClient.createHailuoVideo(prompt, {
      duration: options.duration || 6
    });

    if (!result.success) return result;

    const taskId = result.data?.task_id;
    if (!taskId) return { success: false, error: 'No task ID returned' };

    const internalTaskId = `hailuo_${taskId}`;
    taskManager.createTask(internalTaskId, async () => {
      return lingkeClient.queryHailuoTask(taskId);
    });

    return {
      success: true,
      taskId: internalTaskId,
      externalTaskId: taskId,
      status: 'pending',
      model: 'MiniMax-Hailuo-02',
      timestamp: Date.now()
    };
  }

  getTaskStatus(taskId) {
    return taskManager.getTaskStatus(taskId);
  }

  addSSEClient(taskId, res) {
    return taskManager.addSSEClient(taskId, res);
  }
}

export const videoService = new VideoService();
