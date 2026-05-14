import { API_CONFIG, API_ENDPOINTS, createAPIHeaders, buildURL } from '../config/api';
import { getModelById } from '../config/models';

export class VideoGenerator {
  constructor(apiKey, modelId = 'kling') {
    this.apiKey = apiKey;
    this.modelId = modelId;
    this.model = getModelById(modelId, 'video');
  }

  setModel(modelId) {
    this.modelId = modelId;
    this.model = getModelById(modelId, 'video');
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
      const response = await fetch(buildURL(API_ENDPOINTS.video.generate), {
        method: 'POST',
        headers: createAPIHeaders(this.apiKey),
        body: JSON.stringify(params)
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(text.startsWith('<!DOCTYPE') || text.startsWith('<html')
          ? '服务器未启动或API不可用，请稍后重试'
          : '服务器响应格式错误');
      }

      if (!response.ok || !result.success) {
        const errorMsg = result.error || result.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (result.taskId) {
        return {
          success: true,
          taskId: result.taskId,
          status: 'pending',
          prompt,
          model: this.modelId,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        videos: result.videos || [],
        prompt,
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

  async fromImage(image, prompt, options = {}) {
    if (!this.model?.capabilities?.includes('image-to-video')) {
      throw new Error(`Model ${this.modelId} does not support image-to-video`);
    }

    let imageUrl = image;
    if (image instanceof File || image instanceof Blob) {
      const uploadResult = await this._uploadImage(image);
      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload image: ' + uploadResult.error };
      }
      imageUrl = uploadResult.url;
    }

    try {
      const response = await fetch(buildURL(API_ENDPOINTS.video.fromImage), {
        method: 'POST',
        headers: createAPIHeaders(this.apiKey),
        body: JSON.stringify({
          model: this.model.lingkeModel || this.modelId,
          imageUrl,
          prompt,
          ...this.model.defaultParams,
          ...options
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMsg = result.error || result.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      }

      if (result.taskId) {
        return {
          success: true,
          taskId: result.taskId,
          status: 'pending',
          prompt,
          model: this.modelId,
          timestamp: Date.now()
        };
      }

      return {
        success: true,
        videos: result.videos || [],
        prompt,
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

  async checkStatus(taskId) {
    try {
      const response = await fetch(buildURL(`${API_ENDPOINTS.video.status}/${taskId}`), {
        method: 'GET',
        headers: createAPIHeaders(this.apiKey)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'completed') {
        const videoUrl = result.result?.videoUrl || result.result?.video?.url || result.result?.videos?.[0]?.url;
        return {
          success: true,
          status: 'completed',
          progress: 100,
          videos: videoUrl ? [{ url: videoUrl }] : [],
          model: this.modelId
        };
      }

      return {
        success: true,
        status: result.status,
        progress: result.progress || 0,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pollUntilComplete(taskId, onProgress, maxAttempts = 100) {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.checkStatus(taskId);

      if (onProgress) {
        onProgress(result);
      }

      if (result.status === 'completed') {
        return result;
      }

      if (result.status === 'failed') {
        return { success: false, error: result.error || 'Video generation failed' };
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    return { success: false, error: 'Video generation timed out' };
  }

  async _uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildURL(API_ENDPOINTS.upload.image), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, url: result.url };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  estimateCost(options = {}) {
    const duration = options.duration || this.model?.defaultParams?.duration || 5;
    const pricePerSecond = this.model?.pricing?.perSecond || 0;
    return duration * pricePerSecond;
  }
}

export const createVideoGenerator = (apiKey, modelId) => {
  return new VideoGenerator(apiKey, modelId);
};
