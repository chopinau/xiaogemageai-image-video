import prisma from './db.js';

export async function createAgency(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('用户不存在');
  if (user.role === 'agency') throw new Error('该用户已是代理商');

  const slug = data.agencySlug || generateSlug(data.agencyName);
  const subdomain = data.subdomain || slug;

  const existing = await prisma.agency.findFirst({
    where: { OR: [{ agencySlug: slug }, { subdomain }] }
  });
  if (existing) throw new Error('代理商标识或子域名已存在');

  const agency = await prisma.$transaction(async (tx) => {
    const a = await tx.agency.create({
      data: {
        userId,
        agencyName: data.agencyName,
        agencySlug: slug,
        subdomain,
        logoUrl: data.logoUrl || null,
        primaryColor: data.primaryColor || '#42e6ff',
        description: data.description || null,
        markupType: data.markupType || 'percent',
        markupValue: data.markupValue || 0,
        maxMarkup: data.maxMarkup || 50,
      }
    });
    await tx.user.update({
      where: { id: userId },
      data: { role: 'agency' }
    });
    return a;
  });

  return agency;
}

export async function getAgencyById(id) {
  return prisma.agency.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, nickname: true } },
      brandConfig: true,
    }
  });
}

export async function getAgencyBySubdomain(subdomain) {
  return prisma.agency.findUnique({
    where: { subdomain },
    include: { brandConfig: true }
  });
}

export async function getAgencyByUserId(userId) {
  return prisma.agency.findUnique({
    where: { userId },
    include: { brandConfig: true }
  });
}

export async function listAgencies(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  return prisma.agency.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, nickname: true } },
      _count: { select: { agencyUsers: true, revenueRecords: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateAgency(id, data) {
  const updateData = {};
  const allowedFields = [
    'agencyName', 'logoUrl', 'faviconUrl', 'primaryColor',
    'description', 'markupType', 'markupValue', 'maxMarkup',
    'customDomain', 'allowSignup', 'maxUsers', 'status'
  ];
  for (const field of allowedFields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }
  if (data.subdomain) {
    const existing = await prisma.agency.findFirst({
      where: { subdomain: data.subdomain, NOT: { id } }
    });
    if (existing) throw new Error('子域名已被占用');
    updateData.subdomain = data.subdomain;
  }

  return prisma.agency.update({
    where: { id },
    data: updateData
  });
}

export async function updateBrandConfig(agencyId, config) {
  const allowedFields = [
    'heroTitle', 'heroSubtitle', 'footerText', 'ogImage',
    'customCss', 'hidePoweredBy', 'enabledModels', 'disabledFeatures'
  ];
  const data = {};
  for (const field of allowedFields) {
    if (config[field] !== undefined) data[field] = config[field];
  }

  return prisma.agencyBrandConfig.upsert({
    where: { agencyId },
    update: data,
    create: { agencyId, ...data }
  });
}

export async function getAgencyUsers(agencyId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.agencyUser.findMany({
      where: { agencyId },
      include: { user: { select: { id: true, email: true, nickname: true, credits: true, totalSpent: true, createdAt: true } } },
      orderBy: { joinedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.agencyUser.count({ where: { agencyId } })
  ]);
  return { users, total, page, limit };
}

export async function addAgencyUser(agencyId, userId) {
  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) throw new Error('代理商不存在');

  const userCount = await prisma.agencyUser.count({ where: { agencyId } });
  if (userCount >= agency.maxUsers) throw new Error('已达到最大用户数限制');

  return prisma.$transaction(async (tx) => {
    const link = await tx.agencyUser.create({
      data: { agencyId, userId }
    });
    await tx.user.update({
      where: { id: userId },
      data: { agencyId }
    });
    return link;
  });
}

export async function removeAgencyUser(agencyId, userId) {
  return prisma.$transaction(async (tx) => {
    await tx.agencyUser.delete({
      where: { agencyId_userId: { agencyId, userId } }
    });
    await tx.user.update({
      where: { id: userId },
      data: { agencyId: null }
    });
  });
}

export async function getAgencyStats(agencyId) {
  const [userCount, revenue, withdrawals] = await Promise.all([
    prisma.agencyUser.count({ where: { agencyId } }),
    prisma.agencyRevenueRecord.aggregate({
      where: { agencyId, status: 'settled' },
      _sum: { revenue: true },
      _count: true
    }),
    prisma.agencyWithdrawal.aggregate({
      where: { agencyId, status: 'completed' },
      _sum: { actualAmount: true }
    })
  ]);

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });

  return {
    userCount,
    totalRevenue: agency?.totalRevenue || 0,
    availableBalance: agency?.availableBalance || 0,
    frozenBalance: agency?.frozenBalance || 0,
    totalWithdrawn: agency?.totalWithdrawn || 0,
    revenueRecordCount: revenue._count,
    withdrawalTotal: withdrawals._sum.actualAmount || 0
  };
}

export async function suspendAgency(id) {
  return prisma.agency.update({
    where: { id },
    data: { status: 'suspended' }
  });
}

export async function activateAgency(id) {
  return prisma.agency.update({
    where: { id },
    data: { status: 'active' }
  });
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30) + '-' + Math.random().toString(36).slice(2, 6);
}
