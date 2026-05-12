import * as AuthService from '../services/authService.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: '无效的认证令牌' });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: '令牌已过期或无效' });
  }

  req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
  next();
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  next();
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    if (decoded) {
      req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };
    }
  }
  next();
}
