---
name: tool-image-generate
version: 1.0.0
description: |
  即梦图片生成。文生图和图生图，用于分镜图、参考图、风格转换。
  触发场景：生成分镜图片、根据参考图生成新图、图片风格转换。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 图片生成

## 命令

### 文生图
```bash
dreamina text2image \
  --prompt="..." \
  --ratio=16:9 \
  --model_version=5.0 \
  --resolution_type=2k \
  --poll=60
```

### 图生图
```bash
dreamina image2image \
  --images=./input.png \
  --prompt="turn into watercolor style" \
  --ratio=1:1 \
  --model_version=5.0 \
  --resolution_type=2k \
  --poll=60
```

## 模型

| 模型 | 分辨率 |
|------|--------|
| 3.0 / 3.1 | 1k / 2k |
| 4.0 / 4.1 / 4.5 / 4.6 / 5.0 | 2k / 4k |
| lab（VIP） | 2k / 4k |

## 比例

21:9 / 16:9 / 3:2 / 4:3 / 1:1 / 3:4 / 2:3 / 9:16

## 图片格式自动转换

不支持的格式（HEIC/BMP/TIFF/AVIF）自动转 PNG：
```bash
sips -s format png input.heic --out output.png    # macOS 首选
ffmpeg -i input.bmp output.png -y                  # 备选
```

## 关键代码

`src/lib/video/dreamina-image.ts`

## 迭代记录

- v1.0.0: text2image + image2image + 格式自动转换
