export const ASPECT_RATIOS = {
  mainImage: [
    { value: '1:1', label: '1:1（正方形）' },
    { value: '3:4', label: '3:4（竖版）' },
    { value: '4:3', label: '4:3（横版）' },
    { value: '16:9', label: '16:9（宽屏）' },
    { value: '9:16', label: '9:16（手机竖屏）' },
    { value: '2:3', label: '2:3（竖版）' },
    { value: '3:2', label: '3:2（横版）' }
  ],
  detailPage: [
    { value: '3:4', label: '3:4（详情页竖版）' },
    { value: '9:16', label: '9:16（手机详情页）' },
    { value: '2:3', label: '2:3（长图竖版）' }
  ],
  retouch: [
    { value: 'original', label: '原图比例' },
    { value: '1:1', label: '1:1（正方形）' },
    { value: '3:4', label: '3:4（竖版）' },
    { value: '4:3', label: '4:3（横版）' },
    { value: '16:9', label: '16:9（宽屏）' },
    { value: '9:16', label: '9:16（手机竖屏）' }
  ]
};

export const LANGUAGES = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' }
];

export const RESOLUTIONS = [
  { value: '1k', label: '标清 1K', description: '1024×1024' },
  { value: '2k', label: '高清 2K', description: '2048×2048' },
  { value: '4k', label: '超清 4K', description: '4096×4096' }
];

export const GENERATE_COUNTS = [
  { value: 1, label: '1 张' },
  { value: 2, label: '2 张' },
  { value: 3, label: '3 张' },
  { value: 4, label: '4 张' },
  { value: 6, label: '6 张' },
  { value: 9, label: '9 张' }
];

export const VIDEO_DURATIONS = [
  { value: 4, label: '4 秒' },
  { value: 8, label: '8 秒' },
  { value: 10, label: '10 秒' },
  { value: 15, label: '15 秒' }
];

export const VIDEO_RESOLUTIONS = [
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: '4k', label: '4K' }
];

export const AUDIO_OPTIONS = [
  { value: 'none', label: '不保留音轨' },
  { value: 'original', label: '保留原音' },
  { value: 'custom', label: '自定义背景音乐' }
];

export const BACKGROUND_OPTIONS = [
  { value: 'white', label: '白底图' },
  { value: 'transparent', label: '透明图' },
  { value: 'original', label: '原图背景' },
  { value: 'custom', label: '自定义场景背景' }
];

export const CREDITS = {
  mainImage: { perImage: 10, label: '10 积分/张' },
  detailPlan: { perPlan: 5, label: '5 积分/次规划' },
  detailImage: { perImage: 8, label: '5-10 积分/张' },
  retouch: { perImage: 6, label: '6 积分/张' },
  videoAnalyze: { perAnalyze: 3, label: '3 积分/次分析' },
  videoGenerate: { perSecond: 2, label: '2 积分/秒' }
};

export const DETAIL_PAGE_MODULES = [
  { id: 'hero', name: '主图区', description: '产品主视觉展示' },
  { id: 'selling-points', name: '卖点区', description: '核心卖点提炼' },
  { id: 'features', name: '功能详情', description: '功能特性详解' },
  { id: 'scenarios', name: '使用场景', description: '场景化展示' },
  { id: 'comparison', name: '对比区', description: '竞品/前后对比' },
  { id: 'specs', name: '参数区', description: '技术参数规格' },
  { id: 'reviews', name: '评价区', description: '用户评价展示' },
  { id: 'guarantee', name: '保障区', description: '售后保障信息' }
];

export const RETOUCH_EXAMPLES = [
  '去除背景杂物，保持产品主体清晰',
  '增强产品光泽，提升金属质感',
  '修复产品表面划痕和瑕疵',
  '去除图片中的文字和水印',
  '提升整体清晰度和锐度',
  '调整色彩饱和度，使颜色更鲜艳',
  '优化光影效果，增加立体感'
];

export const PROMOTION_EXAMPLES = [
  '限时特惠：满200减50，活动截止12月31日',
  '新品首发：前100名下单享8折优惠',
  '买一赠一：购买指定款赠送同款小样',
  '会员专享：积分兑换，双重积分日每周三'
];

export const VIDEO_TABS = [
  { value: 'one-click', label: '一键生成' },
  { value: 'editing', label: '总剪辑' },
  { value: 'replicate', label: '视频复刻' }
];

export const MAIN_IMAGE_STEPS = [
  { key: 'input', label: '输入' },
  { key: 'generate', label: '生成' },
  { key: 'processing', label: '生成中' },
  { key: 'complete', label: '完成' }
];

export const DETAIL_STEPS = [
  { key: 'input', label: '上传素材' },
  { key: 'plan', label: '生成规划' },
  { key: 'generate', label: '按模块出图' }
];
