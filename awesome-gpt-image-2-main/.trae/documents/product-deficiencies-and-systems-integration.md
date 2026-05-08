# 产品缺陷修复 + 会员/积分/支付/分销系统整合计划

## 一、当前产品缺陷分析（69项）

### 1.1 核心缺陷（严重程度：高，共44项）

| 缺陷类别 | 数量 | 核心问题 |
|---------|------|---------|
| 用户认证 | 6 | 无登录/注册/Token/路由保护/用户菜单 |
| 会员/订阅 | 5 | 无等级定义/权益控制/订阅流程 |
| 积分/点数 | 7 | 积分仅展示不扣减/无余额/无充值/与模型配置脱节 |
| 支付集成 | 5 | 无支付网关/订单/发票 |
| API Key 管理 | 6 | 明文存储/验证简陋/AIProvider未挂载/无多Key |
| 错误处理 | 8 | 无ErrorBoundary/无失败态/无重试/无超时 |
| 真实API集成 | 7 | 全部Mock数据/Service层与页面断裂/假进度条 |

### 1.2 重要缺陷（严重程度：中，共19项）

| 缺陷类别 | 数量 | 核心问题 |
|---------|------|---------|
| 分销/推广 | 5 | 无推广链接/佣金/数据面板 |
| 响应式设计 | 7 | 导航溢出/断点不够/Sidebar未隐藏/无触摸优化 |
| 通知系统 | 7 | 无Toast/无完成通知/无错误通知 |

### 1.3 次要缺陷（6项）
- i18n不完整（4个新页面全硬编码中文）
- 数据仅存localStorage无服务端同步
- 无CSRF防护
- 无速率限制
- PROMOTION_EXAMPLES每次渲染随机导致闪烁
- 视频下载跨域问题

---

## 二、竞品核心功能对标分析

### 2.1 会员等级对标

| 平台 | 等级数 | 最低价 | 最高价 | 计费单位 |
|------|-------|--------|--------|---------|
| Midjourney | 4 | $10/月 | $120/月 | GPU时长 |
| Canva | 3 | 免费 | $14.99/人/月 | 月度额度 |
| 美图设计室 | 3 | 免费 | ~40元/月 | AI积分 |
| 稿定AI | 4 | 免费 | ~199元/月 | 稿定积分 |
| 通义万相 | 4 | 免费 | 定制 | 次数/资源包 |
| **本项目建议** | **4** | **免费** | **299元/月** | **AI积分** |

### 2.2 积分体系对标

| 平台 | 免费额度 | 付费额度 | 额外购买 | 过期策略 |
|------|---------|---------|---------|---------|
| Midjourney | 无 | 按等级GPU时长 | $4/小时 | 月度清零 |
| Canva | ~50次/月 | ~500次/月 | 需升级 | 月度清零 |
| 美图设计室 | 每日少量 | 按等级增加 | 积分包 | 购买的不过期 |
| 通义万相 | 每日几十次 | 资源包 | 按量付费 | 资源包不过期 |
| **本项目建议** | **每日5积分** | **按等级100-2000/月** | **积分包** | **月度清零/购买不过期** |

### 2.3 支付方式对标

| 支付方式 | 国内必须 | 国际必须 | 优先级 |
|---------|---------|---------|--------|
| 微信支付 | ✅ | - | P0 |
| 支付宝 | ✅ | - | P0 |
| Stripe | - | ✅ | P1 |
| PayPal | - | ✅ | P1 |
| 对公转账 | ✅(企业版) | ✅(企业版) | P2 |

### 2.4 分销体系对标

| 平台 | 模式 | 佣金 | 追踪期 |
|------|------|------|--------|
| Canva | CPA | ~$36/转化 | 30天 |
| Leonardo.ai | CPA | 15-25% | 30天 |
| Adobe | CPA | ~85%首年 | 30天 |
| 通义万相 | 消费分成 | 按比例 | 持续 |
| **本项目建议** | **CPA+消费分成** | **20-30%首年+5%续费** | **30天** |

---

