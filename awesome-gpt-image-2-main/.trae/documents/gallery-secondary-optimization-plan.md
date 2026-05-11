# 画廊二次功能全面优化方案

## 一、自我检查问题清单

### 1.1 下载功能 — 不可用

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 跨域图片下载失败 | `a.download` 属性对跨域 URL（如 picsum.photos）无效，浏览器忽略 download 属性直接打开图片 | 🔴 高 |
| 无下载进度 | 点击后无任何视觉反馈，用户不知道是否成功 | 🟡 中 |
| 无批量下载 | 不能一次下载多个选中图片 | 🟡 中 |

### 1.2 收藏功能 — 纯 `console.log`，零实用价值

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 无持久化存储 | 刷新后收藏状态全部丢失 | 🔴 高 |
| 无收藏面板 | 没有"我的收藏"查看入口，收藏了也看不到 | 🔴 高 |
| 视觉反馈脆弱 | 红心 toggle 状态仅存在于组件内部 state，卡片重渲染后丢失 | 🔴 高 |
| 无二次利用路径 | 收藏后无法：复用提示词、回填参考图、分享 | 🟡 中 |

### 1.3 Red Flag 标记功能 — 同样空壳

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 仅 console.log | 无任何实际行为 | 🔴 高 |
| 无法记录原因 | 用户不知道"为什么这张图不好" | 🔴 高 |
| 无错误学习面板 | 没有"标记历史"供回顾避免重复犯错 | 🔴 高 |
| 无自动提示词分析 | 无法关联"坏结果"与"坏提示词" | 🟡 中 |

### 1.4 一键图生图参考 — 缺失

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 无"作为参考图"按钮 | 用户想基于生成结果微调，需手动下载再上传 | 🔴 高 |
| 仅有"生成视频"跳转 | `handleSendToVideo` 切换类别+回填 URL，但没有图生图的等效功能 | 🔴 高 |
| 无提示词继承 | 不能一键"用这张图的提示词重新生成" | 🟡 中 |

### 1.5 生成数量参数 — 缺失

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 所有图片模型缺 `n` 参数 | `modelParams.js` 中 `gpt-image-2` 仅有 `size`/`quality`，缺少生成数量 | 🔴 高 |
| 即梦系列缺 `n` 参数 | `doubao-seedream-5-0` 等也缺少数量控制 | 🔴 高 |
| 演示模式忽略数量 | demo 模式硬编码生成 1-2 张，不受参数控制 | 🟡 中 |
| 计价未考虑 n>1 | `calculateComputeCost` 未按生成数量倍乘价格 | 🟡 中 |

### 1.6 其他 UI/UX 缺陷

| 问题 | 现状 | 严重度 |
|------|------|--------|
| 覆盖层按钮太小 | 28x28px，移动端几乎不可用 | 🟡 中 |
| 无图片灯箱 | 不能放大预览图片细节 | 🟡 中 |
| 无复制提示词回填 | `Copy` 只复制到剪贴板，不能自动填入输入框 | 🟡 中 |
| 卡片元数据不足 | 缺分辨率、种子、生成耗时 | 🟢 低 |
| Flag 按钮无激活态色变 | 点击后视觉不变，用户不知道是否已标记 | 🟡 中 |

---

## 二、优化方案（按优先级分三层）

### 🟢 第1层：核心功能开荒（让不可用 → 可用）

#### 2.1 修复下载功能

**文件**: `CreativeHub.jsx` — `handleDownload`

```diff
- const handleDownload = useCallback((item) => {
-   const a = document.createElement('a');
-   a.href = item.url;
-   a.download = `generated-${Date.now()}.${item.type === 'video' ? 'mp4' : 'png'}`;
-   a.click();
- }, []);

+ const handleDownload = useCallback(async (item) => {
+   try {
+     showToast('info', '正在准备下载...');
+     const response = await fetch(item.url);
+     const blob = await response.blob();
+     const blobUrl = URL.createObjectURL(blob);
+     const a = document.createElement('a');
+     a.href = blobUrl;
+     a.download = `generated-${Date.now()}.${item.type === 'video' ? 'mp4' : 'png'}`;
+     document.body.appendChild(a);
+     a.click();
+     document.body.removeChild(a);
+     URL.revokeObjectURL(blobUrl);
+     showToast('success', '下载完成');
+   } catch {
+     // fallback: 直接打开
+     window.open(item.url, '_blank');
+     showToast('info', '已在新窗口打开');
+   }
+ }, [showToast]);
```

**新增 store**: `src/store/galleryStore.js` — 管理收藏/标记状态

```javascript
// 基于 localStorage 的状态管理
const FAVORITES_KEY = 'gallery_favorites';
const FLAGGED_KEY = 'gallery_flagged';

export function useGalleryStore() {
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
  });
  
  const [flagged, setFlagged] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FLAGGED_KEY) || '[]'); }
    catch { return []; }
  });

  const toggleFavorite = (item) => { /* 持久化到 localStorage + state */ };
  const toggleFlag = (item, reason) => { /* 持久化到 localStorage + state */ };
  const isFavorited = (id) => favorites.some(f => f.id === id);
  const isFlagged = (id) => flagged.some(f => f.id === id);

  return { favorites, flagged, toggleFavorite, toggleFlag, isFavorited, isFlagged };
}
```

