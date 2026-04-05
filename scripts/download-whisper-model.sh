#!/bin/bash
# 下载 Whisper.cpp 模型文件

MODEL=${1:-medium}  # 默认 medium 模型
MODELS_DIR="${HOME}/.whisper-models"

echo "📦 下载 Whisper 模型: $MODEL"
echo "📁 目标目录: $MODELS_DIR"

# 创建模型目录
mkdir -p "$MODELS_DIR"

# 模型下载地址
BASE_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main"
MODEL_FILE="ggml-${MODEL}.bin"
MODEL_PATH="${MODELS_DIR}/${MODEL_FILE}"

# 检查是否已存在
if [ -f "$MODEL_PATH" ]; then
  echo "✅ 模型已存在: $MODEL_PATH"
  exit 0
fi

# 下载模型
echo "⬇️  开始下载 $MODEL_FILE ..."
curl -L "${BASE_URL}/${MODEL_FILE}" -o "$MODEL_PATH"

if [ $? -eq 0 ]; then
  echo "✅ 下载成功: $MODEL_PATH"
  echo "📊 文件大小: $(du -h "$MODEL_PATH" | cut -f1)"
else
  echo "❌ 下载失败"
  rm -f "$MODEL_PATH"
  exit 1
fi

echo ""
echo "🎉 完成！现在可以使用 Whisper.cpp 进行语音识别了"
echo ""
echo "环境变量配置示例："
echo "  WHISPER_CPP_MODEL=$MODEL"
echo "  WHISPER_CPP_MODELS_DIR=$MODELS_DIR"
