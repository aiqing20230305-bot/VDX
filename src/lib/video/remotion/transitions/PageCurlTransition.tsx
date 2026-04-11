/**
 * 书页翻页转场组件（3D翻页卷曲效果）
 * 模拟纸张从一侧卷曲翻起的效果
 */
import React from 'react'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { applyEasing, type TransitionProps, type PageCurlTransitionConfig } from './types'

export const PageCurlTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const { width, height } = useVideoConfig()
  const curlConfig = config as PageCurlTransitionConfig
  const easedProgress = applyEasing(progress, curlConfig.easing)
  const curlIntensity = curlConfig.curlIntensity ?? 0.5

  // 翻页进度（0 → width）
  const curlPosition = easedProgress * width

  // 根据方向决定起点位置
  const isLeftToRight = curlConfig.direction === 'right'
  const startX = isLeftToRight ? 0 : width

  // 卷曲半径（根据强度调整）
  const curlRadius = width * curlIntensity * 0.3

  // 生成卷曲路径（使用二次贝塞尔曲线）
  const generateCurlPath = () => {
    if (isLeftToRight) {
      // 从左向右翻页
      const x1 = curlPosition - curlRadius
      const x2 = curlPosition
      const controlY = height * 0.5 + curlRadius * Math.sin(easedProgress * Math.PI)

      return `
        M 0 0
        L ${x1} 0
        Q ${x2} ${controlY} ${x1} ${height}
        L 0 ${height}
        Z
      `
    } else {
      // 从右向左翻页
      const x1 = width - curlPosition + curlRadius
      const x2 = width - curlPosition
      const controlY = height * 0.5 + curlRadius * Math.sin(easedProgress * Math.PI)

      return `
        M ${width} 0
        L ${x1} 0
        Q ${x2} ${controlY} ${x1} ${height}
        L ${width} ${height}
        Z
      `
    }
  }

  return (
    <AbsoluteFill>
      {/* 渐变阴影（模拟纸张卷曲的阴影） */}
      <AbsoluteFill
        style={{
          background: isLeftToRight
            ? `linear-gradient(to right, rgba(0,0,0,0) ${Math.max(0, easedProgress * 100 - 20)}%, rgba(0,0,0,${0.3 * easedProgress}) ${easedProgress * 100}%, rgba(0,0,0,0) 100%)`
            : `linear-gradient(to left, rgba(0,0,0,0) ${Math.max(0, easedProgress * 100 - 20)}%, rgba(0,0,0,${0.3 * easedProgress}) ${easedProgress * 100}%, rgba(0,0,0,0) 100%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 卷曲的页面 */}
      <AbsoluteFill
        style={{
          clipPath: `path('${generateCurlPath()}')`,
          transform: `perspective(2000px) rotateY(${isLeftToRight ? easedProgress * -10 : easedProgress * 10}deg)`,
          transformOrigin: isLeftToRight ? 'left center' : 'right center',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          filter: `brightness(${1 - easedProgress * 0.2})`, // 轻微变暗模拟阴影
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
