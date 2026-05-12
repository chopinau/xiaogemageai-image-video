import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import * as UsageService from '../services/usageService.js';
import prisma from '../services/db.js';

const router = Router();

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await UsageService.getUserStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const records = await prisma.usageRecord.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    const total = await prisma.usageRecord.count({ where: { userId: req.user.id } });
    res.json({ success: true, data: { entries: records, total, page, limit } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/daily', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await UsageService.getDailyStats(days);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/models', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const data = await UsageService.getModelStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
