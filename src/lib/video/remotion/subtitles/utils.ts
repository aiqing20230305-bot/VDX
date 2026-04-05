/**
 * 字幕工具函数
 */
import type { SubtitleEntry, SubtitleStyle, SubtitlePosition } from '@/types'

/**
 * 查找当前时间应显示的字幕
 */
export function findActiveSubtitle(
  subtitles: SubtitleEntry[],
  currentTime: number
): SubtitleEntry | null {
  return (
    subtitles.find(
      (sub) => currentTime >= sub.startTime && currentTime <= sub.endTime
    ) || null
  )
}

/**
 * 计算字幕不透明度（支持淡入淡出）
 */
export function calculateSubtitleOpacity(
  subtitle: SubtitleEntry,
  currentTime: number,
  fadeInDuration = 0.2,  // 淡入时间（秒）
  fadeOutDuration = 0.2  // 淡出时间（秒）
): number {
  const { startTime, endTime } = subtitle
  const duration = endTime - startTime

  // 淡入阶段
  if (currentTime < startTime + fadeInDuration) {
    const progress = (currentTime - startTime) / fadeInDuration
    return Math.max(0, Math.min(1, progress))
  }

  // 淡出阶段
  if (currentTime > endTime - fadeOutDuration) {
    const progress = (endTime - currentTime) / fadeOutDuration
    return Math.max(0, Math.min(1, progress))
  }

  // 完全显示阶段
  return 1
}

/**
 * 获取字幕位置样式
 */
export function getPositionStyles(
  position: SubtitlePosition = 'bottom',
  padding = 16
): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
  }

  switch (position) {
    case 'top':
      return {
        ...base,
        top: padding,
        alignItems: 'flex-start',
      }
    case 'middle':
      return {
        ...base,
        top: '50%',
        transform: 'translateY(-50%)',
        alignItems: 'center',
      }
    case 'bottom':
      return {
        ...base,
        bottom: padding,
        alignItems: 'flex-end',
      }
    default:
      return base
  }
}

/**
 * 合并字幕样式（默认样式 + 条目样式）
 */
export function mergeSubtitleStyle(
  defaultStyle: SubtitleStyle | undefined,
  entryStyle: Partial<SubtitleStyle> | undefined
): SubtitleStyle {
  const base: SubtitleStyle = {
    fontSize: 24,
    fontFamily: 'sans-serif',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    lineHeight: 1.5,
    textAlign: 'center',
  }

  return {
    ...base,
    ...defaultStyle,
    ...entryStyle,
  }
}

/**
 * 生成字幕文本样式
 */
export function generateTextStyle(style: SubtitleStyle): React.CSSProperties {
  const cssStyle: React.CSSProperties = {
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    color: style.color,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    margin: 0,
    padding: style.padding,
  }

  // 背景色
  if (style.backgroundColor) {
    cssStyle.backgroundColor = style.backgroundColor
  }

  // 描边
  if (style.stroke) {
    cssStyle.WebkitTextStroke = `${style.stroke.width}px ${style.stroke.color}`
  }

  // 阴影
  if (style.shadow) {
    const { offsetX, offsetY, blur, color } = style.shadow
    cssStyle.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
  }

  return cssStyle
}

/**
 * 解析 SRT 格式字幕文件
 */
export function parseSRT(srtContent: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const blocks = srtContent.trim().split(/\n\n+/)

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (lines.length < 3) continue

    // 解析时间轴：00:00:01,000 --> 00:00:04,000
    const timeMatch = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )
    if (!timeMatch) continue

    const [
      ,
      startH,
      startM,
      startS,
      startMs,
      endH,
      endM,
      endS,
      endMs,
    ] = timeMatch

    const startTime =
      parseInt(startH) * 3600 +
      parseInt(startM) * 60 +
      parseInt(startS) +
      parseInt(startMs) / 1000

    const endTime =
      parseInt(endH) * 3600 +
      parseInt(endM) * 60 +
      parseInt(endS) +
      parseInt(endMs) / 1000

    // 文本（可能多行）
    const text = lines.slice(2).join('\n')

    entries.push({
      startTime,
      endTime,
      text,
    })
  }

  return entries
}

/**
 * 生成 SRT 格式字幕文件
 */
export function generateSRT(entries: SubtitleEntry[]): string {
  return entries
    .map((entry, index) => {
      const startH = Math.floor(entry.startTime / 3600)
        .toString()
        .padStart(2, '0')
      const startM = Math.floor((entry.startTime % 3600) / 60)
        .toString()
        .padStart(2, '0')
      const startS = Math.floor(entry.startTime % 60)
        .toString()
        .padStart(2, '0')
      const startMs = Math.floor((entry.startTime % 1) * 1000)
        .toString()
        .padStart(3, '0')

      const endH = Math.floor(entry.endTime / 3600)
        .toString()
        .padStart(2, '0')
      const endM = Math.floor((entry.endTime % 3600) / 60)
        .toString()
        .padStart(2, '0')
      const endS = Math.floor(entry.endTime % 60)
        .toString()
        .padStart(2, '0')
      const endMs = Math.floor((entry.endTime % 1) * 1000)
        .toString()
        .padStart(3, '0')

      return `${index + 1}\n${startH}:${startM}:${startS},${startMs} --> ${endH}:${endM}:${endS},${endMs}\n${entry.text}\n`
    })
    .join('\n')
}
