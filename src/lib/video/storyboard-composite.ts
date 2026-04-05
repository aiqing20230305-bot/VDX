/**
 * 分镜合成图
 * 将多个分镜帧图片合成为一张概览图，每帧标注序号
 * 用于快速预览整体分镜节奏和画面
 */
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'outputs')

export interface CompositeOptions {
  /** 帧图片 URL 或本地路径列表 */
  frameImages: Array<{ index: number; url: string; duration?: number }>
  /** 每行显示几帧 */
  columns?: number
  /** 单帧宽度（px） */
  frameWidth?: number
  /** 帧间距（px） */
  gap?: number
  /** 标注字体大小 */
  fontSize?: number
}

/**
 * 将分镜帧合成为一张概览图
 * 自动根据帧数决定网格布局，每帧左上角标注序号和时长
 */
export async function compositeStoryboard(options: CompositeOptions): Promise<string> {
  const {
    frameImages,
    columns = 4,
    frameWidth = 480,
    gap = 8,
    fontSize = 28,
  } = options

  if (frameImages.length === 0) throw new Error('No frames to composite')

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // 计算画布尺寸
  const frameHeight = Math.round(frameWidth * 9 / 16) // 默认 16:9
  const rows = Math.ceil(frameImages.length / columns)
  const canvasWidth = columns * frameWidth + (columns - 1) * gap
  const canvasHeight = rows * frameHeight + (rows - 1) * gap

  // 下载并处理每帧图片
  const compositeInputs: sharp.OverlayOptions[] = []

  for (let i = 0; i < frameImages.length; i++) {
    const frame = frameImages[i]
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = col * (frameWidth + gap)
    const y = row * (frameHeight + gap)

    try {
      // 获取图片数据
      let imageBuffer: Buffer
      if (frame.url.startsWith('http')) {
        const res = await fetch(frame.url)
        imageBuffer = Buffer.from(await res.arrayBuffer())
      } else {
        imageBuffer = await fs.readFile(frame.url)
      }

      // 调整尺寸
      const resized = await sharp(imageBuffer)
        .resize(frameWidth, frameHeight, { fit: 'cover' })
        .toBuffer()

      compositeInputs.push({ input: resized, left: x, top: y })

      // 序号标注背景（半透明黑色圆角矩形）
      const labelText = frame.duration
        ? `${frame.index + 1} · ${frame.duration}s`
        : `${frame.index + 1}`
      const labelWidth = labelText.length * (fontSize * 0.6) + 16
      const labelHeight = fontSize + 12

      const labelSvg = Buffer.from(`
        <svg width="${labelWidth}" height="${labelHeight}">
          <rect x="0" y="0" width="${labelWidth}" height="${labelHeight}" rx="6" fill="rgba(0,0,0,0.7)"/>
          <text x="8" y="${fontSize + 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">${labelText}</text>
        </svg>
      `)

      compositeInputs.push({
        input: labelSvg,
        left: x + 8,
        top: y + 8,
      })
    } catch (err) {
      // 帧图片获取失败，填充灰色占位 + 序号
      const placeholder = await sharp({
        create: {
          width: frameWidth,
          height: frameHeight,
          channels: 4,
          background: { r: 40, g: 40, b: 50, alpha: 255 },
        },
      }).png().toBuffer()

      compositeInputs.push({ input: placeholder, left: x, top: y })

      const labelSvg = Buffer.from(`
        <svg width="60" height="${fontSize + 12}">
          <rect x="0" y="0" width="60" height="${fontSize + 12}" rx="6" fill="rgba(0,0,0,0.7)"/>
          <text x="8" y="${fontSize + 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white">${frame.index + 1}</text>
        </svg>
      `)
      compositeInputs.push({ input: labelSvg, left: x + 8, top: y + 8 })
    }
  }

  // 创建画布并合成
  const outputPath = path.join(OUTPUT_DIR, `storyboard_${uuid()}.jpg`)

  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 18, g: 18, b: 24, alpha: 255 }, // 深色背景
    },
  })
    .composite(compositeInputs)
    .jpeg({ quality: 90 })
    .toFile(outputPath)

  return `/outputs/${path.basename(outputPath)}`
}

/**
 * 根据帧数自动选择最佳列数
 */
export function autoColumns(frameCount: number): number {
  if (frameCount <= 4) return 2
  if (frameCount <= 9) return 3
  if (frameCount <= 16) return 4
  if (frameCount <= 30) return 5
  return 6
}
