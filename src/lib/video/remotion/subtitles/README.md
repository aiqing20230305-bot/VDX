# Remotion 字幕系统

基于 Remotion 的字幕渲染系统，支持时间轴同步、样式配置、淡入淡出动画。

## 核心功能

- ✅ 时间轴精确同步
- ✅ 多种位置（上/中/下）
- ✅ 样式完全可配置
- ✅ 淡入淡出动画
- ✅ 多字幕轨道支持
- ✅ SRT 格式导入导出

## 使用方式

### 1. 基础用法

```tsx
import { SubtitleLayer } from '@/lib/video/remotion/subtitles'
import type { SubtitleTrack } from '@/types'

const subtitles: SubtitleTrack[] = [
  {
    id: 'main',
    entries: [
      {
        startTime: 0,
        endTime: 3,
        text: '欢迎来到超级视频',
      },
      {
        startTime: 3,
        endTime: 6,
        text: '这是第二句字幕',
        position: 'top',
      },
    ],
  },
]

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* 视频内容 */}
      <Img src="..." />
      
      {/* 字幕层 */}
      <SubtitleLayer tracks={subtitles} />
    </AbsoluteFill>
  )
}
```

### 2. 样式配置

```tsx
const subtitles: SubtitleTrack[] = [
  {
    id: 'styled',
    defaultStyle: {
      fontSize: 32,
      fontFamily: 'Arial',
      color: '#FFFF00',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      stroke: {
        color: '#000000',
        width: 2,
      },
      shadow: {
        offsetX: 2,
        offsetY: 2,
        blur: 4,
        color: 'rgba(0, 0, 0, 0.5)',
      },
    },
    entries: [
      {
        startTime: 0,
        endTime: 3,
        text: '黄色字幕，黑色描边',
      },
      {
        startTime: 3,
        endTime: 6,
        text: '这条字幕有特殊样式',
        style: {
          color: '#FF0000', // 覆盖默认颜色
          fontSize: 40,
        },
      },
    ],
  },
]
```

### 3. 多轨道

```tsx
const subtitles: SubtitleTrack[] = [
  {
    id: 'chinese',
    entries: [
      { startTime: 0, endTime: 3, text: '中文字幕' },
    ],
  },
  {
    id: 'english',
    defaultStyle: {
      color: '#FFFF00',
      fontSize: 20,
    },
    entries: [
      { 
        startTime: 0, 
        endTime: 3, 
        text: 'English Subtitle',
        position: 'top', // 英文在上方
      },
    ],
  },
]
```

### 4. SRT 导入

```tsx
import { parseSRT } from '@/lib/video/remotion/subtitles'

const srtContent = `
1
00:00:01,000 --> 00:00:04,000
第一句字幕

2
00:00:04,000 --> 00:00:07,000
第二句字幕
`

const entries = parseSRT(srtContent)

const subtitles: SubtitleTrack[] = [
  {
    id: 'imported',
    entries,
  },
]
```

### 5. 集成到 StoryboardVideo

```tsx
// src/lib/video/remotion/compositions/StoryboardVideo.tsx
import { SubtitleLayer } from '../subtitles'

export const StoryboardVideo: React.FC<StoryboardVideoProps> = ({
  storyboard,
  fps = 30,
}) => {
  const sequences = framesToSequences(storyboard.frames, fps)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* 视频帧 */}
      {sequences.map((seq, i) => (
        <Sequence key={i} from={seq.startFrame} durationInFrames={seq.durationInFrames}>
          <FrameSequence frame={seq.frame} totalFrames={seq.durationInFrames} />
        </Sequence>
      ))}
      
      {/* 字幕层 */}
      {storyboard.subtitles && storyboard.subtitles.length > 0 && (
        <SubtitleLayer tracks={storyboard.subtitles} />
      )}
    </AbsoluteFill>
  )
}
```

## API 参考

### SubtitleLayer

字幕层组件，管理多条字幕轨道。

**Props:**
- `tracks: SubtitleTrack[]` - 字幕轨道数组
- `fadeInDuration?: number` - 淡入时间（秒，默认 0.2）
- `fadeOutDuration?: number` - 淡出时间（秒，默认 0.2）

### Subtitle

单条字幕组件（通常不直接使用）。

**Props:**
- `entry: SubtitleEntry` - 字幕条目
- `currentTime: number` - 当前时间（秒）
- `style?: SubtitleStyle` - 样式配置
- `fadeInDuration?: number` - 淡入时间
- `fadeOutDuration?: number` - 淡出时间

### 工具函数

```tsx
// 查找当前时间应显示的字幕
findActiveSubtitle(subtitles: SubtitleEntry[], currentTime: number): SubtitleEntry | null

// 计算不透明度（淡入淡出）
calculateSubtitleOpacity(subtitle: SubtitleEntry, currentTime: number, fadeIn?: number, fadeOut?: number): number

// 合并样式
mergeSubtitleStyle(defaultStyle?: SubtitleStyle, entryStyle?: Partial<SubtitleStyle>): SubtitleStyle

// 解析 SRT 文件
parseSRT(srtContent: string): SubtitleEntry[]

// 生成 SRT 文件
generateSRT(entries: SubtitleEntry[]): string
```

## 样式选项

### SubtitleStyle

```typescript
interface SubtitleStyle {
  fontSize?: number          // 字体大小（默认 24）
  fontFamily?: string        // 字体（默认 sans-serif）
  color?: string             // 文字颜色（默认 #FFFFFF）
  backgroundColor?: string   // 背景颜色（默认 rgba(0,0,0,0.7)）
  stroke?: {
    color: string            // 描边颜色
    width: number            // 描边宽度
  }
  padding?: number           // 内边距（默认 16）
  lineHeight?: number        // 行高（默认 1.5）
  textAlign?: 'left' | 'center' | 'right'  // 对齐（默认 center）
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
}
```

### SubtitlePosition

- `'top'` - 顶部
- `'middle'` - 中间
- `'bottom'` - 底部（默认）

## 性能优化

- 使用 `willChange: 'opacity'` 优化动画
- 字幕层设置 `pointerEvents: 'none'` 不阻挡交互
- 仅渲染当前时间范围内的字幕
- 支持按需启用/禁用轨道

## 示例

完整示例见 `scripts/test-subtitles.ts`。
