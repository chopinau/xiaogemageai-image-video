import crypto from 'crypto';

class PaymentOrderManager {
  constructor(orderStore) {
    this.orderStore = orderStore;
  }

  async createOrder(userId, orderData) {
    const orderId = `order_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const outTradeNo = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const order = {
      id: orderId, outTradeNo, userId, type: orderData.type || 'recharge', paymentMethod: orderData.paymentMethod,
      amount: orderData.amount, currency: 'CNY', credits: orderData.credits, bonus: orderData.bonus || 0,
      status: 'pending', description: orderData.description || `积分充值 ${orderData.credits}`,
      payUrl: null, qrCode: null, createdAt: Date.now(), expiresAt: Date.now() + 1800000,
      paidAt: null, refundedAt: null, refundAmount: 0, metadata: orderData.metadata || {}
    };

    await this.orderStore.set(orderId, order);
    return { success: true, order, orderId, outTradeNo };
  }

  async updateOrderStatus(orderId, status, extraData = {}) {
    const order = await this.orderStore.get(orderId);
    if (!order) return { success: false, error: '订单不存在' };

    const updatedOrder = { ...order, status, ...extraData };
    if (status === 'paid') updatedOrder.paidAt = Date.now();
    else if (status === 'refunded') { updatedOrder.refundedAt = Date.now(); updatedOrder.refundAmount = extraData.refundAmount || order.amount; }
    else if (status === 'cancelled' || status === 'expired') updatedOrder.cancelledAt = Date.now();

    await this.orderStore.set(orderId, updatedOrder);
    return { success: true, order: updatedOrder };
  }

  async getOrder(orderId) { return await this.orderStore.get(orderId); }

  async getOrderByOutTradeNo(outTradeNo) {
    const allOrders = await this.orderStore.getAll();
    return Object.values(allOrders).find(o => o.outTradeNo === outTradeNo);
  }

  async getUserOrders(userId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    const allOrders = await this.orderStore.getAll();
    const userOrders = Object.values(allOrders)
      .filter(o => o.userId === userId)
      .filter(o => !status || o.status === status)
      .sort((a, b) => b.createdAt - a.createdAt);

    const start = (page - 1) * limit;
    const paginated = userOrders.slice(start, start + limit);
    return { orders: paginated, total: userOrders.length, page, limit, totalPages: Math.ceil(userOrders.length / limit) };
  }

  async cancelOrder(orderId) {
    const order = await this.orderStore.get(orderId);
    if (!order) return { success: false, error: '订单不存在' };
    if (order.status !== 'pending') return { success: false, error: `订单状态为 ${order.status}，无法取消` };
    return await this.updateOrderStatus(orderId, 'cancelled');
  }

  async cleanupExpiredOrders() {
    const allOrders = await this.orderStore.getAll();
    const now = Date.now();
    let cleanedCount = 0;
    for (const [id, order] of Object.entries(allOrders)) {
      if (order.status === 'pending' && now > order.expiresAt) {
        await this.updateOrderStatus(id, 'expired');
        cleanedCount++;
      }
    }
    return { cleanedCount };
  }

  async refundOrder(orderId, refundAmount, reason) {
    const order = await this.orderStore.get(orderId);
    if (!order) return { success: false, error: '订单不存在' };
    if (order.status !== 'paid') return { success: false, error: '只有已支付订单才能退款' };
    const actualRefundAmount = Math.min(refundAmount || order.amount, order.amount);
    return await this.updateOrderStatus(orderId, 'refunded', { refundAmount: actualRefundAmount, refundReason: reason });
  }
}

export default PaymentOrderManager;
