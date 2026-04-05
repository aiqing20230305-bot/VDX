/**
 * Pretext 粒子文字组件
 * 粒子物理系统，聚合/爆炸动画，适合动态转场
 */
import React, { useRef, useEffect, useMemo, useState } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { prepareText, createParticles, updateParticles } from '../utils'
import type { ParticleTextConfig } from '../types'

export interface PretextParticleTextProps extends ParticleTextConfig {
  text: string
}

export const PretextParticleText: React.FC<PretextParticleTextProps> = ({
  text,
  fontFamily = 'Inter, Arial, sans-serif',
  fontSize = 60,
  fontWeight = 700,
  color = '#ffffff',
  explosionForce = 1,
  springForce = 0.05,
  damping = 0.9,
  position,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // 预处理文本（仅一次）
  const prepared = useMemo(() => {
    return prepareText(text, fontFamily, fontSize, fontWeight)
  }, [text, fontFamily, fontSize, fontWeight])

  // 初始化粒子（仅一次）
  const [particles] = useState(() => {
    const centerX = position?.x ? position.x * width : width / 2
    const centerY = position?.y ? position.y * height : height / 2
    return createParticles(text, prepared, centerX, centerY)
  })

  // 每帧渲染
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 更新粒子物理
    const deltaTime = 1 / fps
    updateParticles(particles, deltaTime, springForce * explosionForce, damping)

    // 渲染粒子
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (const p of particles) {
      ctx.save()
      ctx.globalAlpha = p.life
      ctx.fillText(p.char, p.x, p.y)
      ctx.restore()
    }
  }, [
    frame,
    particles,
    width,
    height,
    fps,
    fontSize,
    fontFamily,
    fontWeight,
    color,
    explosionForce,
    springForce,
    damping,
  ])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  )
}
