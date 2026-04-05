---
name: 03-storyboard-overview
version: 1.0.0
description: |
  分镜合成概览图。将多帧分镜图片合成为一张带序号标注的概览图，用于快速预览分镜节奏。
  触发场景：分镜图生成完成后、需要整体预览分镜。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 分镜合成概览图

## 功能

将 N 帧分镜图片合成为一张网格图：
- 自动根据帧数选择列数（4~6列）
- 每帧左上角标注序号和时长
- 深色背景，帧间留间距
- 输出为 JPG

## 实现

使用 `sharp` 库合成：
1. 创建画布（深色背景）
2. 逐帧下载/读取图片 → resize → composite
3. SVG 叠加序号标注
4. 输出到 `public/outputs/`

## 关键代码

`src/lib/video/storyboard-composite.ts`

## 迭代记录

- v1.0.0: 基础网格合成 + 序号标注 + 时长标注
