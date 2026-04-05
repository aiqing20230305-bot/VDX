/**
 * 擦除转场组件
 * 使用 clip-path 实现多种擦除效果
 */
import React, { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type WipeTransitionConfig } from './types'

export const WipeTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const wipeConfig = config as WipeTransitionConfig
  const easedProgress = applyEasing(progress, wipeConfig.easing)

  // 根据方向生成 clip-path
  const clipPath = useMemo(() => {
    const percent = easedProgress * 100

    switch (wipeConfig.direction) {
      case 'left':
        // 从左向右擦除
        return `inset(0 ${100 - percent}% 0 0)`

      case 'right':
        // 从右向左擦除
        return `inset(0 0 0 ${100 - percent}%)`

      case 'up':
        // 从上向下擦除
        return `inset(0 0 ${100 - percent}% 0)`

      case 'down':
        // 从下向上擦除
        return `inset(${100 - percent}% 0 0 0)`

      case 'circle':
        // 圆形扩展
        return `circle(${percent}% at 50% 50%)`

      default:
        return 'none'
    }
  }, [wipeConfig.direction, easedProgress])

  return (
    <AbsoluteFill
      style={{
        clipPath,
        willChange: 'clip-path',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
