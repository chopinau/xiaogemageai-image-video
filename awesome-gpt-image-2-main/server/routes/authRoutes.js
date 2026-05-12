import { Router } from 'express';
import * as AuthService from '../services/authService.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

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
    const result = await AuthService.register(email, password, nickname);
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

export default router;
