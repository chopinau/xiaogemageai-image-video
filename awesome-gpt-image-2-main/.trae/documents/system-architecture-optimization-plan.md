# 系统架构优化与功能开发计划

## 一、当前系统架构现状与问题清单

### 1.1 技术栈概览

* **前端**: React 19 + Vite 7 + React Router (HashRouter) + Context状态管理

* **后端**: Express 4 + Prisma 6 + SQLite

* **部署**: 腾讯云轻量服务器 (114.132.163.162) + Nginx反向代理 + PM2

### 1.2 核心概念澄清

* **供应商(Supplier/Provider)**: 仅指API上游配置项（URL + API Key），在管理后台的"上游监控"中配置，**不涉及独立账户体系**

* **代理商(Agency)**: 拥有独立账户、品牌定制、加价策略、收益提现的合作伙伴，**需要完整的账户界面**

### 1.3 架构问题清单

| #  | 问题                                                                                      | 严重度 | 影响          |
| -- | --------------------------------------------------------------------------------------- | --- | ----------- |
| A1 | **双重认证体系**: pricingAdminRoutes用`x-admin-key` Header认证，其他管理路由用JWT Bearer+adminMiddleware | 高   | 安全漏洞        |
| A2 | **API\_BASE管理混乱**: 已修复但架构脆弱，9个文件各自声明已统一到api.js导入                                        | 高   | 已导致JSON解析错误 |
| A3 | **前端apiCall无安全响应解析**: Admin.jsx和PricingAdmin.jsx的apiCall直接用`res.json()`                 | 高   | 供应商添加报错根因   |
| A4 | **策略路由缺少admin权限**: strategyRoutes仅用authMiddleware，任何登录用户可修改策略                           | 高   | 权限漏洞        |
| A5 | **ADMIN\_KEY硬编码前端**: PricingAdmin.jsx和Admin.jsx中`ADMIN_KEY='admin123'`暴露在客户端代码          | 高   | 安全风险        |
| A6 | **供应商数据存JSON文件**: upstreamProviders.json存文件而非数据库，无事务保护                                  | 中   | 数据丢失风险      |
| A7 | **代理商系统前端界面缺失**: 后端Agency API已完善，但前端缺少代理商专属仪表盘页面                                        | 高   | 代理商功能不可用    |
| A8 | **无统一错误码体系**: 错误信息为中文描述字符串，无结构化错误码                                                      | 中   | 用户体验差       |
| A9 | **代理商品牌配置JSON.parse无保护**: agencyRoutes.js中enabledModels/disabledFeatures解析无try-catch    | 低   | 运行时崩溃       |

***

## 二、任务1 - 系统架构分析与优化方案

### 阶段1: 架构规范统一（优先级：最高）

#### 1.1 统一认证体系

* **目标**: 废除`x-admin-key`认证方式，全部改用JWT Bearer Token + adminMiddleware

* **步骤**:

  1. 修改`pricingAdminRoutes.js`的`requireAuth`函数，改为使用`authMiddleware`+`adminMiddleware`
  2. 修改前端`PricingAdmin.jsx`和`Admin.jsx`的`apiCall`函数，使用JWT Token替代`x-admin-key`
  3. 删除前端硬编码的`ADMIN_KEY`
  4. 修改`strategyRoutes.js`添加`adminMiddleware`

* **文件变更**:

  * `server/routes/pricingAdminRoutes.js` - 替换requireAuth为authMiddleware+adminMiddleware

  * `server/routes/strategyRoutes.js` - 添加adminMiddleware

  * `src/pages/admin/PricingAdmin.jsx` - 移除ADMIN\_KEY，使用getAuthHeaders()

  * `src/pages/admin/Admin.jsx` - 同上

#### 1.2 统一API响应处理

* **目标**: 所有前端API调用使用`safeFetch`，消除JSON解析风险

* **步骤**:

  1. 增强`src/config/api.js`中的`safeFetch`，支持结构化错误码
  2. 重构`PricingAdmin.jsx`和`Admin.jsx`的`apiCall`，改用`safeFetch`封装
  3. 定义统一错误码枚举（NETWORK\_ERROR/SERVER\_ERROR/AUTH\_ERROR/VALIDATION\_ERROR/NOT\_FOUND）

