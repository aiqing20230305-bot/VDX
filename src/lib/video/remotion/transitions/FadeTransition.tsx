/**
 * 淡入淡出转场组件
 * 经典的透明度变化转场效果
 */
import React from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type FadeTransitionConfig } from './types'

export const FadeTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  // 应用缓动函数
  const fadeConfig = config as FadeTransitionConfig
  const easedProgress = applyEasing(progress, fadeConfig.easing)

  return (
    <AbsoluteFill
      style={{
        opacity: easedProgress,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
