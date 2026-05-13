# 代理商系统（White-Label Agency System）实施计划

## 一、需求分析

### 1.1 核心需求

| 需求 | 描述 | 优先级 |
|------|------|--------|
| 代理商账户管理 | 管理员将普通用户转为代理商 | P0 |
| 品牌定制 | 代理商上传 Logo、品牌名，前端替换展示 | P0 |
| 子域名映射 | 每个代理商绑定独立子域名 | P0 |
| 加价体系 | 代理商在平台价基础上加价 | P0 |
| 收益追踪 | 差价自动计算为代理商收入 | P0 |
| 提现功能 | 代理商通过支付宝提现 | P1 |

### 1.2 现有系统分析

| 维度 | 现状 | 改造难度 |
|------|------|---------|
| 用户角色 | 仅 `user` / `admin`，无 RBAC | ⚠️ 需新增 `agency` 角色 |
| 定价系统 | 三档策略（经济/均衡/品质），JSON 文件存储 | ✅ 可复用，需扩展代理加价层 |
| 支付系统 | 微信/支付宝双通道，订单+事务 | ✅ 可复用，需新增提现流程 |
| 品牌展示 | `ModelLogo.jsx` + `BRAND_CONFIG` 硬编码 | ⚠️ 需改为动态读取 |
| 前端路由 | React Router，单域名 | ⚠️ 需支持子域名识别 |

---

## 二、市场方案调研

### 2.1 成熟 White-Label SaaS 方案对比

| 方案 | 类型 | 品牌定制 | 代理加价 | 子域名 | 提现 | 成本 | 适配度 |
|------|------|---------|---------|--------|------|------|--------|
| **Vendasta** | 全托管 BaaS | ✅ 完整 | ✅ 内置 | ✅ 自动 | ✅ 内置 | $499/月起 | ⭐⭐⭐⭐ |
| **GoHighLevel** | 营销自动化 | ✅ 完整 | ✅ 内置 | ✅ 自动 | ⚠️ 有限 | $97/月起 | ⭐⭐⭐ |
| **CustomGPT.ai** | AI 聊天白标 | ✅ 完整 | ⚠️ 有限 | ✅ 自动 | ❌ 无 | $99/月起 | ⭐⭐ |
| **BotSailor** | 聊天机器人白标 | ✅ 完整 | ✅ 内置 | ✅ 自动 | ⚠️ 有限 | $49/月起 | ⭐⭐⭐ |
| **自建方案** | 基于现有系统扩展 | ✅ 完全可控 | ✅ 完全可控 | ✅ 可控 | ✅ 可控 | 服务器成本 | ⭐⭐⭐⭐⭐ |

### 2.2 多租户架构方案对比

| 架构 | 描述 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| **共享数据库+tenant_id** | 所有租户共享表，用 tenant_id 隔离 | 成本最低、实现最简 | 数据泄露风险、难定制 | 代理商数量<100 |
| **共享数据库+独立Schema** | 同一数据库，每个租户独立 Schema | 中等隔离、中等成本 | 迁移复杂 | 代理商数量100-1000 |
| **独立数据库** | 每个租户独立数据库 | 隔离最强、可深度定制 | 成本最高、运维复杂 | 大客户/企业级 |

### 2.3 推荐方案：自建 + 共享数据库 + tenant_id

**理由**：
1. 现有系统已有完整的用户/定价/支付体系，无需从零搭建
2. 代理商数量初期不会太多（<100），共享数据库足够
3. 自建方案完全可控，无月费，可深度定制
4. AI SaaS 代理系统比较特殊（需要动态定价+AI调用），通用白标方案无法完美适配

---

## 三、技术架构设计

### 3.1 整体架构

```
用户访问 xx.yourdomain.com
        │
        ▼
   Nginx 反向代理
   (子域名 → 代理商ID 映射)
        │
        ▼
   Express.js 中间件
   (识别代理商 → 注入品牌配置)
        │
   ┌────┴────┐
   ▼         ▼
 前端渲染   API 请求
 (动态品牌) (代理加价计算)
```

