﻿﻿﻿export const CREDITS_RULES = {
  consumption: {
    'image:gpt-image-2:1k': 0.05,
    'image:gpt-image-2:2k': 0.10,
    'image:gpt-image-2:4k': 0.20,
    'image:dall-e-3:1k': 0.10,
    'image:dall-e-3:2k': 0.20,
    'image:midjourney-v6:1k': 0.12,
    'image:midjourney-v6:2k': 0.24,
    'image:midjourney-v6:4k': 0.48,
    'image:stable-diffusion-xl:1k': 0.03,
    'image:stable-diffusion-xl:2k': 0.06,
    'image:flux-pro:1k': 0.08,
    'image:flux-pro:2k': 0.16,
    'retouch:gpt-image-2-retouch:1k': 0.06,
    'retouch:gpt-image-2-retouch:2k': 0.12,
    'retouch:stable-diffusion-retouch:1k': 0.04,
    'retouch:stable-diffusion-retouch:2k': 0.08,
    'video:seedance-2.0': 0.02,
    'video:sora': 0.03,
    'video:runway-gen3': 0.02,
    'video:pika-labs': 0.01,
    'video:kling': 0.02,
    'detail:plan': 0.05,
    'detail:image:1k': 0.05,
    'detail:image:2k': 0.10,
    'psdLayer:bria-rmbg-inpainting': 0.15,
    'text:generate': 0.01
  },

  earning: {
    dailyCheckIn: 0.02,
    newRegister: 2.00,
    referralRegister: 1.00,
    monthlyFree: { free: 0, basic: 20.00, pro: 80.00, enterprise: 300.00 }
  },

  packs: [
    { id: 'pack-10', credits: 10, price: 10, label: '10 算力', bonus: 0 },
    { id: 'pack-50', credits: 50, price: 50, label: '50 算力', bonus: 2 },
    { id: 'pack-200', credits: 200, price: 200, label: '200 算力', bonus: 10 },
    { id: 'pack-500', credits: 500, price: 500, label: '500 算力', bonus: 30 }
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
    const perSecond = CREDITS_RULES.consumption[key] || 0.02;
    return roundToCents(perSecond * duration);
  }

  if (type === 'detail' && model === 'plan') {
    return CREDITS_RULES.consumption['detail:plan'];
  }

  if (type === 'detail') {
    const key = `detail:image:${resolution}`;
    return roundToCents((CREDITS_RULES.consumption[key] || 0.05) * count);
  }

  if (type === 'text') {
    return CREDITS_RULES.consumption['text:generate'] || 0.01;
  }

  const key = `${type}:${model}:${resolution}`;
  const perImage = CREDITS_RULES.consumption[key] || 0.05;
  return roundToCents(perImage * count);
}

export function getCreditsPackById(packId) {
  return CREDITS_RULES.packs.find(p => p.id === packId);
}

function roundToCents(amount) {
  return Math.round(amount * 100) / 100;
}
