export const CREDITS_RULES = {
  consumption: {
    'image:gpt-image-2:1k': 5,
    'image:gpt-image-2:2k': 10,
    'image:gpt-image-2:4k': 20,
    'image:dall-e-3:1k': 10,
    'image:dall-e-3:2k': 20,
    'image:midjourney-v6:1k': 12,
    'image:midjourney-v6:2k': 24,
    'image:midjourney-v6:4k': 48,
    'image:stable-diffusion-xl:1k': 3,
    'image:stable-diffusion-xl:2k': 6,
    'image:flux-pro:1k': 8,
    'image:flux-pro:2k': 16,
    'retouch:gpt-image-2-retouch:1k': 6,
    'retouch:gpt-image-2-retouch:2k': 12,
    'retouch:stable-diffusion-retouch:1k': 4,
    'retouch:stable-diffusion-retouch:2k': 8,
    'video:seedance-2.0': 2,
    'video:sora': 3,
    'video:runway-gen3': 2,
    'video:pika-labs': 1,
    'video:kling': 2,
    'detail:plan': 5,
    'detail:image:1k': 5,
    'detail:image:2k': 10,
    'psdLayer:bria-rmbg-inpainting': 15,
    'text:generate': 1
  },

  earning: {
    dailyCheckIn: 2,
    newRegister: 20,
    referralRegister: 10,
    monthlyFree: { free: 0, basic: 200, pro: 800, enterprise: 3000 }
  },

  packs: [
    { id: 'pack-100', credits: 100, price: 9.9, label: '100 积分', bonus: 0 },
    { id: 'pack-500', credits: 500, price: 39.9, label: '500 积分', bonus: 20 },
    { id: 'pack-2000', credits: 2000, price: 129, label: '2000 积分', bonus: 100 },
    { id: 'pack-5000', credits: 5000, price: 269, label: '5000 积分', bonus: 300 }
  ],

  expiry: {
    monthlyCredits: 'end_of_month',
    purchasedCredits: 'never',
    bonusCredits: 30
  }
};

export function calculateCreditsCost(type, model, resolution, options = {}) {
  const { duration = 0, count = 1 } = options;

  if (type === 'video') {
    const key = `video:${model}`;
    const perSecond = CREDITS_RULES.consumption[key] || 2;
    return perSecond * duration;
  }

  if (type === 'detail' && model === 'plan') {
    return CREDITS_RULES.consumption['detail:plan'];
  }

  if (type === 'detail') {
    const key = `detail:image:${resolution}`;
    return (CREDITS_RULES.consumption[key] || 5) * count;
  }

  if (type === 'text') {
    return CREDITS_RULES.consumption['text:generate'] || 1;
  }

  const key = `${type}:${model}:${resolution}`;
  const perImage = CREDITS_RULES.consumption[key] || 5;
  return perImage * count;
}

export function getCreditsPackById(packId) {
  return CREDITS_RULES.packs.find(p => p.id === packId);
}
