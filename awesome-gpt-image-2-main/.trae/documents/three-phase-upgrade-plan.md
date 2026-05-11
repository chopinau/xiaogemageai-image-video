# 三大核心升级计划：算力定价 · 参数校验 · Flow式UI

## 一、算力定价系统（积分→算力）

### 1.1 小马API定价数据（已获取）

| 模型 | 小马模型ID | 计价方式 | 基础价(元) | 参数选项价格影响 |
|------|-----------|---------|-----------|----------------|
| GPT Image 2 | gpt-image-2 | 按次 | 0.0576 | 无 |
| 即梦 5.0 | doubao-seedream-5-0-260128 | 按次 | 0.1584 | 无 |
| 即梦 4.5 | doubao-seedream-4-5-251128 | 按次 | 0.18 | 无 |
| Gemini Pro Image | gemini-3-pro-image-preview | 按次 | 0.2016 | 无 |
| 可灵 V3 | kling-v3 | 按次 | 0.1728 | 无 |
| 可灵 V3 Omni | kling-v3-omni | 按次 | 0.1728 | resolution=4k: x2 |
| 万相 2.7 图像 | wan2.7-image | 按次 | 0.144 | quality=pro: x2.5 |
| 可灵 V3 视频 | kling-v3-video | 按次 | 3.2386 | duration=10s: x2, 15s: x3, mode=pro: x1.3333 |
| 可灵 2.6 Pro | kling-v2-6 | 按次 | 5.2602 | duration=10s: x2, sound=off: x0.6 |
| Seedance 2.0 | kwvideo-v2 | 按token | 输出53.28 | version=标准: x1.2432 |
| Veo 3.1 Lite | veo3.1-lite | 按次 | 0.36 | quality=4k: x1.1 |
| Grok Video 3+ | grok-video-3-plus | 按次 | 0.4032 | duration=15s: x2, 20s: x2, 25s: x3, 30s: x3 |
| 海螺 2.3 | hailuo-2.3 | 按次 | 1.6128 | fast版: x0.6964, 10s: x1.6696, 1080P: x1.7589 |
| 万相 2.6 | wan2.6-shouzheng | 按次 | 0.4536 | 1080P: x1.6667, 6s: x2, 9s: x3, 12s: x4, 15s: x5 |
| 万相 2.7 视频 | wan2.7-cankaosheng | 按次 | 1.296 | 1080P: x1.6667, 6s: x2, 9s: x3, 12s: x4, 15s: x5 |
| PixVerse V5.6 | pixverse-v5.6-r2v | 按秒 | 0.5414 | 720P: +0.048, 1080P: +0.184 |

### 1.2 实施步骤

1. **创建 `src/config/modelPricing.js`** — 基于API数据定义每个模型的算力价格
   - 每个模型定义：`basePrice`（基础算力）、`billingMethod`（按次/按token/按秒）、`optionPricing`（参数选项价格乘数）
   - 算力单位：1算力 = 0.01元（即100算力=1元），方便用户理解
   - 示例：GPT Image 2 基础价 0.0576元 = 5.76算力 → 取整6算力

2. **修改 `src/config/models.js`** — 将 `pricing` 字段从硬编码改为引用 `modelPricing.js`
   - 删除 `perImage`、`perSecond` 等旧字段
   - 统一改为 `pricing: { billingMethod, baseCredits, optionPricing }`

3. **全局替换"积分"为"算力"**
   - `CreativeHub.jsx`：`积分` → `算力`
   - `CreativeDock.jsx`：充值按钮文案
   - `CreditsContext.jsx` → 重命名为 `ComputeContext.jsx`
   - `CreditsCenter.jsx` → 重命名为 `ComputeCenter.jsx`
   - `creditsManager.js`（服务端）→ 重命名
   - 所有UI文案中的"积分"替换为"算力"

4. **创建算力计算函数 `calculateComputeCost(modelId, params)`**
   - 输入：模型ID + 当前参数
   - 输出：预计算力消耗
   - 逻辑：basePrice × 各参数选项的priceMultiplier

5. **更新 `CreativeHub.jsx` 中的 `estimatedCost` 函数** — 使用新的算力计算

---

## 二、参数校验文档

### 2.1 发现的参数错误

**GPT Image 2 的 `size` 参数值错误！**
- ❌ 当前系统：`1:1`、`1:1-2K`、`4:3` 等比例值
- ✅ 小马API实际：`1024x1024`、`2048x2048`、`3840x2160` 等像素值
- 必须修正为API实际接受的值

**其他模型参数基本正确**，但需要逐项对照确认。

### 2.2 完整参数对照表

#### 图片模型

