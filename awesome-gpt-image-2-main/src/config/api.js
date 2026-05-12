export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
  const base = API_CONFIG.baseURL || '';
  const path = `${base}${endpoint}`;
  let url;
  try {
    url = new URL(path, window.location.origin);
  } catch {
    url = new URL(path, 'http://localhost:3000');
  }
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