## 三、系统架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────┐
│                    前端 (React + Vite)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ 认证模块  │ │ 会员模块  │ │ 积分模块  │ │ 分销模块 │ │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └────┬────┘ │
│        └─────────────┴───────────┴────────────┘      │
│                         │                             │
│              ┌──────────┴──────────┐                  │
│              │   API Gateway       │                  │
│              │   (统一请求层)       │                  │
│              └──────────┬──────────┘                  │
└─────────────────────────┼───────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────┐
│                    后端 API 服务                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Auth服务  │ │ 会员服务  │ │ 积分服务  │ │ 支付服务 │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ AI调度服务│ │ 分销服务  │ │ 通知服务  │ │ 管理后台 │ │
│  └──────────┘ └──────────┘ └──────────┘ └─────────┘ │
│                         │                             │
│              ┌──────────┴──────────┐                  │
│              │   数据库 (PostgreSQL)│                  │
│              │   缓存 (Redis)       │                  │
│              └─────────────────────┘                  │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────┐
│                   第三方服务                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │
│  │OpenAI  │ │Stability│ │Seedance│ │ 微信/支付宝   │  │
│  │API     │ │AI API  │ │API     │ │ Stripe/PayPal│  │
│  └────────┘ └────────┘ └────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 前端新增模块结构

```
src/
├── contexts/
│   ├── AuthContext.jsx        # 认证上下文
│   ├── MemberContext.jsx      # 会员上下文
│   ├── CreditsContext.jsx     # 积分上下文
│   └── NotificationContext.jsx # 通知上下文
├── components/
│   ├── auth/
│   │   ├── LoginPage.jsx      # 登录页
│   │   ├── RegisterPage.jsx   # 注册页
│   │   ├── ForgotPassword.jsx # 忘记密码
│   │   ├── UserMenu.jsx       # 用户菜单
│   │   └── ProtectedRoute.jsx # 路由守卫
│   ├── member/
│   │   ├── PlanCard.jsx       # 会员方案卡片
│   │   ├── PricingPage.jsx    # 定价页
│   │   ├── MemberBadge.jsx    # 会员徽章
│   │   └── FeatureGate.jsx    # 功能门控
│   ├── credits/
│   │   ├── CreditsBalance.jsx # 积分余额显示
│   │   ├── CreditsPack.jsx    # 积分包购买
│   │   ├── CreditsHistory.jsx # 积分历史
│   │   └── CreditsDeduct.jsx  # 积分扣减确认
│   ├── payment/
│   │   ├── PaymentModal.jsx   # 支付弹窗
│   │   ├── PaymentResult.jsx  # 支付结果
│   │   ├── OrderList.jsx      # 订单列表
│   │   └── InvoiceDownload.jsx # 发票下载
│   ├── distribution/
│   │   ├── ReferralLink.jsx   # 推荐链接
│   │   ├── Dashboard.jsx      # 推广数据面板
│   │   ├── CommissionList.jsx # 佣金列表
│   │   └── WithdrawPage.jsx   # 提现页面
│   └── notification/
│       ├── Toast.jsx          # Toast通知
│       └── NotificationBell.jsx # 通知铃铛
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── member/
│   │   ├── Pricing.jsx        # 会员定价页
│   │   └── Profile.jsx        # 个人中心
│   ├── credits/
│   │   └── CreditsCenter.jsx  # 积分中心
│   ├── distribution/
│   │   └── Affiliate.jsx      # 推广中心
│   └── ... (现有页面)
├── config/
│   ├── membership.js          # 会员等级配置
│   ├── credits.js             # 积分规则配置
│   └── payment.js             # 支付配置
└── services/
    ├── authService.js         # 认证API
    ├── memberService.js       # 会员API
    ├── creditsService.js      # 积分API
    ├── paymentService.js      # 支付API
    └── distributionService.js # 分销API
```

---

## 四、详细实施步骤

### 阶段一：基础设施补全（优先级 P0）

#### 步骤 1：通知系统 + 错误边界
1. 创建 `NotificationContext.jsx` + `Toast.jsx` 组件
2. 创建 `ErrorBoundary.jsx` 全局错误边界
3. 在 `App.jsx` 中挂载 `NotificationProvider` 和 `ErrorBoundary`
4. 修复所有 `console.log` 为 Toast 通知
5. 为所有页面添加失败状态处理

#### 步骤 2：用户认证系统
1. 创建 `AuthContext.jsx`（登录/注册/登出/Token管理/自动刷新）
2. 创建认证页面：`Login.jsx`、`Register.jsx`、`ForgotPassword.jsx`
3. 创建 `ProtectedRoute.jsx` 路由守卫
4. 创建 `UserMenu.jsx`（Topbar右侧用户菜单）
5. 创建 `authService.js`（API调用：登录/注册/刷新/验证）
6. 更新 `api.js`：添加认证端点、Token自动附加、401自动跳转登录
7. 更新路由：未登录用户重定向到登录页

