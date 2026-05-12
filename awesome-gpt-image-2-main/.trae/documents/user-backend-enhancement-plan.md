# 用户后台与系统功能完善实施计划

## 系统现状分析

### 已有基础
| 模块 | 现状 | 缺失 |
|------|------|------|
| 客服系统 | 无独立客服模块，仅有外部平台反馈API | 客服工单、在线咨询、消息通知、历史对话 |
| 通知系统 | 前端有Toast通知（内存级），无持久化 | 站内信、系统通知、全员通知、已读追踪 |
| 支付系统 | 微信/支付宝服务代码已写，回调已实现 | 实际密钥未配置、收款页配置、支付后算力验证 |
| 用户权限 | role(user/admin) + membership(free/basic/pro/enterprise) | 用户侧收入信息未清理、权限边界模糊 |
| 用户后台 | UserDashboard有框架，多个Tab显示"开发中" | 数据库绑定、支付/消费记录、信息展示 |
| 数据库 | 6个模型(User/Order/Transaction/UsageRecord/CheckIn/PriceConfig) | Notification/Ticket/TicketMessage等模型缺失 |

### 关键问题
1. **UserDashboard** 右侧面板硬编码了"累计收入¥24.24"、"可提现余额¥14.24"等收入信息，用户角色不应看到
2. **UserDashboard** 多个Tab（设置/API/推荐码/会员中心/问题反馈）均为"功能开发中"占位
3. **Admin.jsx** 用户管理/订单管理/分销管理/操作日志等使用MOCK数据，未连接数据库
4. **支付系统** 代码完整但未配置真实密钥，paymentConfig.js中的配置为空
5. **数据库** 缺少Notification、Ticket等模型

---

## 实施步骤

### 任务1: 完善客服功能模块

#### 1.1 数据库模型扩展
在 `server/prisma/schema.prisma` 中新增：

```prisma
model Ticket {
  id          Int       @id @default(autoincrement())
  userId      Int
  category    String    // bug/feature/question/account/payment/other
  title       String
  status      String    @default("open") // open/in_progress/resolved/closed
  priority    String    @default("normal") // low/normal/high/urgent
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  closedAt    DateTime?

  user        User      @relation(fields: [userId], references: [id])
  messages    TicketMessage[]
}

model TicketMessage {
  id        Int       @id @default(autoincrement())
  ticketId  Int
  senderId  Int?      // null表示系统消息
  senderType String   @default("user") // user/admin/system
  content   String
  attachments String? // JSON数组，附件URL
  isRead    Boolean   @default(false)
  createdAt DateTime  @default(now())

  ticket    Ticket    @relation(fields: [ticketId], references: [id])
}
```

#### 1.2 后端服务
- 新建 `server/services/ticketService.js`：工单CRUD、消息发送、状态流转、分配客服
- 新建 `server/routes/ticketRoutes.js`：
  - `POST /api/tickets` - 创建工单
  - `GET /api/tickets` - 我的工单列表
  - `GET /api/tickets/:id` - 工单详情+消息
  - `POST /api/tickets/:id/messages` - 发送消息
  - `PUT /api/tickets/:id/status` - 更新状态
  - `GET /api/tickets/admin/all` - 管理员：所有工单
  - `PUT /api/tickets/admin/:id/assign` - 管理员：分配客服
  - `PUT /api/tickets/admin/:id/status` - 管理员：更新状态

#### 1.3 前端页面
- 改造 `UserDashboard.jsx` 的 `help` Tab → 完整客服中心
  - 工单列表（按状态筛选）
  - 新建工单表单（分类选择+标题+描述+附件上传）
  - 工单对话界面（消息气泡+发送框）
  - 工单状态追踪
- 在 `Admin.jsx` 新增"客服管理"Tab
  - 工单列表（筛选/搜索/分配）
  - 客服对话界面
  - 工单统计（待处理/处理中/已解决）

---

### 任务2: 管理员全员通知功能

