# 小马AI（云聚AI）平台能力文档

> 更新时间：2026-05-08 | 平台版本：2026-05-08 | 模型总数：83

---

## 一、平台信息

- **平台名称**：云聚AI（小马AI）
- **官网地址**：https://xiaomageai.com
- **API 基础地址**：`https://api.ai6800.com/api`
- **认证方式**：`Authorization: Bearer {API_KEY}`
- **API Key 存放位置**：项目 `server/.env` 文件中（当前使用用户提供的 Key）

---

## 二、接口列表

### 2.1 模型查询

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取模型列表 | GET | `/v1/skills/models` | 按类型查询可用模型，支持 type 参数筛选（chat/image/video/audio） |
| 获取模型功能与参数 | GET | `/v1/skills/models/{model_name}` | 查询单个模型的参数定义 |
| 获取模型完整价格 | GET | `/v1/skills/models/{model_name}/pricing` | 查询模型价格，支持 ?status=active 筛选 |

### 2.2 调用说明

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 通用调用说明 | GET | `/v1/skills/guide` | 返回所有模型的通用调用指南 |

### 2.3 语言模型调用

| 接口 | 方法 | 路径 | 适用模型 | 说明 |
|------|------|------|----------|------|
| OpenAI Chat Completions | POST | `/v1/chat/completions` | gpt/o1/o3/chatgpt 前缀 | 100% 兼容 OpenAI API |
| OpenAI Responses | POST | `/v1/responses` | gpt/o1/o3/chatgpt 前缀 | 新版 Responses API |
| Anthropic Messages | POST | `/v1/messages` | claude 前缀 | 兼容 Anthropic API |
| Gemini Generate Content | POST | `/v1beta/models/{model}:{action}` | gemini 前缀 | 兼容 Google Gemini API |

### 2.4 媒体生成

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取媒体模型列表（旧版） | GET | `/v1/media/models` | 建议用 /v1/skills/models 替代 |
| 提交媒体生成任务 | POST | `/v1/media/generate` | 提交图片/视频/音频/TTS/音乐生成任务 |
| 查询任务状态（旧版） | GET | `/v1/media/status?task_id={id}` | 建议用 /v1/skills/task-status 替代 |

### 2.5 任务管理

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 查询任务状态（增强版） | GET | `/v1/skills/task-status?task_id={id}` | 返回完整任务信息含 model/时间/渠道 |

### 2.6 账户信息

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 查询算力余额 | GET | `/v1/skills/balance` | 返回余额和 API Key 额度 |
| 查询消费明细 | GET | `/v1/skills/usage` | 支持按模型聚合或按任务明细查询 |

### 2.7 语音相关

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 获取可用音色列表 | GET | `/v1/skills/voices` | 支持 ?model=speech-2.8 或 gemini-2.5-pro-preview-tts 筛选 |
| 克隆自定义音色 | POST | `/v1/skills/voices/clone` | 仅支持 speech-2.8 模型 |

### 2.8 反馈

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 提交反馈 | POST | `/v1/skills/feedback` | type: 文档疑问/接口报错/功能建议 |
| 查询反馈结果 | GET | `/v1/skills/feedback?id={id}` | 通过 feedback_id 查询处理状态 |

---

## 三、全部可用模型列表

### 3.1 语言模型（Chat）

