# AI SaaS 后端接入文档

## 一、系统概述

本项目是一个AI图片/视频生成平台的后端服务，基于 Node.js + Express + Prisma + SQLite/MySQL 构建。

**核心功能模块**：
- 用户认证（JWT）
- 积分/算力管理
- 支付系统（微信/支付宝）
- AI模型调用（图片/视频/文字生成）
- 策略价格管理（经济/均衡/品质三档）
- 供应商健康监控与故障切换
- 客服工单系统
- 系统通知推送

---

## 二、技术架构

### 2.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React + Vite)                      │
│  CreativeHub │ UserDashboard │ AdminPage │ CreditsCenter        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP API
┌─────────────────────────────────────────────────────────────────┐
│                     API 网关层 (Express.js)                      │
│  authRoutes │ creditsRoutes │ imageRoutes │ videoRoutes        │
│  paymentRoutes │ ticketRoutes │ notificationRoutes             │
│  pricingAdminRoutes │ strategyRoutes │ usageRoutes             │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  服务层        │     │  业务逻辑层    │     │  外部服务层    │
│  db.js        │     │ pricingEngine │     │ lingkeClient  │
│  (Prisma)     │     │ creditsService│     │ wechatPay     │
│               │     │ orderService  │     │ alipayService │
│               │     │ ticketService │     │               │
│               │     │ notification  │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        数据存储层                                 │
│              SQLite (开发) │ MySQL (生产)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 服务依赖关系

```
server.js (入口)
    │
    ├── routes/authRoutes.js
    │       └── services/authService.js
    │               └── services/db.js (Prisma)
    │
    ├── routes/creditsRoutes.js
    │       └── services/creditsService.js
    │               └── services/db.js
    │
    ├── routes/paymentRoutes.js
    │       ├── services/orderService.js
    │       │       └── services/db.js
    │       ├── services/wechatPayService.js
    │       └── services/alipayService.js
    │
    ├── routes/imageRoutes.js
    │       ├── services/imageService.js
    │       │       ├── services/lingkeClient.js (上游API)
    │       │       ├── services/pricingEngine.js
    │       │       └── services/providerHealthMonitor.js
    │       └── services/creditsService.js
    │
    ├── routes/videoRoutes.js
    │       ├── services/videoService.js
    │       │       ├── services/lingkeClient.js
    │       │       ├── services/pricingEngine.js
    │       │       └── services/providerHealthMonitor.js
    │       └── services/creditsService.js
    │
    ├── routes/ticketRoutes.js
    │       └── services/ticketService.js
    │               └── services/db.js
    │
    ├── routes/notificationRoutes.js
    │       └── services/notificationService.js
    │               └── services/db.js
    │
    ├── routes/pricingAdminRoutes.js
    │       ├── services/pricingEngine.js
    │       ├── services/strategyConfigService.js
    │       └── services/providerHealthMonitor.js
    │
    ├── routes/strategyRoutes.js
    │       ├── services/strategyConfigService.js
    │       │       └── services/pricingEngine.js
    │       └── services/pricingEngine.js
    │
    └── routes/usageRoutes.js
            └── services/usageService.js
                    └── services/db.js
```

---

## 三、环境要求

| 依赖 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.x | 推荐 LTS 版本 |
| npm | >= 10.x | 包管理器 |
| MySQL | >= 8.0（生产） | 或 SQLite（开发） |
| Prisma | 6.x | ORM框架 |

---

## 四、快速开始

### 4.1 代码拉取

```bash
# 进入项目目录
cd d:\my-web-app\xiaogemageai image-video\awesome-gpt-image-2-main

# 安装后端依赖
cd server
npm install
```

### 4.2 数据库配置

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

### 4.3 启动服务

```bash
# 开发模式
node server.js

# 或使用PM2（生产环境）
npm install pm2 -g
pm2 start server.js --name ai-saas
pm2 save
pm2 startup
```

### 4.4 验证服务

```bash
curl http://localhost:3000/api/health
# 预期输出：{"status":"ok","timestamp":1234567890}
```

---

## 五、数据库模型详解

### 5.1 完整 Schema 定义

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"  // 或 "mysql"、"postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  passwordHash    String
  nickname        String    @default("")
  avatar          String?
  role            String    @default("user")      // user / admin
  membership      String    @default("free")       // free / basic / pro / enterprise
  membershipExpire DateTime?
  credits         Float     @default(0)            // 算力余额
  totalSpent      Float     @default(0)           // 累计消费
  apiKey          String?   @unique
  referralCode    String?   @unique
  referredBy      String?
  status          String    @default("active")    // active / banned
  lastLoginAt     DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  orders        Order[]
  transactions  Transaction[]
  usageRecords  UsageRecord[]
  checkIns      CheckIn[]
  tickets       Ticket[]
  notificationReads NotificationRead[]
}

