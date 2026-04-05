/**
 * 缩放转场组件
 * 支持 zoom-in（放大进入）和 zoom-out（缩小进入）
 */
import React, { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type ZoomTransitionConfig } from './types'

export const ZoomTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const zoomConfig = config as ZoomTransitionConfig
  const easedProgress = applyEasing(progress, zoomConfig.easing)

  // 缩放倍数（默认 1.5）
  const maxScale = zoomConfig.scale ?? 1.5

  // 计算缩放值
  const scale = useMemo(() => {
    if (zoomConfig.zoomType === 'in') {
      // zoom-in: 从小到大 (0.5 → 1)
      return maxScale - (maxScale - 1) * easedProgress
    } else {
      // zoom-out: 从大到小 (1.5 → 1)
      return 1 + (maxScale - 1) * (1 - easedProgress)
    }
  }, [zoomConfig.zoomType, maxScale, easedProgress])

  // 透明度渐变（可选）
  const opacity = easedProgress

  // 缩放中心点（默认居中）
  const origin = zoomConfig.origin
    ? `${zoomConfig.origin.x * 100}% ${zoomConfig.origin.y * 100}%`
    : '50% 50%'

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: origin,
        opacity,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}
