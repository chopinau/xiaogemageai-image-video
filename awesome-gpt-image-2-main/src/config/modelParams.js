export const MODEL_PARAMS = {

  'gpt-image-2': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'quality', label: '画质设置', icon: '✨' }
    ],
    params: [
      {
        id: 'size',
        label: '图片尺寸',
        type: 'select',
        group: 'basic',
        default: 'auto',
        help: '选择生成图片的尺寸，auto自动选择最佳比例',
        options: [
          { value: 'auto', label: '自动', detail: '智能选择' },
          { value: '1024x1024', label: '1:1', detail: '正方形' },
          { value: '1024x1536', label: '2:3', detail: '竖版' },
          { value: '1536x1024', label: '3:2', detail: '横版' }
        ]
      },
      {
        id: 'quality',
        label: '质量',
        type: 'select',
        group: 'quality',
        default: 'auto',
        help: 'auto自动选择最佳质量',
        options: [
          { value: 'auto', label: '自动' },
          { value: 'high', label: '高清', detail: '最高质量' },
          { value: 'medium', label: '标准', detail: '平衡质量与速度' },
          { value: 'low', label: '快速', detail: '最快速度' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 10 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'doubao-seedream-5-0': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'advanced', label: '高级设置', icon: '🔧' }
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: '宽高比',
        type: 'select',
        group: 'basic',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'basic',
        default: '2K',
        help: '3K分辨率更清晰',
        options: [
          { value: '2K', label: '2K' },
          { value: '3K', label: '3K' }
        ]
      },
      {
        id: 'web_search',
        label: '联网搜索',
        type: 'toggle',
        group: 'advanced',
        default: false,
        help: '开启联网搜索，可获取实时信息生成图片'
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'doubao-seedream-4-5': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' }
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: '宽高比',
        type: 'select',
        group: 'basic',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'basic',
        default: '2K',
        options: [
          { value: '2K', label: '2K' },
          { value: '4K', label: '4K' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'gemini-3-pro-image': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'quality', label: '画质设置', icon: '✨' }
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: '图片比例',
        type: 'select',
        group: 'basic',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '2:3', label: '2:3' },
          { value: '3:2', label: '3:2' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
          { value: '4:5', label: '4:5' },
          { value: '5:4', label: '5:4' },
          { value: '9:16', label: '9:16' },
          { value: '16:9', label: '16:9' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'quality',
        default: '1K',
        options: [
          { value: '1K', label: '1K' },
          { value: '2K', label: '2K' },
          { value: '4K', label: '4K' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'kling-v3-image': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'quality', label: '画质设置', icon: '✨' }
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: '图片比例',
        type: 'select',
        group: 'basic',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'quality',
        default: '1k',
        options: [
          { value: '1k', label: '1K' },
          { value: '2k', label: '2K' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'kling-v3-omni-image': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'quality', label: '画质设置', icon: '✨' }
    ],
    params: [
      {
        id: 'aspect_ratio',
        label: '图片比例',
        type: 'select',
        group: 'basic',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'quality',
        default: '1k',
        options: [
          { value: '1k', label: '1K' },
          { value: '2k', label: '2K' },
          { value: '4k', label: '4K' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'wan2.7-image': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'quality', label: '画质设置', icon: '✨' }
    ],
    params: [
      {
        id: 'size',
        label: '宽高比',
        type: 'select',
        group: 'basic',
        default: '1:1',
        options: [
          { value: '1:1', label: '1:1' },
          { value: '3:4', label: '3:4' },
          { value: '4:3', label: '4:3' },
          { value: '9:16', label: '9:16' },
          { value: '16:9', label: '16:9' },
          { value: '2:3', label: '2:3' },
          { value: '3:2', label: '3:2' }
        ]
      },
      {
        id: 'quality',
        label: '质量模式',
        type: 'select',
        group: 'quality',
        default: 'standard',
        help: 'pro模式效果更好',
        options: [
          { value: 'standard', label: '标准' },
          { value: 'pro', label: '高质量' }
        ]
      },
      {
        id: 'n',
        label: '生成数量',
        type: 'counter',
        group: 'basic',
        default: 1,
        range: { min: 1, max: 4 },
        help: '一次生成多张图片以供选择'
      }
    ]
  },

  'kling-v3-video': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'mode',
        label: '生成模式',
        type: 'select',
        group: 'basic',
        default: 'std',
        help: '标准性价比高，高品质画质更佳',
        options: [
          { value: 'std', label: '标准' },
          { value: 'pro', label: '高品质' }
        ]
      },
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '5',
        options: [
          { value: '5', label: '5秒' },
          { value: '10', label: '10秒' },
          { value: '15', label: '15秒' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '画面比例',
        type: 'select',
        group: 'output',
        default: '16:9',
        help: '传入图片后比例跟随首帧图',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' }
        ]
      }
    ]
  },

  'kling-v2-6': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '5',
        options: [
          { value: '5', label: '5秒' },
          { value: '10', label: '10秒' }
        ]
      },
      {
        id: 'sound',
        label: '声音模式',
        type: 'select',
        group: 'output',
        default: 'on',
        help: '有声自动生成匹配音效',
        options: [
          { value: 'on', label: '有声' },
          { value: 'off', label: '无声' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '画面比例',
        type: 'select',
        group: 'output',
        default: '16:9',
        help: '有图片时比例随图片而定',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' }
        ]
      }
    ]
  },

  'seedance-2.0': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'version',
        label: '速度版本',
        type: 'select',
        group: 'basic',
        default: '标准',
        help: '标准版质量更高，快速版出图更快',
        options: [
          { value: '标准', label: '标准' },
          { value: '快速', label: '快速' }
        ]
      },
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: 'auto',
        help: '自动模式由模型自主选择最佳时长',
        options: [
          { value: 'auto', label: '自动' },
          { value: '4', label: '4秒' },
          { value: '5', label: '5秒' },
          { value: '6', label: '6秒' },
          { value: '7', label: '7秒' },
          { value: '8', label: '8秒' },
          { value: '9', label: '9秒' },
          { value: '10', label: '10秒' },
          { value: '11', label: '11秒' },
          { value: '12', label: '12秒' },
          { value: '13', label: '13秒' },
          { value: '14', label: '14秒' },
          { value: '15', label: '15秒' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '宽高比',
        type: 'select',
        group: 'output',
        default: 'adaptive',
        help: '自适应根据输入图片自动选择',
        options: [
          { value: 'adaptive', label: '自适应' },
          { value: '16:9', label: '16:9' },
          { value: '4:3', label: '4:3' },
          { value: '1:1', label: '1:1' },
          { value: '3:4', label: '3:4' },
          { value: '9:16', label: '9:16' },
          { value: '21:9', label: '21:9' }
        ]
      },
      {
        id: 'resolution',
        label: '视频分辨率',
        type: 'select',
        group: 'output',
        default: '720p',
        options: [
          { value: '480p', label: '480p' },
          { value: '720p', label: '720p' }
        ]
      }
    ]
  },

  'veo3.1-lite': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'quality',
        label: '视频画质',
        type: 'select',
        group: 'basic',
        default: 'sd',
        options: [
          { value: 'sd', label: '标清' },
          { value: '4k', label: '4K' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '视频比例',
        type: 'select',
        group: 'basic',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' }
        ]
      },
      {
        id: 'enhance_prompt',
        label: '提示词优化',
        type: 'toggle',
        group: 'output',
        default: true,
        help: '自动优化提示词以提升生成质量'
      }
    ]
  },

  'grok-video-3-plus': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '10',
        options: [
          { value: '10', label: '10秒' },
          { value: '15', label: '15秒' },
          { value: '20', label: '20秒' },
          { value: '25', label: '25秒' },
          { value: '30', label: '30秒' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '画面比例',
        type: 'select',
        group: 'output',
        default: '16:9',
        help: '建议与参考图比例一致',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '3:2', label: '3:2' },
          { value: '2:3', label: '2:3' },
          { value: '1:1', label: '1:1' }
        ]
      }
    ]
  },

  'hailuo-2.3': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'model_version',
        label: '模型版本',
        type: 'select',
        group: 'basic',
        default: '2.3',
        help: '标准版画质更优，极速版更快',
        options: [
          { value: '2.3', label: '标准版' },
          { value: '2.3-fast', label: '极速版' }
        ]
      },
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '6',
        options: [
          { value: '6', label: '6秒' },
          { value: '10', label: '10秒' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'output',
        default: '768P',
        options: [
          { value: '768P', label: '768P' },
          { value: '1080P', label: '1080P' }
        ]
      },
      {
        id: 'enhance_prompt',
        label: '提示词优化',
        type: 'select',
        group: 'output',
        default: 'Enabled',
        help: '自动优化提示词以提升生成质量',
        options: [
          { value: 'Enabled', label: '开启' },
          { value: 'Disabled', label: '关闭' }
        ]
      }
    ]
  },

  'wan2.6-video': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'quality',
        label: '生成质量',
        type: 'select',
        group: 'basic',
        default: 'standard',
        help: '快速模式更快，高质量画面更精细',
        options: [
          { value: 'fast', label: '快速' },
          { value: 'standard', label: '高质量' }
        ]
      },
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '6',
        options: [
          { value: '3', label: '3秒' },
          { value: '6', label: '6秒' },
          { value: '9', label: '9秒' },
          { value: '12', label: '12秒' },
          { value: '15', label: '15秒' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'output',
        default: '720P',
        options: [
          { value: '720P', label: '720P' },
          { value: '1080P', label: '1080P' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '宽高比',
        type: 'select',
        group: 'output',
        default: '16:9',
        help: '图生视频跟随首帧图',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' }
        ]
      },
      {
        id: 'shot_type',
        label: '镜头类型',
        type: 'select',
        group: 'output',
        default: 'single',
        help: '单镜头或多镜头叙事',
        options: [
          { value: 'single', label: '单镜头' },
          { value: 'multi', label: '多镜头' }
        ]
      },
      {
        id: 'prompt_extend',
        label: '提示词优化',
        type: 'toggle',
        group: 'output',
        default: true,
        help: '智能改写提示词'
      }
    ]
  },

  'wan2.7-video': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '6',
        options: [
          { value: '3', label: '3秒' },
          { value: '6', label: '6秒' },
          { value: '9', label: '9秒' },
          { value: '12', label: '12秒' },
          { value: '15', label: '15秒' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'output',
        default: '720P',
        options: [
          { value: '720P', label: '720P' },
          { value: '1080P', label: '1080P' }
        ]
      },
      {
        id: 'ratio',
        label: '宽高比',
        type: 'select',
        group: 'output',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '9:16', label: '9:16' },
          { value: '1:1', label: '1:1' },
          { value: '4:3', label: '4:3' },
          { value: '3:4', label: '3:4' }
        ]
      },
      {
        id: 'prompt_extend',
        label: '提示词优化',
        type: 'toggle',
        group: 'output',
        default: true,
        help: '智能优化提示词'
      }
    ]
  },

  'pixverse-v5.6': {
    groups: [
      { id: 'basic', label: '基础设置', icon: '📐' },
      { id: 'output', label: '输出设置', icon: '📤' }
    ],
    params: [
      {
        id: 'duration',
        label: '视频时长',
        type: 'select',
        group: 'basic',
        default: '5',
        options: [
          { value: '5', label: '5秒' },
          { value: '8', label: '8秒' },
          { value: '10', label: '10秒' }
        ]
      },
      {
        id: 'resolution',
        label: '分辨率',
        type: 'select',
        group: 'output',
        default: '720P',
        options: [
          { value: '360P', label: '360P' },
          { value: '540P', label: '540P' },
          { value: '720P', label: '720P' },
          { value: '1080P', label: '1080P' }
        ]
      },
      {
        id: 'aspect_ratio',
        label: '画面比例',
        type: 'select',
        group: 'output',
        default: '16:9',
        options: [
          { value: '16:9', label: '16:9' },
          { value: '4:3', label: '4:3' },
          { value: '1:1', label: '1:1' },
          { value: '3:4', label: '3:4' },
          { value: '9:16', label: '9:16' }
        ]
      }
    ]
  }
};

export function getModelParams(modelId) {
  return MODEL_PARAMS[modelId] || null;
}

export function getModelParamDefaults(modelId) {
  const config = MODEL_PARAMS[modelId];
  if (!config) return {};
  const defaults = {};
  for (const param of config.params) {
    defaults[param.id] = param.default;
  }
  return defaults;
}

export function getModelGroups(modelId) {
  const config = MODEL_PARAMS[modelId];
  return config ? config.groups : [];
}