// 订单表
model Order {
  id              Int       @id @default(autoincrement())
  orderId         String    @unique                // 唯一订单号
  userId          Int
  type            String                         // recharge / subscription
  product         String                         // pack-10 / pack-50 / monthly_basic 等
  amount          Float                          // 支付金额
  credits         Float     @default(0)           // 获得算力
  paymentMethod   String?                        // wechat / alipay
  paymentStatus   String    @default("pending")  // pending / paid / failed / expired
  transactionId   String?                        // 第三方交易号
  paidAt          DateTime?
  expireAt        DateTime?                     // 订单过期时间
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  user            User      @relation(fields: [userId], references: [id])
}

// 交易记录表
model Transaction {
  id          Int       @id @default(autoincrement())
  userId      Int
  type        String                         // deduction / recharge / refund / bonus
  amount      Float                          // 变动金额（正负）
  balance     Float                          // 变动后余额
  description String                         // 描述：图片生成、充值赠送等
  relatedId   String?                        // 关联ID：订单号、请求ID等
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
}

// 使用记录表
model UsageRecord {
  id          Int       @id @default(autoincrement())
  userId      Int
  type        String                         // image / video / text / detail
  model       String                         // gpt-image-2 / kling-v3 等
  cost        Float                          // 消耗算力
  duration    Int?                           // 视频时长（秒）
  resolution  String?                        // 分辨率：1024x1024 等
  status      String    @default("success")  // success / failed
  requestId   String?                        // 请求ID
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id])
}

// 签到记录表
model CheckIn {
  id        Int       @id @default(autoincrement())
  userId    Int
  reward    Float                          // 签到奖励
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id])

  @@unique([userId, createdAt])  // 每天只能签到一次
}

// 价格配置表
model PriceConfig {
  id            Int       @id @default(autoincrement())
  category      String                         // image / video / text
  modelId       String    @unique              // gpt-image-2:1024x1024
  basePrice     Float                          // 基础价格（上游成本）
  markupPercent Float     @default(15)          // 加价百分比
  active        Boolean   @default(true)        // 是否启用
  updatedAt     DateTime  @updatedAt
}

// 工单表
model Ticket {
  id          Int       @id @default(autoincrement())
  userId      Int
  category    String                         // technical / billing / feature / other
  title       String
  status      String    @default("open")     // open / pending / resolved / closed
  priority    String    @default("normal")   // low / normal / high / urgent
  assignedTo  Int?                           // 分配的客服用户ID
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  closedAt    DateTime?

  user        User      @relation(fields: [userId], references: [id])
  messages    TicketMessage[]
}

// 工单消息表
model TicketMessage {
  id          Int       @id @default(autoincrement())
  ticketId    Int
  senderId    Int?                           // 发送者用户ID
  senderType  String    @default("user")    // user / admin / system
  content     String
  attachments String?                       // JSON数组：["url1","url2"]
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())

  ticket      Ticket    @relation(fields: [ticketId], references: [id])
}

// 系统通知表
model Notification {
  id         Int       @id @default(autoincrement())
  title      String
  content    String
  type       String    @default("system")   // system / promotion / warning
  senderId   Int?                            // 发送者用户ID（管理员）
  targetRole String?                         // 发送目标角色：all / admin / user
  createdAt  DateTime  @default(now())

  readStatus NotificationRead[]
}

// 通知已读状态表
model NotificationRead {
  id             Int       @id @default(autoincrement())
  notificationId Int
  userId         Int
  isRead         Boolean   @default(false)
  readAt         DateTime?

  notification   Notification @relation(fields: [notificationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])

  @@unique([notificationId, userId])
}

// 支付配置表（存储微信/支付宝配置）
model PaymentConfig {
  id          Int       @id @default(autoincrement())
  key         String    @unique                // wechat_mch_id / alipay_app_id 等
  value       String                          // 配置值
  description String?
  updatedAt   DateTime  @updatedAt
}
```

### 5.2 表关系说明

```
User (1) ──────< Order (N)           // 一个用户有多个订单
User (1) ──────< Transaction (N)      // 一个用户有多条交易记录
User (1) ──────< UsageRecord (N)      // 一个用户有多条使用记录
User (1) ──────< CheckIn (N)         // 一个用户有多条签到记录（每天一条）
User (1) ──────< Ticket (N)          // 一个用户有多个工单
User (1) ──────< NotificationRead (N) // 一个用户有多条通知阅读记录

