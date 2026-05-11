export const AI_MODELS = {
  image: {
    'gpt-image-2': {
      id: 'gpt-image-2',
      name: 'GPT Image 2',
      provider: 'OpenAI',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '3840x2160',
      pricing: { billingMethod: 'per_call', baseCredits: 6 },
      defaultParams: { size: '1024x1024', quality: 'auto' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'gpt-image-2',
      xiaomageModel: 'gpt-image-2',
      enabled: true,
      sortOrder: 1,
      successRate: 95
    },
    'doubao-seedream-5-0': {
      id: 'doubao-seedream-5-0',
      name: '即梦 5.0',
      provider: 'ByteDance',
      capabilities: ['text-to-image', 'image-to-image', 'multi-reference'],
      maxSize: '3K',
      pricing: { billingMethod: 'per_call', baseCredits: 16 },
      defaultParams: { resolution: '2K', aspect_ratio: '1:1', web_search: false },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'doubao-seedream-5-0-260128',
      xiaomageModel: 'doubao-seedream-5-0-260128',
      enabled: true,
      sortOrder: 2,
      successRate: 93
    },
    'doubao-seedream-4-5': {
      id: 'doubao-seedream-4-5',
      name: '即梦 4.5',
      provider: 'ByteDance',
      capabilities: ['text-to-image', 'image-to-image', 'multi-reference'],
      maxSize: '4K',
      pricing: { billingMethod: 'per_call', baseCredits: 18 },
      defaultParams: { resolution: '2K', aspect_ratio: '1:1' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'doubao-seedream-4-5-251128',
      xiaomageModel: 'doubao-seedream-4-5-251128',
      enabled: true,
      sortOrder: 3,
      successRate: 91
    },
    'gemini-3-pro-image': {
      id: 'gemini-3-pro-image',
      name: 'Gemini Pro Image',
      provider: 'Google',
      capabilities: ['text-to-image', 'image-to-image', 'multi-reference'],
      maxSize: '4K',
      pricing: { billingMethod: 'per_call', baseCredits: 20 },
      defaultParams: { aspectRatio: '1:1', imageSize: '1K' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'gemini-3-pro-image-preview',
      xiaomageModel: 'gemini-3-pro-image-preview',
      enabled: true,
      sortOrder: 4,
      successRate: 92
    },
    'kling-v3-image': {
      id: 'kling-v3-image',
      name: '可灵-V3',
      provider: 'Kuaishou',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '2K',
      pricing: { billingMethod: 'per_call', baseCredits: 17 },
      defaultParams: { resolution: '1k', aspect_ratio: '16:9' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'kling-v3',
      xiaomageModel: 'kling-v3',
      enabled: true,
      sortOrder: 5,
      successRate: 90
    },
    'kling-v3-omni-image': {
      id: 'kling-v3-omni-image',
      name: '可灵-V3-Omni',
      provider: 'Kuaishou',
      capabilities: ['text-to-image', 'image-to-image', 'multi-reference'],
      maxSize: '4K',
      pricing: { billingMethod: 'per_call', baseCredits: 17 },
      defaultParams: { resolution: '1k', aspect_ratio: '16:9' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'kling-v3-omni',
      xiaomageModel: 'kling-v3-omni',
      enabled: true,
      sortOrder: 6,
      successRate: 91
    },
    'wan2.7-image': {
      id: 'wan2.7-image',
      name: '万相 2.7 图像',
      provider: 'Alibaba',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '4K',
      pricing: { billingMethod: 'per_call', baseCredits: 14 },
      defaultParams: { quality: 'standard', size: '1:1' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'wan2.7-image',
      xiaomageModel: 'wan2.7-image',
      enabled: true,
      sortOrder: 7,
      successRate: 89
    }
  },
  video: {
    'kling-v3-video': {
      id: 'kling-v3-video',
      name: '可灵 V3 视频',
      provider: 'Kuaishou',
      capabilities: ['text-to-video', 'image-to-video', 'first-last-frame'],
      maxDuration: '15s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 324 },
      defaultParams: { mode: 'std', duration: '5', aspect_ratio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'kling-v3-video',
      xiaomageModel: 'kling-v3-video',
      enabled: true,
      sortOrder: 1,
      successRate: 90
    },
    'kling-v2-6': {
      id: 'kling-v2-6',
      name: '可灵 2.6 Pro',
      provider: 'Kuaishou',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '10s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 526 },
      defaultParams: { duration: '5', sound: 'on', aspect_ratio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'kling-v2-6',
      xiaomageModel: 'kling-v2-6',
      enabled: true,
      sortOrder: 2,
      successRate: 89
    },
    'seedance-2.0': {
      id: 'seedance-2.0',
      name: 'Seedance 2.0',
      provider: 'ByteDance',
      capabilities: ['text-to-video', 'image-to-video', 'first-last-frame'],
      maxDuration: '15s',
      maxResolution: '720p',
      pricing: { billingMethod: 'per_token', baseCredits: 5328 },
      defaultParams: { version: '标准', duration: 'auto', aspect_ratio: 'adaptive', resolution: '720p' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'doubao-seedance-1-0-pro-250528',
      xiaomageModel: 'kwvideo-v2',
      enabled: true,
      sortOrder: 3,
      successRate: 89
    },
    'veo3.1-lite': {
      id: 'veo3.1-lite',
      name: 'Veo 3.1 Lite',
      provider: 'Google',
      capabilities: ['text-to-video', 'image-to-video', 'first-last-frame'],
      maxDuration: '8s',
      maxResolution: '4K',
      pricing: { billingMethod: 'per_call', baseCredits: 36 },
      defaultParams: { quality: 'sd', aspect_ratio: '16:9', enhance_prompt: true },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'veo3.1-lite',
      xiaomageModel: 'veo3.1-lite',
      enabled: true,
      sortOrder: 4,
      successRate: 87
    },
    'grok-video-3-plus': {
      id: 'grok-video-3-plus',
      name: 'Grok Video 3+',
      provider: 'xAI',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '30s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 40 },
      defaultParams: { duration: '10', aspect_ratio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'grok-video-3-plus',
      xiaomageModel: 'grok-video-3-plus',
      enabled: true,
      sortOrder: 5,
      successRate: 86
    },
    'hailuo-2.3': {
      id: 'hailuo-2.3',
      name: '海螺 2.3',
      provider: 'MiniMax',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '10s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 161 },
      defaultParams: { model_version: '2.3', duration: '6', resolution: '768P', enhance_prompt: 'Enabled' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'MiniMax-Hailuo-02',
      xiaomageModel: 'hailuo-2.3',
      enabled: true,
      sortOrder: 6,
      successRate: 88
    },
    'wan2.6-video': {
      id: 'wan2.6-video',
      name: '万相 2.6 首帧',
      provider: 'Alibaba',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '15s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 45 },
      defaultParams: { quality: 'standard', resolution: '720P', duration: '6', aspect_ratio: '16:9', shot_type: 'single', prompt_extend: true },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'wan2.6-video',
      xiaomageModel: 'wan2.6-shouzheng',
      enabled: true,
      sortOrder: 7,
      successRate: 88
    },
    'wan2.7-video': {
      id: 'wan2.7-video',
      name: '万相 2.7 参考生',
      provider: 'Alibaba',
      capabilities: ['text-to-video', 'image-to-video', 'reference-video'],
      maxDuration: '15s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_call', baseCredits: 130 },
      defaultParams: { resolution: '720P', duration: '6', ratio: '16:9', prompt_extend: true },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'wan2.7-video',
      xiaomageModel: 'wan2.7-cankaosheng',
      enabled: true,
      sortOrder: 8,
      successRate: 88
    },
    'pixverse-v5.6': {
      id: 'pixverse-v5.6',
      name: 'PixVerse V5.6',
      provider: 'PixVerse',
      capabilities: ['text-to-video', 'image-to-video', 'reference'],
      maxDuration: '10s',
      maxResolution: '1080p',
      pricing: { billingMethod: 'per_second', baseCredits: 54 },
      defaultParams: { resolution: '720P', duration: '5', aspect_ratio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'pixverse-v5.6',
      xiaomageModel: 'pixverse-v5.6-r2v',
      enabled: true,
      sortOrder: 9,
      successRate: 85
    }
  },
  text: {
    'gpt-4o': {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      capabilities: ['text-generation', 'image-understanding', 'coding', 'analysis'],
      pricing: { billingMethod: 'per_token', baseCredits: 5 },
      apiEndpoint: '/api/text/generate',
      apiType: 'sync',
      lingkeModel: 'gpt-4o',
      enabled: true,
      sortOrder: 1,
      successRate: 98
    },
    'deepseek': {
      id: 'deepseek',
      name: 'DeepSeek',
      provider: 'DeepSeek',
      capabilities: ['text-generation', 'coding', 'analysis'],
      pricing: { billingMethod: 'per_token', baseCredits: 1 },
      apiEndpoint: '/api/text/generate',
      apiType: 'sync',
      lingkeModel: 'deepseek-chat',
      enabled: true,
      sortOrder: 2,
      successRate: 96
    }
  },
  retouch: {
    'doubao-seededit-retouch': {
      id: 'doubao-seededit-retouch',
      name: '豆包 SeedEdit 精修',
      provider: 'ByteDance',
      capabilities: ['image-to-image', 'inpainting', 'background-replace'],
      maxSize: '2048x2048',
      pricing: { billingMethod: 'per_call', baseCredits: 15 },
      defaultParams: { guidance_scale: 5.5 },
      apiEndpoint: '/api/image/edit',
      apiType: 'sync',
      lingkeModel: 'doubao-seededit-3-0-i2i-250628',
      enabled: true,
      sortOrder: 1,
      successRate: 93
    },
    'gpt-image-2-retouch': {
      id: 'gpt-image-2-retouch',
      name: 'GPT Image 2 精修',
      provider: 'OpenAI',
      capabilities: ['image-to-image', 'inpainting', 'background-replace'],
      maxSize: '2048x2048',
      pricing: { billingMethod: 'per_call', baseCredits: 6 },
      defaultParams: { quality: 'high' },
      apiEndpoint: '/api/image/edit',
      apiType: 'sync',
      lingkeModel: 'gpt-image-2',
      enabled: true,
      sortOrder: 2,
      successRate: 94
    }
  },
  psdLayer: {
    'bria-rmbg-inpainting': {
      id: 'bria-rmbg-inpainting',
      name: 'PSD 智能分层',
      provider: 'fal.ai',
      capabilities: ['background-removal', 'inpainting', 'psd-export'],
      maxSize: '2048x2048',
      pricing: { billingMethod: 'per_call', baseCredits: 50 },
      apiEndpoint: '/api/psd-layer/process',
      apiType: 'async',
      lingkeModel: 'bria-rmbg-1.4',
      enabled: true,
      sortOrder: 1,
      successRate: 90
    }
  }
};

export const SCENE_AGENTS = [
  { id: 'fashion-ecommerce', name: '虚拟模特/电商', icon: '👗', status: 'coming-soon', description: '电商产品图生成、虚拟模特展示' },
  { id: 'virtual-fitting', name: '虚拟试衣', icon: '👔', status: 'coming-soon', description: 'AI换装体验、服装搭配建议' },
  { id: 'product-photography', name: '产品摄影', icon: '📸', status: 'coming-soon', description: '专业级产品图拍摄与优化' },
  { id: 'portrait-enhancement', name: '人像精修', icon: '✨', status: 'available', description: '智能人像美化、皮肤处理' },
  { id: 'image-editing', name: '图像编辑', icon: '✏️', status: 'available', description: '智能图像处理、局部重绘' }
];

export const MODEL_CATEGORIES = {
  image: { label: { en: 'Image Generation', zh: '图像生成' } },
  video: { label: { en: 'Video Generation', zh: '视频生成' } },
  text: { label: { en: 'Text Generation', zh: '文本生成' } },
  retouch: { label: { en: 'Image Retouching', zh: '图片精修' } },
  psdLayer: { label: { en: 'PSD Layering', zh: 'PSD分层' } }
};

export function getModelById(modelId, category) {
  if (category && AI_MODELS[category]) {
    return AI_MODELS[category][modelId];
  }
  for (const cat of Object.keys(AI_MODELS)) {
    if (AI_MODELS[cat][modelId]) {
      return AI_MODELS[cat][modelId];
    }
  }
  return null;
}

export function getModelsByCategory(category) {
  if (!AI_MODELS[category]) return [];
  return Object.values(AI_MODELS[category])
    .filter(m => m.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllModels() {
  const allModels = [];
  for (const category of Object.keys(AI_MODELS)) {
    for (const model of Object.values(AI_MODELS[category])) {
      if (model.enabled) {
        allModels.push({ ...model, category });
      }
    }
  }
  return allModels.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getModelOptions(category) {
  return getModelsByCategory(category).map(m => ({
    value: m.id,
    label: m.name,
    provider: m.provider
  }));
}
