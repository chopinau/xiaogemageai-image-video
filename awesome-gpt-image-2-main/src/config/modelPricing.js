export const MODEL_PRICING = {

  'gpt-image-2': {
    billingMethod: 'per_call',
    basePriceCNY: 0.0576,
    baseCredits: 6,
    optionPricing: {}
  },

  'doubao-seedream-5-0': {
    billingMethod: 'per_call',
    basePriceCNY: 0.1584,
    baseCredits: 16,
    optionPricing: {}
  },

  'doubao-seedream-4-5': {
    billingMethod: 'per_call',
    basePriceCNY: 0.18,
    baseCredits: 18,
    optionPricing: {}
  },

  'gemini-3-pro-image': {
    billingMethod: 'per_call',
    basePriceCNY: 0.2016,
    baseCredits: 20,
    optionPricing: {}
  },

  'kling-v3-image': {
    billingMethod: 'per_call',
    basePriceCNY: 0.1728,
    baseCredits: 17,
    optionPricing: {}
  },

  'kling-v3-omni-image': {
    billingMethod: 'per_call',
    basePriceCNY: 0.1728,
    baseCredits: 17,
    optionPricing: {
      resolution: { '4k': { multiplier: 2 } }
    }
  },

  'wan2.7-image': {
    billingMethod: 'per_call',
    basePriceCNY: 0.144,
    baseCredits: 14,
    optionPricing: {
      quality: { 'pro': { multiplier: 2.5 } }
    }
  },

  'kling-v3-video': {
    billingMethod: 'per_call',
    basePriceCNY: 3.2386,
    baseCredits: 324,
    optionPricing: {
      duration: {
        '10': { multiplier: 2 },
        '15': { multiplier: 3 }
      },
      mode: {
        'pro': { multiplier: 1.3333 }
      }
    }
  },

  'kling-v2-6': {
    billingMethod: 'per_call',
    basePriceCNY: 5.2602,
    baseCredits: 526,
    optionPricing: {
      duration: {
        '10': { multiplier: 2 }
      },
      sound: {
        'off': { multiplier: 0.6 }
      }
    }
  },

  'seedance-2.0': {
    billingMethod: 'per_token',
    basePriceCNY: 53.28,
    baseCredits: 5328,
    optionPricing: {
      version: {
        '标准': { multiplier: 1.2432 }
      }
    },
    note: '按输出token计费，基础价为每百万输出token价格'
  },

  'veo3.1-lite': {
    billingMethod: 'per_call',
    basePriceCNY: 0.36,
    baseCredits: 36,
    optionPricing: {
      quality: {
        '4k': { multiplier: 1.1 }
      }
    }
  },

  'grok-video-3-plus': {
    billingMethod: 'per_call',
    basePriceCNY: 0.4032,
    baseCredits: 40,
    optionPricing: {
      duration: {
        '15': { multiplier: 2 },
        '20': { multiplier: 2 },
        '25': { multiplier: 3 },
        '30': { multiplier: 3 }
      }
    }
  },

  'hailuo-2.3': {
    billingMethod: 'per_call',
    basePriceCNY: 1.6128,
    baseCredits: 161,
    optionPricing: {
      model_version: {
        '2.3-fast': { multiplier: 0.6964 }
      },
      duration: {
        '10': { multiplier: 1.6696 }
      },
      resolution: {
        '1080P': { multiplier: 1.7589 }
      }
    }
  },

  'wan2.6-video': {
    billingMethod: 'per_call',
    basePriceCNY: 0.4536,
    baseCredits: 45,
    optionPricing: {
      resolution: {
        '1080P': { multiplier: 1.6667 }
      },
      duration: {
        '6': { multiplier: 2 },
        '9': { multiplier: 3 },
        '12': { multiplier: 4 },
        '15': { multiplier: 5 }
      }
    }
  },

  'wan2.7-video': {
    billingMethod: 'per_call',
    basePriceCNY: 1.296,
    baseCredits: 130,
    optionPricing: {
      resolution: {
        '1080P': { multiplier: 1.6667 }
      },
      duration: {
        '6': { multiplier: 2 },
        '9': { multiplier: 3 },
        '12': { multiplier: 4 },
        '15': { multiplier: 5 }
      }
    }
  },

  'pixverse-v5.6': {
    billingMethod: 'per_second',
    basePriceCNY: 0.5414,
    baseCredits: 54,
    optionPricing: {
      resolution: {
        '720P': { addCNY: 0.048, addCredits: 5 },
        '1080P': { addCNY: 0.184, addCredits: 18 }
      }
    },
    note: '按秒计费，基础价为每秒价格'
  }
};

export function calculateComputeCost(modelId, params = {}) {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return 0;

  let credits = pricing.baseCredits;

  for (const [paramKey, paramValue] of Object.entries(params)) {
    const optionPricing = pricing.optionPricing[paramKey];
    if (!optionPricing) continue;

    const valuePricing = optionPricing[String(paramValue)];
    if (!valuePricing) continue;

    if (valuePricing.multiplier) {
      credits = Math.round(credits * valuePricing.multiplier);
    }
    if (valuePricing.addCredits) {
      credits += valuePricing.addCredits;
    }
  }

  if (pricing.billingMethod === 'per_second') {
    const duration = params.duration ? parseInt(params.duration) : 5;
    credits = credits * duration;
  }

  if (pricing.billingMethod === 'per_call' && params.n != null) {
    const n = parseInt(params.n) || 1;
    credits = credits * n;
  }

  return credits;
}

export function formatCredits(credits) {
  if (credits >= 10000) {
    return (credits / 10000).toFixed(1) + '万';
  }
  return credits.toString();
}

export function creditsToCNY(credits) {
  return (credits * 0.01).toFixed(2);
}