| 模型名称 | 展示名称 | API格式 | 标签 |
|----------|----------|---------|------|
| gpt-5.5 | GPT-5.5 | openai | 多轮对话/多模态/长上下文/联网搜索 |
| gpt-5.5-xhigh | GPT-5.5 深度推理 | openai | 多轮对话/多模态/长上下文/联网搜索 |
| gpt-5.5-high | GPT-5.5 高推理 | openai | 多轮对话/多模态/长上下文/联网搜索 |
| gpt-5.5-medium | GPT-5.5 中推理 | openai | 多轮对话/多模态/长上下文/联网搜索 |
| gpt-5.5-low | GPT-5.5 低推理 | openai | 多轮对话/多模态/长上下文/联网搜索 |
| gpt-5.4 | GPT-5.4 | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gpt-5.4-xhigh | GPT-5.4 深度推理 | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gpt-5.4-mini | GPT-5.4 mini | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gpt-5.4-nano | GPT-5.4 nano | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gpt-5.3-codex | GPT-5.3 Codex | openai | 写代码/深度思考/长上下文/联网搜索 |
| gpt-5.3-chat-latest | GPT-5.3 对话 | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gpt-5.2 | GPT-5.2 Codex | openai | 深度思考/写代码/联网搜索 |
| gpt-5.2-chat-latest | GPT-5.2 对话 | openai | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| claude-opus-4-7 | opus-4-7 | anthropic | 写代码/深度思考/长上下文/联网搜索 |
| claude-opus-4-6 | opus-4-6 | anthropic | 写代码/深度思考/长上下文/联网搜索 |
| claude-opus-4-5-20251101 | opus-4-5 | anthropic | 深度思考/写代码/联网搜索 |
| claude-sonnet-4-6 | sonnet-4-6 | anthropic | 写代码/深度思考/长上下文/联网搜索 |
| claude-haiku-4-5-20251001 | claude-4-5 | anthropic | 深度思考/写代码/联网搜索 |
| gemini-3.1-pro-preview | Gemini 3.1 Pro | gemini | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gemini-3-pro-preview | Gemini 3 Pro | gemini | 多轮对话/多模态/深度思考/长上下文/联网搜索 |
| gemini-3-flash-preview | Gemini 3 flash | gemini | 多轮对话/多模态/深度思考/长上下文/联网搜索/极速 |
| gemini-3.1-flash-lite-preview | Gemini 3.1 flash | gemini | 多轮对话/多模态/长上下文/联网搜索/极速 |

### 3.2 图像模型（Image）

| 模型名称 | 展示名称 | 标签 |
|----------|----------|------|
| gemini-3-pro-image-preview | Nano Banana Pro | 文生图/图生图/4k/高清 |
| gemini-3.1-flash-image-preview | Nano Banana 2 | 文生图/图生图/4k/高清 |
| gpt-image-2 | GPT Image 2 | 文生图/图生图 |
| gpt-image-2-guan | GPT Image 2 官转 | 文生图 |
| gpt-image-1.5-all | GPT Image 1.5 | 文生图/图生图 |
| mj_imagine | Midjourney | 文生图/图生图 |
| grok-4.2-image | grok-4.2-image | 文生图/图生图 |
| grok-4.1-image | grok-4.1-image | 文生图/图生图 |
| kling-v3-omni | 可灵-V3-Omni | 文生图/图生图/多图融合/4k/高清 |
| kling-v3 | 可灵-V3 | 文生图/图生图/高清 |
| kling-image-o1 | 可灵 o1 | 文生图/图生图 |
| doubao-seedream-5-0-260128 | 即梦 5.0 | 文生图/图生图/多图融合/联网搜索生图/3k |
| doubao-seedream-4-5-251128 | 即梦 4.5 | 文生图/图生图 |
| vidu-image-2 | VIDU Image 2 | 文生图/多图参考/图片编辑/1K/2K/3K |
| wan2.7-image | 万相 2.7 图像 | 文生图/图生图 |
| wan2.6-image | 万相 2.6 图像 | 文生图/图生图 |
| qwen-image | 千问-image-max | 文生图/图像编辑/多图融合 |

### 3.3 视频模型（Video）

