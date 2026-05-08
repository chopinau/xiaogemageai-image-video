# 灵客API后端接入计划

## 一、灵客API概览

- **基础URL**: `https://lingkeapi.com`
- **认证方式**: `Authorization: Bearer sk-I8KygCSUZtzdNFCxdieZo4iYHoGssrynSNF4cAaw52AHh3ax`
- **协议**: 完全兼容OpenAI接口协议
- **特点**: 聚合多模型，一个API Key全模型通用，无需科学上网

---

## 二、API接口与模型映射（匹配系统现有模型）

### 2.1 图片生成接口

#### 接口1: OpenAI兼容 - `/v1/images/generations`（同步返回）
- **适用模型**: `gpt-image-2`, `dall-e-3`, `doubao-seedream-4-0-250828`
- **请求方式**: POST
- **请求体**:
```json
{
  "model": "gpt-image-2",
  "prompt": "描述文字",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "response_format": "url"
}
```
- **响应**:
```json
{
  "created": 1749819664,
  "data": [{ "url": "https://..." }],
  "usage": { "output_tokens": 16280, "total_tokens": 16280 }
}
```

#### 接口2: 图片编辑 - `/v1/images/edits`（multipart/form-data）
- **适用模型**: `gpt-image-1`, `gpt-image-1-all`, `flux-kontext-pro`, `flux-kontext-max`
- **请求方式**: POST (multipart)
- **请求体**: image(文件) + prompt + model + mask(可选) + aspect_ratio + background
- **响应**: 同上格式

#### 接口3: Flux Pro 文生图 - `/fal-ai/flux-pro/kontext/text-to-image`（异步队列）
- **适用模型**: `flux-pro`
- **请求方式**: POST
- **请求体**:
```json
{
  "prompt": "描述",
  "guidance_scale": 3.5,
  "num_images": 1,
  "output_format": "jpeg",
  "safety_tolerance": "2",
  "aspect_ratio": "1:1"
}
```
- **响应** (返回任务ID):
```json
{
  "status": "IN_QUEUE",
  "request_id": "acf05732-7cb3-445b-9f39-fdaeccb1d730",
  "response_url": "https://queue.fal.run/...",
  "status_url": "https://queue.fal.run/.../status"
}
```
- **查询结果**: `GET /fal-ai/{model_name}/requests/{request_id}`
- **结果响应**:
```json
{
  "seed": 2841475369,
  "images": [{ "url": "https://...", "width": 1024, "height": 1024 }],
  "prompt": "..."
}
```

#### 接口4: Flux Pro 图片编辑 - `/fal-ai/nano-banana/edit`（异步队列）
- **适用模型**: `flux-pro` (编辑模式)
- **请求体**: `{ "prompt": "...", "image_urls": ["https://..."], "num_images": 1 }`
- **查询**: 同接口3

#### 接口5: 豆包SeedEdit图片编辑 - `/v1/images/generations`（同步）
- **适用模型**: `doubao-seededit-3-0-i2i-250628`
- **请求体**: `{ "model": "doubao-seededit-3-0-i2i-250628", "prompt": "...", "image": "url或base64", "response_format": "url" }`

#### 接口6: Kling图片生成 - `/kling/v1/images/generations`（异步）
- **适用模型**: `kling-v1-6` (图片)
- **查询**: `GET /kling/v1/images/generations/{task_id}`

#### 接口7: Ideogram Remix - `/ideogram/v1/ideogram-v3/remix`（multipart）
- **适用模型**: Ideogram V3
- **请求体**: image(文件) + prompt + num_images + rendering_speed

#### 接口8: Replicate图片生成 - `POST /replicate/v1/predictions`（异步）
- **查询**: `GET /replicate/v1/predictions/{任务id}`

### 2.2 视频生成接口