* **文件变更**:

  * `src/config/api.js` - 增强safeFetch

  * `src/pages/admin/PricingAdmin.jsx` - 重构apiCall使用safeFetch

  * `src/pages/admin/Admin.jsx` - 重构apiCall使用safeFetch

### 阶段2: 技术债务清理（优先级：高）

#### 2.1 供应商数据迁移到数据库

* **目标**: 将upstreamProviders.json迁移到Prisma管理

* **步骤**:

  1. 在schema.prisma中添加Provider模型
  2. 执行Prisma迁移
  3. 重写upstreamPriceFetcher.js的addProvider/getProviders/removeProvider使用Prisma
  4. 编写数据迁移脚本将现有JSON数据导入数据库

#### 2.2 结构化错误码体系

* **目标**: 后端返回结构化错误码，前端根据错误码分类处理

* **步骤**:

  1. 定义`server/utils/errorCodes.js`错误码枚举
  2. 修改errorHandler中间件支持错误码
  3. 前端添加错误码到用户友好消息的映射

***

## 三、任务2 - 用户身份管理功能模块（代理商账户体系）

### 3.1 需求分析

当前系统用户角色: `user`(普通用户) / `admin`(管理员) / `agency`(代理商)

**核心需求**: 管理员可将普通用户切换为代理商，代理商拥有专属账户界面

**供应商澄清**: 供应商仅是管理后台中的API上游配置（URL + API Key），不需要独立账户界面

### 3.2 后端实现

#### 3.2.1 用户角色变更API

在`server/routes/authRoutes.js`中添加:

```
PUT /api/auth/role  (adminMiddleware)
  请求: { userId: int, role: 'user'|'agency' }
  响应: { success: true, data: { user, accessToken, refreshToken } }
  逻辑:
    1. 验证目标角色只能是user或agency
    2. 如果切换为agency:
       a. 更新User.role为'agency'
       b. 如果该用户没有Agency记录，自动创建Agency（使用默认配置）
       c. 签发新JWT Token（包含更新后的role）
    3. 如果切换回user:
       a. 更新User.role为'user'
       b. 保留Agency记录（不删除，仅标记status为'inactive'）
       c. 签发新JWT Token
    4. 返回更新后的用户信息和新Token
```

#### 3.2.2 代理商账户界面API（已有，需补充）

现有`agencyRoutes.js`已提供:

* `GET /agency/me` - 获取代理商信息

* `PUT /me/brand` - 更新品牌配置

* `PUT /me/markup` - 更新加价策略

* `GET /me/revenue` - 收益记录

* `POST /me/withdraw` - 申请提现

* `GET /me/users` - 代理商用户列表

需要补充:

```
GET  /api/agency/me/stats     - 代理商统计数据（用户数/收益/订单数）
GET  /api/agency/me/orders    - 代理商相关订单列表
GET  /api/agency/me/dashboard - 代理商仪表盘汇总数据
```

#### 3.2.3 代理商权限中间件

已有`agencyResolver.js`中间件处理子域名解析。需确保agency角色用户可访问代理商专属路由:

```javascript
export function agencyMiddleware(req, res, next) {
  if (!req.user || (req.user.role !== 'agency' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, error: '需要代理商权限' });
  }
  next();
}
```

### 3.3 前端实现

#### 3.3.1 管理员用户身份修改界面

在`Admin.jsx`的用户管理Tab中添加:

1. 用户列表中每行添加"身份"列，显示当前角色（普通用户/代理商/管理员）
2. 对非管理员用户添加"设为代理商"/"设为普通用户"切换按钮
3. 点击后弹出确认对话框，说明角色变更的影响
4. 确认后调用`PUT /api/auth/role`
5. 角色变更成功后，更新本地Token和用户信息

#### 3.3.2 代理商专属仪表盘页面

创建`src/pages/agency/AgencyDashboard.jsx`，包含:

**概览卡片**:

* 总用户数 / 本月新增用户

* 总收益 / 可用余额 / 冻结金额

* 本月提现金额

**品牌配置区**:

* 品牌名称/Logo/主色调编辑

* 自定义标题/副标题

* 自定义CSS（高级）

* 预览效果

**加价策略区**:

* 加价类型（百分比/固定金额）

