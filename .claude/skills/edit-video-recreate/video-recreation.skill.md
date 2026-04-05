---
name: edit-video-recreate
version: 1.1.0
description: |
  视频分析与二创。分析输入视频的所有元素（角色、场景、音频、特效、口播内容），
  支持描述式修改元素进行二创，可修改时长。
  触发场景：用户上传视频要二创、需要分析视频内容。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 视频分析与二创

## 分析流程

```
1. 上传视频
2. FFmpeg 提取关键帧（每2秒1帧，最多20帧）
3. 🎤 语音识别：提取视频口播文字（Whisper API）
4. Claude 综合分析：画面 + 口播 → 理解核心主题
5. 输出元素列表 + 场景描述 + 情绪板 + 二创建议
```

## ⭐ v1.1 新增：口播识别

### 为什么需要口播识别？

很多视频（教程、解说、产品介绍）的核心内容在语音里：
- ❌ 只看画面：可能误解主题，抓不到要点
- ✅ 画面+口播：准确理解视频意图和内容

### 工作原理

```
视频文件
  ↓ FFmpeg 提取音频
音频 MP3
  ↓ Whisper API 转写
逐字稿（带时间轴）
  ↓ 加入分析 Prompt
Claude 综合分析
```

### 环境配置

#### 方案 1：Whisper.cpp（推荐 ⭐ 免费）

```bash
# 1. 安装 Whisper.cpp
brew install whisper-cpp

# 2. 下载模型
bash scripts/download-whisper-model.sh medium

# 3. 配置环境变量（.env.local）
ASR_ENGINES=whisper-cpp
WHISPER_CPP_MODEL=medium
```

#### 方案 2：阿里云（便宜快速）

```bash
# .env.local
ASR_ENGINES=aliyun
ALIYUN_ACCESS_KEY_ID=...
ALIYUN_ACCESS_KEY_SECRET=...
ALIYUN_ASR_APP_KEY=...
```

#### 方案 3：OpenAI（国际用户）

```bash
# .env.local
ASR_ENGINES=openai
OPENAI_API_KEY=sk-...
```

#### 方案 4：多引擎降级（推荐 ⭐⭐）

```bash
# 按优先级尝试多个引擎
ASR_ENGINES=whisper-cpp,aliyun,openai

# 配置所有引擎（未配置的会自动跳过）
WHISPER_CPP_MODEL=medium
ALIYUN_ACCESS_KEY_ID=...
OPENAI_API_KEY=...
```

### 技术细节

- **音频提取**：`ffmpeg -i video.mp4 -vn -acodec libmp3lame audio.mp3`
- **语音识别**：OpenAI Whisper API（`whisper-1` 模型，支持中文）
- **文件限制**：音频 ≤ 25MB（超过需要分段处理）
- **输出格式**：`verbose_json`（包含时间轴分段）

## 二创流程

```
1. 基于分析结果，用户描述修改方向
2. 生成二创脚本（保留/替换/添加/删除元素）
3. 进入标准分镜 → 视频生成流程
```

## 修改操作类型

| 操作 | 说明 |
|------|------|
| replace | 替换元素（如换角色） |
| remove | 移除元素 |
| add | 添加新元素 |
| modify | 修改元素属性（如改颜色） |

## FFmpeg 帧提取

```bash
ffmpeg -i input.mp4 -vf "fps=0.5" frames/frame_%04d.jpg
```

## 关键代码

- 分析引擎: `src/lib/ai/analysis-engine.ts`
- API: `src/app/api/analyze/route.ts`

## 迭代记录

- v1.0.0: Claude 视觉分析 + 元素提取 + 二创脚本生成
- 待迭代: 音频分析（BGM识别、人声提取）、时间线标注
