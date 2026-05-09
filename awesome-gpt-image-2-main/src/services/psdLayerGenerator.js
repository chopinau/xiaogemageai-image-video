import { API_CONFIG, createAPIHeaders } from '../config/api';

const BASE_URL = API_CONFIG.baseURL;

export const psdLayerGenerator = {
  async processImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${BASE_URL}/psd-layer/process`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async splitByColors(file, options = {}) {
    const formData = new FormData();
    formData.append('image', file);
    if (options.numColors) formData.append('numColors', options.numColors);
    if (options.ignoreColor) formData.append('ignoreColor', options.ignoreColor);

    const response = await fetch(`${BASE_URL}/psd-layer/split-colors`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async assembleImages(files, options = {}) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    if (options.layerNames) formData.append('layerNames', JSON.stringify(options.layerNames));
    if (options.firstIsBackground !== undefined) formData.append('firstIsBackground', options.firstIsBackground);
    if (options.fit) formData.append('fit', options.fit);
    if (options.width) formData.append('width', options.width);
    if (options.height) formData.append('height', options.height);

    const response = await fetch(`${BASE_URL}/psd-layer/assemble`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  listenProgress(taskId, onProgress) {
    const url = `${BASE_URL}/psd-layer/task/${taskId}/stream`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onProgress(data);

        if (data.step === 'done' || data.status === 'completed' || data.status === 'failed') {
          eventSource.close();
        }
      } catch { /* ignore parse errors */ }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return eventSource;
  },

  async getTaskStatus(taskId) {
    const response = await fetch(`${BASE_URL}/psd-layer/task/${taskId}`, {
      headers: createAPIHeaders('')
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  downloadPSD(taskId) {
    const url = `${BASE_URL}/psd-layer/download/${taskId}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layered.psd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
