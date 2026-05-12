# AI SaaS 后端接入文档

## 一、系统概述

本项目是一个AI图片/视频生成平台的后端服务，基于 Node.js + Express + Prisma + SQLite/MySQL 构建。

**核心功能模块**：
- 用户认证（JWT）
- 积分/算力管理
- 支付系统（微信/支付宝）
- AI模型调用（图片/视频/文字生成）
- 使用统计与消费核算

---

## 二、环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.x | 推荐 LTS 版本 |
| npm | >= 10.x | 包管理器 |
| MySQL | >= 8.0（生产） | 或 SQLite（开发） |
| Prisma | 6.x | ORM框架 |

---

## 三、快速开始

### 3.1 代码拉取

```bash
# 进入项目目录
cd d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main

# 安装后端依赖
cd server
npm install
```

### 3.2 数据库配置

**开发环境（SQLite，零配置）**：
```bash
# 初始化Prisma并运行迁移
npx prisma migrate dev --name init

# 生成初始数据（管理员账号等）
node prisma/seed.js
```

**生产环境（MySQL）**：

1. 修改 `server/prisma/schema.prisma`：
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

2. 修改 `server/.env`：
```env
DATABASE_URL="mysql://用户名:密码@数据库IP:3306/ai_saas"
```

3. 运行迁移：
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 3.3 启动服务

```bash
# 开发模式
node server.js

# 或使用PM2（生产环境）
npm install pm2 -g
pm2 start server.js --name ai-saas
pm2 save
pm2 startup
```

### 3.4 验证服务

```bash
curl http://localhost:3000/api/health
# 预期输出：{"status":"ok","timestamp":1234567890}
```

---

## 四、配置说明

### 4.1 .env 文件配置

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库（SQLite或MySQL）
DATABASE_URL="file:./dev.db"  # SQLite
# DATABASE_URL="mysql://ai_saas:password@localhost:3306/ai_saas"  # MySQL

# JWT配置
JWT_SECRET=your_strong_secret_key_here_至少32位
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Lingke API（上游AI服务）
LINGKE_API_KEY=sk-your-lingke-api-key
LINGKE_BASE_URL=https://lingkeapi.com

# 微信支付（可选，需配置真实密钥）
WECHAT_MCH_ID=
WECHAT_APP_ID=
WECHAT_API_V3_KEY=
WECHAT_NOTIFY_URL=https://your-domain.com/api/payments/wechat/notify

# 支付宝（可选，需配置真实密钥）
ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_NOTIFY_URL=https://your-domain.com/api/payments/alipay/notify

# 管理后台密钥
ADMIN_KEY=admin123

# 自动同步配置
TASK_POLL_INTERVAL=3000
TASK_MAX_POLL_ATTEMPTS=100
TASK_TIMEOUT=300000
```

### 4.2 配置项说明

| 配置项 | 必填 | 说明 |
|--------|------|------|
| PORT | 否 | 服务端口，默认3000 |
| NODE_ENV | 否 | 环境标识，production启用优化 |
| DATABASE_URL | 是 | 数据库连接字符串 |
| JWT_SECRET | 是 | JWT签名密钥，生产环境务必更换 |
| LINGKE_API_KEY | 是 | 上游AI服务密钥 |
| WECHAT_* | 否 | 微信支付配置，不配置则走模拟模式 |
| ALIPAY_* | 否 | 支付宝配置，不配置则走模拟模式 |
| ADMIN_KEY | 是 | 管理后台API认证密钥 |

---

## 五、API接口文档

### 5.1 认证接口

#### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户名"（可选）
}

返回：
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "...", "credits": 2.0 },
    "accessToken": "JWT_TOKEN",
    "refreshToken": "REFRESH_TOKEN"
  }
}
```

#### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

返回：同上
```

#### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "用户名",
    "role": "user",
    "membership": "free",
    "credits": 2.0,
    "totalSpent": 0
  }
}
```

#### 刷新Token
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "REFRESH_TOKEN"
}

返回：
{
  "success": true,
  "data": {
    "accessToken": "NEW_JWT_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN"
  }
}
```

---

### 5.2 积分接口

#### 查询余额
```
GET /api/credits/balance
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": { "balance": 2.0 }
}
```

#### 扣减积分
```
POST /api/credits/deduct
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "amount": 0.05,
  "description": "图片生成",
  "relatedId": "请求ID"（可选）
}

返回：
{
  "success": true,
  "data": { "balance": 1.95, "deducted": 0.05 }
}
```

#### 签到
```
POST /api/credits/check-in
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": { "success": true, "message": "签到成功", "reward": 0.02, "balance": 2.02 }
}
```

#### 交易历史
```
GET /api/credits/history?page=1&limit=20
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": {
    "entries": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

### 5.3 支付接口

#### 创建充值订单
```
POST /api/payments/recharge/create
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "packId": "pack-10",  // pack-10/pack-50/pack-200/pack-500
  "paymentMethod": "wechat"  // wechat/alipay
}

返回：
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "payUrl": "微信支付URL",
    "qrCode": "二维码链接",
    "amount": 10,
    "credits": 10
  }
}
```

#### 查询订单
```
GET /api/payments/orders/{userId}
Authorization: Bearer JWT_TOKEN

返回：订单列表
```

---

### 5.4 AI生成接口

#### 图片生成
```
POST /api/image/generate
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "prompt": "一只可爱的猫",
  "model": "gpt-image-2",
  "params": {
    "resolution": "1024x1024",
    "count": 1
  }
}

返回：
{
  "success": true,
  "data": {
    "images": ["https://xxx/image.jpg"],
    "cost": 0.05
  }
}
```

