/**
 * 模糊转场组件（高斯模糊过渡效果）
 * 画面从清晰逐渐模糊再恢复清晰
 */
import React from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type BlurTransitionConfig } from './types'

export const BlurTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const blurConfig = config as BlurTransitionConfig
  const easedProgress = applyEasing(progress, blurConfig.easing)
  const maxBlur = blurConfig.maxBlur ?? 50
  const blurType = blurConfig.blurType ?? 'gaussian'

  // 计算模糊值（先增加后减少，形成峰值）
  // 0 → 0, 0.5 → maxBlur, 1 → 0
  const blurAmount = Math.sin(easedProgress * Math.PI) * maxBlur

  // 根据模糊类型选择filter
  const getBlurFilter = () => {
    if (blurType === 'motion') {
      // 动态模糊（水平方向）
      return `blur(${blurAmount}px) brightness(${1 - easedProgress * 0.2})`
    } else {
      // 高斯模糊
      return `blur(${blurAmount}px)`
    }
  }

  return (
    <AbsoluteFill
      style={{
        filter: getBlurFilter(),
        // 防止模糊边缘裁剪
        transform: 'scale(1.1)',
        transformOrigin: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
