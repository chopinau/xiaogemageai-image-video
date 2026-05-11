import express from 'express';
import WechatPayService from '../services/wechatPayService.js';
import AlipayService from '../services/alipayService.js';
import * as PricingEngine from '../services/pricingEngine.js';
import CreditsManager from '../services/creditsManager.js';
import PaymentOrderManager from '../services/paymentOrderManager.js';

const router = express.Router();

const wechatPay = new WechatPayService();
const alipayService = new AlipayService();

const userCreditsStore = {
  data: {},
  async get(userId) { return this.data[userId] || { balance: 0, monthlyCredits: 0, bonusCredits: 0, pendingDeductions: [] }; },
  async set(userId, data) { this.data[userId] = data; },
  async update(userId, updates) {
    if (!this.data[userId]) this.data[userId] = { balance: 0, monthlyCredits: 0, bonusCredits: 0, pendingDeductions: [] };
    this.data[userId] = { ...this.data[userId], ...updates };
  }
};

const orderStore = {
  data: {},
  async get(orderId) { return this.data[orderId] || null; },
  async set(orderId, data) { this.data[orderId] = data; },
  async getAll() { return { ...this.data }; }
};

const creditsManager = new CreditsManager(userCreditsStore);
const paymentOrderManager = new PaymentOrderManager(orderStore);