Ticket (1) ─────< TicketMessage (N)   // 一个工单有多条消息
Notification (1) ──< NotificationRead (N) // 一条通知可被多人阅读
```

### 5.3 核心字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| credits | Float | 用户算力余额 | 100.50 |
| totalSpent | Float | 用户累计消费金额 | 299.00 |
| membership | String | 会员等级 | free/basic/pro/enterprise |
| paymentStatus | String | 支付状态 | pending/paid/failed/expired |
| type (Transaction) | String | 交易类型 | deduction/recharge/refund/bonus |
| status (UsageRecord) | String | 使用状态 | success/failed |

---

## 六、核心业务逻辑详解

### 6.1 价格引擎 (pricingEngine.js)

**核心功能**：计算AI生成的最终售价

**价格计算公式**：
```
最终售价 = 上游基础价 × (1 + 加价百分比/100) × 分辨率系数
```

**加价策略**：
```javascript
STRATEGY_MARKUP = {
  economy: 0,      // 经济模式：零加价
  balanced: 15,    // 均衡模式：15%加价
  premium: 30      // 品质模式：30%加价
}
```

**核心函数**：
```javascript
// 计算单次生成成本
calculateSellingPrice(upstreamPrice, modelId, strategy)

// 批量更新价格
batchUpdatePrices(updates)

// 获取所有模型价格
getAllPricing()

// 获取特定模型的各策略价格
getStrategyPricing(modelId)
```

### 6.2 积分服务 (creditsService.js)

**核心功能**：管理用户算力的增减、预扣、回滚

**关键机制**：
- **原子性操作**：所有积分操作使用 Prisma 事务
- **预扣费机制**：生成前预扣，成功确认，失败回滚
- **超时回滚**：10分钟内未确认的预扣自动回滚

**核心函数**：
```javascript
// 查询余额
getBalance(userId)

// 扣减积分
deduct(userId, amount, description, relatedId)

// 增加积分
add(userId, amount, description, relatedId)

// 预扣费（用于生成前）
preDeduct(userId, amount)

// 确认预扣（生成成功后）
confirmDeduction(deductionId)

// 回滚预扣（生成失败后）
rollbackDeduction(deductionId)
```

**积分变化场景**：
| 场景 | 金额 | 说明 |
|------|------|------|
| 图片生成 | -0.05~0.20 | 根据模型和分辨率 |
| 视频生成 | -0.01~0.03 | 按秒计费 |
| 签到奖励 | +0.02 | 每日签到 |
| 充值 | +实际金额 | 购买算力包 |
| 充值赠送 | +bonus | 活动赠送 |

### 6.3 策略配置服务 (strategyConfigService.js)

**核心功能**：管理三个价格策略（economy/balanced/premium）的供应商配置

**数据结构**：
```javascript
{
  strategies: {
    economy: {
      name: "经济模式",
      markupPercent: 0,
      providers: ["provider-a", "provider-b"],
      models: ["gpt-image-2", "dall-e-3"]
    },
    balanced: {
      name: "均衡模式",
      markupPercent: 15,
      providers: ["provider-a"],
      models: ["gpt-image-2"]
    },
    premium: {
      name: "品质模式",
      markupPercent: 30,
      providers: ["provider-b"],
      models: ["gpt-image-2"]
    }
  }
}
```

**核心函数**：
```javascript
// 获取策略配置
getStrategyConfig()

// 更新策略配置
updateStrategy(strategyId, config)

// 同步策略价格（从供应商抓取最新价格）
syncStrategyFromProviders(strategyId)

// 更新策略加价
updateStrategyMarkup(strategyId, markupPercent)
```

### 6.4 供应商健康监控 (providerHealthMonitor.js)

**核心功能**：监控上游API供应商状态，故障时自动切换

**健康检查机制**：
- 每60秒检查所有供应商
- 连续3次失败标记为不健康
- 不健康后每30秒复查

**故障切换逻辑**：
```javascript
// 当 provider-a 失败时，自动切换到备选供应商
getFallbackProvider(currentProviderName, modelName)

