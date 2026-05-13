import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import * as AgencyService from '../services/agencyService.js';
import * as RevenueService from '../services/agencyRevenueService.js';
import * as WithdrawalService from '../services/agencyWithdrawalService.js';
import { clearAgencyCache } from '../middleware/agencyResolver.js';

const router = Router();

router.get('/config', async (req, res) => {
  try {
    const agency = req.agency;
    if (!agency) {
      return res.json({
        success: true,
        data: {
          isAgency: false,
          agencyName: '小马AI',
          logoUrl: null,
          primaryColor: '#42e6ff',
          heroTitle: 'AI 创作工作台',
          heroSubtitle: '一站式图片 & 视频创作，多模型自由切换'
        }
      });
    }

    const brandConfig = agency.brandConfig || {};
    res.json({
      success: true,
      data: {
        isAgency: true,
        agencyId: agency.id,
        agencyName: agency.agencyName,
        agencySlug: agency.agencySlug,
        logoUrl: agency.logoUrl,
        primaryColor: agency.primaryColor,
        description: agency.description,
        heroTitle: brandConfig.heroTitle || `${agency.agencyName} - AI创作平台`,
        heroSubtitle: brandConfig.heroSubtitle || '一站式图片 & 视频创作，多模型自由切换',
        footerText: brandConfig.footerText,
        hidePoweredBy: brandConfig.hidePoweredBy || false,
        enabledModels: brandConfig.enabledModels ? JSON.parse(brandConfig.enabledModels) : null,
        disabledFeatures: brandConfig.disabledFeatures ? JSON.parse(brandConfig.disabledFeatures) : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/pricing', async (req, res) => {
  try {
    const agency = req.agency;
    if (!agency) {
      return res.json({ success: true, data: { hasAgencyMarkup: false } });
    }
    res.json({
      success: true,
      data: {
        hasAgencyMarkup: true,
        markupType: agency.markupType,
        markupValue: agency.markupValue,
        maxMarkup: agency.maxMarkup
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, agencyName, agencySlug, subdomain, primaryColor, markupType, markupValue, maxMarkup } = req.body;
    const agency = await AgencyService.createAgency(userId, {
      agencyName, agencySlug, subdomain, primaryColor, markupType, markupValue, maxMarkup
    });
    clearAgencyCache();
    res.json({ success: true, data: agency });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/admin/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agencies = await AgencyService.listAgencies(req.query);
    res.json({ success: true, data: agencies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agency = await AgencyService.updateAgency(parseInt(req.params.id), req.body);
    clearAgencyCache();
    res.json({ success: true, data: agency });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admin/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agency = await AgencyService.suspendAgency(parseInt(req.params.id));
    clearAgencyCache();
    res.json({ success: true, data: agency });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admin/:id/activate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agency = await AgencyService.activateAgency(parseInt(req.params.id));
    clearAgencyCache();
    res.json({ success: true, data: agency });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/admin/withdrawals', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await WithdrawalService.listWithdrawals(null, req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/withdrawals/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await WithdrawalService.approveWithdrawal(parseInt(req.params.id), req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admin/withdrawals/:id/complete', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const result = await WithdrawalService.completeWithdrawal(parseInt(req.params.id), transactionId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/admin/withdrawals/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await WithdrawalService.rejectWithdrawal(parseInt(req.params.id), req.user.id, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) {
      return res.status(404).json({ success: false, error: '代理商信息不存在' });
    }
    const stats = await AgencyService.getAgencyStats(agency.id);
    res.json({ success: true, data: { ...agency, stats } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/me/brand', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) return res.status(404).json({ success: false, error: '代理商信息不存在' });

    const { agencyName, logoUrl, primaryColor, description } = req.body;
    if (agencyName || logoUrl || primaryColor || description) {
      await AgencyService.updateAgency(agency.id, { agencyName, logoUrl, primaryColor, description });
    }

    const brandFields = ['heroTitle', 'heroSubtitle', 'footerText', 'ogImage', 'customCss', 'hidePoweredBy', 'enabledModels', 'disabledFeatures'];
    const brandData = {};
    for (const f of brandFields) {
      if (req.body[f] !== undefined) {
        brandData[f] = typeof req.body[f] === 'object' ? JSON.stringify(req.body[f]) : req.body[f];
      }
    }
    if (Object.keys(brandData).length > 0) {
      await AgencyService.updateBrandConfig(agency.id, brandData);
    }

    clearAgencyCache();
    const updated = await AgencyService.getAgencyByUserId(req.user.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.put('/me/markup', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) return res.status(404).json({ success: false, error: '代理商信息不存在' });

    const { markupType, markupValue } = req.body;
    if (markupValue !== undefined && agency.maxMarkup && markupValue > agency.maxMarkup) {
      return res.status(400).json({ success: false, error: `加价不能超过 ${agency.maxMarkup}%` });
    }

    await AgencyService.updateAgency(agency.id, { markupType, markupValue });
    clearAgencyCache();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/me/revenue', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) return res.status(404).json({ success: false, error: '代理商信息不存在' });

    const [records, summary] = await Promise.all([
      RevenueService.getRevenueRecords(agency.id, req.query),
      RevenueService.getRevenueSummary(agency.id, req.query.period)
    ]);
    res.json({ success: true, data: { records, summary } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/me/withdraw', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) return res.status(404).json({ success: false, error: '代理商信息不存在' });

    const { amount, method, accountInfo, accountName } = req.body;
    const withdrawal = await WithdrawalService.createWithdrawal(agency.id, amount, method, accountInfo, accountName);
    res.json({ success: true, data: withdrawal });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/me/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agency') {
      return res.status(403).json({ success: false, error: '非代理商账户' });
    }
    const agency = await AgencyService.getAgencyByUserId(req.user.id);
    if (!agency) return res.status(404).json({ success: false, error: '代理商信息不存在' });

    const users = await AgencyService.getAgencyUsers(agency.id, req.query.page, req.query.limit);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