* 加价数值

* 最低/最高加价限制

**收益管理区**:

* 收益趋势图表

* 收益明细列表

* 申请提现按钮

**用户管理区**:

* 代理商下用户列表

* 用户注册时间/消费金额

#### 3.3.3 路由和导航

在`App.jsx`中添加代理商路由:

```jsx
<Route path="/agency" element={<AgencyRoute><AgencyDashboard /></AgencyRoute>} />
<Route path="/agency/brand" element={<AgencyRoute><AgencyBrandConfig /></AgencyRoute>} />
<Route path="/agency/revenue" element={<AgencyRoute><AgencyRevenue /></AgencyRoute>} />
<Route path="/agency/users" element={<AgencyRoute><AgencyUsers /></AgencyRoute>} />
```

AgencyRoute守卫: 检查`user.role === 'agency' || user.role === 'admin'`

#### 3.3.4 差异化功能显示逻辑

在`Topbar.jsx`和导航组件中:

* `user`角色: 创作、作品、充值、分销

* `agency`角色: 创作、作品、充值 + **代理商中心**（品牌/收益/用户）

* `admin`角色: 全部功能 + 管理后台

#### 3.3.5 实时生效机制

* 角色变更API返回新的accessToken和refreshToken

* 前端收到响应后更新localStorage中的Token和用户信息

* AuthContext触发重新渲染，导航菜单自动更新

* 无需用户重新登录

### 3.4 兼容性验证

* 充值流程: 代理商角色仍可充值算力（代理商本身也是平台用户）

* 分销功能: 代理商角色可参与分销

* 加价逻辑: 代理商用户访问时，价格自动加上代理商加价

* 品牌定制: 通过子域名访问时，自动加载代理商品牌配置

***

## 四、任务3 - 修复供应商添加功能异常

### 4.1 根因定位

**错误**: "添加失败: Failed to execute 'json' on 'Response': Unexpected end of JSON input"

**根因**: `PricingAdmin.jsx`的`addProvider()`函数使用`apiCall()`返回的原始Response直接调用`res.json()`，当后端返回非JSON内容时抛出此错误。

**后端验证**: `pricingAdminRoutes.js`的POST handler逻辑正确，会返回JSON。但以下场景可能导致空响应:

1. `UpstreamFetcher.addProvider()`内部`saveProviders()`写文件失败
2. Express中间件异常导致请求被截断
3. CORS预检请求失败
4. 认证失败（x-admin-key不匹配）返回401但前端未正确处理

### 4.2 修复步骤

#### 4.2.1 前端修复 - 重构apiCall使用safeFetch

```javascript
async function apiCall(path, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  return safeFetch(`${API_BASE}${path}`, { ...options, headers });
}
```

#### 4.2.2 前端修复 - 所有apiCall调用处适配safeFetch返回值

apiCall现在返回`{ response, data }`而非原始Response，所有调用处需适配:

```javascript
// 修改前
const res = await apiCall('/pricing-admin/upstream/providers', { method: 'POST', body: JSON.stringify(newProvider) });
const data = await res.json();

// 修改后
const { response, data } = await apiCall('/pricing-admin/upstream/providers', { method: 'POST', body: JSON.stringify(newProvider) });
if (!response.ok || !data.success) {
  throw new Error(data.error || '操作失败');
}
```

#### 4.2.3 后端修复 - 增强addProvider错误处理

在`pricingAdminRoutes.js`中为POST /upstream/providers添加try-catch:

```javascript
router.post('/upstream/providers', requireAuth, (req, res) => {
  try {
    const { name, url, apiKey } = req.body;
    if (!name || !url || !apiKey) {
      return res.status(400).json({ success: false, error: '缺少 name, url 或 apiKey' });
    }
    const provider = UpstreamFetcher.addProvider(name, url, apiKey);
    if (!provider) {
      return res.status(500).json({ success: false, error: '供应商添加失败，请检查数据目录权限' });
    }
    res.json({ success: true, provider: { ...provider, apiKey: provider.apiKey.substring(0, 8) + '...' } });
  } catch (err) {
    res.status(500).json({ success: false, error: `添加供应商失败: ${err.message}` });
  }
});
```

#### 4.2.4 后端修复 - upstreamPriceFetcher.js增强