| 模型 | 参数名 | 小马API实际值 | 当前系统值 | 是否一致 |
|------|--------|-------------|-----------|---------|
| GPT Image 2 | size | auto,1024x1024,1024x1536,1536x1024,960x1280,1280x960,1088x1920,1920x1088,2048x2048,2048x3072,3072x2048,1920x2560,2560x1920,1440x2560,2560x1440,2880x2880,2304x3456,3456x2304,2400x3200,3200x2400,2160x3840,3840x2160 | 1:1,1:1-2K,4:3,3:4,16:9等比例值 | ❌ 需修正 |
| GPT Image 2 | quality | auto,high,medium,low | auto,high,medium,low | ✅ |
| 即梦5.0 | resolution | 2K,3K | 2K,3K | ✅ |
| 即梦5.0 | aspect_ratio | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | ✅ |
| 即梦5.0 | web_search | true/false(switch) | true/false(toggle) | ✅ |
| 即梦4.5 | resolution | 2K,4K | 2K,4K | ✅ |
| 即梦4.5 | aspect_ratio | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | ✅ |
| Gemini Pro | aspectRatio | (待确认) | 1:1,2:3,3:2等10选项 | ⚠️ 待确认 |
| Gemini Pro | imageSize | (待确认) | 1K,2K,4K | ⚠️ 待确认 |
| 可灵V3 | aspect_ratio | (待确认) | 16:9,9:16等8选项 | ⚠️ 待确认 |
| 可灵V3 | resolution | (待确认) | 1k,2k | ⚠️ 待确认 |
| 可灵V3 Omni | aspect_ratio | (待确认) | 16:9,9:16等8选项 | ⚠️ 待确认 |
| 可灵V3 Omni | resolution | (待确认) | 1k,2k,4k | ⚠️ 待确认 |
| 万相2.7图像 | size | (待确认) | 1:1,3:4等7选项 | ⚠️ 待确认 |
| 万相2.7图像 | quality | standard,pro | standard,pro | ✅ |

#### 视频模型

| 模型 | 参数名 | 小马API实际值 | 当前系统值 | 是否一致 |
|------|--------|-------------|-----------|---------|
| 可灵V3视频 | duration | 5,10,15 | 5,10,15 | ✅ |
| 可灵V3视频 | mode | std,pro | std,pro | ✅ |
| 可灵V3视频 | aspect_ratio | 16:9,9:16,1:1 | 16:9,9:16,1:1 | ✅ |
| 可灵2.6 | duration | 5,10 | 5,10 | ✅ |
| 可灵2.6 | sound | on,off | on,off | ✅ |
| 可灵2.6 | aspect_ratio | 16:9,9:16,1:1 | 16:9,9:16,1:1 | ✅ |
| Seedance2.0 | version | 标准,快速 | 标准,快速 | ✅ |
| Seedance2.0 | duration | auto,4-15 | auto,4-15 | ✅ |
| Seedance2.0 | aspect_ratio | adaptive,16:9,4:3,1:1,3:4,9:16,21:9 | adaptive,16:9,4:3,1:1,3:4,9:16,21:9 | ✅ |
| Seedance2.0 | resolution | 480p,720p | 480p,720p | ✅ |
| Veo3.1 Lite | quality | sd,4k | sd,4k | ✅ |
| Veo3.1 Lite | aspect_ratio | 9:16,16:9 | 16:9,9:16 | ✅ |
| Veo3.1 Lite | enhance_prompt | true/false(switch) | true/false(toggle) | ✅ |
| Grok Video3+ | duration | 10,15,20,25,30 | 10,15,20,25,30 | ✅ |
| Grok Video3+ | aspect_ratio | 16:9,9:16,3:2,2:3,1:1 | 16:9,9:16,3:2,2:3,1:1 | ✅ |
| 海螺2.3 | model_version | 2.3,2.3-fast | 2.3,2.3-fast | ✅ |
| 海螺2.3 | duration | 6,10 | 6,10 | ✅ |
| 海螺2.3 | resolution | 768P,1080P | 768P,1080P | ✅ |
| 海螺2.3 | enhance_prompt | Enabled,Disabled | Enabled,Disabled | ✅ |
| 万相2.6 | quality | fast,standard | fast,standard | ✅ |
| 万相2.6 | resolution | 720P,1080P | 720P,1080P | ✅ |
| 万相2.6 | aspect_ratio | 16:9,9:16,1:1,4:3,3:4 | 16:9,9:16,1:1,4:3,3:4 | ✅ |
| 万相2.6 | duration | 3,6,9,12,15 | 3,6,9,12,15 | ✅ |
| 万相2.6 | prompt_extend | true/false(switch) | true/false(toggle) | ✅ |
| 万相2.7视频 | resolution | 720P,1080P | 720P,1080P | ✅ |
| 万相2.7视频 | duration | 3,6,9,12,15 | 3,6,9,12,15 | ✅ |
| 万相2.7视频 | ratio | 16:9,9:16,1:1,4:3,3:4 | 16:9,9:16,1:1,4:3,3:4 | ✅ |
| 万相2.7视频 | prompt_extend | true/false(switch) | true/false(toggle) | ✅ |
| PixVerse V5.6 | resolution | 360P,540P,720P,1080P | 360P,540P,720P,1080P | ✅ |
| PixVerse V5.6 | duration | 5,8,10 | 5,8,10 | ✅ |
| PixVerse V5.6 | aspect_ratio | 16:9,4:3,1:1,3:4,9:16 | 16:9,4:3,1:1,3:4,9:16 | ✅ |

