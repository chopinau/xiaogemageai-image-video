import prisma from './db.js';

async function getBalance(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true } });
  return user?.credits ?? 0;
}

async function deduct(userId, amount, description, relatedId = null) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    if (user.credits < amount) throw new Error('余额不足');
    if (user.status === 'banned') throw new Error('账号已被封禁');

    const newBalance = Math.round((user.credits - amount) * 10000) / 10000;
    await tx.user.update({ where: { id: userId }, data: { credits: newBalance, totalSpent: user.totalSpent + amount } });
    await tx.transaction.create({
      data: { userId, type: 'spend', amount: -amount, balance: newBalance, description, relatedId }
    });
    return { balance: newBalance, deducted: amount };
  });
}

async function add(userId, amount, description, relatedId = null) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');

    const newBalance = Math.round((user.credits + amount) * 10000) / 10000;
    await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });
    await tx.transaction.create({
      data: { userId, type: 'earn', amount, balance: newBalance, description, relatedId }
    });
    return { balance: newBalance, added: amount };
  });
}

const pendingDeductions = new Map();

async function preDeduct(userId, amount) {
  const deductionId = `pd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const result = await deduct(userId, amount, `预扣费 ${deductionId}`, deductionId);
  pendingDeductions.set(deductionId, { userId, amount, deductedAt: new Date() });
  return { deductionId, ...result };
}

async function confirmDeduct(deductionId) {
  const pending = pendingDeductions.get(deductionId);
  if (!pending) return { confirmed: false, reason: '预扣费记录不存在' };
  pendingDeductions.delete(deductionId);
  return { confirmed: true, deductionId };
}

async function rollbackDeduct(deductionId) {
  const pending = pendingDeductions.get(deductionId);
  if (!pending) return { rolledBack: false, reason: '预扣费记录不存在' };
  pendingDeductions.delete(deductionId);
  const result = await add(pending.userId, pending.amount, `预扣费回滚 ${deductionId}`, deductionId);
  return { rolledBack: true, deductionId, ...result };
}

async function checkIn(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.checkIn.findFirst({
    where: {
      userId,
      createdAt: { gte: today }
    }
  });

  if (existing) {
    return { success: false, message: '今日已签到', reward: 0 };
  }

  const reward = 0.02;
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    const newBalance = Math.round((user.credits + reward) * 10000) / 10000;
    await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });
    await tx.checkIn.create({ data: { userId, reward } });
    await tx.transaction.create({
      data: { userId, type: 'checkin', amount: reward, balance: newBalance, description: '每日签到奖励' }
    });
    return newBalance;
  });

  return { success: true, message: '签到成功', reward, balance: result };
}

async function getHistory(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.transaction.count({ where: { userId } })
  ]);
  return { entries, total, page, limit };
}

export {
  getBalance,
  deduct,
  add,
  preDeduct,
  confirmDeduct,
  rollbackDeduct,
  checkIn,
  getHistory
};
