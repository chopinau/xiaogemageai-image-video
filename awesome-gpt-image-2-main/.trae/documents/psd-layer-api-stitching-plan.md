# PSD 智能分层工具 — API 拼接流实施方案

## 一、功能概述

在现有 AI 图像平台中新增 **"PSD 智能分层"** 功能模块。用户上传一张图片，系统自动完成：
1. **AI 抠图**：调用去背 API，提取透明通道主体 PNG
2. **AI 补全**：调用 Inpainting API，将抠掉主体的区域无缝补全为纯背景
3. **PSD 打包**：使用 ag-psd 将原图/主体/背景叠入三个图层，输出 .psd 供下载

---

## 二、技术链路

```
用户上传图片
  → 前端 POST /api/psd-layer/process (FormData: image)
    → 后端 psdLayerRoutes.js
      → Step1: lingkeClient 调用 fal-ai RMBG 模型抠图 → 透明主体 PNG
      → Step2: lingkeClient 调用 fal-ai Inpainting 模型补全背景 → 纯背景 PNG
      → Step3: ag-psd 将三层合成 PSD → 返回 Buffer
    → 前端下载 .psd 文件
```

---

## 三、实施步骤

### Step 1: 安装后端依赖 ag-psd

在 `server/` 目录下安装：
```bash
npm install ag-psd canvas
```
- `ag-psd`：PSD 读写库
- `canvas`（node-canvas）：ag-psd 读取图片数据生成图层 canvas 所需

### Step 2: 扩展 lingkeClient.js — 新增 PSD 分层相关 API 方法

在 `server/services/lingkeClient.js` 中新增 3 个方法：

1. **`removeBackground(imageBuffer, options)`**
   - 调用 `POST /fal-ai/bria/rmbg-1.4` 或类似去背端点
   - 传入图片 Buffer，返回透明通道 PNG URL/Buffer

2. **`inpaintBackground(imageBuffer, maskBuffer, options)`**
   - 调用 `POST /fal-ai/stable-diffusion/inpainting` 或类似修复端点
   - 传入原图 + 抠图产生的 mask，返回补全后的背景 PNG URL/Buffer

3. **`queryFalTask(modelName, requestId)`**
   - 复用已有的 `queryFluxTask` 逻辑，统一查询 fal-ai 异步任务

### Step 3: 新建 server/services/psdLayerService.js

核心服务，编排三步流程：

```javascript
export class PsdLayerService {
  async processImage(imageBuffer, options = {}) {
    // Step 1: AI 抠图
    const foreground = await this._removeBackground(imageBuffer);

    // Step 2: 生成 mask + AI 补全背景
    const mask = this._generateMask(foreground);  // 从抠图结果提取 mask
    const background = await this._inpaintBackground(imageBuffer, mask);

    // Step 3: PSD 打包
    const psdBuffer = this._buildPSD(imageBuffer, foreground, background);

    return { success: true, psdBuffer, filename: 'layered.psd' };
  }
}
```

关键子方法：
- `_removeBackground(imageBuffer)`：调用 lingkeClient.removeBackground
- `_generateMask(foregroundBuffer)`：从透明 PNG 提取 alpha 通道作为 mask
- `_inpaintBackground(imageBuffer, maskBuffer)`：调用 lingkeClient.inpaintBackground
- `_buildPSD(originalBuffer, foregroundBuffer, backgroundBuffer)`：使用 ag-psd 构建三层 PSD

### Step 4: 新建 server/routes/psdLayerRoutes.js

路由设计：

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/psd-layer/process` | POST | 上传图片 → 返回 PSD 文件流 |
| `/api/psd-layer/task/:taskId` | GET | 查询异步任务状态 |
| `/api/psd-layer/task/:taskId/stream` | GET | SSE 实时推送进度 |
| `/api/psd-layer/download/:taskId` | GET | 下载生成的 PSD 文件 |

- 使用 multer 处理图片上传（内存存储，10MB 限制）
- 由于抠图+补全可能耗时较长，采用异步模式：
  - 提交后立即返回 taskId
  - 后台通过 TaskManager 轮询
  - 完成后将 psdBuffer 缓存在 TaskManager 结果中
  - 客户端通过 download 端点获取文件

### Step 5: 注册路由 — 修改 server/server.js

在 `server.js` 中添加：
```javascript
import psdLayerRoutes from './routes/psdLayerRoutes.js';
app.use('/api/psd-layer', psdLayerRoutes);
```

### Step 6: 前端 — 新增 PSD 分层页面

新建 `src/pages/PsdLayer.jsx`，核心 UI：

1. **上传区**：复用 `useFileUpload` Hook，支持拖拽上传图片
2. **处理进度**：显示三步进度（抠图 → 补全 → 打包），SSE 实时更新
3. **预览区**：展示抠图结果、背景补全结果、PSD 图层预览
4. **下载按钮**：点击下载生成的 .psd 文件

页面交互流程：
```
上传图片 → 点击"生成分层PSD" → 显示进度条
  → Step1: 抠图完成，预览透明主体
  → Step2: 背景补全完成，预览纯背景
  → Step3: PSD 打包完成，显示下载按钮
