# 模型参数对照文档

> 数据来源：小马AI API (`GET https://api.ai6800.com/api/v1/skills/models/{name}`)
> 更新时间：2026-05-09
> 用途：随时对照小马AI和本系统参数，方便日后更新

## 图片模型

### GPT Image 2 (gpt-image-2)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| size | select | auto,1024x1024,1024x1536,1536x1024,960x1280,1280x960,1088x1920,1920x1088,2048x2048,2048x3072,3072x2048,1920x2560,2560x1920,1440x2560,2560x1440,2880x2880,2304x3456,3456x2304,2400x3200,3200x2400,2160x3840,3840x2160 | 同左 | ✅ 已修正 |
| quality | select | auto,high,medium,low | 同左 | ✅ |

### 即梦 5.0 (doubao-seedream-5-0-260128)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 2K,3K | 2K,3K | ✅ |
| aspect_ratio | select | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | 同左 | ✅ |
| web_search | switch | true/false | true/false | ✅ |

### 即梦 4.5 (doubao-seedream-4-5-251128)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 2K,4K | 2K,4K | ✅ |
| aspect_ratio | select | 1:1,4:3,3:4,16:9,9:16,3:2,2:3,21:9 | 同左 | ✅ |

### Gemini Pro Image (gemini-3-pro-image-preview)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| aspectRatio | select | 1:1,2:3,3:2,3:4,4:3,4:5,5:4,9:16,16:9,21:9 | 同左 | ✅ |
| imageSize | select | 1K,2K,4K | 1K,2K,4K | ✅ |

### 可灵 V3 (kling-v3)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 2k,1k | 1k,2k | ✅ |
| aspect_ratio | select | 16:9,9:16,1:1,4:3,3:4,3:2,2:3,21:9 | 同左 | ✅ |

### 可灵 V3 Omni (kling-v3-omni)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 1k,2k,4k | 1k,2k,4k | ✅ |
| aspect_ratio | select | 16:9,9:16,1:1,4:3,3:4,3:2,2:3,21:9 | 同左 | ✅ |

### 万相 2.7 图像 (wan2.7-image)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| quality | radio | standard,pro | standard,pro | ✅ |
| size | radio | 1:1,3:4,4:3,9:16,16:9,2:3,3:2 | 同左 | ✅ |

## 视频模型

### 可灵 V3 视频 (kling-v3-video)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| duration | select | 5,10,15 | 5,10,15 | ✅ |
| mode | select | std,pro | std,pro | ✅ |
| aspect_ratio | select | 16:9,9:16,1:1 | 16:9,9:16,1:1 | ✅ |

### 可灵 2.6 Pro (kling-v2-6)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| duration | select | 5,10 | 5,10 | ✅ |
| sound | select | on,off | on,off | ✅ |
| aspect_ratio | select | 16:9,9:16,1:1 | 16:9,9:16,1:1 | ✅ |

### Seedance 2.0 (kwvideo-v2)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| version | select | 标准,快速 | 标准,快速 | ✅ |
| duration | select | auto,4,5,6,7,8,9,10,11,12,13,14,15 | 同左 | ✅ |
| aspect_ratio | select | adaptive,16:9,4:3,1:1,3:4,9:16,21:9 | 同左 | ✅ |
| resolution | select | 480p,720p | 480p,720p | ✅ |

### Veo 3.1 Lite (veo3.1-lite)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| quality | select | sd,4k | sd,4k | ✅ |
| aspect_ratio | select | 9:16,16:9 | 16:9,9:16 | ✅ |
| enhance_prompt | switch | true/false | true/false | ✅ |

### Grok Video 3+ (grok-video-3-plus)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| duration | select | 10,15,20,25,30 | 10,15,20,25,30 | ✅ |
| aspect_ratio | select | 16:9,9:16,3:2,2:3,1:1 | 同左 | ✅ |

### 海螺 2.3 (hailuo-2.3)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| model_version | select | 2.3,2.3-fast | 2.3,2.3-fast | ✅ |
| duration | select | 6,10 | 6,10 | ✅ |
| resolution | select | 768P,1080P | 768P,1080P | ✅ |
| enhance_prompt | select | Enabled,Disabled | Enabled,Disabled | ✅ |

### 万相 2.6 (wan2.6-shouzheng)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| quality | select | fast,standard | fast,standard | ✅ |
| resolution | select | 720P,1080P | 720P,1080P | ✅ |
| duration | select | 3,6,9,12,15 | 3,6,9,12,15 | ✅ |
| aspect_ratio | select | 16:9,9:16,1:1,4:3,3:4 | 同左 | ✅ |
| prompt_extend | switch | true/false | true/false | ✅ |

### 万相 2.7 视频 (wan2.7-cankaosheng)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 720P,1080P | 720P,1080P | ✅ |
| duration | select | 3,6,9,12,15 | 3,6,9,12,15 | ✅ |
| ratio | select | 16:9,9:16,1:1,4:3,3:4 | 同左 | ✅ |
| prompt_extend | switch | true/false | true/false | ✅ |

### PixVerse V5.6 (pixverse-v5.6-r2v)

| 参数名 | 类型 | 小马API值 | 系统值 | 状态 |
|--------|------|----------|--------|------|
| resolution | select | 360P,540P,720P,1080P | 同左 | ✅ |
| duration | select | 5,8,10 | 5,8,10 | ✅ |
| aspect_ratio | select | 16:9,4:3,1:1,3:4,9:16 | 同左 | ✅ |

## 更新方法

调用小马AI API获取最新参数：
```
GET https://api.ai6800.com/api/v1/skills/models/{model_name}
Authorization: Bearer {API_KEY}
```

获取定价数据：
```
GET https://api.ai6800.com/api/v1/skills/models/{model_name}/pricing
Authorization: Bearer {API_KEY}
```
