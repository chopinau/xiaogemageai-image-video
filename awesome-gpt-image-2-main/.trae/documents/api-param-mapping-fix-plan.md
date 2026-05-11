# API一条龙打通 + 分组价格选择 + UI参数优化

## 一、核心发现

### 1.1 API 接入方式完全错误！

**当前后端** **`lingkeClient.js`** 使用的是旧端点：

* 图片：`POST /v1/images/generations` ❌ 已废弃

* 视频：`POST /kling/v1/videos/text2video` ❌ 已废弃

**小马AI/Lingke API 正确方式**（来自 `/v1/skills/guide`）：

* **所有图片/视频/音频统一走**: `POST /v1/media/generate`

* **异步轮询**: `GET /v1/skills/task-status?task_id={task_id}`

* **结果获取**: 当 `is_final=true` 时，从 `result_url` 获取结果

这就是为什么扣费但没图片！旧端点可能被重定向到新端点，但返回格式不同，解析失败。

### 1.2 分组价格机制

小马AI API 的 `GET /v1/skills/models/{name}/pricing` 返回：

```json
{
  "channel_groups": [
    {
      "group_name": "BR-1K",
      "is_active": true,
      "base_price": 0.0576,
      "success_rate_24h": 94.05,
      "avg_response_seconds": 49.1,
      "option_prices": []
    },
    {
      "group_name": "DE-gpt-image-2",
      "is_active": true,
      "base_price": 0.2218,
      "success_rate_24h": 64.12,
      "avg_response_seconds": 217.3
    }
  ]
}
```

**关键发现**：

* 同一模型有多个分组，价格差异巨大（如 GPT Image 2: ¥0.0576 vs ¥0.576，差10倍！）

* 每个分组有 `is_active`、`success_rate_24h`、`avg_response_seconds`

* **不能在请求中指定分组** — 分组选择由 API Key 的渠道策略决定

* 渠道策略有4种：价格优先、速度优先、成功率优先、自定义

* **要使用不同分组，需要创建不同的 API Key，各自配置不同策略**

### 1.3 IS\_DEMO 判断错误

`CreativeHub.jsx` 用 `!import.meta.env.VITE_API_URL` 判断，但项目实际用的是 `VITE_API_BASE_URL`，导致永远走演示模式。

### 1.4 参数传递断裂

前端 → 后端 → API 的参数映射完全断裂：

* 前端传 `aspect_ratio`、`resolution`、`n` → 后端 `lingkeClient` 只传 `model`/`prompt`/`n`/`size`/`quality`

* `n` 参数在 `imageService.js` 中被硬编码为 `options.n || 1`，不传给 lingkeClient

* `aspect_ratio`、`resolution` 等参数完全丢失

***

## 二、修复方案

### Phase 1：彻底重写 API 调用层（一条龙打通）

#### Step 1.1：重写 `lingkeClient.js` — 使用正确的 API 端点

**核心变更**：所有图片/视频生成统一走 `POST /v1/media/generate` + 轮询 `GET /v1/skills/task-status`

```javascript
async mediaGenerate(model, params) {
  // 统一媒体生成端点
  return this.request('POST', '/v1/media/generate', {
    body: { model, ...params }
  });
}

async getTaskStatus(taskId) {
  return this.request('GET', `/v1/skills/task-status?task_id=${taskId}`);
}

async pollUntilFinal(taskId, onProgress, maxWait = 300000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const result = await this.getTaskStatus(taskId);
    if (result.success) {
      const { is_final, progress, result_url } = result.data;
      if (onProgress) onProgress(progress);
      if (is_final) {
        return { success: true, result_url, data: result.data };
      }
    }
    await this._sleep(5000); // 5秒轮询间隔
  }
  return { success: false, error: 'Task timed out' };
}
```

#### Step 1.2：重写 `imageService.js` — 透传所有参数

```javascript
async _syncGenerate(model, prompt, options) {
  const params = { prompt, ...options };
  const result = await lingkeClient.mediaGenerate(model, params);
  
  if (!result.success) return result;
  
  const taskId = result.data?.task_id || result.data?.data?.task_id;
  if (!taskId) return { success: false, error: 'No task_id returned' };
  
  const finalResult = await lingkeClient.pollUntilFinal(taskId);
  if (!finalResult.success) return finalResult;
  
  // 从 result_url 获取结果
  const resultData = await fetch(finalResult.result_url).then(r => r.json());
  const images = extractImagesFromResponse(resultData);
  
  return { success: true, images, model, timestamp: Date.now() };
}
```

#### Step 1.3：修复前端 IS\_DEMO + 参数传递

* `CreativeHub.jsx`: `IS_DEMO = !import.meta.env.VITE_API_BASE_URL`

* `handleSend`: 把所有 `modelParams` 直接透传给后端

* 创建 `.env`: `VITE_API_BASE_URL=http://localhost:3000/api`

#### Step 1.4：统一参数名

所有模型参数名与 API 文档对齐：

* `aspect_ratio`（统一，不用 `aspectRatio`）

* `resolution`（统一，不用 `imageSize`）

* `size`（GPT Image 2 专用）

* `duration`（视频时长，秒）

* `mode`（视频模式：std/pro）

* `n`（生成数量）

### Phase 2：分组价格选择机制

#### Step 2.1：获取并展示分组价格

**新建**: `src/services/pricingService.js` — 调用小马API获取实时价格

```javascript
export async function getModelPricing(modelName) {
  const response = await fetch(`${API_BASE}/pricing/${modelName}`);
  return response.json(); // { channel_groups: [...] }
}
```

**新建**: `src/components/ChannelGroupSelector.jsx` — 分组选择组件

显示每个分组的：

* 分组名称

* 基础价格

* 成功率（24h）

