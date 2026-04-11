/**
 * 立方体转场组件（3D立方体旋转效果）
 * 模拟立方体四个面的旋转过渡
 */
import React from 'react'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { applyEasing, type TransitionProps, type CubeTransitionConfig } from './types'

export const CubeTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const { width, height } = useVideoConfig()
  const cubeConfig = config as CubeTransitionConfig
  const easedProgress = applyEasing(progress, cubeConfig.easing)
  const perspective = cubeConfig.perspective ?? 1500

  // 根据方向计算旋转和平移
  const getTransform = () => {
    const angle = easedProgress * 90 // 0deg → 90deg（四分之一圆）

    switch (cubeConfig.direction) {
      case 'left':
        return {
          rotateY: -angle,
          translateX: easedProgress * width,
        }
      case 'right':
        return {
          rotateY: angle,
          translateX: -easedProgress * width,
        }
      case 'up':
        return {
          rotateX: angle,
          translateY: easedProgress * height,
        }
      case 'down':
        return {
          rotateX: -angle,
          translateY: -easedProgress * height,
        }
      default:
        return { rotateY: -angle, translateX: easedProgress * width }
    }
  }

  const { rotateX = 0, rotateY = 0, translateX = 0, translateY = 0 } = getTransform()

  return (
    <AbsoluteFill
      style={{
        perspective: `${perspective}px`,
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill
        style={{
          transformStyle: 'preserve-3d',
          transform: `
            translateX(${translateX}px)
            translateY(${translateY}px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
          `,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
