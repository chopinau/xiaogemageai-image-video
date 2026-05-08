export const PAYMENT_METHODS = {
  wechat: {
    id: 'wechat',
    name: '微信支付',
    icon: '💬',
    enabled: true,
    supportedProducts: ['membership', 'credits']
  },
  alipay: {
    id: 'alipay',
    name: '支付宝',
    icon: '🔵',
    enabled: true,
    supportedProducts: ['membership', 'credits']
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe (信用卡/PayPal)',
    icon: '💳',
    enabled: true,
    supportedProducts: ['membership', 'credits']
  }
};

export const ORDER_TYPES = {
  membership: 'membership',
  credits: 'credits'
};

export const ORDER_STATUS = {
  pending: '待支付',
  paid: '已支付',
  failed: '支付失败',
  refunded: '已退款',
  cancelled: '已取消'
};

export async function createOrder(authHeaders, { type, productId, paymentMethod, amount, currency = 'CNY' }) {
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ type, productId, paymentMethod, amount, currency })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '创建订单失败');
  return data;
}

export async function checkPaymentStatus(authHeaders, orderId) {
  const response = await fetch(`/api/payment/orders/${orderId}`, { headers: authHeaders });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '查询失败');
  return data;
}

export async function getOrders(authHeaders, page = 1, limit = 20) {
  const response = await fetch(`/api/payment/orders?page=${page}&limit=${limit}`, { headers: authHeaders });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '查询失败');
  return data;
}

export async function requestRefund(authHeaders, orderId, reason) {
  const response = await fetch(`/api/payment/refund/${orderId}`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || '退款申请失败');
  return data;
}
