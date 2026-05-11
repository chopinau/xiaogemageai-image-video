# 动态模型参数系统实现计划

## 📋 目标
为每个 AI 模型添加**专属的、完整的参数选项**（参考 Lingke API 文档），让用户在选择不同模型时看到该模型支持的所有特定参数。

---

## 🔍 现状分析

### 当前问题
1. **所有图片模型共享相同参数**: size, quality, count
2. **所有视频模型共享相同参数**: duration, aspectRatio
3. **缺少模型特有参数**: 
   - Seedance: 参考图条数(1-2)、速度(turbo/pro)、运动幅度、首尾帧模式
   - Kling: 模式(std/pro)、水印开关、音频开关、镜头数量
   - Flux: guidance_scale、steps
   - SDXL: steps、cfgScale、sampler
   - 豆包Seedream: 风格选择
4. **前端参数组件是硬编码的**, 不随模型切换动态变化

---

## 📊 各模型完整参数清单

### 图片生成模型

| 模型 | 特有参数 | 参数类型 | 选项 |
|------|---------|---------|------|
| **GPT Image 2** | quality | 选择 | standard / hd / ultra |
| | style | 选择 | vivid / natural |
| | size | 选择 | 1024x1024 / 1536x1024 / 1792x1024 / 1024x1536 / 1024x1792 / 2048x2048 |
| **DALL-E 3** | quality | 选择 | standard / hd |
| | style | 选择 | vivid / natural |
| | size | 选择 | 1024x1024 / 1792x1024 / 1024x1792 |
| **Flux Pro** | aspect_ratio | 选择 | 1:1 / 16:9 / 9:16 / 4:3 / 3:4 |
| | guidance_scale | 滑块 | 0-20 (默认 3.5) |
| | steps | 滑块 | 10-50 (默认 28) |
| **豆包 Seedream** | size | 选择 | 1024x1024 / 1536x1024 / 2048x2048 / 4096x4096 |
| | style | 选择 | 写实 / 插画 / 3D / 油画 / 水彩 |
| | seed | 输入框 | 可选随机种子 |
| **SDXL** | steps | 滑块 | 10-100 (默认 30) |
| | cfgScale | 滑块 | 1-20 (默认 7) |
| | sampler | 选择 | Euler a / DPM++ 2M Karras / DDIM |
| | size | 选择 | 512x512 / 768x768 / 1024x1024 |

### 视频生成模型

| 模型 | 特有参数 | 参数类型 | 选项/范围 |
|------|---------|---------|----------|
| **Kling V1.6** | duration | 选择 | 5s / 10s |
| | mode | 选择 | std (标准) / pro (专业) |
| | aspect_ratio | 选择 | 16:9 / 9:16 / 1:1 |
| | watermark | 开关 | true / false |
| | audio | 开关 | true / false (需额外积分) |
| | fps | 选择 | 24 / 30 |
| **Veo 3.1** | duration | 选择 | 5s / 8s / 15s |
| | aspect_ratio | 选择 | 16:9 / 9:16 / 1:1 |
| | resolution | 选择 | 720p / 1080p / 4K HDR |
| | camera_control | 选择 | 固定 / 平移 / 缩放 / 环绕运镜 |
| **Sora 2** | duration | 选择 | 5s / 10s / 15s / 20s |
| | orientation | 选择 | landscape / portrait / square |
| **Seedance 2.0** | duration | 选择 | 3s / 5s / 10s |
| | speed | 选择 | turbo (快速) / pro (高质量) |
| | aspect_ratio | 选择 | 16:9 / 9:16 / 1:1 |
| | reference_images | 计数 | 0 / 1 (首帧) / 2 (首尾帧) |
| | movement_amplitude | 选择 | auto / small / medium / large |
| **Runway Gen4** | duration | 选择 | 5s / 10s |
| | model_variant | 选择 | gen4_turbo / gen4_alpha |
| | aspect_ratio | 选择 | 16:9 / 9:16 / 1:1 |
| **海螺 Hailuo** | duration | 选择 | 6s / 10s |
| | resolution | 选择 | 720p / 1080p |
| | bgm | 开关 | true / false (背景音乐) |
| | voice_id | 选择 | 男声 / 女声 / 自动 |
| **Luma DM** | duration | 选择 | 5s |
| | aspect_ratio | 选择 | 16:9 / 9:16 / 1:1 |
| | loop | 开关 | true / false |

---

## 🛠️ 实现计划

### Phase 1: 数据层 - 创建动态参数配置系统

#### 步骤 1.1: 重构 `src/config/models.js`
- 为每个模型添加 `specificParams` 字段
- 定义参数 schema 结构:
```javascript
specificParams: [
  {
    id: 'duration',
    label: '视频时长',
    type: 'select',        // select/slider/toggle/input/counter
    options: [           // select 类型用
      { value: 5, label: '5秒' },
      { value: 10, label: '10秒' }
    ],
    range: { min: 3, max: 15, step: 1 },  // slider 类型用
    default: 5,
    required: false,
    visible: true,
    group: 'video_basic'   // 分组ID
  }
]
```

#### 步骤 1.2: 创建 `src/config/modelParams.js` (新文件)
- 导出每个模型的完整参数定义
- 包含参数分组信息
- 支持条件显示（某些参数在特定条件下才显示）

---

