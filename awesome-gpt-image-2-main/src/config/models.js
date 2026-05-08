export const AI_MODELS = {
  image: {
    'gpt-image-2': {
      id: 'gpt-image-2',
      name: 'GPT Image 2',
      provider: 'OpenAI',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '2048x2048',
      pricing: { perImage: 10, unit: 'credits' },
      defaultParams: { size: '1024x1024', quality: 'standard', style: 'vivid' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'gpt-image-2',
      enabled: true,
      sortOrder: 1
    },
    'dall-e-3': {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'OpenAI',
      capabilities: ['text-to-image'],
      maxSize: '1792x1024',
      pricing: { perImage: 15, unit: 'credits' },
      defaultParams: { size: '1024x1024', quality: 'standard', style: 'vivid' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'dall-e-3',
      enabled: true,
      sortOrder: 2
    },
    'flux-pro': {
      id: 'flux-pro',
      name: 'Flux Pro',
      provider: 'Black Forest Labs',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '2048x2048',
      pricing: { perImage: 8, unit: 'credits' },
      defaultParams: { guidance_scale: 3.5, aspectRatio: '1:1' },
      apiEndpoint: '/api/image/generate',
      apiType: 'async-queue',
      lingkeModel: 'flux-pro',
      enabled: true,
      sortOrder: 3
    },
    'doubao-seedream': {
      id: 'doubao-seedream',
      name: '豆包 Seedream 4.0',
      provider: 'ByteDance',
      capabilities: ['text-to-image', 'image-to-image'],
      maxSize: '4096x4096',
      pricing: { perImage: 6, unit: 'credits' },
      defaultParams: { size: '2048x2048' },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'doubao-seedream-4-0-250828',
      enabled: true,
      sortOrder: 4
    },
    'doubao-seededit': {
      id: 'doubao-seededit',
      name: '豆包 SeedEdit 3.0',
      provider: 'ByteDance',
      capabilities: ['image-to-image', 'inpainting'],
      maxSize: '2048x2048',
      pricing: { perImage: 5, unit: 'credits' },
      defaultParams: { guidance_scale: 5.5 },
      apiEndpoint: '/api/image/edit',
      apiType: 'sync',
      lingkeModel: 'doubao-seededit-3-0-i2i-250628',
      enabled: true,
      sortOrder: 5
    },
    'stable-diffusion-xl': {
      id: 'stable-diffusion-xl',
      name: 'Stable Diffusion XL',
      provider: 'Stability AI',
      capabilities: ['text-to-image', 'image-to-image', 'inpainting'],
      maxSize: '2048x2048',
      pricing: { perImage: 5, unit: 'credits' },
      defaultParams: { steps: 30, cfgScale: 7 },
      apiEndpoint: '/api/image/generate',
      apiType: 'sync',
      lingkeModel: 'stable-diffusion-xl',
      enabled: true,
      sortOrder: 6
    }
  },
  video: {
    'kling': {
      id: 'kling',
      name: 'Kling 可灵 V1.6',
      provider: 'Kuaishou',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '10s',
      maxResolution: '1920x1080',
      pricing: { perSecond: 2, unit: 'credits' },
      defaultParams: { duration: 5, mode: 'std', aspectRatio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'kling-v1-6',
      enabled: true,
      sortOrder: 1
    },
    'veo3': {
      id: 'veo3',
      name: 'Veo 3.1',
      provider: 'Google',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '15s',
      maxResolution: '1920x1080',
      pricing: { perSecond: 3, unit: 'credits' },
      defaultParams: { duration: 8, aspectRatio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'veo3.1-fast',
      enabled: true,
      sortOrder: 2
    },
    'sora': {
      id: 'sora',
      name: 'Sora 2',
      provider: 'OpenAI',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '15s',
      maxResolution: '1920x1080',
      pricing: { perSecond: 3, unit: 'credits' },
      defaultParams: { duration: 10, orientation: 'landscape' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'sora-2',
      enabled: true,
      sortOrder: 3
    },
    'seedance-2.0': {
      id: 'seedance-2.0',
      name: 'Seedance 2.0',
      provider: 'ByteDance',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '10s',
      maxResolution: '1920x1080',
      pricing: { perSecond: 2, unit: 'credits' },
      defaultParams: { duration: 5, aspectRatio: '16:9' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'doubao-seedance-1-0-pro-250528',
      enabled: true,
      sortOrder: 4
    },
    'runway-gen3': {
      id: 'runway-gen3',
      name: 'Runway Gen4',
      provider: 'Runway',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '10s',
      maxResolution: '1280x768',
      pricing: { perSecond: 2, unit: 'credits' },
      defaultParams: { duration: 5, model: 'gen4_turbo' },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'gen4_turbo',
      enabled: true,
      sortOrder: 5
    },
    'hailuo': {
      id: 'hailuo',
      name: '海螺视频 Hailuo',
      provider: 'MiniMax',
      capabilities: ['text-to-video'],
      maxDuration: '10s',
      maxResolution: '1920x1080',
      pricing: { perSecond: 1.5, unit: 'credits' },
      defaultParams: { duration: 6 },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'MiniMax-Hailuo-02',
      enabled: true,
      sortOrder: 6
    },
    'luma': {
      id: 'luma',
      name: 'Luma Dream Machine',
      provider: 'Luma',
      capabilities: ['text-to-video', 'image-to-video'],
      maxDuration: '5s',
      maxResolution: '1360x752',
      pricing: { perSecond: 2, unit: 'credits' },
      defaultParams: { duration: 5 },
      apiEndpoint: '/api/video/generate',
      apiType: 'async',
      lingkeModel: 'luma-dream-machine',
      enabled: true,
      sortOrder: 7
    }
  },
  text: {
    'gpt-4o': {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      capabilities: ['text-generation', 'image-understanding', 'coding', 'analysis'],
      pricing: { perInputToken: 0.000005, perOutputToken: 0.000015, unit: 'credits' },
      apiEndpoint: '/api/text/generate',
      apiType: 'sync',
      lingkeModel: 'gpt-4o',
      enabled: true,
      sortOrder: 1
    },
    'deepseek': {
      id: 'deepseek',
      name: 'DeepSeek',
      provider: 'DeepSeek',
      capabilities: ['text-generation', 'coding', 'analysis'],
      pricing: { perInputToken: 0.000001, perOutputToken: 0.000002, unit: 'credits' },
      apiEndpoint: '/api/text/generate',
      apiType: 'sync',
      lingkeModel: 'deepseek-chat',
      enabled: true,
      sortOrder: 2
    }
  },
  retouch: {
    'doubao-seededit-retouch': {
      id: 'doubao-seededit-retouch',
      name: '豆包 SeedEdit 精修',
      provider: 'ByteDance',
      capabilities: ['image-to-image', 'inpainting', 'background-replace'],
      maxSize: '2048x2048',
      pricing: { perImage: 5, unit: 'credits' },
      defaultParams: { guidance_scale: 5.5 },
      apiEndpoint: '/api/image/edit',
      apiType: 'sync',
      lingkeModel: 'doubao-seededit-3-0-i2i-250628',
      enabled: true,
      sortOrder: 1
    },
    'gpt-image-2-retouch': {
      id: 'gpt-image-2-retouch',
      name: 'GPT Image 2 精修',
      provider: 'OpenAI',
      capabilities: ['image-to-image', 'inpainting', 'background-replace'],
      maxSize: '2048x2048',
      pricing: { perImage: 10, unit: 'credits' },
      defaultParams: { quality: 'high' },
      apiEndpoint: '/api/image/edit',
      apiType: 'sync',
      lingkeModel: 'gpt-image-2',
      enabled: true,
      sortOrder: 2
    }
  },
  psdLayer: {
    'bria-rmbg-inpainting': {
      id: 'bria-rmbg-inpainting',
      name: 'PSD 智能分层',
      provider: 'fal.ai',
      capabilities: ['background-removal', 'inpainting', 'psd-export'],
      maxSize: '2048x2048',
      pricing: { perImage: 15, unit: 'credits' },
      apiEndpoint: '/api/psd-layer/process',
      apiType: 'async',
      lingkeModel: 'bria-rmbg-1.4',
      enabled: true,
      sortOrder: 1
    }
  }
};

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