### 3.2 数据库新增模型

```prisma
// 代理商表
model Agency {
  id              Int       @id @default(autoincrement())
  userId          Int       @unique           // 关联用户（一对一）
  agencyName      String                      // 代理商品牌名（如"XX AI"）
  agencySlug      String    @unique           // URL标识（如"xx-ai"）
  subdomain       String    @unique           // 子域名（如"xx"）
  logoUrl         String?                     // 品牌 Logo URL
  faviconUrl      String?                     // Favicon URL
  primaryColor    String    @default("#42e6ff") // 品牌主色
  description     String?                     // 品牌描述
  status          String    @default("active") // active/suspended
  
  // 加价配置
  markupType      String    @default("percent") // percent(百分比)/fixed(固定额)
  markupValue     Float     @default(0)         // 加价值（%或固定金额）
  minMarkup       Float     @default(0)         // 最低加价
  maxMarkup       Float?                       // 最高加价限制
  
  // 收益
  totalRevenue    Float     @default(0)         // 累计收益
  availableBalance Float    @default(0)         // 可提现余额
  frozenBalance   Float     @default(0)         // 冻结余额（提现审核中）
  totalWithdrawn  Float     @default(0)         // 累计已提现
  
  // 配置
  customDomain    String?                     // 自定义域名（可选）
  allowSignup     Boolean   @default(true)     // 是否允许注册
  maxUsers        Int       @default(1000)     // 最大用户数
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
  users           AgencyUser[]
  withdrawals     AgencyWithdrawal[]
  revenueRecords  AgencyRevenueRecord[]
  brandConfig     AgencyBrandConfig?
}

// 代理商下属用户关联表
model AgencyUser {
  id          Int       @id @default(autoincrement())
  agencyId    Int
  userId      Int
  joinedAt    DateTime  @default(now())
  
  agency      Agency    @relation(fields: [agencyId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  
  @@unique([agencyId, userId])
}

// 代理商收益记录
model AgencyRevenueRecord {
  id              Int       @id @default(autoincrement())
  agencyId        Int
  userId          Int                           // 产生收益的用户
  orderId         String?                       // 关联订单号
  type            String                        // markup(加价收益)/commission(佣金)
  basePrice       Float                         // 平台基础价
  agencyPrice     Float                         // 代理商售价
  revenue         Float                         // 收益金额 = agencyPrice - basePrice
  status          String    @default("settled") // settled/pending/refunded
  createdAt       DateTime  @default(now())
  
  agency          Agency    @relation(fields: [agencyId], references: [id])
}

// 代理商提现记录
model AgencyWithdrawal {
  id              Int       @id @default(autoincrement())
  agencyId        Int
  amount          Float                         // 提现金额
  fee             Float     @default(0)         // 手续费
  actualAmount    Float                         // 实际到账
  method          String    @default("alipay")  // alipay/bank
  accountInfo     String                        // 支付宝账号/银行卡号
  accountName     String                        // 收款人姓名
  status          String    @default("pending") // pending/approved/rejected/completed
  reviewedAt      DateTime?
  reviewedBy      Int?                          // 审核管理员ID
  rejectReason    String?
  completedAt     DateTime?
  transactionId   String?                       // 转账流水号
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  agency          Agency    @relation(fields: [agencyId], references: [id])
}

// 代理商品牌详细配置（可选，用于深度定制）
model AgencyBrandConfig {
  id              Int       @id @default(autoincrement())
  agencyId        Int       @unique
  heroTitle       String?                       // 首页主标题
  heroSubtitle    String?                       // 首页副标题
  footerText      String?                       // 页脚文字
  ogImage         String?                       // 社交分享图
  customCss       String?                       // 自定义CSS
  hidePoweredBy   Boolean   @default(false)     // 隐藏"由小马AI提供技术"
  enabledModels   String?                       // 启用的模型列表(JSON数组)
  disabledFeatures String?                      // 禁用的功能列表(JSON数组)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  agency          Agency    @relation(fields: [agencyId], references: [id])
}
```

### 3.3 User 模型扩展