// 价格对比，选择最优供应商
compareProviderPrices(modelName)
```

**熔断器机制**：
- 失败率超过50%触发熔断
- 熔断期间所有请求直接失败
- 60秒后尝试恢复

### 6.5 订单服务 (orderService.js)

**核心功能**：处理充值订单的创建、支付、回调

**订单状态流转**：
```
pending → paid → completed
        ↘ expired (24小时未支付)
        ↘ failed (支付失败)
```

**核心函数**：
```javascript
// 创建充值订单
createRechargeOrder(userId, packId, paymentMethod)

// 处理支付成功回调
handlePaymentSuccess(orderId, transactionId)

// 处理支付失败
handlePaymentFailed(orderId, reason)

// 取消过期订单
cancelExpiredOrders()
```

### 6.6 工单服务 (ticketService.js)

**核心功能**：处理客服工单的创建、分配、回复

**工单状态流转**：
```
open → pending (等待用户回复) → resolved → closed
     ↘ pending (客服正在处理)
```

**核心函数**：
```javascript
// 创建工单
createTicket(userId, category, title, initialMessage)

// 添加消息
addMessage(ticketId, senderId, senderType, content)

// 分配客服
assignTicket(ticketId, adminId)

// 更新状态
updateTicketStatus(ticketId, status)

// 关闭工单
closeTicket(ticketId)
```

### 6.7 通知服务 (notificationService.js)

**核心功能**：管理系统通知的发送和追踪

**通知类型**：
| type | 说明 | targetRole |
|------|------|------------|
| system | 系统通知 | all/user/admin |
| promotion | 促销活动 | all/user |
| warning | 告警通知 | admin |

**核心函数**：
```javascript
// 创建通知
createNotification(title, content, type, targetRole, senderId)

// 发送全员通知
sendToAllUsers(notificationId)

// 获取用户通知列表
getUserNotifications(userId)

// 标记已读
markAsRead(notificationId, userId)
```

---

## 七、服务调用时序

### 7.1 用户登录流程

```
用户 → POST /api/auth/login
     ↓
authRoutes.js → 调用 authService.login()
     ↓
authService.js → prisma.user.findUnique() 验证密码
     ↓
生成 JWT token
     ↓
返回 { user, accessToken, refreshToken }
     ↓
前端存储 token 到 localStorage
```

### 7.2 图片生成流程

```
用户 → POST /api/image/generate
     ↓
imageRoutes.js → 验证 authMiddleware
     ↓
检查用户余额 creditsService.getBalance()
     ↓
预扣算力 creditsService.preDeduct()
     ↓
调用 lingkeClient 生成图片
     ↓
成功 → creditsService.confirmDeduction()
     ↓
失败 → creditsService.rollbackDeduction()
     ↓
返回生成结果给用户
```

### 7.3 充值流程

```
用户 → POST /api/payments/recharge/create
     ↓
paymentRoutes.js → 创建订单
     ↓
orderService.createRechargeOrder()
     ↓
生成支付链接（微信/支付宝）
     ↓
返回 { orderId, payUrl }

用户扫码支付 → 微信/支付宝回调 → POST /api/payments/callback
     ↓
paymentRoutes.js → 验证签名
     ↓
orderService.handlePaymentSuccess()
     ↓
creditsService.add() 增加算力
     ↓
创建 Transaction 记录
     ↓
返回支付成功
```

---

## 八、配置说明

### 8.1 .env 文件配置

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

### 8.2 配置项说明

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

## 九、API接口文档

### 9.1 认证接口

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

### 9.2 积分接口

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

#### 获取算力包
```
GET /api/credits/packs

返回：
{
  "success": true,
  "data": [
    { "id": "pack-10", "credits": 10, "price": 10, "bonus": 0, "label": "10 算力" },
    { "id": "pack-50", "credits": 50, "price": 50, "bonus": 2, "label": "50 算力" },
    { "id": "pack-200", "credits": 200, "price": 200, "bonus": 10, "label": "200 算力" },
    { "id": "pack-500", "credits": 500, "price": 500, "bonus": 30, "label": "500 算力" }
  ]
}
```

---

### 9.3 支付接口

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

### 9.4 AI生成接口

#### 图片生成
```
POST /api/image/generate
Authorization: Bearer JWT_TOKEN (可选，未登录也能生成但不扣费)
Content-Type: application/json

