# 语音识别快速启动（2分钟配置）

## ⚡ 快速安装（推荐 Whisper.cpp）

### macOS

```bash
# 1. 安装 Whisper.cpp（Homebrew）
brew install whisper-cpp

# 2. 下载模型（medium，1.5GB，准确率高）
bash scripts/download-whisper-model.sh medium

# 3. 测试（可选）
whisper-cli --help | head -5
```

**完成！** 现在视频分析会自动使用 Whisper.cpp 进行语音识别。

---

### Linux

```bash
# 1. 从源码编译
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# 2. 下载模型
bash models/download-ggml-model.sh medium

# 3. 配置路径
export WHISPER_CPP_PATH=/path/to/whisper.cpp/main
export WHISPER_CPP_MODELS_DIR=/path/to/whisper.cpp/models
```

---

### Windows

```bash
# 使用 WSL2 或参考官方文档
# https://github.com/ggerganov/whisper.cpp#quick-start
```

---

## 🎯 使用

### 无需额外配置

默认配置已启用 Whisper.cpp，无需修改 `.env.local`。

### 自定义配置

```bash
# .env.local

# 使用不同模型（可选）
WHISPER_CPP_MODEL=small  # 更快但准确率略低

# 多引擎降级（可选）
ASR_ENGINES=whisper-cpp,openai
OPENAI_API_KEY=sk-...
```

---

## 📊 模型对比

| 模型 | 大小 | 速度 | 准确率 | 下载命令 |
|------|------|------|--------|----------|
| tiny | 75MB | ⚡️⚡️⚡️⚡️⚡️ | ⭐⭐ | `bash scripts/download-whisper-model.sh tiny` |
| base | 142MB | ⚡️⚡️⚡️⚡️ | ⭐⭐⭐ | `bash scripts/download-whisper-model.sh base` |
| small | 466MB | ⚡️⚡️⚡️ | ⭐⭐⭐⭐ | `bash scripts/download-whisper-model.sh small` |
| **medium** | 1.5GB | ⚡️⚡️ | ⭐⭐⭐⭐⭐ | `bash scripts/download-whisper-model.sh medium` ⭐ |
| large | 2.9GB | ⚡️ | ⭐⭐⭐⭐⭐ | `bash scripts/download-whisper-model.sh large` |

**推荐**：medium（准确率和速度最佳平衡）

---

## ✅ 验证安装

### 1. 检查 Whisper.cpp

```bash
which whisper-cli
# 输出：/opt/homebrew/bin/whisper-cli

whisper-cli --help | head -5
```

### 2. 检查模型文件

```bash
ls -lh ~/.whisper-models/ggml-medium.bin
# 输出：-rw-r--r-- 1 user staff 1.5G Apr 5 12:00 ggml-medium.bin
```

### 3. 测试识别（可选）

```bash
# 创建测试音频
say "测试语音识别功能" -o test.m4a

# 提取音频
ffmpeg -i test.m4a -ar 16000 -ac 1 test.wav -y

# 运行识别
whisper-cli -m ~/.whisper-models/ggml-medium.bin -f test.wav -l zh
```

---

## ❓ 故障排查

### 问题 1：whisper-cli: command not found

**解决**：
```bash
# 重新安装
brew install whisper-cpp

# 或手动指定路径
echo 'export WHISPER_CPP_PATH=/opt/homebrew/bin/whisper-cli' >> .env.local
```

### 问题 2：模型文件不存在

**解决**：
```bash
# 重新下载
bash scripts/download-whisper-model.sh medium

# 检查下载目录
ls -la ~/.whisper-models/
```

### 问题 3：下载速度慢

**解决**：使用国内镜像
```bash
# HuggingFace 镜像
export HF_ENDPOINT=https://hf-mirror.com
bash scripts/download-whisper-model.sh medium
```

### 问题 4：识别速度慢

**解决**：
```bash
# 方案 1：使用更小的模型
echo "WHISPER_CPP_MODEL=small" >> .env.local

# 方案 2：使用云端 API（快但付费）
echo "ASR_ENGINES=openai" >> .env.local
echo "OPENAI_API_KEY=sk-..." >> .env.local
```

---

## 💡 性能优化

### 1. 加速识别

```bash
# 使用 small 模型（快 2 倍，准确率略低）
WHISPER_CPP_MODEL=small
```

### 2. GPU 加速（macOS）

```bash
# 如果有 Apple Silicon（M1/M2/M3），自动使用 Metal 加速
# Whisper.cpp 会自动检测并使用 GPU
```

### 3. 异步处理

对于长视频（>5分钟），使用后台任务队列避免阻塞。

---

## 📚 更多信息

- 完整文档：`.claude/ASR_USAGE.md`
- 多引擎支持：`.claude/ASR_SOLUTIONS.md`
- Whisper.cpp 官方：https://github.com/ggerganov/whisper.cpp

---

## 🎉 完成

现在你可以：
- ✅ 上传视频进行分析，自动识别口播内容
- ✅ 完全免费，无需 API Key
- ✅ 隐私安全，本地处理
- ✅ 支持中文等多种语言

如果遇到问题，查看故障排查或参考完整文档。