### 2.3 实施步骤

1. **修正 GPT Image 2 的 `size` 参数** — 将比例值改为API实际接受的像素值
2. **创建 `docs/model-params-reference.md`** — 参数对照文档，方便日后更新
3. **补充确认 Gemini/可灵/万相图像模型的参数** — 通过API再次查询

---

## 三、Flow式UI重构

### 3.1 设计目标

将当前的对话式聊天流改为 **瀑布流画廊 + 悬浮命令舱** 的工业级界面：

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ┌──────┐ ┌────────┐ ┌────┐                       │
│   │      │ │        │ │    │     Masonry Gallery    │
│   │ img  │ │  img   │ │img │     (CSS columns)     │
│   │      │ │        │ │    │     2/4/6列响应式      │
│   └──────┘ │        │ └────┘                        │
│   ┌────┐   └────────┘ ┌────────┐                    │
│   │img │   ┌──────┐   │        │                    │
│   └────┘   │ video│   │  img   │                    │
│   ┌────────┐│      │   │        │                    │
│   │  img   │└──────┘   └────────┘                    │
│   └────────┘                                        │
│                                                     │
│         ┌─────────────────────────────┐             │
│         │  🤖  输入指令...   [模型▾] [▶] │             │
│         └─────────────────────────────┘             │
│              Floating Command Bar                    │
│              (Glassmorphism)                         │
└─────────────────────────────────────────────────────┘
```

### 3.2 组件拆解

1. **`MasonryGallery.jsx`** — 瀑布流画廊
   - CSS `columns` 实现纯CSS瀑布流
   - 响应式：默认2列，md 4列，xl 6列
   - `break-inside-avoid` + `mb-4` 防断裂
   - 极简风格：`rounded-xl`，`overflow-hidden`，`bg-neutral-950`
   - 悬停：平滑过渡 + 深蓝/科技紫辉光阴影

2. **`MediaCard.jsx`** — 媒体卡片
   - 支持图片和视频两种类型
   - 悬停显示操作按钮（下载、发送到视频、收藏、Flag）
   - 显示生成提示词（可复制）
   - 显示模型名称 + 算力消耗

3. **`FloatingCommandBar.jsx`** — 悬浮命令舱
   - 固定底部中央，宽度60%，max-w-4xl
   - Glassmorphism：`bg-neutral-900/80` + `backdrop-blur-lg` + `border-white/10`
   - 左：圆形Avatar
   - 中：透明无边框textarea
   - 右：模型选择按钮 + 发送按钮（深紫/科技蓝）

4. **`ModelSelector.jsx`** — 模型选择下拉
   - 点击弹出模型列表
   - 按图片/视频分类
   - 显示模型名+算力价格

5. **`ParamDrawer.jsx`** — 参数抽屉
   - 从命令栏展开
   - 显示当前模型的参数选项
   - 紧凑的横向布局

### 3.3 实施步骤

1. **创建 `MasonryGallery.jsx`** — 瀑布流画廊组件
2. **创建 `MediaCard.jsx`** — 媒体卡片组件
3. **创建 `FloatingCommandBar.jsx`** — 悬浮命令舱
4. **创建 `ModelSelector.jsx`** — 模型选择下拉
5. **创建 `ParamDrawer.jsx`** — 参数抽屉
6. **重写 `CreativeHub.jsx`** — 整合新组件
7. **添加CSS样式** — 瀑布流 + 毛玻璃 + 辉光效果
8. **删除旧的对话式组件引用** — ChatMessage等不再使用

### 3.4 关键CSS

```css
.masonryGallery {
  columns: 2;
  column-gap: 1rem;
  padding: 1rem;
}
@media (min-width: 768px) { .masonryGallery { columns: 4; } }
@media (min-width: 1280px) { .masonryGallery { columns: 6; } }

.mediaCard {
  break-inside: avoid;
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  overflow: hidden;
  background: #0a0a0a;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.mediaCard:hover {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.15), 0 0 40px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px);
}

.floatingCommandBar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  max-width: 56rem;
  background: rgba(23, 23, 23, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}
```

---

## 执行顺序

1. **Phase 1：参数修正** — 修正GPT Image 2的size参数值，创建参数对照文档
2. **Phase 2：算力定价** — 创建modelPricing.js，替换积分系统为算力系统
3. **Phase 3：UI重构** — 创建瀑布流画廊+悬浮命令舱，替换对话式UI
4. **Phase 4：集成测试** — 构建验证，确保所有功能正常