```prisma
model User {
  // ... 现有字段 ...
  role            String    @default("user")    // user/admin/agency
  agencyId        Int?                          // 所属代理商ID（代理商下属用户）
  
  agency          Agency?   @relation(fields: [agencyId], references: [id])
  agencyUser      AgencyUser[]
}
```

### 3.4 核心中间件设计

```
请求 → agencyResolver 中间件 → 注入 req.agency → 后续处理
                │
                ├─ 从子域名提取 agencySlug
                ├─ 查询 Agency 表获取配置
                ├─ 注入品牌信息到 req.agency
                └─ 无代理商信息则使用默认品牌
```

### 3.5 价格计算流程

```
用户请求生成图片
    │
    ▼
1. 识别用户所属代理商（通过 req.agency 或 user.agencyId）
    │
    ▼
2. 计算平台基础价（pricingEngine 现有逻辑）
    basePrice = upstreamPrice × (1 + strategyMarkup/100)
    │
    ▼
3. 计算代理商加价
    agencyPrice = basePrice × (1 + agency.markupValue/100)  // 百分比加价
    或
    agencyPrice = basePrice + agency.markupValue              // 固定额加价
    │
    ▼
4. 用户支付 agencyPrice
    │
    ▼
5. 平台收入 basePrice，代理商收入 = agencyPrice - basePrice
    │
    ▼
6. 记录 AgencyRevenueRecord
    扣减用户 credits（agencyPrice）
    平台确认 basePrice
    代理商收益 = agencyPrice - basePrice → Agency.availableBalance
```

### 3.6 子域名路由设计

```
Nginx 配置：
  server_name *.yourdomain.com yourdomain.com;

Express 中间件：
  agencyResolver(req, res, next) {
    const host = req.hostname;
    if (host === 'yourdomain.com' || host === 'www.yourdomain.com') {
      req.agency = null;  // 默认品牌
    } else {
      const slug = host.split('.')[0];  // 提取子域名
      req.agency = await findAgencyBySlug(slug);
    }
    next();
  }

前端识别：
  前端通过 /api/agency/config 获取当前品牌配置
  React Context 提供品牌信息全局访问
```

---

## 四、实施步骤

### 阶段一：数据库与后端基础（2-3天）

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 1.1 | 扩展 Prisma Schema，新增 Agency 等模型 | `schema.prisma` |
| 1.2 | 执行数据库迁移 | `npx prisma migrate dev` |
| 1.3 | 创建 AgencyService 服务 | `services/agencyService.js`（新建） |
| 1.4 | 创建 agencyResolver 中间件 | `middleware/agencyResolver.js`（新建） |
| 1.5 | 扩展 User 模型，支持 agencyId | `schema.prisma` |
| 1.6 | 修改 authService，注册时关联代理商 | `services/authService.js` |

### 阶段二：代理商管理后台（2-3天）

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 2.1 | 创建代理商管理路由 | `routes/agencyRoutes.js`（新建） |
| 2.2 | 管理员：创建/编辑/停用代理商 | agencyRoutes |
| 2.3 | 管理员：审核提现申请 | agencyRoutes |
| 2.4 | 代理商：品牌配置（Logo/名称/颜色） | agencyRoutes |
| 2.5 | 代理商：加价设置 | agencyRoutes |
| 2.6 | 代理商：收益查看与提现 | agencyRoutes |
| 2.7 | 代理商：下属用户管理 | agencyRoutes |

### 阶段三：定价与收益系统（2-3天）

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 3.1 | 扩展 pricingEngine，支持代理加价层 | `services/pricingEngine.js` |
| 3.2 | 修改 creditsService，扣费时计算代理收益 | `services/creditsService.js` |
| 3.3 | 创建收益记录服务 | `services/agencyRevenueService.js`（新建） |
| 3.4 | 创建提现服务（支付宝转账） | `services/agencyWithdrawalService.js`（新建） |
| 3.5 | 修改 imageRoutes/videoRoutes，注入代理定价 | `routes/imageRoutes.js`, `routes/videoRoutes.js` |

