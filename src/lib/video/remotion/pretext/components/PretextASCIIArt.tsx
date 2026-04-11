/**
 * Pretext ASCII 艺术组件
 * 图片转 ASCII 字符，复古技术感
 */
import React, { useRef, useEffect, useState } from 'react'
import { useVideoConfig } from 'remotion'
import { getDensityChar, generateDensityMap } from '../utils'
import type { ASCIIArtConfig } from '../types'
import { logger } from '@/lib/utils/logger'

export interface PretextASCIIArtProps extends ASCIIArtConfig {
  imageUrl: string // 必需
}

export const PretextASCIIArt: React.FC<PretextASCIIArtProps> = ({
  imageUrl,
  fontFamily = 'monospace',
  fontSize = 12,
  fontWeight = 400,
  color = '#00ff00',
  charset = ' .:-=+*#%@',
  charSpacing = 0.6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = useVideoConfig()

  // 密度图状态
  const [densityMap, setDensityMap] = useState<number[][] | null>(null)
  const [cols, setCols] = useState(0)
  const [rows, setRows] = useState(0)

  // 加载图片并生成密度图（仅一次）
  useEffect(() => {
    const calcCols = Math.floor(width / (fontSize * charSpacing))
    const calcRows = Math.floor(height / fontSize)

    setCols(calcCols)
    setRows(calcRows)

    generateDensityMap(imageUrl, calcCols, calcRows)
      .then(setDensityMap)
      .catch((err) => {
        logger.error('[PretextASCIIArt] Failed to generate density map:', err)
      })
  }, [imageUrl, width, height, fontSize, charSpacing])

  // 渲染 ASCII
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !densityMap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 设置字体
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textBaseline = 'top'

    // 渲染 ASCII 字符
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const brightness = densityMap[y]?.[x] ?? 0
        const char = getDensityChar(brightness, charset)

        // 跳过空格（优化性能）
        if (char === ' ') continue

        ctx.fillText(char, x * fontSize * charSpacing, y * fontSize)
      }
    }
  }, [densityMap, cols, rows, width, height, fontSize, fontFamily, fontWeight, color, charset, charSpacing])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000', // ASCII 通常需要黑色背景
      }}
    />
  )
}
