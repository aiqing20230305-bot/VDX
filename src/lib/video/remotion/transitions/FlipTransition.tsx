/**
 * 翻转转场组件（3D卡片翻转效果）
 * 支持水平/垂直/对角线翻转
 */
import React from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type FlipTransitionConfig } from './types'

export const FlipTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const flipConfig = config as FlipTransitionConfig
  const easedProgress = applyEasing(progress, flipConfig.easing)
  const perspective = flipConfig.perspective ?? 1200

  // 根据方向计算旋转角度
  const getRotation = () => {
    const angle = easedProgress * 180 // 0deg → 180deg

    switch (flipConfig.direction) {
      case 'horizontal':
        return { rotateY: angle }
      case 'vertical':
        return { rotateX: angle }
      case 'diagonal-left':
        return { rotateX: angle * 0.7, rotateY: angle * 0.7 }
      case 'diagonal-right':
        return { rotateX: angle * 0.7, rotateY: -angle * 0.7 }
      default:
        return { rotateY: angle }
    }
  }

  const rotation = getRotation()

  return (
    <AbsoluteFill
      style={{
        perspective: `${perspective}px`,
        transformStyle: 'preserve-3d',
      }}
    >
      <AbsoluteFill
        style={{
          transform: `
            rotateX(${rotation.rotateX || 0}deg)
            rotateY(${rotation.rotateY || 0}deg)
          `,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          // 防止翻转过程中出现闪烁
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
