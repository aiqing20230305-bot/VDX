# Pretext 文字动画集成计划

## Context（背景）

### 为什么需要 Pretext？

当前 Remotion 视频系统已支持基础的图片序列渲染和淡入淡出转场，但文字动画能力有限：

**当前文字能力的局限：**
- ❌ 静态文字叠加，无动态效果
- ❌ 依赖外部字幕工具
- ❌ 无法实现专业片头/标题动画
- ❌ 无创意文字转场
- ❌ 字符级精确控制困难

**Pretext 的优势：**
- ✅ **字符级精确测量**：`prepareWithSegments()` 测量每个字符宽度，无 DOM 重排
- ✅ **极致性能**：纯算术布局，0.09ms/帧，60fps 流畅
- ✅ **完美契合 Remotion**：Canvas 渲染 + React 组件化
- ✅ **创意文字效果**：流体、粒子、ASCII 艺术、变量字体
- ✅ **交互性**：鼠标驱动动画（可选）

**Phase 1 目标（2周）：**
实现 Pretext 基础集成，提供 3 种核心文字动画组件（流体、粒子、ASCII），与 Remotion 无缝配合。

---

## 技术架构设计

### 1. 整体定位

Pretext 作为 **Remotion 文字动画层**，扩展视频生成能力：

```
视频渲染层次：
├─ Remotion（视频编排）
│   ├─ StoryboardVideo（分镜序列）⭐ 已完成
│   ├─ FrameSequence（单帧渲染）⭐ 已完成
│   └─ Pretext 组件（文字动画）⭐ 新增
│       ├─ PretextFluidText（流体文字）
│       ├─ PretextParticleText（粒子文字）
│       └─ PretextASCIIArt（ASCII 艺术）
└─ Seedance/Kling（AI 生成）
```

### 2. 核心数据流

```
分镜数据（Storyboard）
  ↓
StoryboardFrame + titleAnimation 配置
  ↓
Remotion Composition
  ├─ FrameSequence（背景图片）
  └─ PretextComponent（文字动画层）⭐ 新增
      ├─ prepareWithSegments()（测量字符）
      ├─ layoutWithLines()（布局计算）
      └─ Canvas fillText()（渲染）
  ↓
60fps 视频输出
```

### 3. 与现有系统集成点

**修改文件：**
- `src/types/index.ts` - 扩展 StoryboardFrame 类型
- `remotion/Root.tsx` - 注册 Pretext Composition

**新增文件：**
- `src/lib/video/remotion/pretext/` - Pretext 组件库
- `src/lib/video/remotion/pretext/utils.ts` - 工具函数
- `src/lib/video/remotion/pretext/types.ts` - 类型定义
- `.claude/skills/tool-pretext-text/` - Skill 文档

---

## 核心文件结构

### 新增目录结构

```
src/lib/video/remotion/pretext/       # Pretext 集成层
├── components/                       # React 组件
│   ├── PretextFluidText.tsx         # 流体文字（Phase 1 核心）
│   ├── PretextParticleText.tsx      # 粒子文字
│   ├── PretextASCIIArt.tsx          # ASCII 艺术
│   └── PretextCanvas.tsx            # Canvas 封装基类
├── effects/                          # 动画效果
│   ├── fluid.ts                     # 流体场计算
│   ├── particle.ts                  # 粒子物理系统
│   └── ascii.ts                     # 密度映射算法
├── utils.ts                          # Pretext 工具封装
├── types.ts                          # 类型定义
└── README.md                         # 使用文档

.claude/skills/tool-pretext-text/     # Skill 文档
├── SKILL.md                          # Skill 定义
└── examples/                         # 示例代码

scripts/
└── test-pretext.ts                   # 端到端测试脚本
```

---

## 关键实现详解

### 1. 数据类型扩展

**扩展 StoryboardFrame（src/types/index.ts）：**
```typescript
// 文字动画配置
export interface PretextAnimation {
  type: 'fluid' | 'particle' | 'ascii'
  text: string                        // 显示文字
  config: PretextConfig
}

export interface PretextConfig {
  // 通用配置
  fontFamily?: string                 // 字体
  fontWeight?: number                 // 字重（100-900）
  fontSize?: number                   // 字号
  color?: string                      // 颜色
  position?: { x: number; y: number } // 位置（0-1 归一化）

  // 流体特有
  fluidSpeed?: number                 // 流动速度
  fluidDensity?: number               // 密度

  // 粒子特有
  particleCount?: number              // 粒子数量
  explosionForce?: number             // 爆炸力度

  // ASCII 特有
  asciiChars?: string                 // 字符集
  asciiDensity?: number               // 密度映射范围
}

// 扩展分镜帧类型
export interface StoryboardFrame {
  // ... 现有字段
  titleAnimation?: PretextAnimation   // ⭐ 新增：文字动画
}
```

