import prisma from './db.js';

async function record(userId, type, model, cost, params = {}) {
  return prisma.usageRecord.create({
    data: {
      userId,
      type,
      model,
      cost,
      duration: params.duration || null,
      resolution: params.resolution || null,
      status: params.status || 'success',
      requestId: params.requestId || null
    }
  });
}

async function getUserStats(userId) {
  const [totalSpent, totalCalls, modelBreakdown] = await Promise.all([
    prisma.usageRecord.aggregate({ where: { userId, status: 'success' }, _sum: { cost: true } }),
    prisma.usageRecord.count({ where: { userId, status: 'success' } }),
    prisma.usageRecord.groupBy({
      by: ['model'],
      where: { userId, status: 'success' },
      _count: { model: true },
      _sum: { cost: true },
      orderBy: { _count: { model: 'desc' } },
      take: 10
    })
  ]);

  return {
    totalSpent: totalSpent._sum.cost || 0,
    totalCalls,
    modelBreakdown: modelBreakdown.map(m => ({
      model: m.model,
      calls: m._count.model,
      cost: m._sum.cost || 0
    }))
  };
}

async function getDailyStats(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const records = await prisma.usageRecord.findMany({
    where: { createdAt: { gte: since }, status: 'success' },
    select: { createdAt: true, cost: true, type: true, model: true }
  });

  const dailyMap = {};
  for (const r of records) {
    const day = r.createdAt.toISOString().split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { date: day, calls: 0, cost: 0, byType: {} };
    dailyMap[day].calls++;
    dailyMap[day].cost += r.cost;
    dailyMap[day].byType[r.type] = (dailyMap[day].byType[r.type] || 0) + 1;
  }

  return Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
}

async function getModelStats() {
  return prisma.usageRecord.groupBy({
    by: ['model', 'type'],
    where: { status: 'success' },
    _count: { model: true },
    _sum: { cost: true },
    orderBy: { _count: { model: 'desc' } }
  });
}

async function getTopUsers(limit = 10) {
  return prisma.usageRecord.groupBy({
    by: ['userId'],
    where: { status: 'success' },
    _count: { userId: true },
    _sum: { cost: true },
    orderBy: { _sum: { cost: 'desc' } },
    take: limit
  });
}

export {
  record,
  getUserStats,
  getDailyStats,
  getModelStats,
  getTopUsers
};
