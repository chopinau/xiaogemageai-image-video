import prisma from './db.js';

export async function recordRevenue(agencyId, userId, basePrice, agencyPrice, type = 'markup', orderId = null) {
  const revenue = Math.round((agencyPrice - basePrice) * 100) / 100;
  if (revenue <= 0) return null;

  return prisma.$transaction(async (tx) => {
    const record = await tx.agencyRevenueRecord.create({
      data: {
        agencyId,
        userId,
        orderId,
        type,
        basePrice,
        agencyPrice,
        revenue,
        status: 'settled'
      }
    });

    await tx.agency.update({
      where: { id: agencyId },
      data: {
        totalRevenue: { increment: revenue },
        availableBalance: { increment: revenue }
      }
    });

    return record;
  });
}

export async function refundRevenue(agencyId, revenueRecordId) {
  const record = await prisma.agencyRevenueRecord.findUnique({
    where: { id: revenueRecordId }
  });
  if (!record || record.status !== 'settled') return null;

  return prisma.$transaction(async (tx) => {
    await tx.agencyRevenueRecord.update({
      where: { id: revenueRecordId },
      data: { status: 'refunded' }
    });

    await tx.agency.update({
      where: { id: agencyId },
      data: {
        totalRevenue: { decrement: record.revenue },
        availableBalance: { decrement: record.revenue }
      }
    });

    return { refunded: record.revenue };
  });
}

export async function getRevenueRecords(agencyId, filters = {}) {
  const where = { agencyId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.agencyRevenueRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.agencyRevenueRecord.count({ where })
  ]);

  return { records, total, page, limit };
}

export async function getRevenueSummary(agencyId, period = 'month') {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const result = await prisma.agencyRevenueRecord.aggregate({
    where: {
      agencyId,
      status: 'settled',
      createdAt: { gte: startDate }
    },
    _sum: { revenue: true },
    _count: true
  });

  return {
    period,
    startDate,
    totalRevenue: result._sum.revenue || 0,
    transactionCount: result._count
  };
}

export function calculateAgencyPrice(basePrice, agency) {
  if (!agency || agency.markupValue <= 0) return basePrice;

  let agencyPrice;
  if (agency.markupType === 'percent') {
    const markup = Math.min(agency.markupValue, agency.maxMarkup || 50);
    agencyPrice = basePrice * (1 + markup / 100);
  } else {
    agencyPrice = basePrice + agency.markupValue;
  }

  return Math.round(agencyPrice * 100) / 100;
}