#### 2.1 数据库模型扩展
在 `server/prisma/schema.prisma` 中新增：

```prisma
model Notification {
  id         Int       @id @default(autoincrement())
  title      String
  content    String
  type       String    @default("system") // system/activity/maintenance/payment
  senderId   Int?      // null=系统通知
  targetRole String?   // null=所有人, user/admin/supplier
  createdAt  DateTime  @default(now())

  readStatus NotificationRead[]
}

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
```

在 User 模型中添加关联：
```prisma
notifications  NotificationRead[]
```

#### 2.2 后端服务
- 新建 `server/services/notificationService.js`：
  - `createNotification(title, content, type, targetRole, senderId)` - 创建通知
  - `sendToAll(title, content, type)` - 全员发送
  - `sendToRole(role, title, content, type)` - 按角色发送
  - `getUserNotifications(userId, page, limit)` - 获取用户通知列表
  - `markAsRead(notificationId, userId)` - 标记已读
  - `markAllAsRead(userId)` - 全部标记已读
  - `getUnreadCount(userId)` - 未读数量
- 新建 `server/routes/notificationRoutes.js`：
  - `GET /api/notifications` - 用户通知列表
  - `GET /api/notifications/unread-count` - 未读数量
  - `PUT /api/notifications/:id/read` - 标记已读
  - `PUT /api/notifications/read-all` - 全部已读
  - `POST /api/notifications/admin/send` - 管理员发送通知
  - `GET /api/notifications/admin/history` - 管理员通知历史
  - `GET /api/notifications/admin/stats` - 通知统计（发送数/已读率）

#### 2.3 前端
- 新建 `src/contexts/NotificationSystemContext.jsx`：全局通知状态管理（轮询/SSE获取未读数）
- 在 `Topbar.jsx` 添加通知铃铛图标+未读数badge+下拉通知列表
- 在 `Admin.jsx` 新增"通知管理"Tab：
  - 发送通知表单（标题+内容+类型+目标角色选择）
  - 通知历史列表（含已读率统计）
  - 通知详情（查看每个用户的已读状态）

---

### 任务3: 完善充值功能模块

#### 3.1 集成微信支付和支付宝
- 在 `server/config/paymentConfig.js` 中配置真实密钥（从.env读取）
- 在 `server/.env` 中添加：
  ```
  WECHAT_APP_ID=wx...
  WECHAT_MCH_ID=...
  WECHAT_API_V3_KEY=...
  WECHAT_SERIAL_NO=...
  WECHAT_PRIVATE_KEY_PATH=./certs/wechat/apiclient_key.pem
  WECHAT_CERT_PATH=./certs/wechat/apiclient_cert.pem
  WECHAT_NOTIFY_URL=https://yourdomain.com/api/payments/wechat/notify
  ALIPAY_APP_ID=...
  ALIPAY_PRIVATE_KEY=...
  ALIPAY_PUBLIC_KEY=...
  ALIPAY_NOTIFY_URL=https://yourdomain.com/api/payments/alipay/notify
  ALIPAY_RETURN_URL=https://yourdomain.com/credits
  ```
- 创建 `server/certs/` 目录存放证书文件
- 验证支付回调接口 `/api/payments/wechat/notify` 和 `/api/payments/alipay/notify`

#### 3.2 管理员收款页面配置
- 在 `server/prisma/schema.prisma` 新增：
  ```prisma
  model PaymentConfig {
    id            Int       @id @default(autoincrement())
    key           String    @unique
    value         String
    description   String?
    updatedAt     DateTime  @updatedAt
  }
  ```
- 新建 `server/services/paymentConfigService.js`：收款配置CRUD
- 新建 `server/routes/paymentConfigRoutes.js`：
  - `GET /api/payment-config/admin` - 管理员获取所有配置
  - `PUT /api/payment-config/admin` - 管理员更新配置
  - `GET /api/payment-config/public` - 公开配置（收款页展示信息）
