---
name: 06-video-assemble
version: 1.2.0
description: |
  视频生成 Pipeline 编排。支持 Seedance/Kling 逐帧生成 + FFmpeg 拼接，或 Remotion 程序化渲染（含 5 种转场）。
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
- ✅ **5 种转场效果**：fade / slide / zoom / rotate / wipe
- ✅ **7 种缓动函数**：linear / ease-in / ease-out / ease-in-out / cubic 变体
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
- 转场系统: `src/lib/video/remotion/transitions/`
- API 端点: `src/app/api/video/remotion-render/route.ts`
- 配置文件: `remotion.config.ts`

### 转场系统（v1.2）

**5 种转场类型：**

| 类型 | 说明 | 配置示例 |
|------|------|----------|
| **fade** | 淡入淡出（透明度） | `{ type: 'fade', duration: 15, easing: 'ease-in-out' }` |
| **slide** | 滑动进入（位移） | `{ type: 'slide', direction: 'left', easing: 'ease-out' }` |
| **zoom** | 缩放进入（scale） | `{ type: 'zoom', zoomType: 'in', scale: 1.5 }` |
| **rotate** | 旋转进入（3D） | `{ type: 'rotate', axis: 'y', angle: 90 }` |
| **wipe** | 擦除效果（clip-path） | `{ type: 'wipe', direction: 'circle' }` |

**7 种缓动函数：**
- `linear`：匀速
- `ease-in`：加速
- `ease-out`：减速
- `ease-in-out`：先加速后减速
- `ease-in-cubic`：三次方加速
- `ease-out-cubic`：三次方减速
- `ease-in-out-cubic`：三次方先加速后减速

**向后兼容**：
```typescript
// 字符串格式（向后兼容）
transition: 'fade'

// 对象格式（完整配置）
transition: {
  type: 'fade',
  config: { duration: 15, easing: 'ease-in-out' }
}
```

**工厂模式**：
- `TransitionFactory` 根据配置动态选择转场组件
- 未知类型自动降级到无转场
- GPU 加速：所有转场使用 `transform`/`opacity` 不触发 layout

### 字幕系统（v1.3）

**功能特性：**
- ✅ 时间轴精确同步（基于 fps）
- ✅ 淡入淡出动画（默认 0.2 秒）
- ✅ 完全可配置样式（字体/颜色/描边/背景/阴影）
- ✅ 多轨道支持（中英双语字幕）
- ✅ 3 种位置（顶部/中间/底部）
- ✅ SRT 格式导入导出

**使用示例：**
```typescript
const subtitles: SubtitleTrack[] = [
  {
    id: 'main',
    entries: [
      {
        startTime: 0,
        endTime: 3,
        text: '欢迎来到超级视频',
        position: 'bottom',
      },
    ],
  },
]

// 在 Storyboard 中使用
storyboard.subtitles = subtitles
```

**核心组件：**
- `Subtitle`: 单条字幕组件
- `SubtitleLayer`: 字幕层（多轨道管理）
- `parseSRT` / `generateSRT`: SRT 格式工具

### 标题动画系统（v1.3）

**6 种动画类型：**
- `slideIn`: 滑动进入（4 个方向）
- `fadeIn`: 淡入
- `zoomIn`: 缩放进入
- `bounceIn`: 弹跳进入
- `rotateIn`: 旋转进入
- `typewriter`: 打字机效果（逐字显示）

**功能特性：**
- ✅ 进入与退出动画
- ✅ 7 种缓动函数
- ✅ 3 种位置（top/center/bottom）
- ✅ 完全可配置样式（字体/颜色/描边/阴影/背景）
- ✅ 多轨道支持

**使用示例：**
```typescript
const titles: TitleTrack[] = [
  {
    id: 'main',
    entries: [
      {
        startTime: 0,
        endTime: 3,
        text: '标题文本',
        position: 'center',
        animation: {
          type: 'slideIn',
          direction: 'bottom',
          duration: 30,
          exitAnimation: true,
        },
      },
    ],
  },
]

// 在 Storyboard 中使用
storyboard.titles = titles
```

**核心组件：**
- `Title`: 单个标题组件
- `TitleLayer`: 标题层（多轨道管理）
- `animations`: 动画效果库

## 迭代记录

- v1.0.0: Seedance + Kling 双引擎编排 + FFmpeg 拼接
- v1.1.0 (2026-04-05): Remotion 程序化渲染集成（Phase 1） ⭐
  - ✅ React 组件描述视频
  - ✅ 淡入淡出转场效果
  - ✅ 帧级精确控制
  - ✅ 与 FFmpeg 方案并存
- v1.2.0 (2026-04-05): Remotion 转场系统（Phase 2 完成） ⭐
  - ✅ 5 种转场类型（fade / slide / zoom / rotate / wipe）
  - ✅ 7 种缓动函数（linear / ease-in/out / cubic 变体）
  - ✅ 工厂模式动态选择
  - ✅ 向后兼容字符串配置
  - ✅ GPU 加速（transform/opacity）
  - ✅ 转场系统集成到 FrameSequence
  - ✅ 完整测试覆盖（单元测试 + 集成测试）
- v1.3.0 (2026-04-05): Remotion 文字系统（Phase 3 部分完成） ⭐
  - ✅ 字幕系统（时间轴同步/多轨道/SRT 格式）
  - ✅ 标题动画（6 种动画类型/进入退出/打字机）
  - ✅ 完全可配置样式（字体/颜色/描边/阴影）
  - ✅ GPU 优化（willChange / pointerEvents）
  - ✅ 完整测试覆盖（字幕 3 测试 + 标题 4 测试）
- 待迭代: 弹幕效果、音频同步、前端 UI 集成