#### 接口1: Veo视频创建 - `/v1/video/create`（异步）
- **适用模型**: `veo2`, `veo2-fast`, `veo2-fast-frames`, `veo2-fast-components`, `veo2-pro`, `veo3`, `veo3-fast`, `veo3-fast-frames`, `veo3-pro`, `veo3-pro-frames`, `veo3.1`, `veo3.1-fast`, `veo3.1-pro`
- **请求体**:
```json
{
  "model": "veo3.1-fast",
  "prompt": "描述",
  "images": ["https://..."],
  "aspect_ratio": "16:9",
  "enable_upsample": true,
  "enhance_prompt": true
}
```
- **响应**: `{ "id": "veo3-fast-frames:1757555257-PORrVn9sa9", "status": "pending" }`
- **查询**: `GET /v1/video/query?id={task_id}`
- **查询响应**:
```json
{
  "id": "...",
  "status": "completed",
  "video_url": "https://...",
  "enhanced_prompt": "..."
}
```

#### 接口2: Sora视频创建 - `/v1/video/create`（异步）
- **适用模型**: `sora-2`
- **请求体**:
```json
{
  "model": "sora-2",
  "prompt": "描述",
  "orientation": "portrait",
  "size": "small",
  "duration": "15",
  "images": [],
  "watermark": "false"
}
```
- **查询**: `GET /v1/video/query?id={task_id}`

#### 接口3: Kling视频创建 - `/kling/v1/videos/text2video`（异步）
- **适用模型**: `kling-v1`, `kling-v1-5`, `kling-v1-6`
- **请求体**:
```json
{
  "model_name": "kling-v1-6",
  "prompt": "描述",
  "duration": 10,
  "mode": "std",
  "aspect_ratio": "16:9",
  "cfg_scale": 0.5
}
```
- **查询**: `GET /kling/v1/videos/text2video/{task_id}`
- **查询响应**:
```json
{
  "code": 0,
  "data": {
    "task_id": "...",
    "task_status": "succeed",
    "task_result": { "videos": [{ "url": "https://..." }] }
  }
}
```

#### 接口4: Kling图生视频 - `/kling/v1/videos/image2video`（异步）
- **请求体**: `{ "model_name": "kling-v1-6", "prompt": "...", "image": "url", "duration": 5 }`
- **查询**: `GET /kling/v1/videos/image2video/{task_id}`

#### 接口5: Runway图生视频 - `/runwayml/v1/image_to_video`（异步）
- **适用模型**: `gen4_turbo`, `gen3a_turbo`
- **请求体**:
```json
{
  "promptImage": "https://...",
  "model": "gen4_turbo",
  "promptText": "描述",
  "duration": 5,
  "ratio": "1280:768"
}
```

#### 接口6: Luma视频创建 - `/luma/generations`（异步）
- **适用模型**: Luma Dream Machine
- **查询**: `GET /luma/generations/{task_id}`
- **延长**: `POST /luma/generations/{task_id}/extend`

#### 接口7: 豆包Seedance视频 - `/volc/v1/contents/generations/tasks`（异步）
- **适用模型**: `doubao-seedance-1-0-pro-250528`, `doubao-seedance-1-0-lite-i2v-250428`
- **请求体**:
```json
{
  "model": "doubao-seedance-1-0-pro-250528",
  "content": [
    { "type": "text", "text": "描述 --ratio 16:9" }
  ]
}
```
- **图生视频**:
```json
{
  "model": "doubao-seedance-1-0-lite-i2v-250428",
  "content": [
    { "type": "text", "text": "描述" },
    { "type": "image_url", "image_url": { "url": "https://..." }, "role": "first_frame" }
  ]
}
```
- **查询**: `GET /volc/v1/contents/generations/tasks?filter.status=succeeded`

#### 接口8: MiniMax海螺视频 - `/minimax/v1/video_generation`（异步）
- **适用模型**: `MiniMax-Hailuo-02`
- **请求体**: `{ "model": "MiniMax-Hailuo-02", "prompt": "描述", "duration": 10 }`
- **查询**: `GET /minimax/v1/video_generation/query?task_id={task_id}`

#### 接口9: 即梦视频 - `/jimeng/submit/videos`（异步）
- **请求体**: `{ "prompt": "描述", "duration": 5, "aspect_ratio": "16:9" }`

### 2.3 文本/聊天接口

#### 接口: `/v1/chat/completions`（OpenAI兼容）
- **适用模型**: `gpt-4o`, `gpt-4`, `claude-3`, `deepseek` 等
- **完全兼容OpenAI协议**

### 2.4 图片上传接口

