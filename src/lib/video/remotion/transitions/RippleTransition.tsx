/**
 * 水波纹转场组件（Ripple Effect）
 * 从中心点扩散的波纹扭曲效果
 */
import React from 'react'
import { AbsoluteFill, useVideoConfig } from 'remotion'
import { applyEasing, type TransitionProps, type RippleTransitionConfig } from './types'

export const RippleTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const { width, height } = useVideoConfig()
  const rippleConfig = config as RippleTransitionConfig
  const easedProgress = applyEasing(progress, rippleConfig.easing)

  const center = rippleConfig.center ?? { x: 0.5, y: 0.5 }
  const frequency = rippleConfig.frequency ?? 8
  const amplitude = rippleConfig.amplitude ?? 0.05

  // 生成SVG filter ID
  const filterId = `ripple-${Math.random().toString(36).substr(2, 9)}`

  // 计算波纹扩散半径（0 → 对角线长度）
  const maxRadius = Math.sqrt(width * width + height * height)
  const rippleRadius = easedProgress * maxRadius

  // 波纹振幅随距离衰减
  const getDisplacementScale = () => {
    // 在0.3-0.7时波纹最明显
    const peakFactor = Math.sin(easedProgress * Math.PI)
    return amplitude * peakFactor * 100
  }

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            {/* 生成波纹扰动图 */}
            <feTurbulence
              type="turbulence"
              baseFrequency={`${frequency / width} ${frequency / height}`}
              numOctaves="2"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={getDisplacementScale()}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* 径向渐变遮罩 */}
          <radialGradient id={`${filterId}-mask`}>
            <stop
              offset={`${Math.max(0, (rippleRadius / maxRadius) - 0.2) * 100}%`}
              stopColor="white"
              stopOpacity="0"
            />
            <stop
              offset={`${(rippleRadius / maxRadius) * 100}%`}
              stopColor="white"
              stopOpacity="1"
            />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <AbsoluteFill
        style={{
          filter: `url(#${filterId})`,
          opacity: 1 - Math.abs(easedProgress - 0.5) * 0.4, // 中心时最亮
        }}
      >
        {children}
      </AbsoluteFill>

      {/* 波纹轮廓（可选视觉增强） */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${center.x * 100}% ${center.y * 100}%, transparent ${rippleRadius - 5}px, rgba(255,255,255,${0.3 * Math.sin(easedProgress * Math.PI)}) ${rippleRadius}px, transparent ${rippleRadius + 5}px)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  )
}
