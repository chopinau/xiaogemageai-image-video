import { Router } from 'express';
import * as AuthService from '../services/authService.js';
import { authMiddleware, adminMiddleware, optionalAuth } from '../middleware/auth.js';
import prisma from '../services/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码至少6位' });
    }
    const agencyId = req.agency?.id || null;
    const result = await AuthService.register(email, password, nickname, agencyId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    }
    const result = await AuthService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: '刷新令牌不能为空' });
    }
    const tokens = await AuthService.refreshAccessToken(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await AuthService.getUserWithCredits(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, nickname: true, avatar: true, role: true, membership: true, credits: true, createdAt: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '请提供当前密码和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: '新密码至少6位' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: '当前密码不正确' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash },
    });
    res.json({ success: true, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/api-key', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { apiKey: true },
    });
    res.json({ success: true, data: { apiKey: user?.apiKey || null } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api-key', authMiddleware, async (req, res) => {
  try {
    const apiKey = `sk-${crypto.randomBytes(24).toString('hex')}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { apiKey },
      select: { id: true, apiKey: true },
    });
    res.json({ success: true, data: { apiKey: user.apiKey } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({ success: false, error: '缺少 userId 或 role' });
    }
    if (!['user', 'agency'].includes(role)) {
      return res.status(400).json({ success: false, error: '角色只能是 user 或 agency' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    if (targetUser.role === 'admin') {
      return res.status(400).json({ success: false, error: '不能修改管理员角色' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, nickname: true, role: true, membership: true, credits: true, createdAt: true },
    });

    if (role === 'agency') {
      const existingAgency = await prisma.agency.findUnique({ where: { userId } });
      if (!existingAgency) {
        const slug = `agency-${userId}-${Date.now()}`;
        await prisma.agency.create({
          data: {
            userId,
            agencyName: `${updatedUser.nickname || updatedUser.email}的代理`,
            agencySlug: slug,
            subdomain: slug,
            status: 'active',
            markupType: 'percentage',
            markupValue: 20,
            minMarkup: 0.01,
            maxMarkup: 100,
          }
        });
      } else if (existingAgency.status === 'inactive') {
        await prisma.agency.update({ where: { id: existingAgency.id }, data: { status: 'active' } });
      }
    } else if (role === 'user') {
      const existingAgency = await prisma.agency.findUnique({ where: { userId } });
      if (existingAgency && existingAgency.status === 'active') {
        await prisma.agency.update({ where: { id: existingAgency.id }, data: { status: 'inactive' } });
      }
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'xiaomageai_secret_key_2024';
    const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
    const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

    const accessToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    const refreshToken = jwt.sign(
      { userId: updatedUser.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES }
    );

    res.json({
      success: true,
      data: {
        user: updatedUser,
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? {
      OR: [
        { email: { contains: search } },
        { nickname: { contains: search } },
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: { id: true, email: true, nickname: true, role: true, membership: true, credits: true, totalSpent: true, status: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { users, total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
