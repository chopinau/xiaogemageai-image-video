# SaaS 用户管理系统全面修复与数据库集成计划

## 一、现状诊断

### 核心问题
| 问题 | 严重程度 | 说明 |
|------|----------|------|
| **无数据库** | 🔴 严重 | 所有用户数据存内存/JSON，服务器重启即丢失 |
| **前端可篡改余额** | 🔴 严重 | 积分余额存localStorage，用户可直接修改 |
| **无真正的用户认证** | 🔴 严重 | 后端无用户表，无密码验证，auth中间件未使用 |
| **支付未对接** | 🟠 高 | 微信/支付宝密钥为空，充值走DEMO模式 |
| **无并发控制** | 🟠 高 | 积分扣减非原子操作，可能超扣 |
| **API无认证** | 🟠 高 | 图片/视频生成API无需登录即可调用 |
| **前后端算力定义冲突** | 🟡 中 | constants.js与credits.js定义不一致 |
| **11个前端API端点后端不存在** | 🟠 高 | 登录/注册/积分/会员等API缺失 |

---

## 二、实施策略：先搭框架再连服务器

**策略说明**：先在本地使用 SQLite（Prisma内置支持，零配置）完成所有代码开发和调试，验证通过后只需修改一行配置即可切换到服务器MySQL。

---

## 三、实施步骤（按执行顺序）

### 步骤1：安装Prisma + 设计Schema + 本地SQLite建表

**目标**：搭建数据库基础设施，本地零配置运行

1.1 安装依赖
```bash
cd server
npm install prisma @prisma/client bcryptjs jsonwebtoken --save
```

1.2 初始化Prisma（使用SQLite开发，后续切换MySQL）
```bash
npx prisma init --datasource-provider sqlite
```

1.3 创建 `server/prisma/schema.prisma`，包含6个模型：
- **User** - 用户表（邮箱/密码/角色/会员/积分/推荐码等）
- **Order** - 订单表（充值/会员/算力包订单）
- **Transaction** - 交易流水表（收入/支出/充值/退款等）
- **UsageRecord** - 使用记录表（每次AI生成的详细记录）
- **CheckIn** - 签到表（每日签到奖励）
- **PriceConfig** - 价格配置表（替代JSON文件）

1.4 创建 `server/prisma/seed.js` - 初始化管理员账号和默认数据

1.5 运行迁移
```bash
npx prisma migrate dev --name init
npx prisma generate
```

1.6 创建 `server/services/db.js` - Prisma Client单例

---

### 步骤2：用户认证系统（注册/登录/JWT）

**目标**：替换前端DEMO模式，实现真正的后端认证

2.1 创建 `server/services/authService.js`
- `register(email, password, nickname)` - 注册（bcrypt哈希密码，赠送初始算力2.00）
- `login(email, password)` - 登录（验证密码，生成JWT）
- `verifyToken(token)` - 验证JWT
- `refreshToken(token)` - 刷新token
- `getUser(userId)` - 获取用户信息

2.2 创建 `server/routes/authRoutes.js`
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户（需认证）

2.3 重写 `server/middleware/auth.js`
- 验证JWT真伪
- 从数据库查用户
- 注入 `req.user`
- 管理员权限检查

2.4 在 `server/server.js` 中注册auth路由

---

### 步骤3：积分/算力系统数据库化

**目标**：积分操作走数据库事务，防止篡改和超扣

3.1 创建 `server/services/creditsService.js`
- `getBalance(userId)` - 查询余额（从数据库读）
- `deduct(userId, amount, desc, relatedId)` - 扣减（Prisma事务）
- `add(userId, amount, desc, relatedId)` - 增加（Prisma事务）
- `preDeduct(userId, amount)` - 预扣费（事务+记录pendingDeduction）
- `confirmDeduct(deductionId)` - 确认扣费
- `rollbackDeduct(deductionId)` - 回滚
- `checkIn(userId)` - 签到（每日一次，事务）
- `getHistory(userId, page, limit)` - 交易历史

3.2 创建 `server/routes/creditsRoutes.js`
- `GET /api/credits/balance` - 查询余额
- `POST /api/credits/deduct` - 扣减
- `POST /api/credits/check-in` - 签到
- `GET /api/credits/history` - 交易历史
- `GET /api/credits/packs` - 算力包列表

3.3 统一算力定义
- 删除 `constants.js` 中冲突的 `CREDITS` 定义
- 以 `credits.js` 的 `CREDITS_RULES` 为准

---

### 步骤4：支付系统数据库化

**目标**：订单走数据库，支付回调能正确处理

4.1 重构 `server/routes/paymentRoutes.js`
- 将内存 `userCreditsStore` 和 `orderStore` 替换为 Prisma 操作
- 订单创建/查询/更新全部走数据库
- 支付回调使用数据库事务（更新订单状态+增加积分）

4.2 创建 `server/services/orderService.js`
- `createOrder(userId, type, product, amount, credits)` - 创建订单
- `getOrder(orderId)` - 查询订单
- `updateOrderStatus(orderId, status, transactionId)` - 更新状态
- `handlePaymentCallback(orderId, paymentData)` - 处理支付回调
- `getUserOrders(userId, page, limit)` - 用户订单列表

4.3 支付回调安全
- 验证回调签名
- 事务内更新订单+增加积分
- 防止重复回调（幂等性）

---

### 步骤5：使用统计与消费核算

**目标**：每次AI生成记录到数据库，管理后台展示真实数据

5.1 创建 `server/services/usageService.js`
- `record(userId, type, model, cost, params)` - 记录使用
- `getUserStats(userId)` - 用户统计
- `getDailyStats(date)` - 每日统计
- `getModelStats(modelId)` - 模型统计
- `getTopUsers(limit)` - 消费排行