**说明**: 创建全局 store 而不是组件内 state，确保跨渲染保持状态。

#### 2.2 实现收藏系统

**新增组件**: `src/components/FavoritesPanel.jsx` — 右侧滑出收藏面板

功能：
- 显示所有收藏的图片/视频
- 支持按模型/日期筛选
- 一键"复用提示词"（复制到输入框）
- 一键"作为参考图"（回填图片 URL + 提示词到命令栏）
- 取消收藏
- 导出收藏列表

**修改**: `CreativeHub.jsx` — 添加 `showFavoritesPanel` 状态和切换按钮

#### 2.3 实现 Red Flag 标记系统

**新增组件**: `src/components/FlagDialog.jsx` — 标记原因弹窗

功能：
- 点击 Flag 弹出小型原因选择器（预设选项 + 自定义输入）
- 预设原因：图片模糊、比例错误、内容不符、风格不对、有水印、颜色偏差、构图差
- 保存原因到 localStorage 的 flagged 列表

**新增组件**: `src/components/FlaggedPanel.jsx` — 错误回顾面板

功能：
- 按原因分组展示
- 显示原始提示词 vs 错误结果
- 一键"用此提示词重新生成"
- "忽略此标记"按钮

#### 2.4 实现一键图生图参考

**修改**: `MediaCard.jsx` — 新增"作为参考图"按钮

覆盖层按钮改为5个：
```
[⬇下载] [🎬生成视频] [🖼作为参考] [❤收藏] [🚩标记]
```

**新增**: `CreativeHub.jsx` — `handleUseAsReference(item)`:
```javascript
const handleUseAsReference = useCallback((item) => {
  setRefImageUrl(item.url);
  if (item.prompt) {
    setPrompt(`基于这张图：${item.prompt}`);
  }
  showToast('success', '已设为参考图，可直接修改提示词后生成');
}, [showToast]);
```

#### 2.5 补充生成数量参数

**修改**: `src/config/modelParams.js` — 为所有图片模型添加 `n` 参数

```javascript
// gpt-image-2 新增：
{
  id: 'n',
  label: '生成数量',
  type: 'counter',
  group: 'basic',
  default: 1,
  range: { min: 1, max: 10 },
  help: '一次生成多张图片'
}
```

同样为：`doubao-seedream-5-0`、`doubao-seedream-4-5`、`gemini-3-pro-image`、`kling-v3-image`、`kling-v3-omni-image`、`wan2.7-image` 添加数量参数。

默认值 1，范围 1-4（控制单次生成成本）。

**修改**: `CreativeHub.jsx` — demo 模式读取 `n` 参数影响生成数量

**修改**: `modelPricing.js` — `calculateComputeCost` 乘以 `n` 倍

---

### 🟡 第2层：交互体验升级（让可用 → 好用）

#### 2.6 图片灯箱 Lightbox

**新增组件**: `src/components/ImageLightbox.jsx`

功能：
- 点击卡片图片 → 全屏灯箱放大预览
- 支持左右切换浏览
- 灯箱内显示完整提示词
- 灯箱底部操作栏：下载 / 作为参考 / 收藏 / 标记 / 复制提示词
- 键盘导航：← → 切换图片，Esc 关闭
- 支持双指缩放

#### 2.7 卡片操作面板升级

**修改**: `MediaCard.jsx` — 更大、更直观的操作按钮

改进：
- 覆盖层按钮从 28px → 36px
- 每个按钮附带文字标签（鼠标悬停时展开）
- Flag 按钮激活态颜色变为黄色 `#fbbf24`
- 添加"复制提示词到输入框"快捷按钮（区别于复制到剪贴板）
- 鼠标悬停时显示生成参数摘要（分辨率、模型）

#### 2.8 批量操作栏

**新增**: `MasonryGallery.jsx` — 多选模式

功能：
- 长按/右键卡片进入多选模式
- 顶部出现批量操作工具栏
- 批量操作：全部下载、全部收藏、全部作为参考批次

#### 2.9 提示词一键回填

**修改**: `MediaCard.jsx` + `CreativeHub.jsx`

- 每个卡片增加"回填提示词"按钮（`ArrowLeftToLine` 图标）
- 点击后：当前 prompt + refImageUrl 同时回填到 FloatingCommandBar
- 如果当前是图片模式，直接可发送
- 自动切换到对应模型

#### 2.10 生成失败原因反馈

**修改**: `CreativeHub.jsx` — `handleSend`

当 API 返回 failure 时：
- 在 gallery 中显示一个"失败卡片"（灰色调，显示错误原因）
- 失败卡片上有"重试"按钮
- 自动弹出 Flag 对话框建议标记

---

### 🔵 第3层：生态完善（让好用 → 出色）

#### 2.11 右侧资产面板（Asset Panel）

**新增组件**: `src/components/AssetPanel.jsx`

