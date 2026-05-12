import express from 'express';
import * as PaymentConfigService from '../services/paymentConfigService.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const configs = await PaymentConfigService.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs)) return res.status(400).json({ success: false, error: '无效的配置数据' });

    const results = await PaymentConfigService.updateConfigs(configs);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/public', async (req, res) => {
  try {
    const configs = await PaymentConfigService.getPublicConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/packs', async (req, res) => {
  try {
    const packs = await PaymentConfigService.getPackConfig();
    res.json({ success: true, data: packs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/initialize', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await PaymentConfigService.initializeDefaults();
    const configs = await PaymentConfigService.getAllConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
