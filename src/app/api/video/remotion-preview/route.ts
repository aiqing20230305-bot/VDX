/**
 * Remotion 预览 API
 * 快速渲染单帧用于预览，无需完整视频编码
 */
import 'server-only'
import { renderStill, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import type { Storyboard, AspectRatio } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60  // 1 分钟

// Bundle 缓存（避免重复打包）
let cachedBundle: string | null = null

/**
 * 获取或创建 Bundle
 */
async function getBundleLocation(): Promise<string> {
  if (cachedBundle) {
    console.log('[Preview] 使用缓存的 Bundle')
    return cachedBundle
  }

  console.log('[Preview] 创建新 Bundle...')
  const bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
    webpackOverride: (config) => config,
  })

  cachedBundle = bundleLocation
  return bundleLocation
}

/**
 * 计算指定分镜帧的绝对帧号
 */
function calculateFrameNumber(
  frames: Storyboard['frames'],
  frameIndex: number,
  fps: number
): number {
  let cumulative = 0
  for (let i = 0; i < frameIndex; i++) {
    cumulative += Math.round(frames[i].duration * fps)
  }
  // 返回该帧的中间帧号（更具代表性）
  const frameDuration = Math.round(frames[frameIndex].duration * fps)
  return cumulative + Math.floor(frameDuration / 2)
}

/**
 * 根据比例计算视频尺寸
 */
function getVideoDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  // 预览使用较低分辨率以提高速度
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 }  // 720p
    case '9:16':
      return { width: 720, height: 1280 }  // 竖屏 720p
    case '1:1':
      return { width: 720, height: 720 }
    case '4:3':
      return { width: 960, height: 720 }
    default:
      return { width: 1280, height: 720 }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      storyboard,
      frameIndex = 0,
      fps = 30,
      aspectRatio = '16:9',
    } = body as {
      storyboard: Storyboard
      frameIndex?: number
      fps?: number
      aspectRatio?: AspectRatio
    }

    // 验证输入
    if (!storyboard || !storyboard.frames || storyboard.frames.length === 0) {
      return NextResponse.json({ error: '无效的分镜数据' }, { status: 400 })
    }

    if (frameIndex < 0 || frameIndex >= storyboard.frames.length) {
      return NextResponse.json({ error: '帧索引超出范围' }, { status: 400 })
    }

    // 获取尺寸
    const dimensions = getVideoDimensions(aspectRatio)

    // 计算帧号
    const frameNumber = calculateFrameNumber(storyboard.frames, frameIndex, fps)
    console.log(`[Preview] 渲染第 ${frameIndex} 帧（帧号 ${frameNumber}）`)

    // 获取 Bundle
    const bundleLocation = await getBundleLocation()

    // 获取 Composition 信息
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'StoryboardVideo',
      inputProps: { storyboard, fps },
    })

    // 渲染单帧（使用 renderStill）
    const startTime = Date.now()
    const outputPath = path.join('/tmp', `preview-${Date.now()}.png`)

    await renderStill({
      composition: {
        ...composition,
        fps,
        width: dimensions.width,
        height: dimensions.height,
      },
      serveUrl: bundleLocation,
      frame: frameNumber,
      inputProps: { storyboard, fps },
      output: outputPath,
      imageFormat: 'png',
    })

    const renderTime = Date.now() - startTime
    console.log(`[Preview] 渲染完成，耗时 ${renderTime}ms`)

    // 读取渲染的图片
    const frameBuffer = await fs.readFile(outputPath)

    // 删除临时文件
    await fs.unlink(outputPath).catch(() => {})

    // 返回 PNG 图片
    return new NextResponse(frameBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Render-Time': `${renderTime}ms`,
      },
    })

  } catch (err) {
    console.error('[Preview Error]:', err)
    const message = err instanceof Error ? err.message : String(err)

    // 特定错误处理
    if (message.includes('Puppeteer')) {
      return NextResponse.json({
        error: 'Puppeteer 未安装，请运行: npx puppeteer browsers install chrome',
      }, { status: 500 })
    }

    if (message.includes('ENOMEM') || message.includes('memory')) {
      return NextResponse.json({
        error: '内存不足，请尝试降低预览分辨率',
      }, { status: 500 })
    }

    if (message.includes('ENOENT') && message.includes('remotion')) {
      return NextResponse.json({
        error: 'Remotion 文件未找到，请检查项目配置',
      }, { status: 500 })
    }

    return NextResponse.json({ error: `预览失败: ${message}` }, { status: 500 })
  }
}