- **URL**: `POST https://imageproxy.zhongzhuan.chat/api/upload`
- **认证**: `Authorization: Bearer {token}`
- **请求**: multipart/form-data, file字段
- **用途**: 上传图片获取URL，用于图生视频等需要图片URL的场景

---

## 三、系统模型与灵客API映射

### 3.1 图片模型映射

| 系统模型ID | 灵客API模型 | 接口路径 | 调用方式 |
|-----------|------------|---------|---------|
| `gpt-image-2` | `gpt-image-2` | `/v1/images/generations` | 同步 |
| `dall-e-3` | `dall-e-3` | `/v1/images/generations` | 同步 |
| `midjourney-v6` | `midjourney-v6` | `/v1/images/generations` | 异步 |
| `stable-diffusion-xl` | `stable-diffusion-xl` | `/v1/images/generations` | 同步 |
| `flux-pro` | `flux-pro` | `/fal-ai/flux-pro/kontext/text-to-image` | 异步队列 |
| `doubao-seedream` (新增) | `doubao-seedream-4-0-250828` | `/v1/images/generations` | 同步 |
| `doubao-seededit` (新增) | `doubao-seededit-3-0-i2i-250628` | `/v1/images/generations` | 同步(编辑) |

### 3.2 视频模型映射

| 系统模型ID | 灵客API模型 | 接口路径 | 调用方式 |
|-----------|------------|---------|---------|
| `sora` | `sora-2` | `/v1/video/create` | 异步+轮询 |
| `runway-gen3` | `gen4_turbo` | `/runwayml/v1/image_to_video` | 异步+轮询 |
| `pika-labs` | `pika-labs` | `/v1/video/create` | 异步+轮询 |
| `kling` | `kling-v1-6` | `/kling/v1/videos/text2video` | 异步+轮询 |
| `seedance-2.0` | `doubao-seedance-1-0-pro-250528` | `/volc/v1/contents/generations/tasks` | 异步+轮询 |
| `veo3` (新增) | `veo3.1-fast` | `/v1/video/create` | 异步+轮询 |
| `luma` (新增) | `luma-dream-machine` | `/luma/generations` | 异步+轮询 |
| `hailuo` (新增) | `MiniMax-Hailuo-02` | `/minimax/v1/video_generation` | 异步+轮询 |

---

## 四、后端架构设计

### 4.1 项目结构
```
server/
├── server.js              # Express主入口
├── .env                   # 环境变量(API Key等)
├── package.json
├── routes/
│   ├── imageRoutes.js     # 图片生成路由
│   ├── videoRoutes.js     # 视频生成路由
│   ├── textRoutes.js      # 文本生成路由
│   └── uploadRoutes.js    # 图片上传路由
├── services/
│   ├── lingkeClient.js    # 灵客API统一客户端
│   ├── imageService.js    # 图片生成服务
│   ├── videoService.js    # 视频生成服务
│   ├── textService.js     # 文本生成服务
│   └── uploadService.js   # 图片上传服务
├── middleware/
│   ├── auth.js            # 认证中间件
│   ├── rateLimit.js       # 限流中间件
│   └── credits.js         # 积分扣减中间件
└── utils/
    ├── taskManager.js     # 异步任务管理器(轮询)
    └── errorHandler.js    # 统一错误处理
```

### 4.2 核心设计

#### lingkeClient.js - 统一API客户端
- 封装所有灵客API调用
- 统一错误处理和重试逻辑
- 支持同步和异步两种模式
- 异步任务自动轮询

#### taskManager.js - 异步任务管理器
- 管理所有异步生成任务(视频/部分图片)
- 定时轮询任务状态
- 任务完成时通过SSE推送前端
- 任务超时和失败处理

#### 中间件链
```
请求 → 认证 → 积分检查 → 限流 → 业务路由 → 灵客API → 响应
```

### 4.3 前端适配

#### 更新 `src/config/api.js`
- 将 baseURL 指向后端服务器
- 添加异步任务轮询端点

#### 更新 `src/config/models.js`
- 添加灵客API实际支持的模型
- 添加模型的 `apiType` 字段标识调用方式(sync/async/queue)
- 添加模型的 `lingkeModel` 字段映射灵客API模型名

#### 更新 `src/services/imageGenerator.js`
- 支持同步和异步两种调用模式
- 异步模式支持轮询结果

