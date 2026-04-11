/**
 * 故障艺术转场组件（Glitch Effect）
 * 模拟数字信号故障：RGB通道分离、扫描线、位移
 */
import React from 'react'
import { AbsoluteFill } from 'remotion'
import { applyEasing, type TransitionProps, type GlitchTransitionConfig } from './types'

export const GlitchTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const glitchConfig = config as GlitchTransitionConfig
  const easedProgress = applyEasing(progress, glitchConfig.easing)
  const intensity = glitchConfig.intensity ?? 0.5
  const rgbSplit = glitchConfig.rgbSplit !== false
  const scanlines = glitchConfig.scanlines !== false

  // 故障强度随进度变化（在0.3-0.7达到峰值）
  const glitchAmount = intensity * (Math.sin(easedProgress * Math.PI * 4) + 1) / 2

  // RGB通道分离距离
  const rgbOffset = glitchAmount * 10

  // 随机水平位移（抖动效果）
  const randomShift = (Math.random() - 0.5) * glitchAmount * 20

  // 生成扫描线渐变
  const scanlineGradient = scanlines
    ? `repeating-linear-gradient(
         0deg,
         rgba(0, 0, 0, 0),
         rgba(0, 0, 0, 0) 1px,
         rgba(0, 0, 0, ${glitchAmount * 0.3}) 2px,
         rgba(0, 0, 0, ${glitchAmount * 0.3}) 3px
       )`
    : 'none'

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {/* 基础层（绿色通道） */}
      <AbsoluteFill
        style={{
          transform: `translateX(${randomShift}px)`,
          opacity: 1,
        }}
      >
        {children}
      </AbsoluteFill>

      {rgbSplit && (
        <>
          {/* 红色通道（左偏移） */}
          <AbsoluteFill
            style={{
              transform: `translateX(${-rgbOffset + randomShift}px)`,
              mixBlendMode: 'screen',
              opacity: glitchAmount,
              filter: 'sepia(1) hue-rotate(-50deg) saturate(5)',
            }}
          >
            {children}
          </AbsoluteFill>

          {/* 蓝色通道（右偏移） */}
          <AbsoluteFill
            style={{
              transform: `translateX(${rgbOffset + randomShift}px)`,
              mixBlendMode: 'screen',
              opacity: glitchAmount,
              filter: 'sepia(1) hue-rotate(100deg) saturate(5)',
            }}
          >
            {children}
          </AbsoluteFill>
        </>
      )}

      {/* 扫描线覆盖层 */}
      {scanlines && (
        <AbsoluteFill
          style={{
            background: scanlineGradient,
            pointerEvents: 'none',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* 噪点层（在峰值时显示） */}
      {glitchAmount > 0.5 && (
        <AbsoluteFill
          style={{
            background: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" /></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="${glitchAmount * 0.3}"/></svg>')`,
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </AbsoluteFill>
  )
}
