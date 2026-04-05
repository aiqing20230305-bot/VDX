/**
 * 单条字幕组件
 * 渲染一条字幕，支持淡入淡出动画和样式配置
 */
import React from 'react'
import type { SubtitleEntry, SubtitleStyle } from '@/types'
import {
  calculateSubtitleOpacity,
  getPositionStyles,
  generateTextStyle,
} from './utils'

export interface SubtitleProps {
  entry: SubtitleEntry
  currentTime: number
  style?: SubtitleStyle
  fadeInDuration?: number   // 淡入时间（秒，默认 0.2）
  fadeOutDuration?: number  // 淡出时间（秒，默认 0.2）
}

export const Subtitle: React.FC<SubtitleProps> = ({
  entry,
  currentTime,
  style,
  fadeInDuration = 0.2,
  fadeOutDuration = 0.2,
}) => {
  // 计算不透明度（淡入淡出）
  const opacity = calculateSubtitleOpacity(
    entry,
    currentTime,
    fadeInDuration,
    fadeOutDuration
  )

  // 不显示（未到开始时间或已过结束时间）
  if (opacity === 0) {
    return null
  }

  // 获取位置样式
  const positionStyles = getPositionStyles(entry.position, style?.padding)

  // 生成文本样式
  const textStyle = generateTextStyle(style || {})

  return (
    <div
      style={{
        ...positionStyles,
        opacity,
        transition: 'opacity 0.2s ease-in-out',
        willChange: 'opacity',
        pointerEvents: 'none', // 不阻挡交互
      }}
    >
      <p
        style={{
          ...textStyle,
          whiteSpace: 'pre-wrap', // 保留换行
          wordWrap: 'break-word',
          maxWidth: '90%',
          borderRadius: 4,
        }}
      >
        {entry.text}
      </p>
    </div>
  )
}
