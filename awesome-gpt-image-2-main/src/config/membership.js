export const MEMBERSHIP_PLANS = [
  {
    id: 'free',
    name: '免费版',
    price: 0,
    yearlyPrice: 0,
    monthlyCredits: 0,
    dailyCredits: 5,
    features: {
      maxResolution: '1k',
      maxGenCount: 1,
      models: ['gpt-image-2', 'stable-diffusion-xl'],
      videoModels: ['seedance-2.0'],
      retouchModels: ['stable-diffusion-retouch'],
      textModels: ['gpt-4o', 'deepseek'],
      apiAccess: false,
      priority: false,
      batchSize: false,
      customBackground: false,
      watermark: true
    },
    color: '#73859f',
    icon: '🆓'
  },
  {
    id: 'basic',
    name: '基础版',
    price: 29,
    yearlyPrice: 24,
    monthlyCredits: 200,
    dailyCredits: 0,
    features: {
      maxResolution: '2k',
      maxGenCount: 5,
      models: ['gpt-image-2', 'dall-e-3', 'stable-diffusion-xl', 'flux-pro'],
      videoModels: ['seedance-2.0', 'pika-labs', 'kling'],
      retouchModels: ['gpt-image-2-retouch', 'stable-diffusion-retouch'],
      textModels: ['gpt-4o', 'gpt-4', 'deepseek'],
      apiAccess: false,
      priority: false,
      batchSize: true,
      customBackground: false,
      watermark: false
    },
    color: '#42e6ff',
    icon: '⭐',
    popular: true
  },
  {
    id: 'pro',
    name: '专业版',
    price: 99,
    yearlyPrice: 79,
    monthlyCredits: 800,
    dailyCredits: 0,
    features: {
      maxResolution: '4k',
      maxGenCount: 9,
      models: ['gpt-image-2', 'dall-e-3', 'midjourney-v6', 'stable-diffusion-xl', 'flux-pro'],
      videoModels: ['seedance-2.0', 'sora', 'runway-gen3', 'pika-labs', 'kling'],
      retouchModels: ['gpt-image-2-retouch', 'stable-diffusion-retouch'],
      textModels: ['gpt-4o', 'gpt-4', 'claude-3', 'deepseek'],
      apiAccess: false,
      priority: true,
      batchSize: true,
      customBackground: true,
      watermark: false
    },
    color: '#78ffb9',
    icon: '💎'
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: 299,
    yearlyPrice: 249,
    monthlyCredits: 3000,
    dailyCredits: 0,
    features: {
      maxResolution: '4k',
      maxGenCount: 9,
      models: ['gpt-image-2', 'dall-e-3', 'midjourney-v6', 'stable-diffusion-xl', 'flux-pro'],
      videoModels: ['seedance-2.0', 'sora', 'runway-gen3', 'pika-labs', 'kling'],
      retouchModels: ['gpt-image-2-retouch', 'stable-diffusion-retouch'],
      textModels: ['gpt-4o', 'gpt-4', 'claude-3', 'deepseek'],
      apiAccess: true,
      priority: true,
      batchSize: true,
      customBackground: true,
      watermark: false
    },
    color: '#f9ff72',
    icon: '🏢'
  }
];

export function getPlanById(planId) {
  return MEMBERSHIP_PLANS.find(p => p.id === planId) || MEMBERSHIP_PLANS[0];
}

export function canUseFeature(planId, feature, value) {
  const plan = getPlanById(planId);
  if (!plan) return false;
  const featureValue = plan.features[feature];
  if (typeof featureValue === 'boolean') return featureValue;
  if (Array.isArray(featureValue)) return featureValue.includes(value);
  if (typeof featureValue === 'number') return value <= featureValue;
  if (typeof featureValue === 'string') {
    const resolutionOrder = ['1k', '2k', '4k'];
    return resolutionOrder.indexOf(value) <= resolutionOrder.indexOf(featureValue);
  }
  return true;
}

export function getAvailableModels(planId, category) {
  const plan = getPlanById(planId);
  if (!plan) return [];
  const featureKey = category === 'image' ? 'models'
    : category === 'video' ? 'videoModels'
    : category === 'retouch' ? 'retouchModels'
    : 'textModels';
  return plan.features[featureKey] || [];
}
