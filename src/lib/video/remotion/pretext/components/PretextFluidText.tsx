/**
 * Pretext 流体文字组件
 * 正弦波驱动的流体文字效果，适合片头标题、品牌动画
 */
import React, { useRef, useEffect, useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { prepareText } from '../utils'
import type { FluidTextConfig } from '../types'

export interface PretextFluidTextProps extends FluidTextConfig {
  text: string
}

export const PretextFluidText: React.FC<PretextFluidTextProps> = ({
  text,
  fontFamily = 'Inter, Arial, sans-serif',
  fontSize = 80,
  fontWeight = 700,
  color = '#ffffff',
  fluidSpeed = 1,
  fluidDensity = 1,
  position,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // 预处理文本（仅计算一次）
  const prepared = useMemo(() => {
    return prepareText(text, fontFamily, fontSize, fontWeight)
  }, [text, fontFamily, fontSize, fontWeight])

  // 每帧渲染
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 时间（秒）
    const time = frame / fps

    // 获取字符宽度和片段
    const { segments, widths } = prepared

    // 计算总宽度，用于居中
    const totalWidth = widths.reduce((sum, w) => sum + w, 0)

    // 起始位置（默认居中）
    const startX = position?.x ? position.x * width : (width - totalWidth) / 2
    const startY = position?.y ? position.y * height : height / 2

    // 设置字体
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.textBaseline = 'middle'

    // 渲染每个字符
    let x = startX

    for (let i = 0; i < segments.length; i++) {
      const char = segments[i]
      const charWidth = widths[i]

      // 流体偏移（正弦波）
      // x 轴：横向波动
      // y 轴：纵向波动
      const offsetX =
        Math.sin(time * fluidSpeed * 2 + i * 0.3) * 5 * fluidDensity
      const offsetY =
        Math.cos(time * fluidSpeed * 2 + i * 0.2) * 3 * fluidDensity

      // 透明度波动（微妙）
      const alpha = 0.9 + Math.sin(time * 2 + i * 0.5) * 0.1

      // 字号微调（可选，增加流体感）
      const scaleFactor = 1 + Math.sin(time * 1.5 + i * 0.4) * 0.05

      // 渲染字符
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = color

      // 应用缩放
      ctx.translate(x + charWidth / 2 + offsetX, startY + offsetY)
      ctx.scale(scaleFactor, scaleFactor)
      ctx.translate(-(x + charWidth / 2 + offsetX), -(startY + offsetY))

      ctx.fillText(char, x + offsetX, startY + offsetY)
      ctx.restore()

      x += charWidth
    }
  }, [
    frame,
    prepared,
    width,
    height,
    fps,
    fontFamily,
    fontSize,
    fontWeight,
    color,
    fluidSpeed,
    fluidDensity,
    position,
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
