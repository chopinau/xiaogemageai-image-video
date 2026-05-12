import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ai_saas_jwt_secret_key_change_in_production_2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const INITIAL_CREDITS = 2.0;

async function register(email, password, nickname = '') {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('该邮箱已注册');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const referralCode = `REF${Date.now().toString(36).toUpperCase()}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname: nickname || email.split('@')[0],
      credits: INITIAL_CREDITS,
      referralCode,
      status: 'active'
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: 'bonus',
      amount: INITIAL_CREDITS,
      balance: user.credits,
      description: '新注册赠送算力'
    }
  });

  const tokens = generateTokens(user);
  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('邮箱或密码错误');
  }

  if (user.status === 'banned') {
    throw new Error('账号已被封禁，请联系管理员');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('邮箱或密码错误');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  const tokens = generateTokens(user);
  return {
    user: sanitizeUser(user),
    ...tokens
  };
}

function generateTokens(user) {
  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: user.id, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function refreshAccessToken(refreshToken) {
  const decoded = verifyToken(refreshToken);
  if (!decoded || decoded.type !== 'refresh') {
    throw new Error('无效的刷新令牌');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || user.status === 'banned') {
    throw new Error('用户不存在或已被封禁');
  }

  const tokens = generateTokens(user);
  return tokens;
}

async function getUser(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return sanitizeUser(user);
}

async function getUserWithCredits(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    ...sanitizeUser(user),
    credits: user.credits,
    totalSpent: user.totalSpent,
    membership: user.membership,
    membershipExpire: user.membershipExpire
  };
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export {
  register,
  login,
  verifyToken,
  refreshAccessToken,
  getUser,
  getUserWithCredits,
  generateTokens,
  sanitizeUser
};
