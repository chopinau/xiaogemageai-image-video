import express from 'express';
import WechatPayService from '../services/wechatPayService.js';
import AlipayService from '../services/alipayService.js';
import * as PricingEngine from '../services/pricingEngine.js';
import * as CreditsService from '../services/creditsService.js';
import * as OrderService from '../services/orderService.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const wechatPay = new WechatPayService();
const alipayService = new AlipayService();

router.post('/recharge/create', authMiddleware, async (req, res) => {
  try {
    const { packId, paymentMethod, amount, credits, type, planId } = req.body;
    const userId = req.user.id;

    if (!paymentMethod) return res.status(400).json({ success: false, error: '请选择支付方式' });

    let orderAmount = amount;
    let orderCredits = credits || 0;
    let product = '算力充值';

    if (packId) {
      const packs = [
        { id: 'pack-10', credits: 10, price: 10, bonus: 0, label: '10算力包' },
        { id: 'pack-50', credits: 50, price: 50, bonus: 2, label: '50算力包' },
        { id: 'pack-200', credits: 200, price: 200, bonus: 10, label: '200算力包' },
        { id: 'pack-500', credits: 500, price: 500, bonus: 30, label: '500算力包' }
      ];
      const pack = packs.find(p => p.id === packId);
      if (!pack) return res.status(400).json({ success: false, error: '算力包不存在' });
      orderAmount = pack.price;
      orderCredits = pack.credits + pack.bonus;
      product = pack.label;
    } else if (type === 'membership' && planId) {
      const plans = { basic: 29, pro: 99, enterprise: 299 };
      orderAmount = plans[planId] || 0;
      orderCredits = 0;
      product = `${planId}会员订阅`;
    }

    if (!orderAmount || orderAmount <= 0) {
      return res.status(400).json({ success: false, error: '订单金额无效' });
    }

    const order = await OrderService.createOrder(userId, type || 'recharge', product, orderAmount, orderCredits, paymentMethod);

    let payResult;
    if (paymentMethod === 'wechat') {
      payResult = await wechatPay.createOrder({
        outTradeNo: order.orderId,
        description: product,
        amount: orderAmount,
        clientIp: req.ip
      });
    } else if (paymentMethod === 'alipay') {
      payResult = await alipayService.createWebOrder({
        outTradeNo: order.orderId,
        amount: orderAmount,
        subject: product,
        body: `充值 ${orderCredits} 算力`,
        userId
      });
    } else {
      return res.status(400).json({ success: false, error: '不支持的支付方式' });
    }

    if (payResult.success) {
      res.json({
        success: true,
        data: {
          orderId: order.orderId,
          payUrl: payResult.payUrl,
          qrCode: payResult.qrCode,
          amount: orderAmount,
          credits: orderCredits
        }
      });
    } else {
      await OrderService.updateOrderStatus(order.orderId, 'failed');
      res.status(500).json({ success: false, error: '创建支付订单失败', detail: payResult.error });
    }
  } catch (error) {
    console.error('[PaymentRoutes] Create recharge error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generation/pre-deduct', authMiddleware, async (req, res) => {
  try {
    const { type, model, params } = req.body;
    const userId = req.user.id;
    if (!type || !model) return res.status(400).json({ success: false, error: '缺少必要参数' });

    const cost = PricingEngine.calculateCost(type, model, params);
    if (cost <= 0) return res.status(400).json({ success: false, error: '无法计算费用' });

    const balance = await CreditsService.getBalance(userId);
    if (balance < cost) {
      return res.json({ success: false, error: '积分不足', currentBalance: balance, requiredAmount: cost, needRecharge: true });
    }

    const result = await CreditsService.preDeduct(userId, cost);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[PaymentRoutes] Pre-deduct error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generation/confirm', authMiddleware, async (req, res) => {
  try {
    const { deductionId } = req.body;
    if (!deductionId) return res.status(400).json({ success: false, error: '缺少预扣费ID' });
    const result = await CreditsService.confirmDeduct(deductionId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[PaymentRoutes] Confirm deduct error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generation/rollback', authMiddleware, async (req, res) => {
  try {
    const { deductionId } = req.body;
    if (!deductionId) return res.status(400).json({ success: false, error: '缺少预扣费ID' });
    const result = await CreditsService.rollbackDeduct(deductionId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[PaymentRoutes] Rollback deduct error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/wechat/notify', async (req, res) => {
  try {
    const body = req.body;
    const headers = req.headers;
    const isValid = wechatPay.verifyNotify(JSON.stringify(body), headers);
    if (!isValid) return res.status(400).json({ code: 'FAIL', message: '签名验证失败' });

    const decrypted = wechatPay.decryptNotify(body.resource.associated_data, body.resource.nonce, body.resource.ciphertext);
    const { out_trade_no, trade_state } = decrypted;

    if (trade_state === 'SUCCESS') {
      await OrderService.handlePaymentSuccess(out_trade_no, decrypted.transaction_id);
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
      await OrderService.handlePaymentSuccess(out_trade_no, body.trade_no);
    }
    res.send('success');
  } catch (error) {
    console.error('[PaymentRoutes] Alipay notify error:', error);
    res.send('fail');
  }
});

router.get('/credits/:userId', authMiddleware, async (req, res) => {
  try {
    const balance = await CreditsService.getBalance(req.user.id);
    res.json({ success: true, data: { balance } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/orders/:userId', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await OrderService.getUserOrders(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/orders/me', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await OrderService.getUserOrders(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
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
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

router.get('/transaction-history/:userId', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await CreditsService.getHistory(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

export default router;