#### 更新 `src/services/videoGenerator.js`
- 所有视频生成都走异步模式
- 统一的任务创建和状态查询接口

---

## 五、实施步骤

### Step 1: 后端基础设施
1. 创建 `.env` 文件，配置API Key和基础URL
2. 安装后端依赖: `node-fetch`, `form-data`, `multer`
3. 创建 `lingkeClient.js` 统一API客户端
4. 创建 `taskManager.js` 异步任务管理器
5. 创建中间件: 认证、限流、积分

### Step 2: 图片生成后端
1. 创建 `imageService.js` - 封装所有图片API调用
2. 创建 `imageRoutes.js` - 图片生成/编辑/精修路由
3. 支持同步模型(gpt-image-2, dall-e-3)直接返回
4. 支持异步模型(flux-pro)通过任务管理器轮询
5. 创建 `uploadRoutes.js` + `uploadService.js` 图片上传

### Step 3: 视频生成后端
1. 创建 `videoService.js` - 封装所有视频API调用
2. 创建 `videoRoutes.js` - 视频生成/图生视频/状态查询路由
3. 统一异步任务创建接口
4. 统一任务状态查询接口
5. SSE推送任务完成通知

### Step 4: 前端模型配置更新
1. 更新 `models.js` 添加灵客API实际模型和映射
2. 更新 `api.js` 添加新端点
3. 更新 `imageGenerator.js` 适配新的后端接口
4. 更新 `videoGenerator.js` 适配异步任务模式
5. 更新四个核心页面(MainImageGen, DetailStudio, RetouchStudio, VideoGen)接入真实API

### Step 5: 集成测试
1. 测试图片生成(gpt-image-2同步)
2. 测试图片生成(flux-pro异步)
3. 测试图片编辑(doubao-seededit)
4. 测试视频生成(kling异步)
5. 测试视频生成(veo3异步)
6. 测试图片上传
7. 测试积分扣减
8. 测试错误处理和重试

---

## 六、关键代码设计

### 6.1 lingkeClient.js 核心方法

```javascript
class LingkeClient {
  constructor(apiKey, baseURL) { ... }
  
  // 同步调用(图片生成)
  async syncRequest(endpoint, body) { ... }
  
  // 异步任务创建(视频/部分图片)
  async createTask(endpoint, body) { ... }
  
  // 查询任务状态
  async queryTask(endpoint, taskId) { ... }
  
  // 上传图片
  async uploadImage(file) { ... }
  
  // 通用请求(带重试)
  async request(method, endpoint, options) { ... }
}
```

### 6.2 taskManager.js 核心方法

```javascript
class TaskManager {
  constructor(lingkeClient) { ... }
  
  // 创建任务并开始轮询
  createTask(taskId, queryEndpoint, queryFn) { ... }
  
  // 取消任务
  cancelTask(taskId) { ... }
  
  // 获取任务状态
  getTaskStatus(taskId) { ... }
  
  // 内部轮询逻辑
  _pollTask(taskId) { ... }
}
```

### 6.3 统一API路由设计

```
POST /api/image/generate     → 图片生成(自动判断同步/异步)
POST /api/image/edit         → 图片编辑
POST /api/image/inpaint      → 局部重绘
POST /api/image/upscale      → 图片放大
POST /api/video/generate     → 视频生成(创建异步任务)
POST /api/video/from-image   → 图生视频
GET  /api/video/status/:id   → 查询视频任务状态
GET  /api/video/stream/:id   → SSE推送视频任务进度
POST /api/upload/image       → 上传图片
POST /api/text/generate      → 文本生成
POST /api/text/chat          → 聊天对话
```

---

## 七、环境变量配置

```env
LINGKE_API_KEY=sk-I8KygCSUZtzdNFCxdieZo4iYHoGssrynSNF4cAaw52AHh3ax
LINGKE_BASE_URL=https://lingkeapi.com
UPLOAD_BASE_URL=https://imageproxy.zhongzhuan.chat/api/upload
PORT=3000
NODE_ENV=development
TASK_POLL_INTERVAL=3000
TASK_MAX_POLL_ATTEMPTS=100
TASK_TIMEOUT=300000
```