#### 步骤 3：挂载 AIProvider + 真实 API 对接
1. 在 `main.jsx` 中挂载 `AIProvider`
2. 将四个页面的 Mock 逻辑替换为 `useAI()` hook 调用
3. 修复 `api.js` 中的超时处理（使用 AbortController）
4. 添加请求重试机制
5. 添加 API 响应拦截器（统一错误处理）
6. 进度条改为基于 SSE/WebSocket 的真实进度

### 阶段二：会员 + 积分系统（优先级 P0）

#### 步骤 4：会员等级系统
1. 创建 `membership.js` 配置：

```
会员等级定义：
┌──────────┬──────────┬──────────┬──────────────┬──────────────┐
│   等级    │  月付价格 │ 年付价格  │  月度积分     │  核心权益     │
├──────────┼──────────┼──────────┼──────────────┼──────────────┤
│ 免费版    │ 免费      │ 免费      │ 每日5积分     │ 基础模型/1K   │
│ 基础版    │ 29元/月   │ 24元/月   │ 200积分/月    │ 全模型/2K/5张 │
│ 专业版    │ 99元/月   │ 79元/月   │ 800积分/月    │ 全模型/4K/9张 │
│ 企业版    │ 299元/月  │ 249元/月  │ 3000积分/月   │ 全部+API+优先 │
└──────────┴──────────┴──────────┴──────────────┴──────────────┘
```

2. 创建 `MemberContext.jsx`（会员状态/权益判断/到期提醒）
3. 创建 `FeatureGate.jsx`（功能门控组件，根据会员等级显示/隐藏/锁定功能）
4. 创建 `PricingPage.jsx`（会员方案选择页）
5. 创建 `MemberBadge.jsx`（Topbar中显示会员等级徽章）
6. 更新四个页面：根据会员等级限制模型选择/分辨率/生成数量
7. 创建 `memberService.js`（API：订阅/取消/升级/降级/续费）

#### 步骤 5：积分管理系统
1. 创建 `credits.js` 配置：

```
积分规则：
- 积分消耗规则（按模型+功能+分辨率动态计算）
  - 基础模型 1K：5积分/张
  - 基础模型 2K：10积分/张
  - 高级模型 1K：10积分/张
  - 高级模型 2K：20积分/张
  - 高级模型 4K：40积分/张
  - 视频生成：2积分/秒
  - 精修：6积分/张
  - 详情页规划：5积分/次

- 积分获取规则
  - 每日签到：+2积分
  - 新用户注册：+20积分
  - 邀请好友注册：+10积分/人
  - 会员月度发放：按等级

- 积分包购买
  - 100积分：9.9元
  - 500积分：39.9元
  - 2000积分：129元
  - 5000积分：269元

- 过期策略
  - 会员月度积分：月底清零
  - 购买积分包：永不过期
  - 赠送积分：30天过期
```

2. 创建 `CreditsContext.jsx`（余额查询/扣减/充值/不足拦截）
3. 创建 `CreditsBalance.jsx`（Topbar中显示积分余额，点击跳转积分中心）
4. 创建 `CreditsDeduct.jsx`（生成前积分扣减确认弹窗）
5. 创建 `CreditsCenter.jsx`（积分中心页面：余额/历史/充值/签到）
6. 更新四个页面：生成前检查积分余额，不足时引导充值
7. 积分消耗与 `models.js` 的 `pricing` 字段关联，动态计算
8. 创建 `creditsService.js`（API：余额查询/扣减/充值/历史/签到）

### 阶段三：支付系统（优先级 P0）

#### 步骤 6：支付集成
1. 创建 `payment.js` 配置（支付方式/回调地址/签名密钥）
2. 创建 `PaymentModal.jsx`（支付方式选择+二维码/跳转）
3. 创建 `paymentService.js`：

```
支付流程：
1. 用户选择商品（会员/积分包）→ 创建订单
2. 选择支付方式（微信/支付宝/Stripe）
3. 前端调用 /api/payment/create → 获取支付参数
4. 微信/支付宝：展示支付二维码或跳转
5. Stripe：使用 Stripe Elements 嵌入表单
6. 支付完成 → 回调通知 → 更新订单状态
7. 前端轮询/WebSocket 获取支付结果
8. 显示支付结果页
```

