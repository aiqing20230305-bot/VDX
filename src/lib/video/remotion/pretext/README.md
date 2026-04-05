# Pretext 文字动画组件库

基于 `@chenglou/pretext` 的 Remotion 文字动画组件。

## 组件

### PretextFluidText（流体文字）
正弦波驱动的流体文字效果，适合片头标题、品牌动画。

### PretextParticleText（粒子文字）
粒子物理系统，聚合/爆炸动画，适合动态转场。

### PretextASCIIArt（ASCII 艺术）
图片转 ASCII 字符，复古技术感。

## 使用

```typescript
import { PretextFluidText } from '@/lib/video/remotion/pretext/components/PretextFluidText'

<PretextFluidText
  text="超级视频"
  fontSize={100}
  fluidSpeed={1}
/>
```

## 架构

```
pretext/
├── types.ts              # 类型定义
├── utils.ts              # 工具函数（封装 pretext API）
├── components/           # React 组件
│   ├── PretextFluidText.tsx
│   ├── PretextParticleText.tsx
│   └── PretextASCIIArt.tsx
└── effects/              # 动画效果（可选）
    ├── fluid.ts
    ├── particle.ts
    └── ascii.ts
```

## 性能

- 60fps 流畅渲染
- 字符级精确控制
- Canvas 高性能渲染
- 支持 1000+ 字符