在`addProvider()`中添加try-catch，返回null表示失败

#### 4.2.5 前端错误分类提示

在catch中区分错误类型:

* "服务器未启动或API不可用" → safeFetch检测到HTML响应

* "服务器响应格式错误" → safeFetch检测到非JSON响应

* 后端返回的data.error → 显示具体错误信息

* 网络错误 → "网络连接失败，请检查网络"

***

## 五、任务4 - 系统部署验证与全面测试

### 5.1 数据库配置验证

1. SSH连接腾讯云服务器(114.132.163.162)
2. 检查`/opt/ai-saas/server/.env`中DATABASE\_URL配置
3. 检查SQLite数据库文件是否存在且可读写
4. 执行`npx prisma db push`确保schema同步
5. 执行`npx prisma db seed`确保种子数据存在

### 5.2 后端服务验证

1. 检查PM2进程状态: `pm2 list`
2. 检查后端日志: `pm2 logs ai-saas --lines 50`
3. 测试API健康端点: `curl http://localhost:3000/api/health`
4. 测试登录端点: `curl -X POST http://localhost:3000/api/auth/login`
5. 测试404端点返回JSON: `curl http://localhost:3000/api/nonexistent`

### 5.3 Nginx配置验证

1. 检查Nginx配置: `cat /etc/nginx/sites-available/ai-saas`
2. 验证代理转发: `curl -H "Host: ps.xiaomageai.com" http://localhost/api/health`
3. 检查SSL证书状态
4. 重启Nginx: `nginx -t && systemctl reload nginx`

### 5.4 前端部署验证

1. 本地构建: `npm run build`
2. 上传dist到服务器
3. 检查dist目录完整性: `ls -la /opt/ai-saas/dist/assets/`
4. 浏览器访问<https://ps.xiaomageai.com验证页面加载>

### 5.5 功能测试用例

| 模块    | 测试项                       | 预期结果          |
| ----- | ------------------------- | ------------- |
| 登录    | <admin@ai.com>/admin123登录 | 成功，跳转首页       |
| 登录    | <test@ai.com>/test123登录   | 成功，普通用户权限     |
| 登录    | 错误密码登录                    | 提示"邮箱或密码错误"   |
| 图片生成  | 选择GPT Image 2，输入提示词，点击生成  | 返回生成的图片       |
| 视频生成  | 选择Kling，输入提示词，点击生成        | 返回异步任务，轮询完成   |
| 充值    | 点击充值，选择算力包                | 创建订单          |
| 管理后台  | 访问/admin                  | 管理员可见，普通用户不可见 |
| 供应商管理 | 添加供应商(URL+API Key)        | 成功添加，列表刷新     |
| 供应商管理 | 删除供应商                     | 成功删除          |
| 价格同步  | 点击同步上游价格                  | 返回同步结果        |
| 算力签到  | 每日签到                      | 获得0.02算力      |
| 工单    | 提交工单                      | 成功创建          |
| 代理商   | 管理员将用户设为代理商               | 角色变更成功，导航更新   |
| 代理商   | 代理商登录访问/agency            | 可见代理商仪表盘      |
| 代理商   | 代理商修改品牌配置                 | 配置保存成功        |
| 代理商   | 代理商查看收益                   | 显示收益数据        |

### 5.6 数据交互验证

1. 管理后台修改价格 → 创作页面价格同步更新
2. 用户充值 → 算力余额实时更新
3. 生成内容 → 算力扣减 → 交易记录生成
4. 代理商加价 → 代理商用户看到加价后价格
5. 角色变更 → Token更新 → 导航菜单实时变化

***

## 六、任务5 - 代理商账号测试环境

### 6.1 创建测试账号

1. 通过API创建代理商测试账号:

```
POST /api/auth/register
{ email: "agency@test.com", password: "agency123", nickname: "测试代理商" }
```

1. 管理员将该用户设为代理商:

```
PUT /api/auth/role (admin)
{ userId: <新用户ID>, role: "agency" }
```

1. 或通过管理后台UI操作

### 6.2 代理商 vs 普通用户功能对比

