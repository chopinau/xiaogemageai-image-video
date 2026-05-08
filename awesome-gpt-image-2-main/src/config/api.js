export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const API_ENDPOINTS = {
  image: {
    generate: '/image/generate',
    edit: '/image/edit',
    inpaint: '/image/inpaint',
    taskStatus: '/image/task',
    taskStream: '/image/task'
  },
  video: {
    generate: '/video/generate',
    fromImage: '/video/from-image',
    status: '/video/status',
    stream: '/video/stream'
  },
  text: {
    generate: '/text/generate',
    chat: '/text/chat'
  },
  upload: {
    image: '/upload/image'
  },
  psdLayer: {
    process: '/psd-layer/process',
    taskStatus: '/psd-layer/task',
    taskStream: '/psd-layer/task',
    download: '/psd-layer/download'
  },
  history: '/history',
  usage: '/usage',
  models: '/models'
};

export const createAPIHeaders = (apiKey, extraHeaders = {}) => ({
  ...API_CONFIG.headers,
  'Authorization': `Bearer ${apiKey}`,
  ...extraHeaders
});

export function buildURL(endpoint, params = {}) {
  const url = new URL(`${API_CONFIG.baseURL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

export function validateAPIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, message: 'API key is required' };
  }
  if (apiKey.length < 8) {
    return { valid: false, message: 'API key seems too short' };
  }
  return { valid: true };
}