5.2 创建 `server/routes/usageRoutes.js`
- `GET /api/usage/stats` - 用户使用统计
- `GET /api/usage/history` - 使用历史
- `GET /api/usage/daily` - 每日统计

5.3 在图片/视频/文字生成路由中集成使用记录
- 生成成功后调用 `usageService.record()`
- 管理后台Dashboard连接真实数据

---

### 步骤6：前端对接真实后端

**目标**：前端所有操作走后端API，删除DEMO模拟逻辑

6.1 更新 `src/contexts/AuthContext.jsx`
- 删除 `DEMO_ACCOUNTS` 硬编码
- 登录/注册调用 `/api/auth/login` 和 `/api/auth/register`
- token验证调用 `/api/auth/me`
- 保留 `IS_DEMO` 标志作为降级方案

6.2 更新 `src/contexts/CreditsContext.jsx`
- 余额查询调用 `/api/credits/balance`
- 签到调用 `/api/credits/check-in`
- 充值调用 `/api/payments/recharge/create`
- 交易历史调用 `/api/credits/history`
- 删除DEMO模式下的模拟充值

6.3 更新 `src/contexts/MemberContext.jsx`
- 会员订阅/取消调用后端API

6.4 更新 `src/services/historyManager.js`
- 生成历史同步到后端
- 保留前端缓存但以后端为准

6.5 更新生成流程中的积分扣减
- 生成前调用 `/api/credits/deduct` 预扣费
- 生成失败调用回滚
- 生成成功确认扣费

---

### 步骤7：给所有API添加认证中间件

**目标**：防止未登录用户调用生成API

7.1 在 `server/routes/imageRoutes.js` 添加auth中间件
7.2 在 `server/routes/videoRoutes.js` 添加auth中间件
7.3 在 `server/routes/textRoutes.js` 添加auth中间件
7.4 在 `server/routes/psdLayerRoutes.js` 添加auth中间件
7.5 在 `server/routes/paymentRoutes.js` 添加auth中间件
7.6 在 `server/routes/creditsRoutes.js` 添加auth中间件

---

### 步骤8：连接腾讯云服务器MySQL（最后一步）

**目标**：将本地SQLite切换为服务器MySQL

8.1 修改 `server/prisma/schema.prisma`
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

8.2 修改 `server/.env`
```
DATABASE_URL="mysql://ai_saas:密码@服务器IP:3306/ai_saas"
```

8.3 运行迁移
```bash
npx prisma migrate deploy
```

8.4 服务器部署（PM2 + Nginx + SSL）

---

## 四、文件变更清单

### 新增文件
| 文件 | 说明 |
|------|------|
| `server/prisma/schema.prisma` | 数据库Schema |
| `server/prisma/seed.js` | 初始数据种子 |
| `server/services/db.js` | Prisma Client单例 |
| `server/services/authService.js` | 认证服务 |
| `server/services/creditsService.js` | 积分服务 |
| `server/services/orderService.js` | 订单服务 |
| `server/services/usageService.js` | 使用统计服务 |
| `server/routes/authRoutes.js` | 认证路由 |
| `server/routes/creditsRoutes.js` | 积分路由 |
| `server/routes/usageRoutes.js` | 使用统计路由 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `server/middleware/auth.js` | 重写为JWT验证+数据库查用户 |
| `server/routes/paymentRoutes.js` | 内存存储→Prisma数据库 |
| `server/routes/imageRoutes.js` | 添加auth中间件+使用记录 |
| `server/routes/videoRoutes.js` | 添加auth中间件+使用记录 |
| `server/routes/textRoutes.js` | 添加auth中间件+使用记录 |
| `server/server.js` | 注册新路由 |
| `server/.env` | 添加DATABASE_URL和JWT_SECRET |
| `src/contexts/AuthContext.jsx` | 对接真实后端API |
| `src/contexts/CreditsContext.jsx` | 对接真实后端API |
| `src/contexts/MemberContext.jsx` | 对接真实后端API |
| `src/services/historyManager.js` | 同步后端数据 |
| `src/config/constants.js` | 删除冲突的CREDITS定义 |

---

## 五、腾讯云轻量服务器部署方案

### 最低配置要求
| 资源 | 最低 | 推荐 |
|------|------|------|
| CPU | 1核 | 2核 |
| 内存 | 1GB | 2GB |
| 磁盘 | 20GB | 40GB SSD |
| 带宽 | 1Mbps | 3Mbps |

### 部署架构
```
用户浏览器 → Nginx(反向代理+SSL) → Node.js(Express) → MySQL 8.0
                                              ↓
                                         LingkeAPI(上游AI服务)
```

### 部署步骤
1. 安装 Node.js 20.x + MySQL 8.0 + Nginx
2. 配置MySQL数据库和用户
3. 克隆代码，安装依赖
4. 配置 .env（DATABASE_URL、JWT_SECRET、支付密钥）
5. 运行 `npx prisma migrate deploy`
6. 运行 `npx prisma db seed`
7. 使用 PM2 启动 Node.js 服务
8. 配置 Nginx 反向代理和 SSL（Let's Encrypt）

---

## 六、风险与注意事项

1. **数据迁移**：当前无真实用户数据，无需迁移，直接从零开始
2. **DEMO模式兼容**：保留 `IS_DEMO` 标志，未配置后端时自动降级
3. **并发安全**：Prisma事务保证积分操作的原子性
4. **渐进式改造**：每步完成后测试验证再进行下一步
5. **SQLite→MySQL切换**：只需改一行配置，Prisma自动处理差异
6. **备份策略**：MySQL定时备份，JSON文件保留作为降级方案
