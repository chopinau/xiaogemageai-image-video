import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEFAULT_CONFIGS = [
  { key: 'wechat_enabled', value: 'false', description: '微信支付开关' },
  { key: 'alipay_enabled', value: 'false', description: '支付宝开关' },
  { key: 'payment_page_title', value: 'AI 创作平台 - 算力充值', description: '收款页标题' },
  { key: 'payment_page_desc', value: '充值算力，畅享AI创作', description: '收款页描述' },
  { key: 'pack_10_price', value: '10', description: '10算力包价格' },
  { key: 'pack_50_price', value: '50', description: '50算力包价格' },
  { key: 'pack_200_price', value: '200', description: '200算力包价格' },
  { key: 'pack_500_price', value: '500', description: '500算力包价格' },
  { key: 'pack_10_credits', value: '10', description: '10算力包算力数' },
  { key: 'pack_50_credits', value: '50', description: '50算力包算力数' },
  { key: 'pack_200_credits', value: '200', description: '200算力包算力数' },
  { key: 'pack_500_credits', value: '500', description: '500算力包算力数' },
  { key: 'pack_50_bonus', value: '2', description: '50算力包赠送' },
  { key: 'pack_200_bonus', value: '10', description: '200算力包赠送' },
  { key: 'pack_500_bonus', value: '30', description: '500算力包赠送' },
];

export async function initializeDefaults() {
  for (const config of DEFAULT_CONFIGS) {
    await prisma.paymentConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
}

export async function getAllConfigs() {
  return prisma.paymentConfig.findMany({ orderBy: { key: 'asc' } });
}

export async function getConfig(key) {
  const config = await prisma.paymentConfig.findUnique({ where: { key } });
  return config ? config.value : null;
}

export async function updateConfig(key, value) {
  return prisma.paymentConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function updateConfigs(configs) {
  const results = [];
  for (const { key, value } of configs) {
    const result = await prisma.paymentConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    results.push(result);
  }
  return results;
}

export async function getPublicConfigs() {
  const keys = [
    'wechat_enabled',
    'alipay_enabled',
    'payment_page_title',
    'payment_page_desc',
    'pack_10_price',
    'pack_50_price',
    'pack_200_price',
    'pack_500_price',
    'pack_10_credits',
    'pack_50_credits',
    'pack_200_credits',
    'pack_500_credits',
    'pack_50_bonus',
    'pack_200_bonus',
    'pack_500_bonus',
  ];

  const configs = await prisma.paymentConfig.findMany({
    where: { key: { in: keys } },
  });

  const result = {};
  for (const config of configs) {
    result[config.key] = config.value;
  }
  return result;
}

export async function getPackConfig() {
  const publicConfigs = await getPublicConfigs();
  return [
    {
      id: 'pack-10',
      credits: parseInt(publicConfigs.pack_10_credits) || 10,
      price: parseFloat(publicConfigs.pack_10_price) || 10,
      bonus: 0,
      label: '10算力包',
    },
    {
      id: 'pack-50',
      credits: parseInt(publicConfigs.pack_50_credits) || 50,
      price: parseFloat(publicConfigs.pack_50_price) || 50,
      bonus: parseInt(publicConfigs.pack_50_bonus) || 2,
      label: '50算力包',
    },
    {
      id: 'pack-200',
      credits: parseInt(publicConfigs.pack_200_credits) || 200,
      price: parseFloat(publicConfigs.pack_200_price) || 200,
      bonus: parseInt(publicConfigs.pack_200_bonus) || 10,
      label: '200算力包',
    },
    {
      id: 'pack-500',
      credits: parseInt(publicConfigs.pack_500_credits) || 500,
      price: parseFloat(publicConfigs.pack_500_price) || 500,
      bonus: parseInt(publicConfigs.pack_500_bonus) || 30,
      label: '500算力包',
    },
  ];
}
