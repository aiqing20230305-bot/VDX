# 语音识别（ASR）使用指南

## 快速开始

### 1. Whisper.cpp（推荐，完全免费）

```bash
# 安装
brew install whisper-cpp

# 下载模型
bash scripts/download-whisper-model.sh medium

# 配置
echo "ASR_ENGINES=whisper-cpp" >> .env.local
echo "WHISPER_CPP_MODEL=medium" >> .env.local

# 使用
# 系统会自动使用 Whisper.cpp 进行语音识别
```

### 2. 多引擎降级（最稳定）

```bash
# 配置多个引擎
cat >> .env.local << EOF
# 按优先级尝试（逗号分隔）
ASR_ENGINES=whisper-cpp,openai

# Whisper.cpp 配置
WHISPER_CPP_MODEL=medium

# OpenAI 备用
OPENAI_API_KEY=sk-...
EOF
```

工作流程：
1. 优先使用 Whisper.cpp（本地，免费）
2. 失败 → 降级到 OpenAI（云端，付费）
3. 所有引擎都失败 → 跳过语音识别，仅分析画面

---

## 引擎对比

| 引擎 | 成本 | 速度 | 准确率 | 国内可用 | 推荐度 |
|------|------|------|--------|----------|--------|
| **Whisper.cpp** | 免费 | 慢 | ⭐⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐⭐ |
| **阿里云** | ¥0.003/分 | 快 | ⭐⭐⭐⭐ | ✅ | ⭐⭐⭐⭐ |
| **OpenAI** | ¥0.042/分 | 快 | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐ |

---

## Whisper.cpp 模型选择

| 模型 | 大小 | 速度 | 准确率 | 适用场景 |
|------|------|------|--------|----------|
| tiny | 75MB | 极快 | ⭐⭐ | 实时字幕、草稿 |
| base | 142MB | 快 | ⭐⭐⭐ | 开发测试 |
| small | 466MB | 中 | ⭐⭐⭐⭐ | 日常使用 |
| **medium** | 1.5GB | 中慢 | ⭐⭐⭐⭐⭐ | **推荐** |
| large | 2.9GB | 慢 | ⭐⭐⭐⭐⭐ | 最高质量 |

**推荐**：medium（准确率和速度平衡）

---

## 配置说明

### 通用配置

```bash
# .env.local

# 启用的引擎（按优先级，逗号分隔）
ASR_ENGINES=whisper-cpp,aliyun,openai
```

### Whisper.cpp 配置

```bash
# Whisper.cpp 可执行文件路径（可选，默认自动查找）
WHISPER_CPP_PATH=/opt/homebrew/bin/whisper-cpp

# 模型名称（tiny/base/small/medium/large）
WHISPER_CPP_MODEL=medium

# 模型文件目录（可选，默认 ~/.whisper-models）
WHISPER_CPP_MODELS_DIR=/path/to/models
```

### 阿里云配置

```bash
# 阿里云 AccessKey
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret

# 阿里云语音识别 AppKey
ALIYUN_ASR_APP_KEY=your-app-key
```

注意：阿里云引擎需要安装 SDK（待完整实现）

### OpenAI 配置

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...
```

---

## 使用示例

### 代码调用

```typescript
import { transcribeVideoSpeech, getAvailableASREngines, estimateASRCost } from '@/lib/video/speech-to-text'

// 1. 查看可用引擎
const engines = await getAvailableASREngines()
console.log(engines)
// [
//   { name: 'whisper-cpp', available: true, cost: '免费' },
//   { name: 'openai', available: true, cost: '¥0.0042/分钟' }
// ]

// 2. 估算成本
const { engine, cost } = await estimateASRCost(120)  // 120秒视频
console.log(`使用引擎: ${engine}, 预估成本: ¥${cost.toFixed(4)}`)

// 3. 转写视频
const result = await transcribeVideoSpeech('/path/to/video.mp4')
console.log('识别文字:', result.text)
console.log('使用引擎:', result.engine)

// 4. 格式化输出（带时间轴）
import { formatTranscription } from '@/lib/video/speech-to-text'
console.log(formatTranscription(result))
// [0.0s - 3.2s] 大家好，今天我们来讲解...
// [3.2s - 7.5s] 首先我们需要了解...
```

### 命令行测试

```bash
# 创建测试脚本
cat > test-asr.js << 'EOF'
const { transcribeVideoSpeech } = require('./src/lib/video/speech-to-text')

