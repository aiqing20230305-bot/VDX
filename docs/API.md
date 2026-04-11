# 超级视频Agent API 文档

**版本**: v1.11.0  
**Base URL**: `http://localhost:3000/api`  
**更新日期**: 2026-04-10

---

## 目录

1. [认证](#认证)
2. [聊天接口](#聊天接口)
3. [脚本生成](#脚本生成)
4. [分镜生成](#分镜生成)
5. [视频分析](#视频分析)
6. [字符风格转换](#字符风格转换)
7. [用量统计](#用量统计)
8. [错误代码](#错误代码)

---

## 认证

当前版本为本地应用，无需认证。未来版本将支持 API Key 认证。

---

## 聊天接口

### POST `/api/chat`

与 Claude AI 进行流式对话，生成脚本和分镜。

#### 请求

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "我想做一个30秒的猫咪日常视频"
    }
  ],
  "context": {
    "projectId": "optional-project-id",
    "previousFrames": []
  }
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `messages` | `Message[]` | ✅ | 对话消息列表 |
| `messages[].role` | `'user' \| 'assistant'` | ✅ | 消息角色 |
| `messages[].content` | `string` | ✅ | 消息内容 |
| `context.projectId` | `string` | ❌ | 项目 ID（用于上下文） |
| `context.previousFrames` | `Frame[]` | ❌ | 之前的分镜（用于修改） |

#### 响应

**Content-Type**: `text/event-stream`

流式响应，每个事件格式：

```
data: {"type":"message","content":"我来帮你..."}

data: {"type":"complete","result":{"script":"...","frames":[...]}}
```

**事件类型**:

| 类型 | 说明 | Payload |
|------|------|---------|
| `message` | AI 回复文本 | `{type: 'message', content: string}` |
| `question` | AI 提问（带选项） | `{type: 'question', content: string, options: string[]}` |
| `progress` | 生成进度 | `{type: 'progress', stage: string, percent: number}` |
| `complete` | 生成完成 | `{type: 'complete', result: {...}}` |
| `error` | 错误信息 | `{type: 'error', message: string}` |

**完成事件 Payload**:
```json
{
  "type": "complete",
  "result": {
    "script": {
      "title": "猫咪日常",
      "duration": 30,
      "aspectRatio": "9:16",
      "scenes": [
        {
          "index": 0,
          "description": "猫咪在阳光下打哈欠",
          "duration": 3,
          "visualPrompt": "特写镜头，猫咪慵懒地躺在窗台..."
        }
      ]
    },
    "frames": [
      {
        "id": "frame-1",
        "index": 0,
        "sceneDescription": "猫咪在阳光下打哈欠",
        "imagePrompt": "A cute cat yawning in sunlight...",
        "duration": 3,
        "cameraMove": "静止",
        "imageUrl": "https://..."
      }
    ]
  }
}
```

#### 示例

**使用 Fetch API**:
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '我想做一个30秒的猫咪日常视频' }
    ]
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const lines = text.split('\n').filter(line => line.startsWith('data:'))

  for (const line of lines) {
    const data = JSON.parse(line.substring(5))
    console.log(data)
  }
}
```

---

## 脚本生成

### POST `/api/script`

直接生成脚本，不经过对话流程。

#### 请求

```json
{
  "idea": "猫咪日常",
  "duration": 30,
  "aspectRatio": "9:16",
  "style": "写实摄影"
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `idea` | `string` | ✅ | 视频创意描述 |
| `duration` | `number` | ✅ | 视频时长（秒，10-300） |
| `aspectRatio` | `'16:9' \| '9:16' \| '1:1'` | ✅ | 画面比例 |
| `style` | `string` | ❌ | 风格（默认"写实摄影"） |

#### 响应

```json
{
  "script": {
    "title": "猫咪日常",
    "duration": 30,
    "aspectRatio": "9:16",
    "scenes": [
      {
        "index": 0,
        "description": "猫咪在阳光下打哈欠",
        "duration": 3,
        "visualPrompt": "特写镜头，猫咪慵懒地躺在窗台，阳光洒在它柔软的毛发上...",
        "cameraMove": "静止"
      }
    ]
  }
}
```

---

## 分镜生成

### POST `/api/storyboard`

基于脚本生成分镜图片。

#### 请求

```json
{
  "script": {
    "title": "猫咪日常",
    "scenes": [
      {
        "index": 0,
        "description": "猫咪在阳光下打哈欠",
        "visualPrompt": "...",
        "duration": 3
      }
    ]
  },
  "style": "写实摄影",
  "aspectRatio": "9:16"
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `script` | `Script` | ✅ | 脚本对象 |
| `style` | `string` | ❌ | 图片风格 |
| `aspectRatio` | `string` | ✅ | 画面比例 |

#### 响应

**Content-Type**: `text/event-stream`

流式响应，实时返回生成进度：

```
data: {"type":"progress","stage":"生成图片","frameIndex":0,"totalFrames":10}

data: {"type":"frame","frame":{...}}

data: {"type":"complete","frames":[...]}
```

**事件类型**:

| 类型 | 说明 |
|------|------|
| `progress` | 生成进度 |
| `frame` | 单个分镜完成 |
| `error` | 错误信息 |
| `complete` | 全部完成 |

---

## 视频分析

### POST `/api/analyze`

分析已有视频，提取脚本和分镜用于二创。

#### 请求

```json
{
  "videoUrl": "https://example.com/video.mp4",
  "options": {
    "extractFrames": true,
    "extractAudio": true,
    "generateTranscript": true
  }
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `videoUrl` | `string` | ✅ | 视频 URL 或本地路径 |
| `options.extractFrames` | `boolean` | ❌ | 是否提取关键帧 |
| `options.extractAudio` | `boolean` | ❌ | 是否提取音频 |
| `options.generateTranscript` | `boolean` | ❌ | 是否生成字幕 |

#### 响应

```json
{
  "video": {
    "duration": 30.5,
    "fps": 30,
    "width": 1080,
    "height": 1920
  },
  "frames": [
    {
      "timestamp": 0,
      "imageUrl": "/uploads/frame-0.jpg",
      "description": "猫咪在阳光下打哈欠"
    }
  ],
  "transcript": [
    {
      "start": 0,
      "end": 3,
      "text": "今天天气真好"
    }
  ]
}
```

---

## 字符风格转换

### POST `/api/character-style`

将真人照片转换为指定风格（动漫/3D/卡通等）。

#### 请求

```json
{
  "imageUrl": "https://example.com/person.jpg",
  "targetStyle": "anime",
  "options": {
    "preserveIdentity": true,
    "quality": "high"
  }
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `imageUrl` | `string` | ✅ | 原始图片 URL |
| `targetStyle` | `'anime' \| '3d' \| 'cartoon' \| 'oil_painting'` | ✅ | 目标风格 |
| `options.preserveIdentity` | `boolean` | ❌ | 是否保留身份特征 |
| `options.quality` | `'normal' \| 'high'` | ❌ | 输出质量 |

#### 响应

```json
{
  "resultUrl": "https://cdn.example.com/styled-image.png",
  "style": "anime",
  "processingTime": 2.5
}
```

---

## 用量统计

### GET `/api/usage`

获取 API 调用用量统计。

#### 请求

无需参数

#### 响应

```json
{
  "tokensUsed": 125000,
  "tokensLimit": 1000000,
  "requestsToday": 45,
  "remainingQuota": 875000,
  "resetDate": "2026-04-11T00:00:00Z"
}
```

---

## 错误代码

所有错误响应格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### 错误代码列表

| 代码 | HTTP 状态 | 说明 | 解决方法 |
|------|-----------|------|----------|
| `INVALID_REQUEST` | 400 | 请求参数错误 | 检查请求格式和参数 |
| `UNAUTHORIZED` | 401 | 未授权 | 提供有效的 API Key |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求过于频繁 | 等待后重试 |
| `TOKEN_LIMIT_EXCEEDED` | 429 | Token 用量超限 | 升级套餐或等待重置 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 | 联系技术支持 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 | 稍后重试 |
| `IMAGE_GENERATION_FAILED` | 500 | 图片生成失败 | 重试或修改提示词 |
| `VIDEO_ANALYSIS_FAILED` | 500 | 视频分析失败 | 检查视频格式和大小 |

### 重试策略

**推荐使用指数退避策略**：

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      const delay = Math.pow(2, i) * 1000 // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}
```

---

## 速率限制

| 接口 | 限制 |
|------|------|
| `/api/chat` | 60 请求/分钟 |
| `/api/script` | 30 请求/分钟 |
| `/api/storyboard` | 10 请求/分钟（较慢） |
| `/api/analyze` | 5 请求/分钟（耗时） |

**超出限制响应**：
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## 完整示例

### 生成视频完整流程

```javascript
// 1. 生成脚本
const scriptResponse = await fetch('/api/script', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idea: '猫咪日常',
    duration: 30,
    aspectRatio: '9:16'
  })
})
const { script } = await scriptResponse.json()

// 2. 生成分镜（流式）
const storyboardResponse = await fetch('/api/storyboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ script, aspectRatio: '9:16' })
})

const reader = storyboardResponse.body.getReader()
const decoder = new TextDecoder()
const frames = []

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const text = decoder.decode(value)
  const lines = text.split('\n').filter(line => line.startsWith('data:'))

  for (const line of lines) {
    const data = JSON.parse(line.substring(5))
    if (data.type === 'frame') {
      frames.push(data.frame)
      console.log(`生成进度: ${frames.length}/${script.scenes.length}`)
    }
  }
}

console.log('分镜生成完成:', frames)

// 3. 导出视频（前端调用Remotion渲染）
// 见前端文档
```

---

## Webhook 通知（即将支持）

未来版本将支持 Webhook，在长时间任务完成时主动通知。

### 配置 Webhook

```javascript
POST /api/webhooks

{
  "url": "https://your-domain.com/webhook",
  "events": ["storyboard.complete", "video.exported"],
  "secret": "your-secret-key"
}
```

### Webhook Payload

```json
{
  "event": "storyboard.complete",
  "timestamp": "2026-04-10T12:00:00Z",
  "data": {
    "projectId": "abc123",
    "frames": [...]
  },
  "signature": "sha256=..."
}
```

---

**更新日期**: 2026-04-10  
**API 版本**: v1.0.0  
**文档版本**: v1.0.0