* 平均响应时间

* 是否活跃

用户选择后，系统使用对应策略的 API Key 调用。

#### Step 2.2：API Key 策略管理

**新建**: `src/config/apiKeys.js` — 多 API Key 管理

```javascript
export const API_KEY_PROFILES = {
  'economy': {
    label: '经济优先',
    key: import.meta.env.VITE_API_KEY_ECONOMY,
    strategy: '价格优先',
    description: '自动选择最低价格渠道'
  },
  'balanced': {
    label: '均衡模式',
    key: import.meta.env.VITE_API_KEY_BALANCED,
    strategy: '成功率优先',
    description: '自动选择成功率最高渠道'
  },
  'premium': {
    label: '品质优先',
    key: import.meta.env.VITE_API_KEY_PREMIUM,
    strategy: '速度优先',
    description: '自动选择最快响应渠道'
  }
};
```

**说明**：由于 API 不支持在请求中指定分组，需要为每种策略创建不同的 API Key。用户在前端选择策略 → 系统使用对应的 API Key → API 自动路由到对应分组。

#### Step 2.3：前端价格展示

在 FloatingCommandBar 底部信息栏显示：

```
GPT Image 2 · 经济 ¥0.058/次 (94%成功率) · 预计 5.8 算力
```

点击价格可展开分组对比面板。

### Phase 3：UI 参数面板优化

#### Step 3.1：参数优先级排序

所有模型参数按以下顺序排列：

1. **尺寸/比例** — 用户第一选择
2. **分辨率/画质** — 第二选择
3. **生成数量** — 第三选择
4. **功能开关** — 第四选择
5. **高级参数** — 折叠

#### Step 3.2：FloatingCommandBar 布局优化

```
[16:9 ▾] [高清 ▾] [×2] [高级 ▾]        ← 参数芯片行
[输入提示词...]          [📎] [模型▾] [→]  ← 输入行
GPT Image 2 · 经济 ¥0.058 · 预计 5.8 算力  ← 底部信息
```

* counter 类型（n）显示为 `×1`/`×2`/`×4` 快捷按钮

* 高级面板展开后显示完整 DynamicParamPanel

* 底部显示实时价格和分组信息

#### Step 3.3：模型选择器增强

在模型下拉中显示：

* 模型名称

* 最低价格

* 分组数量

***

## 三、实施步骤

### Step 1: 重写 lingkeClient.js — 统一使用 /v1/media/generate

* 新增 `mediaGenerate()` 方法

* 新增 `getTaskStatus()` 方法

* 新增 `pollUntilFinal()` 方法

* 保留旧方法作为 fallback

### Step 2: 重写 imageService.js — 透传参数 + 异步轮询

* `_syncGenerate()` 改用 `mediaGenerate()` + 轮询

* 透传所有前端参数

* 正确解析 result\_url 返回的图片

### Step 3: 修复前端 IS\_DEMO + 参数传递

* 修复 `CreativeHub.jsx` IS\_DEMO 判断

* 创建 `.env` 文件

* handleSend 透传所有 modelParams

### Step 4: 统一参数名 + 排序

* 修改 `modelParams.js`：参数名对齐 API、按优先级排序

* 修改 `models.js`：defaultParams 同步

### Step 5: 创建分组价格服务

* 新建 `pricingService.js`

* 新建 `apiKeys.js`（多 Key 策略管理）

* 后端新增 `/api/pricing/:model` 代理路由

### Step 6: 创建 ChannelGroupSelector 组件

* 分组对比面板

* 策略选择（经济/均衡/品质）

* 实时价格展示

### Step 7: 优化 FloatingCommandBar

* counter 类型显示为快捷按钮

* 底部显示实时价格

* 参数排序优化

### Step 8: 构建验证 + 端到端测试

* `npm run build`

* 启动后端 + 前端

* 输入提示词 → 调用 API → 返回图片 → 显示在画廊

***

## 四、涉及文件

| 文件                                        | 操作     | 内容                         |
| ----------------------------------------- | ------ | -------------------------- |
| `server/services/lingkeClient.js`         | **重写** | 统一 /v1/media/generate + 轮询 |
| `server/services/imageService.js`         | **重写** | 透传参数 + 异步轮询 + 正确解析         |
| `server/routes/imageRoutes.js`            | **修改** | 新增 pricing 代理路由            |
| `.env`                                    | **新建** | VITE\_API\_BASE\_URL       |
| `CreativeHub.jsx`                         | **修改** | IS\_DEMO、参数透传              |
| `modelParams.js`                          | **修改** | 参数名统一、排序                   |
| `models.js`                               | **修改** | defaultParams 同步           |
| `src/services/pricingService.js`          | **新建** | 实时价格获取                     |
| `src/config/apiKeys.js`                   | **新建** | 多 Key 策略管理                 |
| `src/components/ChannelGroupSelector.jsx` | **新建** | 分组选择组件                     |
| `FloatingCommandBar.jsx`                  | **修改** | counter芯片、价格展示、排序          |
| `src/config/modelPricing.js`              | **修改** | 对接实时价格 API                 |

***

## 五、验证标准

1. ✅ 输入提示词 → 后端日志显示 `POST /v1/media/generate` + 完整参数
2. ✅ 后端轮询 `GET /v1/skills/task-status` → 获取 `result_url`
3. ✅ 从 `result_url` 获取图片 → 前端画廊正确显示
4. ✅ 选择不同参数（16:9、2K、×2）→ API 收到对应参数 → 返回匹配结果
5. ✅ 分组价格面板显示实时价格和成功率
6. ✅ 切换策略（经济/均衡/品质）→ 使用不同 API Key → 价格变化
7. ✅ 底部信息栏显示：模型名 · 策略 · 单价 · 预计算力