- 在 `Admin.jsx` 的"系统设置"Tab中增加收款页面配置：
  - 微信支付开关+配置项
  - 支付宝开关+配置项
  - 收款页标题/描述/Logo
  - 算力包价格自定义

#### 3.3 验证支付后自动增加算力
- 检查 `orderService.handlePaymentSuccess()` 的事务逻辑：
  1. 更新 Order 状态为 paid
  2. 调用 `creditsService.add()` 增加算力
  3. 记录 Transaction 流水
- 编写测试脚本验证完整流程
- 添加支付成功后的通知（调用 notificationService）

---

### 任务4: 优化用户权限逻辑

#### 4.1 清理用户侧收入信息
- 修改 `UserDashboard.jsx`：
  - 移除右侧面板"累计收入"、"可提现余额"统计项
  - 替换为与用户使用相关的统计：累计算力、累计消费、作品数量、使用天数
  - 移除"分销管理"相关入口（如Affiliate页面中对普通用户展示的收入信息）
- 修改 `CreditsContext.jsx`：确保不返回收入相关数据
- 修改 `usageRoutes.js`：用户只能查询自己的使用记录，不返回收入统计

#### 4.2 权限边界强化
- 后端API层面：
  - 所有 `/api/admin/*` 路由强制 `adminMiddleware`
  - `/api/payments/orders/:userId` 只能查自己的订单
  - `/api/credits/history` 只能查自己的历史
- 前端路由层面：
  - `Topbar.jsx` 中"管理后台"入口仅 admin 可见（已实现）
  - 用户后台不显示任何管理功能入口
  - 清理 `UserDashboard` 中"加入工作室"等不恰当入口

#### 4.3 API数据过滤
- 修改 `authRoutes.js` 的 `GET /me` 接口：对普通用户不返回 totalSpent 等敏感字段
- 修改 `creditsRoutes.js`：确保返回数据不包含收入信息

---

### 任务5: 用户后台信息展示与数据库绑定

#### 5.1 用户信息卡片数据库绑定
- 修改 `UserDashboard.jsx` 右侧面板：
  - 从 `AuthContext` 获取真实用户数据（nickname/email/avatar/membership/createdAt）
  - 替换硬编码的"星月月亮"、"13141572222@qq.com"等

#### 5.2 各Tab功能实现
- **设置Tab**：用户资料编辑（昵称/头像修改/密码修改）
  - 新增 `PUT /api/auth/profile` 接口
  - 新增 `PUT /api/auth/password` 接口
- **API Tab**：API Key管理
  - 新增 User 模型 `apiKey String?` 字段
  - 新增 `POST /api/auth/api-key` 生成API Key
  - 新增 `GET /api/auth/api-key` 查询API Key
- **推荐码Tab**：推荐系统
  - 利用已有 `referralCode` 字段
  - 新增 `GET /api/credits/referral-stats` 推荐统计
  - 新增 `POST /api/auth/referral` 使用推荐码
- **会员中心Tab**：嵌入 `PricingPage` 组件或链接到 `/pricing`

#### 5.3 数据验证
- 验证所有数据读取正确：用户信息、算力余额、会员状态
- 验证数据写入正确：资料更新、密码修改
- 验证数据删除正确：作品删除

---

### 任务6: 支付记录和消费记录追踪

#### 6.1 支付记录页面
- 在 `UserDashboard.jsx` 新增"支付记录"Tab：
  - 订单列表（调用 `GET /api/payments/orders/:userId`）
  - 展示字段：订单号、商品名称、金额、支付方式、状态、创建时间、支付时间
  - 支持分页和状态筛选
  - 订单详情弹窗

#### 6.2 消费记录页面
- 在 `UserDashboard.jsx` 新增"消费记录"Tab：
  - 交易流水列表（调用 `GET /api/credits/history`）
  - 展示字段：交易时间、类型（充值/消费/签到/赠送）、金额、余额、描述
  - 支持分页和类型筛选
  - 使用记录列表（调用 `GET /api/usage/history`）
  - 展示字段：使用时间、模型、类型、消耗算力、分辨率、状态