router.post('/recharge/create', async (req, res) => {
  try {
    const { packId, paymentMethod, userId } = req.body;
    if (!packId || !paymentMethod || !userId) return res.status(400).json({ error: '缺少必要参数' });

    const pack = PricingEngine.getPackById(packId);
    if (!pack) return res.status(400).json({ error: '积分包不存在' });

    const totalCredits = pack.credits + (pack.bonus || 0);

    const orderResult = await paymentOrderManager.createOrder(userId, {
      type: 'recharge', paymentMethod, amount: pack.price, credits: totalCredits,
      bonus: pack.bonus || 0, description: pack.label, metadata: { packId }
    });

    if (!orderResult.success) return res.status(500).json({ error: '创建订单失败' });

    let payResult;
    if (paymentMethod === 'wechat') {
      payResult = await wechatPay.createOrder({ outTradeNo: orderResult.outTradeNo, description: pack.label, amount: pack.price, clientIp: req.ip });
    } else if (paymentMethod === 'alipay') {
      payResult = await alipayService.createWebOrder({ outTradeNo: orderResult.outTradeNo, amount: pack.price, subject: pack.label, body: `充值 ${totalCredits} 积分`, userId });
    } else {
      return res.status(400).json({ error: '不支持的支付方式' });
    }

    if (payResult.success) {
      await paymentOrderManager.updateOrderStatus(orderResult.orderId, 'pending', { payUrl: payResult.payUrl, qrCode: payResult.qrCode });
      res.json({ success: true, orderId: orderResult.orderId, outTradeNo: orderResult.outTradeNo, payUrl: payResult.payUrl, qrCode: payResult.qrCode, pack, totalCredits });
    } else {
      res.status(500).json({ error: '创建支付订单失败', detail: payResult.error });
    }
  } catch (error) {
    console.error('[PaymentRoutes] Create recharge error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generation/pre-deduct', async (req, res) => {
  try {
    const { userId, type, model, params } = req.body;
    if (!userId || !type || !model) return res.status(400).json({ error: '缺少必要参数' });

    const cost = PricingEngine.calculateCost(type, model, params);
    if (cost <= 0) return res.status(400).json({ error: '无法计算费用' });

    const userCredits = await creditsManager.getUserCredits(userId);
    if (userCredits.total < cost) {
      return res.json({ success: false, error: '积分不足', currentBalance: userCredits.total, requiredAmount: cost, needRecharge: true });
    }

    const result = await creditsManager.preDeduct(userId, cost, `${type}生成 - ${model}`, `${type}_${model}_${Date.now()}`);
    res.json(result);
  } catch (error) {
    console.error('[PaymentRoutes] Pre-deduct error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generation/confirm', async (req, res) => {
  try {
    const { deductionId } = req.body;
    if (!deductionId) return res.status(400).json({ error: '缺少预扣费ID' });
    const result = await creditsManager.confirmDeduct(deductionId);
    res.json(result);
  } catch (error) {
    console.error('[PaymentRoutes] Confirm deduct error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generation/rollback', async (req, res) => {
  try {
    const { deductionId } = req.body;
    if (!deductionId) return res.status(400).json({ error: '缺少预扣费ID' });
    const result = await creditsManager.rollbackDeduct(deductionId);
    res.json(result);
  } catch (error) {
    console.error('[PaymentRoutes] Rollback deduct error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/wechat/notify', async (req, res) => {
  try {
    const body = req.body;
    const headers = req.headers;

    const isValid = wechatPay.verifyNotify(JSON.stringify(body), headers);
    if (!isValid) return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });

    const decrypted = wechatPay.decryptNotify(body.resource.associated_data, body.resource.nonce, body.resource.ciphertext);
    const { out_trade_no, trade_state, amount } = decrypted;

    if (trade_state === 'SUCCESS') {
      const order = await paymentOrderManager.getOrderByOutTradeNo(out_trade_no);
      if (order && order.status === 'pending') {
        await paymentOrderManager.updateOrderStatus(order.id, 'paid', { transactionId: decrypted.transaction_id, paidAmount: amount.total / 100 });
        await creditsManager.addCredits(order.userId, order.credits, `支付成功 - ${order.description}`, 'recharge');
      }
    }

    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (error) {
    console.error('[PaymentRoutes] Wechat notify error:', error);
    res.json({ code: 'FAIL', message: error.message });
  }
});

router.post('/alipay/notify', async (req, res) => {
  try {
    const body = req.body;
    const isValid = alipayService.verifyNotify(JSON.stringify(body));
    if (!isValid) return res.status(400).send('fail');

    const { out_trade_no, trade_status } = body;

    if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
      const order = await paymentOrderManager.getOrderByOutTradeNo(out_trade_no);
      if (order && order.status === 'pending') {
        await paymentOrderManager.updateOrderStatus(order.id, 'paid', { tradeNo: body.trade_no, paidAmount: parseFloat(body.total_amount) });
        await creditsManager.addCredits(order.userId, order.credits, `支付成功 - ${order.description}`, 'recharge');
      }
    }

    res.send('success');
  } catch (error) {
    console.error('[PaymentRoutes] Alipay notify error:', error);
    res.send('fail');
  }
});

router.get('/credits/:userId', async (req, res) => {
  try {
    const credits = await creditsManager.getUserCredits(req.params.userId);
    res.json({ success: true, data: credits });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/orders/:userId', async (req, res) => {
  try {
    const orders = await paymentOrderManager.getUserOrders(req.params.userId, {
      page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, status: req.query.status
    });
    res.json({ success: true, data: orders });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/pricing', async (req, res) => {
  try {
    const { type, model, resolution, duration, count } = req.query;
    if (type && model) {
      const cost = PricingEngine.calculateCost(type, model, {
        resolution, duration: duration ? parseInt(duration) : undefined, count: count ? parseInt(count) : undefined
      });
      res.json({ success: true, cost, type, model });
    } else {
      const models = PricingEngine.getAllModels();
      res.json({ success: true, data: models });
    }
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/pricing/update', async (req, res) => {
  try {
    const { category, modelId, resolution, price } = req.body;
    const success = PricingEngine.updateModelPrice(category, modelId, resolution, price);
    if (success) res.json({ success: true, message: '价格更新成功' });
    else res.status(400).json({ error: '更新失败' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/transaction-history/:userId', async (req, res) => {
  try {
    const history = await creditsManager.getTransactionHistory(req.params.userId, {
      page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, type: req.query.type
    });
    res.json({ success: true, data: history });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