{
  "prompt": "一只可爱的猫",
  "model": "gpt-image-2",
  "resolution": "1024x1024",
  "count": 1
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

#### 图片编辑
```
POST /api/image/edit
Authorization: Bearer JWT_TOKEN (可选)
Content-Type: multipart/form-data

{
  "prompt": "把这只猫变成蓝色",
  "image": "图片文件",
  "model": "gpt-image-2"
}

返回：同上
```

#### 视频生成
```
POST /api/video/generate
Authorization: Bearer JWT_TOKEN (可选)
Content-Type: application/json

{
  "prompt": "一只猫在跳舞",
  "model": "kling-v3-video",
  "duration": 5
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

#### 图生视频
```
POST /api/video/from-image
Authorization: Bearer JWT_TOKEN (可选)
Content-Type: application/json

{
  "prompt": "让这张图片动起来",
  "imageUrl": "https://xxx/image.jpg",
  "model": "kling-v3-video",
  "duration": 5
}

返回：同上
```

---

### 9.5 策略管理接口

#### 获取策略配置
```
GET /api/strategy/config
Authorization: Bearer JWT_TOKEN (管理员)

返回：
{
  "success": true,
  "data": {
    "strategies": {
      "economy": { "name": "经济模式", "markupPercent": 0, "providers": [], "models": [] },
      "balanced": { "name": "均衡模式", "markupPercent": 15, "providers": [], "models": [] },
      "premium": { "name": "品质模式", "markupPercent": 30, "providers": [], "models": [] }
    }
  }
}
```

#### 更新策略
```
PUT /api/strategy/:id
Authorization: Bearer JWT_TOKEN (管理员)
Content-Type: application/json

{
  "markupPercent": 20,
  "providers": ["lingke"],
  "models": ["gpt-image-2", "dall-e-3"]
}

返回：
{
  "success": true,
  "data": { ...更新后的配置 }
}
```

#### 同步策略价格
```
POST /api/strategy/:id/sync
Authorization: Bearer JWT_TOKEN (管理员)

返回：
{
  "success": true,
  "message": "同步完成",
  "updated": 15  // 更新的模型数量
}
```

---

### 9.6 工单接口

#### 创建工单
```
POST /api/tickets
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "category": "technical",
  "title": "图片生成失败",
  "message": "详细描述问题..."
}

返回：
{
  "success": true,
  "data": { "id": 1, "ticketId": "TK-xxx", "status": "open" }
}
```

#### 获取工单列表
```
GET /api/tickets
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": [
    { "id": 1, "category": "technical", "title": "...", "status": "open", "createdAt": "..." }
  ]
}
```

#### 获取工单详情
```
GET /api/tickets/:id
Authorization: Bearer JWT_TOKEN

返回：工单详情包含 messages 数组
```

#### 添加工单消息
```
POST /api/tickets/:id/messages
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "content": "补充更多信息..."
}

返回：
{
  "success": true,
  "data": { "id": 5, "content": "...", "createdAt": "..." }
}
```

---

### 9.7 通知接口

#### 获取通知列表
```
GET /api/notifications
Authorization: Bearer JWT_TOKEN

返回：
{
  "success": true,
  "data": [
    { "id": 1, "title": "系统通知", "content": "...", "type": "system", "isRead": false, "createdAt": "..." }
  ]
}
```

#### 标记已读
```
POST /api/notifications/:id/read
Authorization: Bearer JWT_TOKEN

返回：{ "success": true }
```

#### 管理员发送全员通知
```
POST /api/notifications/admin/send
Authorization: Bearer JWT_TOKEN (管理员)
Content-Type: application/json

{
  "title": "系统维护通知",
  "content": "将于今晚10点进行系统维护...",
  "type": "system",
  "targetRole": "all"  // all / user / admin
}