| 功能模块        | 普通用户(user) | 代理商(agency) | 管理员(admin) |
| ----------- | ---------- | ----------- | ---------- |
| AI创作(图片/视频) | ✅          | ✅           | ✅          |
| 我的作品        | ✅          | ✅           | ✅          |
| 充值中心        | ✅          | ✅           | ✅          |
| 推广分销        | ✅          | ✅           | ✅          |
| **代理商中心**   | ❌          | ✅           | ✅          |
| **品牌配置**    | ❌          | ✅           | ✅          |
| **加价策略**    | ❌          | ✅           | ✅          |
| **收益管理**    | ❌          | ✅           | ✅          |
| **代理商用户**   | ❌          | ✅           | ✅          |
| **提现功能**    | ❌          | ✅           | ✅          |
| 管理后台        | ❌          | ❌           | ✅          |
| 用户管理        | ❌          | ❌           | ✅          |
| 供应商配置       | ❌          | ❌           | ✅          |
| 系统设置        | ❌          | ❌           | ✅          |

### 6.3 代理商特有业务流程

1. **品牌定制**: 代理商设置品牌名称/Logo/主色调 → 通过子域名访问时展示定制品牌
2. **加价策略**: 代理商设置加价百分比/固定金额 → 其用户看到的价格=平台价+加价
3. **收益累计**: 代理商用户消费时 → 加价部分自动计入代理商收益
4. **提现流程**: 代理商申请提现 → 管理员审批 → 完成打款

### 6.4 测试验证标准

1. 代理商登录后可见"代理商中心"菜单
2. 代理商不可见管理员菜单
3. 代理商可配置品牌（名称/Logo/颜色）
4. 代理商可设置加价策略
5. 代理商可查看收益和提现
6. 代理商可管理自己的用户列表
7. 普通用户不可见任何代理商功能
8. 管理员可将普通用户切换为代理商
9. 管理员可将代理商切换回普通用户
10. 角色切换后功能菜单实时更新，无需重新登录

***

## 七、实施路径与优先级

### 第一阶段（立即执行）- 修复关键Bug

1. ✅ 修复API双重前缀问题（已完成）
2. 修复供应商添加JSON解析错误（重构apiCall使用safeFetch）
3. 后端addProvider添加try-catch
4. 适配PricingAdmin.jsx和Admin.jsx中所有apiCall调用

### 第二阶段 - 安全加固 + 代理商后端

1. 统一认证体系（废除x-admin-key，改用JWT+adminMiddleware）
2. 策略路由添加adminMiddleware
3. 添加PUT /api/auth/role接口
4. 添加代理商仪表盘API（/agency/me/stats, /agency/me/dashboard）
5. 添加agencyMiddleware

### 第三阶段 - 代理商前端界面

1. 创建代理商仪表盘页面（AgencyDashboard.jsx）
2. 创建品牌配置页面（AgencyBrandConfig.jsx）
3. 创建收益管理页面（AgencyRevenue.jsx）
4. 创建用户管理页面（AgencyUsers.jsx）
5. 添加AgencyRoute守卫和路由配置
6. 管理员用户管理中添加角色切换功能
7. Topbar导航根据角色差异化显示

### 第四阶段 - 部署验证与测试

1. 本地构建前端
2. 上传到腾讯云服务器
3. 重启后端服务
4. 执行全面功能测试
5. 创建代理商测试账号
6. 生成测试报告

### 第五阶段（后续迭代）- 架构优化

1. 供应商数据迁移到数据库
2. 结构化错误码体系
3. 前端模型配置动态化

***

## 八、风险控制

| 风险                  | 概率 | 影响 | 缓解措施                            |
| ------------------- | -- | -- | ------------------------------- |
| 认证体系切换导致管理后台不可用     | 中  | 高  | 分步切换，先保留双认证过渡期                  |
| 角色变更后Token未更新       | 中  | 中  | 变更角色后重新签发Token，前端更新localStorage |
| 数据库迁移失败             | 低  | 高  | 迁移前备份SQLite文件                   |
| 供应商数据JSON文件损坏       | 低  | 中  | 添加原子写入（先写临时文件再rename）           |
| 前端构建后资源404          | 中  | 高  | 部署后验证所有JS/CSS文件可访问              |
| 代理商品牌配置JSON.parse崩溃 | 低  | 中  | 添加try-catch保护，fallback到默认值      |

