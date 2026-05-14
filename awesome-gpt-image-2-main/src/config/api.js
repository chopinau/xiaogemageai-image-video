export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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
  const base = API_CONFIG.baseURL || '/api';
  const path = `${base}${endpoint}`;
  const url = new URL(path, window.location.origin);
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

export async function safeFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (!text || text.trim() === '') {
    throw new Error(`服务器返回空响应 (HTTP ${response.status})`);
  }
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<HTML')) {
    throw new Error('服务器未启动或API不可用，请稍后重试');
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (parseErr) {
    console.error('[safeFetch] JSON parse failed. URL:', url, 'Status:', response.status, 'Response:', text.substring(0, 200));
    throw new Error(`服务器响应格式错误 (HTTP ${response.status})`);
  }
  return { response, data };
}

export function createAdminApiCall() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
  return async function apiCall(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };
    return safeFetch(`${API_BASE}${path}`, { ...options, headers });
  };
}
