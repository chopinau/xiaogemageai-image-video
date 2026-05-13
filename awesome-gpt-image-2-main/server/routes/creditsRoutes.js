import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as CreditsService from '../services/creditsService.js';

const CREDITS_PACKS = [
  { id: 'pack-10', credits: 10, price: 10, bonus: 0, label: '10 算力' },
  { id: 'pack-50', credits: 50, price: 50, bonus: 2, label: '50 算力' },
  { id: 'pack-200', credits: 200, price: 200, bonus: 10, label: '200 算力' },
  { id: 'pack-500', credits: 500, price: 500, bonus: 30, label: '500 算力' }
];

const router = Router();

router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const balance = await CreditsService.getBalance(req.user.id);
    res.json({ success: true, data: { balance } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/deduct', authMiddleware, async (req, res) => {
  try {
    const { amount, description, relatedId } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: '扣减金额必须大于0' });
    }
    const result = await CreditsService.deduct(req.user.id, amount, description || '消费扣减', relatedId);
    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.message === '余额不足' ? 402 : 400;
    res.status(status).json({ success: false, error: err.message, needRecharge: err.message === '余额不足' });
  }
});

router.post('/check-in', authMiddleware, async (req, res) => {
  try {
    const result = await CreditsService.checkIn(req.user.id);
    res.json({ success: result.success, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await CreditsService.getHistory(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/packs', (req, res) => {
  res.json({ success: true, data: CREDITS_PACKS });
});

export default router;
