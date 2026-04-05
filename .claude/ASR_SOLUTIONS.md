# 语音识别（ASR）方案调研

## 需求
- 从视频中提取口播文字
- 支持中文
- 准确率高
- 成本可控
- 国内可用

---

## 方案对比

### 1. 🌐 云服务 API

#### OpenAI Whisper API（当前方案）
- **优点**：准确率高、支持多语言、时间轴分段
- **缺点**：国内访问需代理、API 收费（$0.006/分钟）
- **API**：`https://api.openai.com/v1/audio/transcriptions`
- **适用**：有代理且预算充足

#### 阿里云语音识别（推荐 ⭐）
- **优点**：国内稳定、支持实时/录音、价格便宜
- **缺点**：需要阿里云账号
- **价格**：录音文件识别 ¥0.003/分钟（比 Whisper 便宜一半）
- **API**：阿里云 SDK
- **免费额度**：新用户 3 个月免费
- **适用**：生产环境推荐

#### 腾讯云语音识别
- **优点**：国内稳定、API 简单
- **缺点**：价格略高于阿里云
- **价格**：¥0.012/分钟
- **API**：腾讯云 SDK
- **免费额度**：新用户 50 小时
- **适用**：已有腾讯云账号的用户

#### 百度智能云
- **优点**：国内稳定、有免费额度
- **缺点**：准确率一般
- **价格**：¥0.003/分钟
- **免费额度**：每日 50,000 次调用
- **适用**：预算紧张的用户

#### 讯飞语音（科大讯飞）
- **优点**：中文识别准确率高、国内老牌
- **缺点**：API 复杂、文档较差
- **价格**：¥0.005/分钟
- **免费额度**：每日 500 次
- **适用**：对中文准确率要求极高

#### 火山引擎（字节跳动）
- **优点**：技术新、准确率高、价格低
- **缺点**：文档较少
- **价格**：¥0.002/分钟（最便宜）
- **API**：火山引擎 SDK
- **适用**：成本敏感用户

---

### 2. 🖥️ 本地部署（开源模型）

#### Whisper.cpp（推荐 ⭐⭐）
- **优点**：
  - 完全免费
  - 无需网络
  - 隐私安全
  - 准确率接近 OpenAI API
- **缺点**：
  - 首次下载模型文件（几百MB）
  - 需要 CPU/GPU 算力
  - 速度较慢（CPU 推理可能慢 2-5 倍实时）
- **安装**：
  ```bash
  brew install whisper-cpp
  # 或
  git clone https://github.com/ggerganov/whisper.cpp
  cd whisper.cpp && make
  ```
- **使用**：
  ```bash
  whisper-cpp -m models/ggml-medium.bin -f audio.wav -l zh
  ```
- **模型大小**：
  - tiny: 75MB（快但不准）
  - base: 142MB
  - small: 466MB
  - medium: 1.5GB（推荐）
  - large: 2.9GB（最准）
- **适用**：本地使用、无网络环境、隐私要求高

#### Faster Whisper（推荐 ⭐）
- **优点**：比 Whisper.cpp 快 4 倍、准确率相同
- **缺点**：需要 Python 环境
- **安装**：
  ```bash
  pip install faster-whisper
  ```
- **使用**：
  ```python
  from faster_whisper import WhisperModel
  model = WhisperModel("medium", device="cpu")
  segments, info = model.transcribe("audio.mp3", language="zh")
  ```
- **适用**：有 Python 环境、追求速度

#### SenseVoice（阿里开源）
- **优点**：专为中文优化、极快、支持情绪识别
- **缺点**：文档较少、社区小
- **GitHub**：`https://github.com/FunAudioLLM/SenseVoice`
- **适用**：纯中文场景、追求速度

#### FunASR（阿里达摩院）
- **优点**：工业级、支持多种语言、准确率高
- **缺点**：配置复杂
- **GitHub**：`https://github.com/alibaba-damo-academy/FunASR`
- **适用**：有技术能力的团队

---

### 3. 🔄 混合方案（推荐）

#### 方案 A：本地优先 + 云备份
```
1. 优先使用 Whisper.cpp 本地识别（免费）
2. 失败或超时 → 降级到阿里云 API
3. 成本：大部分免费，少量付费
```

