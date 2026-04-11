/**
 * 像素化转场组件（马赛克像素效果）
 * 画面从清晰逐渐像素化再恢复清晰
 */
import React from 'react'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { applyEasing, type TransitionProps, type PixelateTransitionConfig } from './types'

export const PixelateTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const { width, height } = useVideoConfig()
  const pixelConfig = config as PixelateTransitionConfig
  const easedProgress = applyEasing(progress, pixelConfig.easing)
  const maxPixelSize = pixelConfig.maxPixelSize ?? 50

  // 计算像素大小（先增加后减少）
  // 0 → 1, 0.5 → maxPixelSize, 1 → 1
  const pixelSize = Math.max(1, Math.sin(easedProgress * Math.PI) * maxPixelSize)

  // 计算缩小后的尺寸
  const scaledWidth = Math.ceil(width / pixelSize)
  const scaledHeight = Math.ceil(height / pixelSize)

  return (
    <AbsoluteFill
      style={{
        // 使用image-rendering实现像素化效果
        imageRendering: 'pixelated',
        // @ts-ignore - WebKit浏览器兼容
        WebkitImageRendering: 'pixelated',
        // 先缩小再放大，形成像素化效果
        transform: `scale(${width / scaledWidth}, ${height / scaledHeight})`,
        transformOrigin: 'top left',
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
    >
      <div
        style={{
          transform: `scale(${pixelSize})`,
          transformOrigin: 'top left',
          width: `${width / pixelSize}px`,
          height: `${height / pixelSize}px`,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}