| 模型名称 | 展示名称 | 标签 |
|----------|----------|------|
| sora-2 | Sora-2 官转版 | 文生视频/图生视频/稳定 |
| grok-video-3 | grok-video-3 | 文生视频/图生视频/首帧参考图/1080p |
| grok-video-3-plus | grok-video-3-plus | 文生视频/图生视频/首帧参考图/1080p |
| veo3.1 | veo3.1 | 文生视频/图生视频/首帧参考图/首尾帧/高清 |
| veo3.1-4k | veo3.1-4K高清 | 文生视频/图生视频/首帧参考图/首尾帧/4K |
| veo3.1-lite | veo3.1-lite | 文生视频/图生视频/首尾帧/标清/4K |
| viduq3 | Vidu Q3 | 文生视频/图生视频/首帧参考图/首尾帧/有声视频/1080p |
| viduq3-cankaosheng | Vidu Q3 参考生 | 参考生视频/1080p/多图参考/有声视频 |
| viduq2-cankaosheng | Vidu Q2 参考生 | 参考生视频/1080p/有声视频 |
| vidu-jieshuoman | VIDU-解说漫 | 解说漫剧/剧本驱动/多资产参考/TTS+对口型 |
| doubao-seedance-1-5-pro-251215 | 即梦 3.5 Pro | 文生视频/图生视频/首帧参考图/首尾帧/有声视频/1080p |
| kwvideo-v2 | SD 2.0 首尾帧 | 文生视频/图生视频/有声视频/首尾帧/高清 |
| kwvideo-v2-ref | SD 2.0 参考生 | 文生视频/图生视频/有声视频/参考生视频/720p |
| kwvideo-v2-quannengcankao | SD 2.0 全能参考 | 多模态参考/图参视参音参/1080p |
| kling-v3-video | 可灵-V3-video | 文生视频/图生视频/有声视频/首尾帧/高清 |
| kling-v3-omni-cankao | 可灵-Omni 参考生 | 文生视频/图生视频/有声视频/参考生视频/高清 |
| kling-v3-omni-shouweizhen | 可灵-Omni 首尾帧 | 图生视频/有声视频/首尾帧/高清 |
| kling-v3-omni-videoref | 可灵-Omni 视频参考 | 视频参考/视频编辑/高清 |
| kling-v2-6 | 可灵 2.6 Pro | 文生视频/图生视频/有声视频/1080p/高清 |
| kling-motion-control | 可灵-动作控制 | 动作控制/视频生成 |
| kling-motion-control-v3 | 可灵-动作控制 V3 | 动作控制/视频生成/高清 |
| kling-avatar-image2video | 可灵-数字人 | 数字人/视频生成 |
| happyhorse-t2v | 快乐马-文生视频 | 文生视频/物理真实/运镜连贯/720P/1080P |
| happyhorse-i2v | 快乐马-首帧 | 图生视频/首帧驱动/物理真实/720P/1080P |
| happyhorse-r2v | 快乐马-参考生 | 参考生视频/多主体融合/角色一致/720P/1080P |
| happyhorse-video-edit | 快乐马-视频编辑 | 视频编辑/指令改片/换装/风格迁移/720P/1080P |
| wan2.6-shouzheng | 万相 2.6 首帧 | 图生视频/文生视频/有声视频/1080p/首帧参考图 |
| wan2.6-cankaosheng | 万相 2.6 参考生 | 参考生视频/1080p |
| wan2.7-shouweizhen | 万相 2.7 首尾帧 | 图生视频/首尾帧/1080p |
| wan2.7-cankaosheng | 万相 2.7 参考生 | 文生视频/参考生视频/1080p |
| wan2.7-xuxie | 万相 2.7 视频续写 | 视频续写/视频转视频/1080p |
| wan2.2-animate-mix | 万相-视频换人 | 视频换人 |
| pixverse-v6-shouweizhen | Pix V6 首尾帧 | 文生视频/图生视频/有声视频/首尾帧/高清 |
| pixverse-v5.6-r2v | Pix V5.6 参考生 | 参考生视频/多图参考/有声视频/图生视频 |
| pixverse-v5.6-shouweizhen | Pix V5.6 首尾帧 | 文生视频/图生视频/有声视频/首尾帧/高清 |
| pixverse-c1-cankaosheng | Pix C1 参考生 | 文生视频/参考生/有声视频/高清/动态场景 |
| pixverse-c1-shouweizhen | Pix C1 首尾帧 | 图生视频/有声视频/首尾帧/高清/动态场景 |
| hailuo-2.3 | 海螺 2.3 | 文生视频/图生视频/1080p/高清 |