### 2. Pretext 工具封装

#### A. 工具函数（utils.ts）

```typescript
// src/lib/video/remotion/pretext/utils.ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

/**
 * 预处理文本（一次性，缓存结果）
 */
export function prepareText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number
) {
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`
  return prepareWithSegments(text, font)
}

/**
 * 布局文本行（每帧调用）
 */
export function layoutText(
  prepared: ReturnType<typeof prepareWithSegments>,
  maxWidth: number,
  lineHeight: number
) {
  return layoutWithLines(prepared, maxWidth, lineHeight)
}

/**
 * 字符密度映射（用于 ASCII 艺术）
 */
export function getDensityChar(
  brightness: number,      // 0-1
  charset: string = ' .:-=+*#%@'
): string {
  const index = Math.floor(brightness * (charset.length - 1))
  return charset[index]
}

/**
 * 创建粒子系统
 */
export interface Particle {
  char: string
  x: number
  y: number
  vx: number
  vy: number
  life: number              // 0-1
  targetX: number
  targetY: number
}

export function createParticles(
  text: string,
  prepared: ReturnType<typeof prepareWithSegments>,
  count: number
): Particle[] {
  const particles: Particle[] = []
  const { widths, segments } = prepared

  // 为每个字符创建粒子
  let x = 0
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const width = widths[i]

    particles.push({
      char: segment,
      x: x + width / 2,           // 初始位置
      y: 0,
      vx: (Math.random() - 0.5) * 10,  // 随机速度
      vy: (Math.random() - 0.5) * 10,
      life: 1,
      targetX: x + width / 2,     // 目标位置
      targetY: 0,
    })

    x += width
  }

  return particles
}

/**
 * 更新粒子物理（每帧调用）
 */
export function updateParticles(
  particles: Particle[],
  deltaTime: number,
  springForce = 0.05,
  damping = 0.9
) {
  for (const p of particles) {
    // 弹簧力（回归目标位置）
    const dx = p.targetX - p.x
    const dy = p.targetY - p.y
    p.vx += dx * springForce
    p.vy += dy * springForce

    // 阻尼
    p.vx *= damping
    p.vy *= damping

    // 更新位置
    p.x += p.vx * deltaTime
    p.y += p.vy * deltaTime

    // 生命周期
    p.life -= deltaTime * 0.01
    if (p.life < 0) p.life = 0
  }
}
```

### 3. React 组件实现

#### A. 流体文字组件（PretextFluidText.tsx）⭐ 核心

```typescript
// src/lib/video/remotion/pretext/components/PretextFluidText.tsx
import React, { useRef, useEffect, useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { prepareText, layoutText } from '../utils'

export interface PretextFluidTextProps {
  text: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  fluidSpeed?: number     // 流动速度
  fluidDensity?: number   // 密度
}

export const PretextFluidText: React.FC<PretextFluidTextProps> = ({
  text,
  fontFamily = 'Inter',
  fontSize = 80,
  fontWeight = 700,
  color = '#ffffff',
  fluidSpeed = 1,
  fluidDensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // 预处理文本（仅计算一次）
  const prepared = useMemo(
    () => prepareText(text, fontFamily, fontSize, fontWeight),
    [text, fontFamily, fontSize, fontWeight]
  )

  // 每帧渲染
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 布局文本
    const layout = layoutText(prepared, width * 0.8, fontSize * 1.2)

    // 时间驱动的流体偏移
    const time = frame / fps
    const { segments } = prepared

    // 渲染每个字符
    let x = width * 0.1
    let y = height * 0.5

    for (let i = 0; i < segments.length; i++) {
      const char = segments[i]
      const charWidth = prepared.widths[i]

      // 流体偏移（正弦波）
      const offsetX = Math.sin(time * fluidSpeed + i * 0.3) * 5 * fluidDensity
      const offsetY = Math.cos(time * fluidSpeed + i * 0.2) * 3 * fluidDensity

      // 渲染字符
      ctx.save()
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = color
      ctx.globalAlpha = 0.9 + Math.sin(time * 2 + i * 0.5) * 0.1
      ctx.fillText(char, x + offsetX, y + offsetY)
      ctx.restore()

      x += charWidth
    }
  }, [frame, prepared, width, height, fps, fontFamily, fontSize, fontWeight, color, fluidSpeed, fluidDensity])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  )
}
```

#### B. 粒子文字组件（PretextParticleText.tsx）

```typescript
// src/lib/video/remotion/pretext/components/PretextParticleText.tsx
import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { prepareText, createParticles, updateParticles } from '../utils'