```

### Step 7: 前端 — 新增 psdLayerGenerator.js 服务

新建 `src/services/psdLayerGenerator.js`，封装前端 API 调用：

```javascript
export const psdLayerGenerator = {
  async processImage(file, onProgress) {
    // 1. 上传图片，发起处理
    // 2. SSE 监听进度
    // 3. 返回结果（含下载 URL）
  },
  async downloadPSD(taskId) {
    // 下载 PSD 文件
  }
};
```

### Step 8: 注册前端路由和导航

1. **App.jsx**：添加 `/psd-layer` 路由指向 PsdLayer 页面
2. **Sidebar.jsx**：添加导航项 `{ path: '/psd-layer', label: 'PSD分层', icon: FileLayers }`
3. **Topbar.jsx**：如需要，添加对应导航链接

### Step 9: 配置模型和积分

1. **src/config/models.js**：在 AI_MODELS 中新增 `psdLayer` 类别
   ```javascript
   psdLayer: {
     'bria-rmbg-inpainting': {
       id: 'bria-rmbg-inpainting',
       name: 'PSD 智能分层',
       provider: 'fal.ai',
       capabilities: ['background-removal', 'inpainting', 'psd-export'],
       pricing: { perImage: 15, unit: 'credits' },
       apiEndpoint: '/api/psd-layer/process',
       apiType: 'async',
       enabled: true,
       sortOrder: 1
     }
   }
   ```

2. **src/config/credits.js**：新增积分规则
   ```javascript
   'psdLayer:bria-rmbg-inpainting': 15
   ```

3. **src/config/api.js**：新增端点
   ```javascript
   psdLayer: {
     process: '/psd-layer/process',
     taskStatus: '/psd-layer/task',
     taskStream: '/psd-layer/task',
     download: '/psd-layer/download'
   }
   ```

### Step 10: 环境变量配置

在 `server/.env` 中新增（如需要独立 API Key）：
```env
FAL_API_KEY=your_fal_api_key_here
```

> 注意：如果继续通过 lingkeapi.com 代理调用 fal-ai，则无需额外 Key，复用 LINGKE_API_KEY 即可。

---

## 四、文件变更清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 新建 | `server/services/psdLayerService.js` | PSD 分层核心服务 |
| 新建 | `server/routes/psdLayerRoutes.js` | PSD 分层路由 |
| 新建 | `src/pages/PsdLayer.jsx` | PSD 分层页面 |
| 新建 | `src/services/psdLayerGenerator.js` | 前端 PSD 服务 |
| 修改 | `server/services/lingkeClient.js` | 新增 removeBackground/inpaintBackground 方法 |
| 修改 | `server/server.js` | 注册 psdLayer 路由 |
| 修改 | `src/App.jsx` | 添加 /psd-layer 路由 |
| 修改 | `src/components/Sidebar.jsx` | 添加导航项 |
| 修改 | `src/config/models.js` | 新增 psdLayer 模型类别 |
| 修改 | `src/config/credits.js` | 新增积分规则 |
| 修改 | `src/config/api.js` | 新增 API 端点 |
| 修改 | `server/.env` | 新增 FAL_API_KEY（可选） |

---

## 五、成本与定价建议

| 环节 | API 成本（估算） | 说明 |
|------|-----------------|------|
| AI 抠图 (bria-rmbg) | ~$0.01/次 | fal.ai 按量计费 |
| AI 补全 (SD Inpainting) | ~$0.01-0.03/次 | fal.ai 按量计费 |
| PSD 打包 (ag-psd) | $0 | 本地执行，零成本 |
| **合计** | **~$0.02-0.04/次** | |

**建议定价**：15 积分/次（约 ¥1.5），毛利率 > 95%

---

## 六、风险与备选方案

1. **fal.ai 端点不可用**：备选 Remove.bg API（抠图）+ Stability AI Inpainting（补全）
2. **Inpainting 质量不稳定**：可增加"手动调整 mask"功能，让用户微调抠图结果后再补全
3. **大文件超时**：限制上传图片 ≤ 5MB，分辨率 ≤ 2048px
4. **ag-psd 兼容性**：ag-psd 不支持 CMYK/16bit，需在前端提示仅支持 RGB 模式图片输入
