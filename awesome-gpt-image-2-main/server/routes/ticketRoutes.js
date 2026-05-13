import express from 'express';
import * as TicketService from '../services/ticketService.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import prisma from '../services/db.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, title, message } = req.body;
    if (!category || !title) return res.status(400).json({ success: false, error: '请填写分类和标题' });

    const ticket = await TicketService.createTicket(req.user.id, category, title, message || null);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;
    const result = await TicketService.getUserTickets(req.user.id, page, limit, status);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await TicketService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await TicketService.getTicketDetail(parseInt(req.params.id), req.user.id, false);
    if (!ticket) return res.status(404).json({ success: false, error: '工单不存在' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    if (!content) return res.status(400).json({ success: false, error: '消息内容不能为空' });

    const message = await TicketService.addMessage(
      parseInt(req.params.id),
      req.user.id,
      'user',
      content,
      attachments
    );
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) return res.status(400).json({ success: false, error: '无效状态' });

    const ticket = await TicketService.updateTicketStatus(parseInt(req.params.id), status, req.user.id, false);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {
      status: req.query.status || null,
      category: req.query.category || null,
      priority: req.query.priority || null,
      search: req.query.search || null,
    };
    const result = await TicketService.getAllTickets(page, limit, filters);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await TicketService.getTicketStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ticket = await TicketService.getTicketDetail(parseInt(req.params.id), null, true);
    if (!ticket) return res.status(404).json({ success: false, error: '工单不存在' });
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/:id/messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    if (!content) return res.status(400).json({ success: false, error: '消息内容不能为空' });

    const message = await TicketService.addMessage(
      parseInt(req.params.id),
      req.user.id,
      'admin',
      content,
      attachments
    );
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/admin/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status, priority } = req.body;
    if (!status && !priority) return res.status(400).json({ success: false, error: '请提供更新内容' });

    const ticket = await TicketService.updateTicketStatus(parseInt(req.params.id), status, req.user.id, true);
    if (priority) {
      await prisma.ticket.update({ where: { id: parseInt(req.params.id) }, data: { priority } });
    }
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/admin/:id/assign', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ticket = await TicketService.assignTicket(parseInt(req.params.id), req.user.id);
    res.json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