### Phase 2: 组件层 - 动态参数渲染系统

#### 步骤 2.1: 创建 `src/components/DynamicParamPanel.jsx` (新文件)
核心功能:
- 接收当前选中的 modelId 和 category
- 根据 modelId 从配置中读取 specificParams
- 渲染对应的 UI 控件:
  - `select` → 下拉选择器
  - `slider` → 滑块 + 数值输入
  - `toggle` → 开关按钮
  - `input` → 文本输入框
  - `counter` → +/- 按钮
- 参数分组展示（基础/高级/风格/输出）
- 参数联动逻辑（如：选了"首尾帧模式"，自动显示两张图上传）

#### 步骤 2.2: 更新 `src/components/ParamCapsuleGroup.jsx`
- 当检测到 modelId 时，委托给 DynamicParamPanel
- 保持向后兼容（如果没有 specificParams，使用原有逻辑）

#### 步骤 2.3: 创建通用参数子组件 (可选优化)
- `DynamicSelect.jsx` - 带搜索的下拉选择
- `DynamicSlider.jsx` - 带预览的滑块
- `DynamicToggle.jsx` - 样式化的开关
- `DynamicCounter.jsx` - 数字计数器
- `ParamGroupHeader.jsx` - 可折叠的参数分组标题

---

### Phase 3: 业务层 - 参数传递与验证

#### 步骤 3.1: 更新 `CreativeHub.jsx`
- 新增 state: `selectedModelParams`
- 当用户切换模型时:
  1. 读取该模型的 specificParams
  2. 设置默认值
  3. 触发 DynamicParamPanel 重新渲染
- 收集用户填写的所有参数 → 合并到请求体

#### 步骤 3.2: 参数验证逻辑
- 在提交前验证必填参数
- 检查参数范围合法性
- 显示友好的错误提示

#### 步骤 3.3: API 请求构建
- 将 dynamicParams 与 defaultParams 合并
- 构建符合 Lingke API 格式的请求体
- 特别处理多模态输入（首尾帧、参考图等）

---

### Phase 4: UI/UX 优化

#### 步骤 4.1: 参数面板布局优化
- 默认只显示"常用参数"（3-5个）
- 点击"高级设置"展开全部参数
- 参数按功能分组：
  - 📐 尺寸与比例
  - ⚡ 速度与质量
  - 🎨 风格与效果
  - 📤 输出选项
  - 🔧 高级选项

#### 步骤 4.2: 参数提示与帮助
- 每个参数旁边有 `?` 图标
- hover 显示参数说明和推荐值
- 新手模式下显示参数建议

#### 步骤 4.3: 参数预设/模板
- "电影级"、"社交媒体"、"产品展示"等预设
- 一键填充多个参数组合
- 用户可保存自定义预设

---

### Phase 5: API 对接准备 (可选)

#### 步骤 5.1: 创建后端参数转换服务
- 将前端参数格式转换为 Lingke API 格式
- 处理不同模型的字段映射差异

#### 步骤 5.2: 参数缓存与热更新
- 后端定期从 Lingke API 同步最新支持的参数
- 前端可请求获取最新的参数配置
- 支持运营手动调整参数选项

---

## 📁 文件变更清单

### 新建文件
| 文件路径 | 用途 |
|---------|------|
| `src/config/modelParams.js` | 所有模型的完整参数定义 |
| `src/components/DynamicParamPanel.jsx` | 动态参数面板主组件 |
| `src/components/dynamic/` | 通用参数子组件目录 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/config/models.js` | 添加 specificParams 字段到每个模型 |
| `src/components/ParamCapsuleGroup.jsx` | 集成 DynamicParamPanel |
| `src/pages/CreativeHub.jsx` | 管理动态参数状态 |
| `src/styles/creative-hub.css` | 新增动态参数面板样式 |

---

## ⏱️ 实施顺序

```
Phase 1 (数据层)     ↓  约 30 分钟
  ├─ 步骤 1.1: models.js 重构
  └─ 步骤 1.2: modelParams.js 创建
       ↓
Phase 2 (组件层)     ↓  约 60 分钟
  ├─ 步骤 2.1: DynamicParamPanel
  ├─ 步骤 2.2: ParamCapsuleGroup 更新
  └─ 步骤 2.3: 子组件 (可选)
       ↓
Phase 3 (业务层)     ↓  约 40 分钟
  ├─ 步骤 3.1: CreativeHub 集成
  ├─ 步骤 3.2: 参数验证
  └─ 步骤 3.3: API 请求构建
       ↓
Phase 4 (UI优化)     ↓  约 30 分钟
  ├─ 步骤 4.1: 布局优化
  ├─ 步骤 4.2: 提示帮助
  └─ 步骤 4.3: 预设模板
       ↓
完成 ✅ 总计约 2.5-3 小时
```

---

## ✅ 验收标准

1. 切换到 Seedance 模型时，能看到: 参考图条数、速度模式、运动幅度等特有参数
2. 切换到 GPT Image 2 时，能看到: quality/style/size 等标准参数
3. 参数面板响应流畅，无卡顿
4. 参数能正确传递到 API 请求
5. 移动端自适应良好

---

## 📌 备注

- 当前阶段先实现前端静态配置（基于文档调研）
- 后续可通过 API 动态拉取最新参数配置
- 所有参数都有合理的默认值，新手可直接使用