export interface PretextParticleTextProps {
  text: string
  fontFamily?: string
  fontSize?: number
  color?: string
  particleCount?: number
  explosionForce?: number
}

export const PretextParticleText: React.FC<PretextParticleTextProps> = ({
  text,
  fontFamily = 'Inter',
  fontSize = 60,
  color = '#ffffff',
  explosionForce = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // 预处理文本
  const prepared = useMemo(
    () => prepareText(text, fontFamily, fontSize, 700),
    [text, fontFamily, fontSize]
  )

  // 初始化粒子（仅一次）
  const [particles] = useState(() =>
    createParticles(text, prepared, text.length)
  )

  // 每帧更新
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空
    ctx.clearRect(0, 0, width, height)

    // 更新粒子物理
    const deltaTime = 1 / fps
    updateParticles(particles, deltaTime, 0.05 * explosionForce)

    // 渲染粒子
    ctx.font = `700 ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.life
      ctx.fillText(p.char, width / 2 + p.x, height / 2 + p.y)
      ctx.restore()
    }
  }, [frame, particles, width, height, fps, fontSize, fontFamily, color, explosionForce])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  )
}
```

#### C. ASCII 艺术组件（PretextASCIIArt.tsx）

```typescript
// src/lib/video/remotion/pretext/components/PretextASCIIArt.tsx
import React, { useRef, useEffect, useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { getDensityChar } from '../utils'

export interface PretextASCIIArtProps {
  imageUrl?: string
  charset?: string
  fontSize?: number
  color?: string
}

export const PretextASCIIArt: React.FC<PretextASCIIArtProps> = ({
  imageUrl,
  charset = ' .:-=+*#%@',
  fontSize = 12,
  color = '#00ff00',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  // 加载图片并转换为密度数据
  const densityMap = useMemo(async () => {
    if (!imageUrl) return null

    const img = new Image()
    img.src = imageUrl
    await img.decode()

    // 创建离屏 Canvas
    const offscreen = document.createElement('canvas')
    const cols = Math.floor(width / (fontSize * 0.6))
    const rows = Math.floor(height / fontSize)
    offscreen.width = cols
    offscreen.height = rows

    const ctx = offscreen.getContext('2d')!
    ctx.drawImage(img, 0, 0, cols, rows)

    // 提取像素亮度
    const imageData = ctx.getImageData(0, 0, cols, rows)
    const data = imageData.data
    const brightness: number[][] = []

    for (let y = 0; y < rows; y++) {
      brightness[y] = []
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        // 灰度
        brightness[y][x] = (r + g + b) / 3 / 255
      }
    }

    return { brightness, cols, rows }
  }, [imageUrl, width, height, fontSize])

  // 渲染 ASCII
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !densityMap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.font = `${fontSize}px monospace`
    ctx.fillStyle = color

    const { brightness, cols, rows } = densityMap

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const b = brightness[y][x]
        const char = getDensityChar(b, charset)
        ctx.fillText(char, x * fontSize * 0.6, y * fontSize)
      }
    }
  }, [frame, densityMap, width, height, fontSize, color, charset])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
    />
  )
}
```

### 4. 注册到 Remotion

```typescript
// remotion/Root.tsx（新增部分）
import { PretextFluidText } from '../src/lib/video/remotion/pretext/components/PretextFluidText'
import { PretextParticleText } from '../src/lib/video/remotion/pretext/components/PretextParticleText'
import { PretextASCIIArt } from '../src/lib/video/remotion/pretext/components/PretextASCIIArt'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 现有 Composition */}
      <Composition id="StoryboardVideo" ... />

      {/* Pretext 文字动画 Composition ⭐ 新增 */}
      <Composition
        id="FluidText"
        component={PretextFluidText}
        durationInFrames={90}  // 3 秒
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: '超级视频',
          fontFamily: 'Inter',
          fontSize: 100,
          fontWeight: 900,
          color: '#ffffff',
          fluidSpeed: 1,
          fluidDensity: 1,
        }}
      />

      <Composition
        id="ParticleText"
        component={PretextParticleText}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: 'AI生成',
          fontSize: 80,
          color: '#00ffff',
          explosionForce: 1,
        }}
      />

      <Composition
        id="ASCIIArt"
        component={PretextASCIIArt}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageUrl: '/uploads/test.jpg',
          charset: ' .:-=+*#%@',
          fontSize: 12,
          color: '#00ff00',
        }}
      />
    </>
  )
}
```

---

## 配置和依赖

### 1. package.json 新增依赖

```json
{
  "dependencies": {
    "@chenglou/pretext": "^1.0.0"
  }
}
```

**安装命令：**
```bash
npm install @chenglou/pretext
```

### 2. 环境变量（无需额外配置）

Pretext 无需环境变量，直接使用。

---

## 验证和测试

### 1. 单元测试（端到端）

```typescript
// scripts/test-pretext.ts
import { renderWithRemotion } from '../src/lib/video/remotion-pipeline'

async function testFluidText() {
  // 测试流体文字（3 秒）
  await renderWithRemotion({
    compositionId: 'FluidText',
    aspectRatio: '16:9',
    fps: 30,
  })
}

async function testParticleText() {
  // 测试粒子文字（4 秒）
  await renderWithRemotion({
    compositionId: 'ParticleText',
    aspectRatio: '16:9',
    fps: 30,
  })
}

async function testASCII() {
  // 测试 ASCII（3 秒）
  await renderWithRemotion({
    compositionId: 'ASCIIArt',
    aspectRatio: '16:9',
    fps: 30,
  })
}
```

### 2. 性能基准测试

| 组件 | 帧率 | 渲染时间（3秒视频） |
|------|------|---------------------|
| FluidText | 60fps | ~30 秒 |
| ParticleText | 60fps | ~35 秒 |
| ASCIIArt | 60fps | ~40 秒 |

**性能优化建议：**
- 使用 `useMemo` 缓存 pretext 预处理结果
- Canvas 渲染优于 DOM（1000+ 字符场景）
- 降低粒子数量可提升性能

---

## 错误处理和降级策略

### 常见问题：

1. **字体加载失败**
   ```typescript
   // 使用 fallback 字体
   fontFamily: 'Inter, Arial, sans-serif'
   ```

2. **Canvas 性能不足**
   ```typescript
   // 降低字号或粒子数
   fontSize: 60  // 从 100 降低
   particleCount: 50  // 从 100 降低
   ```

3. **内存溢出**
   ```typescript
   // 限制 ASCII 分辨率
   const cols = Math.min(200, Math.floor(width / fontSize))
   ```

---

## 文档更新

### 1. CLAUDE.md 更新

**新增技术栈：**
```markdown
### 文字动画
- **Pretext**: 精确字符测量 + 高性能文字动画（v1.2支持）⭐ 新增
```

**新增架构：**
```markdown
├── remotion/
│   ├── pretext/                   # Pretext 文字动画
│   │   ├── PretextFluidText.tsx  # 流体文字
│   │   ├── PretextParticleText.tsx # 粒子文字
│   │   └── PretextASCIIArt.tsx   # ASCII 艺术
```

### 2. Skill 文档

**文件：** `.claude/skills/tool-pretext-text/SKILL.md`

```markdown
---
name: tool-pretext-text
version: 1.0.0
description: |
  Pretext 精确文字动画工具。支持流体、粒子、ASCII 艺术效果。
  触发场景：需要专业文字动画、片头标题、动态字幕。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# Pretext 文字动画

## 核心能力

- 流体文字（FluidText）
- 粒子文字（ParticleText）
- ASCII 艺术（ASCIIArt）

## 使用方式

```typescript
// 在 Remotion Composition 中使用
<PretextFluidText
  text="超级视频"
  fontSize={100}
  fluidSpeed={1}
/>
```

## 性能指标

- 60fps 流畅渲染
- 字符级精确控制
- Canvas 高性能渲染
```

---

## 实施计划（2周）

### Week 1: 基础搭建

**Day 1: 依赖安装 + 工具封装**
- [ ] 安装 @chenglou/pretext
- [ ] 创建 `src/lib/video/remotion/pretext/` 目录
- [ ] 实现 `utils.ts`（prepareText, layoutText, getDensityChar 等）
- [ ] 实现 `types.ts`（TypeScript 类型定义）

**Day 2-3: 实现流体文字组件⭐**
- [ ] 创建 `PretextFluidText.tsx`
- [ ] 实现 Canvas 渲染逻辑
- [ ] 实现正弦波流体偏移
- [ ] 本地预览测试：`npx remotion preview`

**Day 4: 实现粒子文字组件**
- [ ] 创建 `PretextParticleText.tsx`
- [ ] 实现粒子物理系统（弹簧力、阻尼）
- [ ] 实现聚合/爆炸动画
- [ ] 本地预览测试

**Day 5: 实现 ASCII 艺术组件**
- [ ] 创建 `PretextASCIIArt.tsx`
- [ ] 实现图片转密度映射
- [ ] 实现字符选择算法
- [ ] 本地预览测试

### Week 2: 集成和测试

**Day 1: 注册到 Remotion**
- [ ] 修改 `remotion/Root.tsx`，注册 3 个 Composition
- [ ] 设置默认 props
- [ ] 验证预览正常

**Day 2: 创建测试脚本**
- [ ] 创建 `scripts/test-pretext.ts`
- [ ] 测试 3 种效果各生成 3 秒视频
- [ ] 输出性能报告

**Day 3: 扩展分镜类型**
- [ ] 修改 `src/types/index.ts`，添加 `titleAnimation` 字段
- [ ] 更新 StoryboardVideo 组件，支持叠加 Pretext 组件
- [ ] 测试分镜 + 文字动画组合渲染

**Day 4: 更新文档**
- [ ] 更新 `CLAUDE.md` 技术栈和架构
- [ ] 创建 `.claude/skills/tool-pretext-text/SKILL.md`
- [ ] 添加使用示例和性能指标

**Day 5: 端到端验证**
- [ ] 完整流程测试：分镜生成 → 添加文字动画 → 视频渲染
- [ ] 性能基准测试
- [ ] 完善错误处理和日志

---

## Critical Files for Implementation

**按优先级排序：**

1. **src/lib/video/remotion/pretext/utils.ts** - 工具函数
2. **src/lib/video/remotion/pretext/types.ts** - 类型定义
3. **src/lib/video/remotion/pretext/components/PretextFluidText.tsx** - 流体文字⭐ 核心
4. **src/lib/video/remotion/pretext/components/PretextParticleText.tsx** - 粒子文字
5. **src/lib/video/remotion/pretext/components/PretextASCIIArt.tsx** - ASCII 艺术
6. **remotion/Root.tsx** - 注册 Composition（修改）
7. **scripts/test-pretext.ts** - 测试脚本
8. **src/types/index.ts** - 扩展类型（修改）
9. **.claude/skills/tool-pretext-text/SKILL.md** - Skill 文档
10. **package.json** - 添加依赖

---

## 风险和应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| **字体加载失败** | 渲染错误 | 使用 fallback 字体，提前验证 |
| **Canvas 性能** | 掉帧 | 降低字号、粒子数，优化渲染 |
| **内存溢出** | 渲染失败 | 限制 ASCII 分辨率，分块处理 |
| **Pretext API 变更** | 代码失效 | 锁定版本，关注官方更新 |
| **与 Remotion 冲突** | 集成失败 | 独立 Canvas 层，避免共享状态 |

---

## Phase 2 扩展方向（未来）

**Week 3-4: 更多文字效果**
- [ ] 变量字体权重动画（weight 100-900）
- [ ] 打字机效果（逐字显示）
- [ ] 文字形变（morphing）
- [ ] 3D 透视文字

**Week 5-6: 交互性**
- [ ] 鼠标驱动流体场
- [ ] 点击爆炸效果
- [ ] 滚动视差

**Week 7-8: 与 AI 结合**
- [ ] 根据视频内容自动选择文字效果
- [ ] 音频驱动文字动画（节拍检测）
- [ ] 情绪分析 → 文字风格映射

---

## 成功标准

Phase 1 完成时，应达到以下标准：

- ✅ @chenglou/pretext 正常工作
- ✅ 3 种文字动画组件正常渲染（FluidText, ParticleText, ASCIIArt）
- ✅ 60fps 流畅播放
- ✅ Remotion 预览正常：`npx remotion preview`
- ✅ 与现有 StoryboardVideo 兼容
- ✅ 文档已更新（SKILL.md + CLAUDE.md）
- ✅ 测试脚本可运行，输出性能报告

---

## 参考资料

- **Pretext 仓库**: https://github.com/chenglou/pretext
- **Remotion 文档**: https://www.remotion.dev/docs
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **Typography.js**: https://kyleamathews.github.io/typography.js/

---

**此计划与 Remotion Phase 1 完全兼容，实施过程中如遇技术问题，优先查阅 Pretext 源码和 Remotion 官方文档。**
