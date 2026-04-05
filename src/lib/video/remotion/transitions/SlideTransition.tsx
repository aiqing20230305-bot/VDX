/**
 * 滑动转场组件
 * 从指定方向滑入画面
 */
import React, { useMemo } from 'react'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { applyEasing, type TransitionProps, type SlideTransitionConfig } from './types'

export const SlideTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const { width, height } = useVideoConfig()
  const slideConfig = config as SlideTransitionConfig
  const easedProgress = applyEasing(progress, slideConfig.easing)

  // 根据方向计算偏移量
  const offset = useMemo(() => {
    const distance = 1 - easedProgress  // 1 → 0

    switch (slideConfig.direction) {
      case 'left':
        return {
          x: width * distance,
          y: 0,
        }
      case 'right':
        return {
          x: -width * distance,
          y: 0,
        }
      case 'up':
        return {
          x: 0,
          y: height * distance,
        }
      case 'down':
        return {
          x: 0,
          y: -height * distance,
        }
      default:
        return { x: 0, y: 0 }
    }
  }, [slideConfig.direction, easedProgress, width, height])

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        willChange: 'transform',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
