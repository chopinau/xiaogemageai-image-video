import prisma from './db.js';

const MIN_WITHDRAWAL = 100;
const WITHDRAWAL_FEE_RATE = 0.006;

export async function createWithdrawal(agencyId, amount, method, accountInfo, accountName) {
  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`最低提现金额为 ${MIN_WITHDRAWAL} 元`);
  }

  const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
  if (!agency) throw new Error('代理商不存在');
  if (agency.availableBalance < amount) throw new Error('可提现余额不足');

  const fee = Math.round(amount * WITHDRAWAL_FEE_RATE * 100) / 100;
  const actualAmount = Math.round((amount - fee) * 100) / 100;

  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.agencyWithdrawal.create({
      data: {
        agencyId,
        amount,
        fee,
        actualAmount,
        method: method || 'alipay',
        accountInfo,
        accountName
      }
    });

    await tx.agency.update({
      where: { id: agencyId },
      data: {
        availableBalance: { decrement: amount },
        frozenBalance: { increment: amount }
      }
    });

    return withdrawal;
  });
}

export async function approveWithdrawal(withdrawalId, adminId) {
  const withdrawal = await prisma.agencyWithdrawal.findUnique({
    where: { id: withdrawalId }
  });
  if (!withdrawal) throw new Error('提现记录不存在');
  if (withdrawal.status !== 'pending') throw new Error('提现记录状态不正确');

  return prisma.agencyWithdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: adminId
    }
  });
}

export async function completeWithdrawal(withdrawalId, transactionId) {
  const withdrawal = await prisma.agencyWithdrawal.findUnique({
    where: { id: withdrawalId }
  });
  if (!withdrawal) throw new Error('提现记录不存在');
  if (withdrawal.status !== 'approved') throw new Error('提现记录状态不正确');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.agencyWithdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        transactionId
      }
    });

    await tx.agency.update({
      where: { id: withdrawal.agencyId },
      data: {
        frozenBalance: { decrement: withdrawal.amount },
        totalWithdrawn: { increment: withdrawal.actualAmount }
      }
    });

    return updated;
  });
}

export async function rejectWithdrawal(withdrawalId, adminId, reason) {
  const withdrawal = await prisma.agencyWithdrawal.findUnique({
    where: { id: withdrawalId }
  });
  if (!withdrawal) throw new Error('提现记录不存在');
  if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
    throw new Error('提现记录状态不正确');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.agencyWithdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectReason: reason
      }
    });

    await tx.agency.update({
      where: { id: withdrawal.agencyId },
      data: {
        frozenBalance: { decrement: withdrawal.amount },
        availableBalance: { increment: withdrawal.amount }
      }
    });

    return updated;
  });
}

export async function listWithdrawals(agencyId, filters = {}) {
  const where = {};
  if (agencyId) where.agencyId = agencyId;
  if (filters.status) where.status = filters.status;

  const page = filters.page || 1;
  const limit = filters.limit || 20;

  const [records, total] = await Promise.all([
    prisma.agencyWithdrawal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.agencyWithdrawal.count({ where })
  ]);

  return { records, total, page, limit };
}