#### 视频生成
```
POST /api/video/generate
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "prompt": "一只猫在跳舞",
  "model": "kling-v3-video",
  "params": {
    "duration": 5
  }
}

返回：
{
  "success": true,
  "data": {
    "videoUrl": "https://xxx/video.mp4",
    "cost": 0.1
  }
}
```

---

### 5.5 管理后台接口

#### 获取仪表盘数据
```
GET /api/pricing-admin/dashboard
X-Admin-Key: admin123

返回：
{
  "success": true,
  "data": {
    "totalModels": 15,
    "providers": 1,
    "totalDailyRequests": 100,
    "totalDailySpent": 5.0,
    "activeUsers": 10,
    "defaultMarkup": 15,
    "topModels": [...],
    "circuitBreakerAlerts": []
  }
}
```

#### 获取上游供应商健康状态
```
GET /api/pricing-admin/upstream/health
X-Admin-Key: admin123

返回：供应商健康状态列表
```

---

## 六、腾讯云轻量服务器部署指南

### 6.1 服务器配置要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 硬盘 | 20GB | 40GB SSD |
| 带宽 | 1Mbps | 3Mbps |

### 6.2 部署步骤

```bash
# 1. 安装依赖
sudo apt update && sudo apt install -y nodejs npm mysql-server nginx certbot python3-certbot-nginx

# 2. 配置MySQL
sudo mysql -u root -p
CREATE DATABASE ai_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ai_saas'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ai_saas.* TO 'ai_saas'@'localhost';
FLUSH PRIVILEGES;

# 3. 上传代码（使用git或FTP）
mkdir -p /var/www/ai-saas
cd /var/www/ai-saas
git clone <你的仓库地址> .

# 4. 安装依赖
cd server
npm install

# 5. 配置.env
nano .env
# 修改DATABASE_URL为MySQL连接串

# 6. 运行迁移
npx prisma migrate deploy
npx prisma db seed

# 7. 配置PM2
npm install pm2 -g
pm2 start server.js --name ai-saas
pm2 save
pm2 startup

# 8. 配置Nginx反向代理
nano /etc/nginx/sites-available/ai-saas
```

### 6.3 Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # SSL配置（使用Certbot自动生成）
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

---

## 七、目录结构

```
server/
├── generated/              # Prisma生成的客户端代码
├── middleware/             # 中间件
│   ├── auth.js             # JWT认证中间件
│   └── rateLimit.js        # 限流中间件
├── prisma/                 # Prisma配置
│   ├── schema.prisma       # 数据库Schema
│   └── seed.js             # 初始数据
├── routes/                 # API路由
│   ├── authRoutes.js       # 认证接口
│   ├── creditsRoutes.js    # 积分接口
│   ├── imageRoutes.js      # 图片生成接口
│   ├── paymentRoutes.js    # 支付接口
│   ├── pricingAdminRoutes.js # 管理后台接口
│   └── usageRoutes.js      # 使用统计接口
├── services/               # 业务服务
│   ├── authService.js      # 认证服务
│   ├── creditsService.js   # 积分服务
│   ├── db.js               # Prisma客户端
│   ├── orderService.js     # 订单服务
│   └── usageService.js     # 使用统计服务
├── .env                    # 环境变量配置
├── package.json            # 项目依赖
└── server.js               # 服务入口
```

---

## 八、安全注意事项

1. **JWT_SECRET**：生产环境务必使用至少32位的随机字符串
2. **数据库密码**：不要硬编码，使用环境变量
3. **API密钥**：LingkeAPI密钥等敏感信息使用环境变量
4. **HTTPS**：生产环境必须启用HTTPS
5. **输入验证**：所有API输入参数必须验证
6. **日志**：记录关键操作日志，定期备份
7. **防火墙**：只开放必要端口（3000/80/443）

---

## 九、故障排查

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据库连接失败 | DATABASE_URL配置错误 | 检查连接字符串格式 |
| JWT验证失败 | JWT_SECRET不匹配 | 确保前后端使用相同密钥 |
| 生成失败 | LingkeAPI密钥错误 | 检查LINGKE_API_KEY |
| 支付失败 | 支付密钥未配置 | 配置WECHAT_*或ALIPAY_* |
| 端口占用 | 3000端口已被占用 | 更换PORT或停止占用进程 |

### 日志查看

```bash
# 查看PM2日志
pm2 logs ai-saas

# 查看最近日志
pm2 logs ai-saas --lines 100

# 实时日志
pm2 logs ai-saas --watch
```

---

## 十、维护与更新

### 代码更新流程

```bash
cd /var/www/ai-saas/server
git pull origin main
npm install
npx prisma migrate deploy
pm2 restart ai-saas
```

### 数据库备份

```bash
# MySQL备份
mysqldump -u ai_saas -p ai_saas > backup_$(date +%Y%m%d).sql

# SQLite备份
cp dev.db backup_$(date +%Y%m%d).db
```

---

## 附录：预设账号

| 账号 | 密码 | 角色 | 初始算力 |
|------|------|------|----------|
| admin@ai.com | admin123 | 管理员 | 9999 |
| test@ai.com | test123 | 普通用户 | 100 |
| demo@ai.com | demo123 | 普通用户 | 50 |

---

**文档版本**: v1.0  
**创建日期**: 2026-05-12  
**适用版本**: awesome-gpt-image-2-main v2.0