#### 6.3 数据完整性
- 确保每次支付成功都记录 Order + Transaction
- 确保每次生成消耗都记录 UsageRecord + Transaction
- 添加数据一致性检查接口

---

### 任务7: 竞品分析报告

#### 7.1 分析对象
- Midjourney官网
- 即梦AI（字节跳动）
- 通义万相（阿里云）
- 文心一格（百度）
- 可灵AI（快手）
- 美图设计室

#### 7.2 分析维度
- 功能结构：核心功能模块、辅助功能、差异化功能
- 界面设计：布局风格、配色方案、交互模式
- 用户体验流程：注册→首次使用→付费转化→留存
- 核心功能模块：创作页、作品管理、会员体系、支付流程
- 用户后台：信息展示、设置、记录查看

#### 7.3 输出
- 形成竞品分析报告文档
- 提炼可借鉴的优化建议

---

## 执行顺序

```
阶段1: 数据库与后端基础 (任务1.1 + 2.1 + 3.2 + 4.1)
  ├─ 扩展 Prisma Schema（新增 Ticket/TicketMessage/Notification/NotificationRead/PaymentConfig）
  ├─ 运行数据库迁移
  └─ 清理用户侧收入信息

阶段2: 核心后端服务 (任务1.2 + 2.2 + 3.1 + 3.2 + 3.3)
  ├─ ticketService + ticketRoutes
  ├─ notificationService + notificationRoutes
  ├─ paymentConfigService + paymentConfigRoutes
  └─ 支付密钥配置 + 支付流程验证

阶段3: 前端页面实现 (任务1.3 + 2.3 + 5 + 6)
  ├─ 客服中心页面（用户端+管理端）
  ├─ 通知系统（铃铛+下拉列表+管理端发送）
  ├─ UserDashboard 各Tab功能实现
  ├─ 支付记录+消费记录Tab
  └─ 用户信息数据库绑定

阶段4: 权限优化与验证 (任务4 + 5.3)
  ├─ API数据过滤
  ├─ 权限边界强化
  └─ 全链路数据验证

阶段5: 竞品分析 (任务7)
  └─ 竞品调研 + 分析报告
```

## 涉及的文件清单

### 新建文件
| 文件 | 用途 |
|------|------|
| `server/services/ticketService.js` | 客服工单服务 |
| `server/routes/ticketRoutes.js` | 客服工单路由 |
| `server/services/notificationService.js` | 通知服务 |
| `server/routes/notificationRoutes.js` | 通知路由 |
| `server/services/paymentConfigService.js` | 收款配置服务 |
| `server/routes/paymentConfigRoutes.js` | 收款配置路由 |
| `src/contexts/NotificationSystemContext.jsx` | 全局通知状态 |
| `src/components/NotificationBell.jsx` | 通知铃铛组件 |
| `src/components/TicketChat.jsx` | 工单对话组件 |

### 修改文件
| 文件 | 修改内容 |
|------|----------|
| `server/prisma/schema.prisma` | 新增 Ticket/TicketMessage/Notification/NotificationRead/PaymentConfig 模型 |
| `server/server.js` | 注册新路由 |
| `server/.env` | 添加支付密钥配置 |
| `server/config/paymentConfig.js` | 从环境变量读取配置 |
| `src/pages/UserDashboard.jsx` | 移除收入信息、实现各Tab功能、新增支付/消费记录Tab |
| `src/pages/admin/Admin.jsx` | 新增客服管理/通知管理Tab、收款配置 |
| `src/components/Topbar.jsx` | 添加通知铃铛 |
| `src/contexts/AuthContext.jsx` | 添加资料编辑方法 |
| `src/contexts/CreditsContext.jsx` | 清理收入相关数据 |
| `server/routes/authRoutes.js` | 新增资料编辑/密码修改/API Key接口 |
| `server/routes/creditsRoutes.js` | 数据过滤 |
| `server/routes/usageRoutes.js` | 权限强化 |