返回：
{
  "success": true,
  "data": { "id": 5, "sentCount": 100 }
}
```

---

### 9.8 管理后台接口

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

## 十、腾讯云轻量服务器部署指南

### 10.1 服务器配置要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 硬盘 | 20GB | 40GB SSD |
| 带宽 | 1Mbps | 3Mbps |

### 10.2 部署步骤

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

### 10.3 Nginx配置示例

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

## 十一、目录结构

```
server/
├── generated/              # Prisma生成的客户端代码
├── middleware/             # 中间件
│   ├── auth.js             # JWT认证中间件 (authMiddleware, optionalAuth)
│   └── rateLimit.js        # 限流中间件（防滥用）
├── prisma/                 # Prisma配置
│   ├── schema.prisma       # 数据库Schema定义
│   ├── seed.js             # 初始数据（管理员、测试用户）
│   └── dev.db              # SQLite数据库文件（开发环境）
├── routes/                 # API路由
│   ├── authRoutes.js       # 认证接口（登录/注册/Token刷新）
│   ├── creditsRoutes.js   # 积分接口（余额/扣减/充值/签到）
│   ├── imageRoutes.js      # 图片生成接口
│   ├── videoRoutes.js      # 视频生成接口
│   ├── paymentRoutes.js    # 支付接口
│   ├── ticketRoutes.js     # 工单接口
│   ├── notificationRoutes.js # 通知接口
│   ├── pricingAdminRoutes.js # 管理后台接口
│   ├── strategyRoutes.js   # 策略配置接口
│   └── usageRoutes.js      # 使用统计接口
├── services/               # 业务服务层
│   ├── db.js               # Prisma客户端单例（重要！避免多实例）
│   ├── authService.js      # 认证业务逻辑
│   ├── creditsService.js   # 积分业务逻辑（原子操作、预扣费）
│   ├── orderService.js     # 订单业务逻辑
│   ├── imageService.js     # 图片生成业务逻辑
│   ├── videoService.js     # 视频生成业务逻辑
│   ├── ticketService.js    # 工单业务逻辑
│   ├── notificationService.js # 通知业务逻辑
│   ├── pricingEngine.js    # 价格计算引擎
│   ├── strategyConfigService.js # 策略配置服务
│   ├── providerHealthMonitor.js # 供应商健康监控
│   ├── lingkeClient.js     # Lingke API客户端
│   ├── wechatPayService.js # 微信支付服务
│   ├── alipayService.js    # 支付宝服务
│   └── usageService.js     # 使用统计服务
├── config/
│   └── paymentConfig.js    # 支付配置管理
├── utils/
│   ├── errorHandler.js     # 全局错误处理
│   └── taskManager.js      # 任务状态管理
├── .env                    # 环境变量配置
├── package.json            # 项目依赖
└── server.js               # 服务入口
```

---

## 十二、安全注意事项

1. **JWT_SECRET**：生产环境务必使用至少32位的随机字符串
2. **数据库密码**：不要硬编码，使用环境变量
3. **API密钥**：LingkeAPI密钥等敏感信息使用环境变量
4. **HTTPS**：生产环境必须启用HTTPS
5. **输入验证**：所有API输入参数必须验证
6. **日志**：记录关键操作日志，定期备份
7. **防火墙**：只开放必要端口（3000/80/443）
8. **CORS**：生产环境限制允许的来源域名
9. **限流**：启用rateLimit中间件防止DDoS攻击
10. **权限控制**：AdminRoute组件确保管理后台仅管理员可访问

---

## 十三、故障排查

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 数据库连接失败 | DATABASE_URL配置错误 | 检查连接字符串格式 |
| JWT验证失败 | JWT_SECRET不匹配 | 确保前后端使用相同密钥 |
| 生成失败 | LingkeAPI密钥错误 | 检查LINGKE_API_KEY |
| 支付失败 | 支付密钥未配置 | 配置WECHAT_*或ALIPAY_* |
| 端口占用 | 3000端口已被占用 | 更换PORT或停止占用进程 |
| 预扣费未回滚 | 服务器异常重启 | 已添加10分钟超时自动回滚 |
| 管理员无法登录 | 数据库种子未运行 | 运行 `node prisma/seed.js` |

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

## 十四、维护与更新

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

## 附录A：预设账号

| 账号 | 密码 | 角色 | 初始算力 |
|------|------|------|----------|
| admin@ai.com | admin123 | 管理员 | 9999 |
| test@ai.com | test123 | 普通用户 | 100 |
| demo@ai.com | demo123 | 普通用户 | 50 |

## 附录B：错误码定义

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| AUTH001 | 无效的凭据 | 邮箱或密码错误 |
| AUTH002 | Token已过期 | JWT过期，需刷新 |
| AUTH003 | 无访问权限 | 无效的admin key |
| CREDIT001 | 余额不足 | 算力不足 |
| CREDIT002 | 扣费失败 | 事务失败 |
| ORDER001 | 订单不存在 | 订单号错误 |
| ORDER002 | 订单已过期 | 超过24小时 |
| TICKET001 | 工单不存在 | 工单ID错误 |
| TICKET002 | 工单已关闭 | 无法添加消息 |

---

**文档版本**: v2.0
**创建日期**: 2026-05-13
**更新内容**: 补充数据库Schema详解、核心业务逻辑、服务调用关系、完整API接口
**适用版本**: awesome-gpt-image-2-main v2.0