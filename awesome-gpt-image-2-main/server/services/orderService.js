import prisma from './db.js';
import * as CreditsService from './creditsService.js';

async function createOrder(userId, type, product, amount, credits, paymentMethod = null) {
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  const expireAt = new Date(Date.now() + 30 * 60 * 1000);

  const order = await prisma.order.create({
    data: {
      orderId,
      userId,
      type,
      product,
      amount,
      credits,
      paymentMethod,
      paymentStatus: 'pending',
      expireAt
    }
  });

  return order;
}

async function getOrder(orderId) {
  return prisma.order.findUnique({ where: { orderId }, include: { user: true } });
}

async function getOrderByTransactionId(transactionId) {
  return prisma.order.findFirst({ where: { transactionId } });
}

async function updateOrderStatus(orderId, status, transactionId = null) {
  return prisma.order.update({
    where: { orderId },
    data: {
      paymentStatus: status,
      transactionId,
      paidAt: status === 'paid' ? new Date() : undefined,
      updatedAt: new Date()
    }
  });
}

async function handlePaymentSuccess(orderId, transactionId) {
  const order = await getOrder(orderId);
  if (!order) throw new Error('订单不存在');
  if (order.paymentStatus === 'paid') return { alreadyPaid: true, order };

  return prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { orderId },
      data: { paymentStatus: 'paid', transactionId, paidAt: new Date() }
    });

    const user = await tx.user.findUnique({ where: { id: order.userId } });
    const newBalance = Math.round((user.credits + order.credits) * 10000) / 10000;
    await tx.user.update({
      where: { id: order.userId },
      data: { credits: newBalance }
    });

    await tx.transaction.create({
      data: {
        userId: order.userId,
        type: 'recharge',
        amount: order.credits,
        balance: newBalance,
        description: `充值 ${order.credits} 算力 (${order.product})`,
        relatedId: orderId
      }
    });

    return { success: true, balance: newBalance, orderId };
  });
}

async function getUserOrders(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where: { userId } })
  ]);
  return { orders, total, page, limit };
}

async function cancelExpiredOrders() {
  const result = await prisma.order.updateMany({
    where: {
      paymentStatus: 'pending',
      expireAt: { lt: new Date() }
    },
    data: { paymentStatus: 'expired' }
  });
  return result.count;
}

export {
  createOrder,
  getOrder,
  getOrderByTransactionId,
  updateOrderStatus,
  handlePaymentSuccess,
  getUserOrders,
  cancelExpiredOrders
};
