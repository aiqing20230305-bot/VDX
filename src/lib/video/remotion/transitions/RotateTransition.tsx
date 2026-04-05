/**
 * 旋转转场组件
 * 支持 3D 旋转（X, Y, Z 轴）
 */
import React, { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type RotateTransitionConfig } from './types'

export const RotateTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const rotateConfig = config as RotateTransitionConfig
  const easedProgress = applyEasing(progress, rotateConfig.easing)

  // 旋转角度（默认 90 度）
  const maxAngle = rotateConfig.angle ?? 90

  // 计算当前旋转角度
  const angle = useMemo(() => {
    return maxAngle * (1 - easedProgress)  // 90° → 0°
  }, [maxAngle, easedProgress])

  // 透明度渐变
  const opacity = easedProgress

  // 透视距离（默认 1000px）
  const perspective = rotateConfig.perspective ?? 1000

  // 根据旋转轴生成 transform
  const transform = useMemo(() => {
    switch (rotateConfig.axis) {
      case 'x':
        return `perspective(${perspective}px) rotateX(${angle}deg)`
      case 'y':
        return `perspective(${perspective}px) rotateY(${angle}deg)`
      case 'z':
        return `rotateZ(${angle}deg)`
      default:
        return 'none'
    }
  }, [rotateConfig.axis, perspective, angle])

  return (
    <AbsoluteFill
      style={{
        transform,
        transformOrigin: '50% 50%',
        opacity,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',  // 隐藏背面
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