功能：
- 固定在右侧的抽屉面板
- 三个 Tab：全部结果 / 我的收藏 / 标记记录
- 收藏 Tab：快速浏览、搜索、复用
- 标记 Tab：按原因分组，展示"错误 → 正确"对照
- 每个条目可拖拽到命令栏作为参考

#### 2.12 智能提示词优化建议

**新增组件**: `src/components/PromptTips.jsx`

功能（基于标记数据分析）：
- 当用户输入提示词时，如果与之前 Flag 过的提示词相似 → 给出警告
- "你之前标记过类似的提示词[xxx]，建议添加更多细节描述"
- 基于收藏的提示词推荐常用关键词

#### 2.13 生成历史导出

**新增**: `CreativeHub.jsx`

- 导出当前画廊为 JSON（包含 URL、提示词、参数）
- 导出收藏列表为 JSON
- 一键复制全部提示词到剪贴板

---

## 三、实施步骤

### Step 1: 基础设施 — 创建 store 和修复下载
- 创建 `src/store/galleryStore.js`
- 修复 `handleDownload`（blob 下载）
- 为 ImageGenerator/VideoGenerator 添加 `n` 参数传递

### Step 2: 补充模型参数 — 所有图片模型加 `n`
- 修改 `modelParams.js`：7 个图片模型添加 `n` 参数
- 修改 `modelPricing.js`：`calculateComputeCost` 乘 `n`
- 修改 `FloatingCommandBar.jsx`：显示数量控制芯片
- 修改 `CreativeHub.jsx`：demo 模式读取 `n`

### Step 3: 收藏系统完整实现
- 创建 `FavoritesPanel.jsx`
- 修改 `MediaCard.jsx`：使用全局 store 的收藏状态
- 修改 `CreativeHub.jsx`：集成收藏面板

### Step 4: Flag 标记系统完整实现
- 创建 `FlagDialog.jsx`
- 修改 `MediaCard.jsx`：标记原因弹窗
- 创建 `FlaggedPanel.jsx` 错误回顾面板

### Step 5: 一键图生图参考
- 修改 `MediaCard.jsx`：添加"作为参考"按钮
- 修改 `CreativeHub.jsx`：`handleUseAsReference`

### Step 6: 图片灯箱
- 创建 `ImageLightbox.jsx`
- 修改 `MediaCard.jsx`：点击图片打开灯箱

### Step 7: 卡片 UI 升级 + 批量操作
- 增大按钮尺寸
- 添加文字标签
- 批量选择模式

### Step 8: 右侧资产面板（统一入口）
- 创建 `AssetPanel.jsx`
- 整合收藏 + 标记 + 历史三个 Tab
- 修改 `CreativeHub.jsx`：侧栏切换

### Step 9: CSS 全套样式
- 灯箱样式
- 面板样式
- Flag 弹窗样式
- 批量工具栏样式
- 按钮尺寸升级

### Step 10: 构建验证 + 端到端测试
- `npm run build` 验证
- 检查所有交互链路

---

## 四、涉及文件总览

| 文件 | 操作 | 内容 |
|------|------|------|
| `src/store/galleryStore.js` | **新建** | 收藏/标记持久化 store |
| `src/components/FavoritesPanel.jsx` | **新建** | 收藏面板 |
| `src/components/FlagDialog.jsx` | **新建** | 标记原因弹窗 |
| `src/components/FlaggedPanel.jsx` | **新建** | 错误回顾面板 |
| `src/components/ImageLightbox.jsx` | **新建** | 图片灯箱 |
| `src/components/AssetPanel.jsx` | **新建** | 右侧资产面板 |
| `src/components/MediaCard.jsx` | **修改** | 按钮升级、全局 store、灯箱触发、参考图按钮 |
| `src/components/MasonryGallery.jsx` | **修改** | 批量选择模式 |
| `src/pages/CreativeHub.jsx` | **修改** | 集成所有面板、修复下载、handleUseAsReference |
| `src/config/modelParams.js` | **修改** | 7 个图片模型补充 `n` 参数 |
| `src/config/modelPricing.js` | **修改** | calculateComputeCost 乘 n |
| `src/components/FloatingCommandBar.jsx` | **修改** | 显示数量芯片 |
| `src/styles/creative-hub.css` | **修改** | 新增全部样式 |

---

## 五、预期效果

实施完成后，用户交互闭环：
1. 输入提示词 → 选择数量 → 发送 → 多张图片显示在画廊
2. 悬停卡片 → 显示大按钮：**下载** | **生成视频** | **作为参考** | **收藏** | **标记**
3. 点击"下载" → blob 下载成功，Toast 提示完成
4. 点击"收藏" → 红心变实心，存入 localStorage，右侧资产面板同步显示
5. 点击"标记" → 弹窗选择原因 → 黄色旗标激活 → 存入 Flagged 记录
6. 点击"作为参考" → 图片 URL + 提示词自动回填到命令栏 → 可立即二次生成
7. 点击图片 → 灯箱放大查看细节，支持左右切换和缩放
8. 右侧资产面板 → 查看收藏/标记历史 → 一键复用或避免错误