---
name: tool-pretext-text
version: 1.0.0
description: |
  Pretext 精确文字动画工具。基于 @chenglou/pretext 库实现字符级精确控制，
  支持流体文字、粒子文字、ASCII 艺术效果。与 Remotion 无缝集成。
  触发场景：需要专业文字动画、片头标题、动态字幕、创意文字特效。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# Pretext 文字动画工具

## 核心能力

### 三大核心组件

| 组件 | 效果 | 适用场景 |
|------|------|----------|
| **PretextFluidText** | 流体文字 | 片头标题、品牌动画 |
| **PretextParticleText** | 粒子文字 | 爆炸效果、动态转场 |
| **PretextASCIIArt** | ASCII 艺术 | 复古风格、技术感场景 |

### 技术特性

- ✅ **字符级精确测量**：`prepareWithSegments()` 无 DOM 重排
- ✅ **极致性能**：0.09ms/帧，60fps 流畅
- ✅ **React 组件化**：与 Remotion 完美集成
- ✅ **Canvas 渲染**：高性能渲染 1000+ 字符

## 使用方式

### 1. 在 Remotion Composition 中使用

```typescript
import { PretextFluidText } from '@/lib/video/remotion/pretext/components/PretextFluidText'

<PretextFluidText
  text="超级视频"
  fontFamily="Inter"
  fontSize={100}
  fontWeight={900}
  color="#ffffff"
  fluidSpeed={1}
  fluidDensity={1}
/>
```

### 2. 在分镜数据中配置

```typescript
const frame: StoryboardFrame = {
  // ... 其他字段
  titleAnimation: {
    type: 'fluid',  // 或 'particle' / 'ascii'
    text: '超级视频',
    config: {
      fontFamily: 'Inter',
      fontSize: 100,
      fontWeight: 900,
      color: '#ffffff',
      fluidSpeed: 1,
      fluidDensity: 1,
    }
  }
}
```

### 3. 命令行渲染测试

```bash
# 测试流体文字
npx tsx scripts/test-pretext.ts --type fluid

# 测试粒子文字
npx tsx scripts/test-pretext.ts --type particle

# 测试 ASCII 艺术
npx tsx scripts/test-pretext.ts --type ascii
```

## 配置参数

### 通用参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | string | - | 显示文字 |
| fontFamily | string | 'Inter' | 字体 |
| fontSize | number | 80 | 字号 |
| fontWeight | number | 700 | 字重（100-900） |
| color | string | '#ffffff' | 颜色 |

### FluidText 特有参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fluidSpeed | number | 1 | 流动速度 |
| fluidDensity | number | 1 | 密度 |

### ParticleText 特有参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| particleCount | number | text.length | 粒子数量 |
| explosionForce | number | 1 | 爆炸力度 |

### ASCIIArt 特有参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| imageUrl | string | - | 源图片路径 |
| charset | string | ' .:-=+*#%@' | ASCII 字符集 |
| asciiDensity | number | 1 | 密度映射范围 |

## 性能指标

| 指标 | 值 |
|------|-----|
| **帧率** | 60fps |
| **渲染时间** | 30-40 秒（3秒视频） |
| **内存占用** | < 500MB |
| **字符数上限** | 1000+ |

## 关键文件

| 文件 | 说明 |
|------|------|
| `src/lib/video/remotion/pretext/utils.ts` | Pretext 工具封装 |
| `src/lib/video/remotion/pretext/components/PretextFluidText.tsx` | 流体文字组件 |
| `src/lib/video/remotion/pretext/components/PretextParticleText.tsx` | 粒子文字组件 |
| `src/lib/video/remotion/pretext/components/PretextASCIIArt.tsx` | ASCII 艺术组件 |
| `remotion/Root.tsx` | Composition 注册 |
| `scripts/test-pretext.ts` | 测试脚本 |

## 常见问题

### 字体加载失败

**症状**：渲染文字显示为系统默认字体

**解决方案**：
```typescript
// 使用 fallback 字体
fontFamily: 'Inter, Arial, sans-serif'
```

### Canvas 性能不足

**症状**：渲染掉帧，低于 60fps

**解决方案**：
```typescript
// 降低字号或粒子数
fontSize: 60        // 从 100 降低
particleCount: 50   // 从 100 降低
```

### 内存溢出

**症状**：渲染时内存占用过高，系统卡顿

**解决方案**：
```typescript
// 限制 ASCII 分辨率
const cols = Math.min(200, Math.floor(width / fontSize))
```

## 迭代记录

- **v1.0.0** (2026-04-05): 初始版本
  - ✅ 实现 3 种核心组件（FluidText, ParticleText, ASCIIArt）
  - ✅ 与 Remotion 集成
  - ✅ 支持分镜数据配置
  - ✅ 60fps 性能优化
  - ✅ 测试脚本和文档

- **待迭代**:
  - 变量字体权重动画（weight 100-900）
  - 打字机效果（逐字显示）
  - 文字形变（morphing）
  - 3D 透视文字
  - 鼠标交互效果
  - 音频驱动文字动画