4. 创建 `OrderList.jsx`（订单列表页）
5. 创建 `PaymentResult.jsx`（支付结果页）
6. 创建 `InvoiceDownload.jsx`（发票下载）
7. 集成微信支付（Native支付/JSAPI支付）
8. 集成支付宝（网页支付/手机网站支付）
9. 集成 Stripe（信用卡/PayPal）
10. 支付回调处理（异步通知+签名验证）

### 阶段四：分销系统（优先级 P1）

#### 步骤 7：分销/推广系统
1. 创建 `distributionService.js`：

```
分销体系设计：
- 推广员等级
  ┌──────────┬──────────┬──────────┬──────────┐
  │   等级    │  首年佣金 │  续费佣金 │  提现门槛 │
  ├──────────┼──────────┼──────────┼──────────┤
  │ 铜牌推广员 │ 20%      │ 5%       │ 50元     │
  │ 银牌推广员 │ 25%      │ 5%       │ 50元     │
  │ 金牌推广员 │ 30%      │ 8%       │ 50元     │
  └──────────┴──────────┴──────────┴──────────┘
  升级条件：银牌=累计推广5人，金牌=累计推广20人

- 推广链接格式：https://xxx.com/?ref=UNIQUE_CODE
- Cookie追踪期：30天
- 佣金结算：T+7（7天后可提现）
- 提现方式：支付宝/微信/银行卡
```

2. 创建 `ReferralLink.jsx`（推广链接生成+复制）
3. 创建推广数据面板 `Dashboard.jsx`（点击/注册/转化/佣金）
4. 创建 `CommissionList.jsx`（佣金明细）
5. 创建 `WithdrawPage.jsx`（提现申请+提现记录）
6. 注册页面支持 `ref` 参数自动绑定推荐人
7. 分享按钮关联推广链接（带ref参数）

### 阶段五：后台管理系统（优先级 P1）

#### 步骤 8：管理后台（类似 New API）
1. 后台路由和布局（`/admin/*`）
2. 仪表盘（用户数/收入/生成量/活跃度）
3. 用户管理（列表/详情/封禁/调整积分/调整会员）
4. 模型管理（启用/禁用/排序/定价/参数配置）
5. 订单管理（列表/详情/退款/发票）
6. 积分管理（发放/扣减/规则配置）
7. 分销管理（推广员审核/佣金设置/提现审批）
8. 系统设置（支付配置/通知配置/公告管理）
9. 操作日志

### 阶段六：体验优化（优先级 P2）

#### 步骤 9：响应式 + 体验优化
1. Topbar 移动端汉堡菜单
2. Sidebar 移动端抽屉式
3. 两栏布局增加 1200px/900px/640px 三个断点
4. VideoGen 参数配置响应式
5. 拖拽上传增加触摸友好替代方案
6. 修复 PROMOTION_EXAMPLES 闪烁问题
7. 修复视频下载跨域问题

#### 步骤 10：i18n + 其他
1. 四个新页面提取文本到 i18n 配置
2. 添加 CSRF Token
3. 前端速率限制（防重复点击）
4. 数据持久化到服务端

---

## 五、API 端点设计

### 5.1 认证 API
```
POST   /api/auth/register          # 注册
POST   /api/auth/login             # 登录
POST   /api/auth/logout            # 登出
POST   /api/auth/refresh           # 刷新Token
POST   /api/auth/forgot-password   # 忘记密码
POST   /api/auth/reset-password    # 重置密码
GET    /api/auth/me                # 获取当前用户信息
```

### 5.2 会员 API
```
GET    /api/membership/plans        # 获取会员方案列表
POST   /api/membership/subscribe    # 订阅会员
POST   /api/membership/cancel       # 取消订阅
POST   /api/membership/upgrade      # 升级会员
GET    /api/membership/status       # 获取当前会员状态
```

### 5.3 积分 API
```
GET    /api/credits/balance         # 查询积分余额
POST   /api/credits/deduct          # 扣减积分
POST   /api/credits/recharge        # 充值积分
GET    /api/credits/history         # 积分变动历史
POST   /api/credits/check-in        # 每日签到
GET    /api/credits/packs           # 获取积分包列表
```