### 3.4 音频模型（Audio）

| 模型名称 | 展示名称 | 标签 |
|----------|----------|------|
| speech-2.8 | 海螺 语音克隆 2.8 | 语音克隆/文字转语音/音色复刻/多语言 |
| doubao-tts-2.0 | 豆包 语音合成 2.0 | 文字转语音/多音色/多情感/多语言 |
| gemini-3.1-flash-tts-preview | Gemini-3.1-TTS | 文字转语音/多音色/多语言 |
| gemini-2.5-pro-preview-tts | Gemini-2.5-TTS | 文字转语音/多音色/多语言 |
| music-2.5+ | 海螺 音乐生成 2.5+ | 音乐生成/歌词生成/AI作曲/纯音乐 |
| music-2.5 | 海螺 音乐生成 2.5 | 音乐生成/歌词生成/AI作曲 |

---

## 四、调用方式与代码示例

### 4.1 语言模型 - OpenAI 格式

适用模型：gpt/o1/o3/chatgpt 前缀

**端点**：`POST /v1/chat/completions`

```javascript
const response = await fetch('https://api.ai6800.com/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'gpt-5.5',
    messages: [{ role: 'user', content: '你好' }],
    stream: false
  })
});
const data = await response.json();
```

**Python SDK**：
```python
from openai import OpenAI
client = OpenAI(base_url="https://api.ai6800.com/api/v1", api_key="YOUR_API_KEY")
response = client.chat.completions.create(model="gpt-5.5", messages=[{"role":"user","content":"你好"}])
```

### 4.2 语言模型 - Anthropic 格式

适用模型：claude 前缀

**端点**：`POST /v1/messages`

```javascript
const response = await fetch('https://api.ai6800.com/api/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-6',
    messages: [{ role: 'user', content: '你好' }],
    max_tokens: 1024
  })
});
```

### 4.3 语言模型 - Gemini 格式

适用模型：gemini 前缀

**端点**：`POST /v1beta/models/{model}:{action}`

```javascript
const response = await fetch('https://api.ai6800.com/api/v1beta/models/gemini-3-pro-preview:generateContent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: '你好' }] }]
  })
});
```

### 4.4 媒体生成 - 异步轮询模式

适用模型：所有 image/video/audio 类型模型

**流程**：
1. `POST /v1/media/generate` 提交任务 → 获取 task_id
2. `GET /v1/skills/task-status?task_id={id}` 轮询状态
3. 当 `is_final=true` 时，从 `result_url` 获取结果

**提交任务示例**：
```javascript
const response = await fetch('https://api.ai6800.com/api/v1/media/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'viduq3',
    prompt: 'a golden retriever running on the beach at sunset',
    params: {
      duration: '4',
      resolution: '720p',
      aspect_ratio: '16:9',
      model_variant: 'turbo'
    }
  })
});
const { data } = await response.json();
const taskId = data.task_id;
```

