---
name: 06-video-assemble
version: 1.1.0
description: |
  视频生成 Pipeline 编排。支持 Seedance/Kling 逐帧生成 + FFmpeg 拼接，或 Remotion 程序化渲染。
  触发场景：用户确认分镜后选择引擎开始生成、需要完整视频输出。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 视频 Pipeline

## 流程

```
分镜(N帧) → 逐帧生成视频片段 → 下载到本地 → FFmpeg 拼接 → 最终视频
```

## 引擎选择

| 引擎 | 时长限制 | 质量 | 速度 | 特效 | 适用场景 |
|------|----------|------|------|------|----------|
| Seedance 2.0 | 4~15s/帧 | ⭐⭐⭐⭐⭐ | ⚡⚡ | ❌ | AI 生成内容 |
| 可灵 Kling | 5s或10s/帧 | ⭐⭐⭐⭐ | ⚡⚡⚡ | ❌ | AI 生成内容 |
| **Remotion** ⭐ | 无限制 | ⭐⭐⭐⭐⭐ | ⚡⚡ | ✅✅✅ | 精细特效控制 |

### Remotion 优势

- ✅ **React 组件化**：用 JSX 描述视频
- ✅ **淡入淡出转场**：0.5秒交叉淡化
- ✅ **帧级精确控制**：interpolate() 实现任意动画
- ✅ **实时预览**：浏览器中预览效果
- ✅ **类型安全**：TypeScript 全程检查

## 长视频策略（>15秒）

单帧最长 15 秒，长视频需要分帧：
- 30 秒视频 → 6~8 个 4~5 秒片段
- 5 分钟视频 → 60~75 个片段

每个片段独立生成后 FFmpeg 拼接。

## FFmpeg 操作

```bash
# 拼接
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4

# 加背景音
ffmpeg -i video.mp4 -i audio.mp3 -filter_complex "[1:a]volume=0.3[m];[0:a][m]amix" -map 0:v -map "[aout]" output.mp4

# 变速
ffmpeg -i input.mp4 -vf "setpts=0.5*PTS" -af "atempo=2.0" output.mp4

# 裁剪
ffmpeg -ss 0 -i input.mp4 -t 10 -c copy output.mp4
```

## 关键代码

- Pipeline: `src/lib/video/pipeline.ts`
- FFmpeg: `src/lib/video/ffmpeg-utils.ts`

## Remotion 使用（v1.1）

### 环境配置

```bash
# 1. 安装依赖（已完成）
npm install remotion @remotion/bundler @remotion/renderer @remotion/cli

# 2. 安装浏览器
npx puppeteer browsers install chrome

# 3. 配置环境变量（.env.local）
REMOTION_ENABLE=true
REMOTION_CONCURRENCY=2
REMOTION_QUALITY=80
```

### 使用方式

```typescript
// Pipeline 选择引擎
const outputUrl = await runVideoPipeline({
  engine: 'remotion',  // 或 'seedance' / 'kling' / 'ffmpeg'
  storyboard,
  aspectRatio: '16:9',
})
```

### 核心文件

- 渲染引擎: `src/lib/video/remotion-pipeline.ts`
- React 组件: `src/lib/video/remotion/compositions/`
- API 端点: `src/app/api/video/remotion-render/route.ts`
- 配置文件: `remotion.config.ts`

## 迭代记录

- v1.0.0: Seedance + Kling 双引擎编排 + FFmpeg 拼接
- v1.1.0 (2026-04-05): Remotion 程序化渲染集成 ⭐
  - ✅ React 组件描述视频
  - ✅ 淡入淡出转场效果
  - ✅ 帧级精确控制
  - ✅ 与 FFmpeg 方案并存
- 待迭代: 更多转场效果（缩放、滑动、旋转）、字幕系统、音频同步