### 阶段四：前端品牌系统（2-3天）

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 4.1 | 创建 AgencyContext | `contexts/AgencyContext.jsx`（新建） |
| 4.2 | 创建品牌配置 API | 前端 `config/agency.js`（新建） |
| 4.3 | 修改 Topbar，动态显示品牌名/Logo | `components/Topbar.jsx` |
| 4.4 | 修改 CreativeDock，动态品牌 | `components/CreativeDock.jsx` |
| 4.5 | 修改 HeroShowcase，动态品牌 | `components/HeroShowcase.jsx` |
| 4.6 | 修改 ModelLogo，支持代理商覆盖 | `components/ModelLogo.jsx` |
| 4.7 | 修改 Pricing 页面，显示代理加价后价格 | `pages/member/Pricing.jsx` |
| 4.8 | 修改 CreditsCenter，显示代理价格 | `pages/credits/CreditsCenter.jsx` |

### 阶段五：子域名与部署（1-2天）

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 5.1 | Nginx 泛域名配置 | 服务器配置 |
| 5.2 | DNS 泛解析配置 | 域名管理 |
| 5.3 | server.js 注册 agencyResolver 中间件 | `server.js` |
| 5.4 | Vite 配置支持多域名 | `vite.config.js` |
| 5.5 | SSL 证书配置（通配符） | 服务器配置 |

### 阶段六：测试与文档（1-2天）

| 步骤 | 内容 |
|------|------|
| 6.1 | 代理商全流程测试（创建→配置→用户注册→使用→收益→提现） |
| 6.2 | 子域名访问测试 |
| 6.3 | 品牌展示验证 |
| 6.4 | 收益计算准确性验证 |
| 6.5 | 更新部署文档 |

---

## 五、关键设计决策

### 5.1 为什么选择共享数据库 + agencyId 而非独立数据库？

| 因素 | 共享数据库 | 独立数据库 |
|------|-----------|-----------|
| 实现成本 | 低（加字段即可） | 高（需数据路由层） |
| 运维复杂度 | 低 | 高 |
| 数据隔离 | 逻辑隔离 | 物理隔离 |
| 适合规模 | <100 代理商 | >100 代理商 |
| 当前阶段 | ✅ 推荐 | ❌ 过度设计 |

### 5.2 为什么自建而非使用 Vendasta/GoHighLevel？

1. **AI 定价特殊性**：通用白标方案无法处理"上游API成本+平台加价+代理加价"的三层定价
2. **成本**：Vendasta $499/月，自建仅需服务器成本
3. **可控性**：自建可深度定制，第三方方案受限
4. **数据安全**：用户数据在自己服务器

### 5.3 提现方案选择

| 方案 | 优点 | 缺点 | 推荐 |
|------|------|------|------|
| 支付宝转账API | 自动化、实时 | 需企业支付宝、有手续费 | ✅ 首选 |
| 手动转账+确认 | 无技术门槛 | 效率低、体验差 | 备选 |
| 微信企业付款 | 自动化 | 仅限微信、限额 | 补充 |

---

## 六、风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|---------|
| 数据泄露（代理商看到其他代理数据） | 高 | 所有查询强制加 agencyId 过滤，中间件自动注入 |
| 代理加价过高导致用户流失 | 中 | 设置 maxMarkup 上限，默认不超过50% |
| 子域名解析延迟 | 低 | DNS 预配置泛解析，TTL 设置较短 |
| 提现欺诈 | 高 | 最低提现额度、审核机制、风控规则 |
| 品牌合规风险 | 中 | 代理商协议、内容审核机制 |

---

## 七、预期成果

完成后的系统能力：

1. ✅ 管理员一键将用户升级为代理商
2. ✅ 代理商独立后台配置品牌（Logo/名称/颜色/域名）
3. ✅ 用户访问子域名看到代理商品牌
4. ✅ 代理商自主设置加价，系统自动计算收益
5. ✅ 代理商通过支付宝提现收益
6. ✅ 平台管理员审核提现、管理代理商
7. ✅ 完整的收益报表和用户管理