**轮询状态示例**：
```javascript
async function pollTaskStatus(taskId) {
  while (true) {
    const res = await fetch(`https://api.ai6800.com/api/v1/skills/task-status?task_id=${taskId}`, {
      headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
    });
    const status = await res.json();
    if (status.is_final) {
      return status.result_url;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
```

**图生图示例**：
```javascript
{
  model: 'gemini-3.1-flash-image-preview',
  prompt: '以这些参考图为基础生成一张同风格的主人公走进咖啡馆场景',
  params: {
    images: ['https://your-cdn.example.com/ref1.png', 'https://your-cdn.example.com/ref2.png'],
    imageSize: '2K',
    aspectRatio: '16:9'
  }
}
```

**图生视频示例**：
```javascript
{
  model: 'wan2.6',
  prompt: '镜头推进，主人公转身微笑',
  params: {
    img_url: 'https://your-cdn.example.com/first-frame.jpg',
    duration: '5',
    aspect_ratio: '9:16'
  }
}
```

### 4.5 TTS 语音合成

1. 先获取音色列表：`GET /v1/skills/voices`
2. 提交生成任务：
```javascript
{
  model: 'speech-2.8',
  prompt: '要朗读的文本内容',
  params: {
    voice_id: 'LK_123_1712345678'
  }
}
```

### 4.6 音色克隆

```javascript
const response = await fetch('https://api.ai6800.com/api/v1/skills/voices/clone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'My Custom Voice',
    audio_url: 'https://example.com/my-voice-sample.mp3'
  })
});
```

---

## 五、计费方式

### 5.1 按次计费（媒体模型）
```
最终价格 = 基础价格 × 所有选项系数的乘积 + 所有选项加成的总和
```

### 5.2 按 Token 计费（语言模型）
```
费用 = (输入token数 × 输入token价格 + 输出token数 × 输出token价格) ÷ 1000000
```

### 5.3 按秒计费（部分视频模型）
```
最终价格 = 时长秒数 × 每秒价格
```

查询具体价格：`GET /v1/skills/models/{model_name}/pricing`

---

## 六、渠道策略

| 策略 | 说明 |
|------|------|
| 价格优先 | 自动选择价格最低的可用渠道 |
| 速度优先 | 自动选择响应最快的可用渠道 |
| 成功率优先 | 自动选择成功率最高的可用渠道 |
| 自定义 | 按用户预设的渠道顺序逐个 fallback |

策略在 API Key 管理页面设置，调用时自动路由，不支持请求级别覆盖。

---

## 七、错误处理

| 错误类型 | HTTP状态码 | 说明 | AI操作 |
|----------|-----------|------|--------|
| invalid_request_error | 400 | 请求参数错误 | 修正参数后重试 |
| authentication_error | 401/403 | API Key 无效 | 检查 Authorization 头 |
| insufficient_balance | 402 | 余额不足 | 充值或取消调用 |
| not_found | 404 | 模型/任务不存在 | 检查 URL 和模型名 |
| rate_limit_exceeded | 429 | 频率限制 | 退避重试 |
| upstream_error | 5xx | 上游故障 | 5-30秒后重试 |
| server_error | 500 | 平台内部错误 | 稍后重试或提交反馈 |

---

## 八、不支持的端点

以下 OpenAI 兼容端点不可用，统一走 `/v1/media/generate`：

- `/v1/images/generations` → 用 `POST /v1/media/generate` + 图片模型
- `/v1/images/edits` → 用 `POST /v1/media/generate` + 图片模型的 upload 参数
- `/v1/images/variations` → 用 `POST /v1/media/generate` + 提示词
- `/v1/video/generations` → 用 `POST /v1/media/generate` + 视频模型
- `/v1/videos/generations` → 用 `POST /v1/media/generate`
- `/v1/audio/speech` → 用 `POST /v1/media/generate` + TTS 模型
- `/v1/audio/transcriptions` → 平台暂不提供 ASR
- `/v1/audio/translations` → 平台暂不提供语音翻译
- `/v1/embeddings` → 平台暂不提供 embedding

---

## 九、重要注意事项

1. **媒体模型参数**：所有模型特定参数必须放在 `params` 对象内，不要放在请求体顶层
2. **upload 参数**：type=upload 的参数传入可公开访问的文件 URL，支持单字符串和字符串数组
3. **参数名区分**：请求中的 upload 参数名由模型决定（images/img_url/videos 等），响应中统一叫 input_files
4. **轮询建议**：提交后等 5-10 秒再首次轮询，之后每 5 秒一次，超时阈值 7200 秒
5. **progress 不可靠**：判断任务完成只看 state 和 is_final，不要看 progress 数值
6. **余额检查**：调用付费接口前建议先查余额 `GET /v1/skills/balance`
7. **渠道分组**：is_active 会实时变化，展示价格时应包含所有分组
8. **音乐模型**：歌曲模式必须传入 lyrics 参数
9. **TTS 模型**：需先获取音色列表再传入 voice_id
10. **duration_seconds**：是任务处理总耗时，不是输出媒体本身的时长
