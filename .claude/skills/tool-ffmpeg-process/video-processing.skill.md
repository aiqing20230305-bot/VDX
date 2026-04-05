---
name: tool-ffmpeg-process
version: 1.0.0
description: |
  FFmpeg 视频处理操作。拼接、裁剪、变速、加音频、比例转换、帧提取。
  触发场景：需要后处理视频片段、合并视频、调整视频属性。
allowed-tools:
  - Bash
  - Read
---

# FFmpeg 视频处理

## 常用操作

### 拼接视频
```bash
# 写 concat 列表
printf "file '%s'\n" clip1.mp4 clip2.mp4 > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4 -y
```

### 裁剪
```bash
ffmpeg -ss 5 -i input.mp4 -t 10 -c copy output.mp4 -y
```

### 变速
```bash
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" output.mp4 -y
```

### 加背景音乐
```bash
ffmpeg -i video.mp4 -i bgm.mp3 \
  -filter_complex "[1:a]volume=0.3[m];[0:a][m]amix=inputs=2:duration=first[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a aac output.mp4 -y
```

### 比例转换（加黑边）
```bash
ffmpeg -i input.mp4 -vf "scale=...,pad=..." -c:a copy output.mp4 -y
```

### 提取帧
```bash
ffmpeg -i input.mp4 -vf "fps=1" frames/frame_%04d.jpg -y
```

### 获取视频信息
```bash
ffprobe -v quiet -print_format json -show_streams -show_format input.mp4
```

## 关键代码

`src/lib/video/ffmpeg-utils.ts`

## 迭代记录

- v1.0.0: 拼接/裁剪/变速/加音频/比例转换/帧提取/视频信息