#### 方案 B：短视频本地 + 长视频云端
```
1. ≤3分钟 → Whisper.cpp 本地
2. >3分钟 → 阿里云 API（避免本地处理太慢）
```

#### 方案 C：多引擎支持 + 用户选择
```
1. 提供多种引擎选项（环境变量配置）
2. 用户根据需求选择：
   - 免费但慢 → Whisper.cpp
   - 快速稳定 → 阿里云
   - 国外用户 → OpenAI
```

---

## 推荐方案

### 🥇 最佳方案：Whisper.cpp + 阿里云
```
优先级：
1. Whisper.cpp（本地，免费）
2. 阿里云（云端，便宜）
3. OpenAI（国际，贵）

配置：
ASR_ENGINE=whisper-cpp|aliyun|openai
ALIYUN_ACCESS_KEY=...
ALIYUN_ACCESS_SECRET=...
OPENAI_API_KEY=...
```

### 🥈 次选方案：纯阿里云
```
- 稳定可靠
- 成本可控（¥0.003/分钟）
- 无需本地配置
- 适合生产环境
```

### 🥉 备选方案：纯 Whisper.cpp
```
- 完全免费
- 适合开发测试
- 适合隐私敏感场景
- 需要用户自行安装
```

---

## 成本对比（10分钟视频）

| 方案 | 成本 | 速度 | 准确率 | 国内可用 |
|------|------|------|--------|----------|
| Whisper.cpp | ¥0 | 慢（20-60秒） | ⭐⭐⭐⭐⭐ | ✅ |
| 阿里云 | ¥0.03 | 快（5-10秒） | ⭐⭐⭐⭐ | ✅ |
| 火山引擎 | ¥0.02 | 快（5-10秒） | ⭐⭐⭐⭐ | ✅ |
| 百度云 | ¥0.03 | 快（5-10秒） | ⭐⭐⭐ | ✅ |
| 腾讯云 | ¥0.12 | 快（5-10秒） | ⭐⭐⭐⭐ | ✅ |
| OpenAI | ¥0.42 | 快（10-15秒） | ⭐⭐⭐⭐⭐ | ❌ 需代理 |

---

## 实现建议

### 架构设计
```typescript
// 统一接口
interface ASREngine {
  name: string
  transcribe(audioPath: string): Promise<TranscriptionResult>
  isAvailable(): boolean  // 检查是否可用
  estimateCost(durationSeconds: number): number  // 估算成本
}

// 多引擎支持
class WhisperCppEngine implements ASREngine { ... }
class AliyunASREngine implements ASREngine { ... }
class OpenAIASREngine implements ASREngine { ... }

// 自动选择引擎
class ASRManager {
  engines: ASREngine[]
  
  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    // 按优先级尝试每个引擎
    for (const engine of this.engines) {
      if (engine.isAvailable()) {
        try {
          return await engine.transcribe(audioPath)
        } catch (err) {
          console.warn(`Engine ${engine.name} failed, trying next...`)
        }
      }
    }
    throw new Error('All ASR engines failed')
  }
}
```

### 环境配置
```bash
# .env.local
# 引擎选择（逗号分隔，按优先级）
ASR_ENGINES=whisper-cpp,aliyun,openai

# Whisper.cpp 配置
WHISPER_CPP_PATH=/usr/local/bin/whisper-cpp
WHISPER_CPP_MODEL=medium  # tiny/base/small/medium/large

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=...
ALIYUN_ACCESS_KEY_SECRET=...

# OpenAI 配置（备用）
OPENAI_API_KEY=...
```

---

## 下一步行动

1. ✅ 实现 Whisper.cpp 引擎
2. ✅ 实现阿里云 ASR 引擎
3. ✅ 实现引擎管理器（自动降级）
4. ✅ 更新文档和配置说明
5. ⬜ 测试各引擎准确率
6. ⬜ 性能基准测试

---

## 参考资源

- Whisper.cpp: https://github.com/ggerganov/whisper.cpp
- Faster Whisper: https://github.com/guillaumekln/faster-whisper
- 阿里云 ASR: https://help.aliyun.com/product/30413.html
- SenseVoice: https://github.com/FunAudioLLM/SenseVoice
- FunASR: https://github.com/alibaba-damo-academy/FunASR
