import express from 'express';
import * as NotificationService from '../services/notificationService.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await NotificationService.getUserNotifications(req.user.id, page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await NotificationService.markAsRead(parseInt(req.params.id), req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await NotificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/send', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, content, type, targetRole } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, error: '标题和内容不能为空' });

    let notification;
    if (targetRole === 'all' || !targetRole) {
      notification = await NotificationService.sendToAll(title, content, type || 'system', req.user.id);
    } else {
      notification = await NotificationService.sendToRole(targetRole, title, content, type || 'system', req.user.id);
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/history', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await NotificationService.getNotificationHistory(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