async function test() {
  const result = await transcribeVideoSpeech(process.argv[2])
  console.log('引擎:', result.engine)
  console.log('文字:', result.text)
}

test().catch(console.error)
EOF

# 运行测试
node test-asr.js video.mp4
```

---

## 故障排查

### 1. Whisper.cpp 不可用

**症状**：提示 "whisper-cpp 不可用"

**解决**：
```bash
# 检查是否安装
which whisper-cli

# 未安装则安装
brew install whisper-cpp

# 检查模型文件
ls ~/.whisper-models/ggml-medium.bin

# 未下载则下载
bash scripts/download-whisper-model.sh medium
```

### 2. 模型下载慢

**解决**：使用国内镜像
```bash
# 从 HuggingFace 镜像下载
export HF_ENDPOINT=https://hf-mirror.com
bash scripts/download-whisper-model.sh medium
```

### 3. OpenAI API 超时

**症状**：curl timeout

**解决**：
```bash
# 配置代理
export https_proxy=http://127.0.0.1:7890

# 或切换到 Whisper.cpp
echo "ASR_ENGINES=whisper-cpp" >> .env.local
```

### 4. 所有引擎都失败

**症状**：所有 ASR 引擎都失败了

**原因**：未正确配置任何引擎

**解决**：
```bash
# 检查配置
cat .env.local | grep ASR

# 至少配置一个引擎
echo "ASR_ENGINES=whisper-cpp" >> .env.local
bash scripts/download-whisper-model.sh medium
```

---

## 性能优化

### 1. 加速 Whisper.cpp

```bash
# 使用更小的模型
WHISPER_CPP_MODEL=small  # 466MB，速度快 2 倍

# 使用 GPU（需要编译支持）
# 参考：https://github.com/ggerganov/whisper.cpp#metal-build-macos
```

### 2. 缓存识别结果

```typescript
// 视频分析时缓存语音识别结果
const cacheKey = `asr:${videoPath}`
const cached = await redis.get(cacheKey)
if (cached) {
  return JSON.parse(cached)
}

const result = await transcribeVideoSpeech(videoPath)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400)  // 缓存 24 小时
```

### 3. 异步处理

```typescript
// 长视频异步处理
import { transcribeVideoSpeech } from '@/lib/video/speech-to-text'

// 提交异步任务
const job = await queue.add('asr', { videoPath })

// 后台处理
queue.process('asr', async (job) => {
  const result = await transcribeVideoSpeech(job.data.videoPath)
  return result
})
```

---

## 扩展开发

### 添加新引擎

1. 创建引擎类
```typescript
// src/lib/video/asr/myengine.ts
export class MyEngine implements ASREngine {
  name = 'myengine'
  priority = 2
  
  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    // 实现转写逻辑
  }
  
  async isAvailable(): Promise<boolean> {
    // 检查是否可用
  }
  
  estimateCost(durationSeconds: number): number {
    // 估算成本
  }
}
```

2. 注册引擎
```typescript
// src/lib/video/asr/manager.ts
import { MyEngine } from './myengine'

const allEngines: ASREngine[] = [
  new WhisperCppEngine(),
  new MyEngine(),  // 添加新引擎
  new OpenAIASREngine(),
]
```

3. 配置使用
```bash
ASR_ENGINES=myengine
```

---

## 常见问题

**Q: Whisper.cpp 和 OpenAI Whisper 有什么区别？**

A: 
- OpenAI Whisper：官方 API，云端运行，需要网络和 API Key，付费
- Whisper.cpp：开源实现，本地运行，无需网络，完全免费

**Q: 哪个引擎准确率最高？**

A: OpenAI Whisper API 和 Whisper.cpp(large 模型) 准确率最高，阿里云次之。

**Q: 如何降低成本？**

A: 优先使用 Whisper.cpp（免费），云端引擎作为备用。

**Q: 支持哪些语言？**

A: 所有引擎都支持中文。Whisper 支持 99+ 语言，阿里云主要支持中英文。

**Q: 可以批量处理吗？**

A: 可以。使用队列系统批量提交任务，避免并发过多占用资源。

---

## 更多资源

- Whisper.cpp: https://github.com/ggerganov/whisper.cpp
- OpenAI Whisper: https://platform.openai.com/docs/guides/speech-to-text
- 阿里云 ASR: https://help.aliyun.com/product/30413.html
- 模型下载: https://huggingface.co/ggerganov/whisper.cpp