### 5.4 支付 API
```
POST   /api/payment/create          # 创建支付订单
POST   /api/payment/wechat/callback # 微信支付回调
POST   /api/payment/alipay/callback # 支付宝回调
POST   /api/payment/stripe/callback # Stripe回调
GET    /api/payment/orders          # 订单列表
GET    /api/payment/orders/:id      # 订单详情
POST   /api/payment/refund/:id      # 申请退款
GET    /api/payment/invoice/:id     # 下载发票
```

### 5.5 分销 API
```
GET    /api/distribution/referral-code   # 获取推广码
GET    /api/distribution/dashboard       # 推广数据面板
GET    /api/distribution/commissions     # 佣金列表
POST   /api/distribution/withdraw        # 申请提现
GET    /api/distribution/withdrawals     # 提现记录
```

### 5.6 AI 生成 API（已有，需完善）
```
POST   /api/image/generate         # 图像生成（需积分扣减）
POST   /api/image/retouch          # 图像精修（需积分扣减）
POST   /api/video/generate         # 视频生成（需积分扣减）
POST   /api/text/generate          # 文本生成（需积分扣减）
GET    /api/image/task/:id         # 查询生成任务状态
GET    /api/video/task/:id         # 查询视频任务状态
```

### 5.7 管理后台 API
```
GET    /api/admin/dashboard        # 仪表盘数据
GET    /api/admin/users            # 用户列表
PUT    /api/admin/users/:id        # 编辑用户
GET    /api/admin/models           # 模型配置列表
PUT    /api/admin/models/:id       # 编辑模型配置
GET    /api/admin/orders           # 订单列表
POST   /api/admin/orders/:id/refund # 后台退款
GET    /api/admin/distribution     # 分销管理
PUT    /api/admin/settings         # 系统设置
```

---

## 六、数据库核心表设计

```sql
-- 用户表
users (id, email, phone, password_hash, nickname, avatar, membership_level, 
       membership_expires_at, credits_balance, referral_code, referred_by, 
       created_at, updated_at)

-- 会员订阅表
subscriptions (id, user_id, plan_id, status, current_period_start, 
               current_period_end, cancel_at_period_end, created_at)

-- 积分变动表
credits_transactions (id, user_id, type, amount, balance_after, 
                      reference_type, reference_id, description, created_at)

-- 订单表
orders (id, user_id, type, product_id, amount, currency, status, 
        payment_method, payment_id, paid_at, created_at)

-- 推广记录表
referrals (id, referrer_id, referee_id, status, commission_amount, 
           commission_status, created_at)

-- 佣金提现表
withdrawals (id, user_id, amount, method, account_info, status, 
             reviewed_at, created_at)

-- AI生成任务表
generation_tasks (id, user_id, type, model, params, status, progress,
                  result, credits_cost, created_at, completed_at)

-- 模型配置表（后台管理用）
model_configs (id, model_id, category, name, provider, enabled, sort_order,
               pricing, default_params, api_endpoint, created_at, updated_at)
```

---

## 七、实施优先级与时间线

| 阶段 | 内容 | 优先级 | 预估文件数 |
|------|------|--------|-----------|
| 一 | 通知+错误边界+认证+AIProvider挂载 | P0 | ~20 |
| 二 | 会员等级+积分系统 | P0 | ~25 |
| 三 | 支付集成（微信/支付宝/Stripe） | P0 | ~15 |
| 四 | 分销/推广系统 | P1 | ~12 |
| 五 | 管理后台 | P1 | ~30 |
| 六 | 响应式+i18n+优化 | P2 | ~10 |

**总计新增/修改文件约 112 个**

---

## 八、关键技术选型

| 模块 | 技术选型 | 理由 |
|------|---------|------|
| 后端框架 | Node.js + Express / NestJS | 与前端统一技术栈 |
| 数据库 | PostgreSQL | 关系型数据，事务支持好 |
| 缓存 | Redis | 积分余额缓存/会话/限流 |
| 认证 | JWT + Refresh Token | 无状态，易扩展 |
| 微信支付 | wechatpay-node-v3 | 官方SDK |
| 支付宝 | alipay-sdk | 官方SDK |
| Stripe | stripe-node | 官方SDK |
| 实时通信 | WebSocket (Socket.io) | 生成进度推送 |
| 对象存储 | 阿里云OSS / AWS S3 | 图片/视频存储 |
| 消息队列 | Bull (Redis-based) | AI生成任务队列 |
