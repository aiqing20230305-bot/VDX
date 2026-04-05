/**
 * 单条弹幕组件
 * 从右向左滚动显示
 */
import React, { useMemo } from 'react'
import { interpolate, useVideoConfig } from 'remotion'
import type { BulletEntry, BulletStyle } from '@/types'

export interface BulletProps {
  entry: BulletEntry
  relativeFrame: number      // 相对于弹幕出现时间的帧数
  style?: BulletStyle
  laneIndex: number          // 轨道索引（从顶部开始计数）
  laneHeight: number         // 轨道高度（像素）
}

export const Bullet: React.FC<BulletProps> = ({
  entry,
  relativeFrame,
  style,
  laneIndex,
  laneHeight,
}) => {
  const { width, fps } = useVideoConfig()

  // 合并样式
  const finalStyle: BulletStyle = {
    fontSize: 24,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    color: '#FFFFFF',
    padding: 8,
    opacity: 0.9,
    ...style,
    ...entry.style,
  }

  // 滚动速度（像素/秒）
  const speed = entry.speed || 200

  // 弹幕文本宽度估算（简化计算）
  const textWidth = entry.text.length * (finalStyle.fontSize || 24) * 0.6

  // 总移动距离：从屏幕右侧完全外部 → 屏幕左侧完全外部
  const totalDistance = width + textWidth

  // 总持续时间（秒）
  const duration = totalDistance / speed

  // 总帧数
  const totalFrames = Math.ceil(duration * fps)

  // 如果已经滚动完成，不渲染
  if (relativeFrame > totalFrames) {
    return null
  }

  // 计算当前 X 位置
  const x = interpolate(
    relativeFrame,
    [0, totalFrames],
    [width, -textWidth],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )

  // Y 位置（基于轨道索引）
  const y = laneIndex * laneHeight + (laneHeight - (finalStyle.fontSize || 24)) / 2

  // 文本样式
  const textStyle: React.CSSProperties = {
    fontSize: finalStyle.fontSize,
    fontFamily: finalStyle.fontFamily,
    fontWeight: finalStyle.fontWeight,
    color: finalStyle.color,
    padding: finalStyle.padding,
    margin: 0,
    whiteSpace: 'nowrap',
    opacity: finalStyle.opacity,
  }

  // 背景色
  if (finalStyle.backgroundColor) {
    textStyle.backgroundColor = finalStyle.backgroundColor
  }

  // 描边
  if (finalStyle.stroke) {
    textStyle.WebkitTextStroke = `${finalStyle.stroke.width}px ${finalStyle.stroke.color}`
    textStyle.textStroke = `${finalStyle.stroke.width}px ${finalStyle.stroke.color}`
  }

  // 阴影
  if (finalStyle.shadow) {
    const { offsetX, offsetY, blur, color } = finalStyle.shadow
    textStyle.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <p
        style={{
          ...textStyle,
          borderRadius: 4,
        }}
      >
        {entry.text}
      </p>
    </div>
  )
}
