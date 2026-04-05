/**
 * Pretext 工具函数
 * 封装 @chenglou/pretext 核心 API
 */
import {
  prepareWithSegments,
  layoutWithLines,
  type PreparedTextWithSegments,
  type LayoutLinesResult,
} from '@chenglou/pretext'
import type { Particle } from './types'

/**
 * 预处理文本（一次性，缓存结果）
 * @param text 文本内容
 * @param fontFamily 字体
 * @param fontSize 字号
 * @param fontWeight 字重
 * @returns PreparedTextWithSegments
 */
export function prepareText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number
): PreparedTextWithSegments {
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`
  return prepareWithSegments(text, font)
}

/**
 * 布局文本行（每帧调用）
 * @param prepared 预处理的文本
 * @param maxWidth 最大宽度
 * @param lineHeight 行高
 * @returns LayoutLinesResult
 */
export function layoutText(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
  lineHeight: number
): LayoutLinesResult {
  return layoutWithLines(prepared, maxWidth, lineHeight)
}

/**
 * 字符密度映射（用于 ASCII 艺术）
 * @param brightness 亮度（0-1）
 * @param charset 字符集（从暗到亮）
 * @returns 映射的字符
 */
export function getDensityChar(
  brightness: number,
  charset: string = ' .:-=+*#%@'
): string {
  const index = Math.floor(brightness * (charset.length - 1))
  return charset[Math.max(0, Math.min(index, charset.length - 1))]
}

/**
 * 创建粒子系统
 * @param text 文本内容
 * @param prepared 预处理的文本
 * @param centerX 中心 x 坐标
 * @param centerY 中心 y 坐标
 * @returns Particle[]
 */
export function createParticles(
  text: string,
  prepared: PreparedTextWithSegments,
  centerX: number = 0,
  centerY: number = 0
): Particle[] {
  const particles: Particle[] = []
  const { widths, segments } = prepared

  // 计算总宽度，用于居中
  const totalWidth = widths.reduce((sum, w) => sum + w, 0)
  let x = centerX - totalWidth / 2

  // 为每个字符创建粒子
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const width = widths[i]

    particles.push({
      char: segment,
      x: x + width / 2 + (Math.random() - 0.5) * 200, // 初始随机分散
      y: centerY + (Math.random() - 0.5) * 200,
      vx: (Math.random() - 0.5) * 20,  // 随机初速度
      vy: (Math.random() - 0.5) * 20,
      life: 1,
      targetX: x + width / 2,          // 目标位置（居中）
      targetY: centerY,
      width,
    })

    x += width
  }

  return particles
}

/**
 * 更新粒子物理（每帧调用）
 * @param particles 粒子数组
 * @param deltaTime 时间增量（秒）
 * @param springForce 弹簧力（0-1）
 * @param damping 阻尼（0-1）
 */
export function updateParticles(
  particles: Particle[],
  deltaTime: number,
  springForce: number = 0.05,
  damping: number = 0.9
): void {
  for (const p of particles) {
    // 弹簧力（回归目标位置）
    const dx = p.targetX - p.x
    const dy = p.targetY - p.y
    p.vx += dx * springForce
    p.vy += dy * springForce

    // 阻尼
    p.vx *= damping
    p.vy *= damping

    // 更新位置
    p.x += p.vx * deltaTime * 60 // 归一化到 60fps
    p.y += p.vy * deltaTime * 60
  }
}

/**
 * 从图片生成密度图（用于 ASCII 艺术）
 * @param imageUrl 图片路径
 * @param cols 列数
 * @param rows 行数
 * @returns Promise<number[][]> 亮度矩阵（0-1）
 */
export async function generateDensityMap(
  imageUrl: string,
  cols: number,
  rows: number
): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // 创建离屏 Canvas
      const offscreen = document.createElement('canvas')
      offscreen.width = cols
      offscreen.height = rows
      const ctx = offscreen.getContext('2d')

      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, cols, rows)

      // 提取像素数据
      const imageData = ctx.getImageData(0, 0, cols, rows)
      const data = imageData.data

      // 计算亮度矩阵
      const brightness: number[][] = []
      for (let y = 0; y < rows; y++) {
        brightness[y] = []
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // 灰度公式：0.299*R + 0.587*G + 0.114*B
          const gray = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          brightness[y][x] = gray
        }
      }

      resolve(brightness)
    }

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${imageUrl}`))
    }

    img.src = imageUrl
  })
}

/**
 * 计算视频尺寸（根据宽高比）
 * @param aspectRatio 宽高比
 * @returns { width, height }
 */
export function getVideoDimensions(aspectRatio: string): {
  width: number
  height: number
} {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 }
    case '9:16':
      return { width: 1080, height: 1920 }
    case '1:1':
      return { width: 1080, height: 1080 }
    case '4:3':
      return { width: 1440, height: 1080 }
    default:
      return { width: 1920, height: 1080 }
  }
}

/**
 * 线性插值
 * @param start 起始值
 * @param end 结束值
 * @param t 插值参数（0-1）
 * @returns 插值结果
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * 夹紧值到范围
 * @param value 值
 * @param min 最小值
 * @param max 最大值
 * @returns 夹紧后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}
