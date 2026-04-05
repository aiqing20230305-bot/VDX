/**
 * Remotion 渲染引擎
 * 负责 Bundle + Render 流程
 */
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { framesToSequences, getVideoDimensions, calculateTotalFrames } from './remotion/utils'
import type { Storyboard, AspectRatio } from '@/types'
import path from 'path'
import { v4 as uuid } from 'uuid'

export interface RemotionRenderOptions {
  storyboard: Storyboard
  aspectRatio: AspectRatio
  outputPath?: string
  fps?: number
  onProgress?: (progress: number) => void
}

/**
 * 使用 Remotion 渲染视频
 * @param options 渲染选项
 * @returns 视频 URL（/outputs/xxx.mp4）
 */
export async function renderWithRemotion(
  options: RemotionRenderOptions
): Promise<string> {
  const { storyboard, aspectRatio, fps = 30, onProgress } = options

  // 1. 计算视频尺寸
  const dimensions = getVideoDimensions(aspectRatio)

  // 2. 计算总帧数
  const totalFrames = calculateTotalFrames(storyboard.frames, fps)

  console.log('[Remotion] 开始 Bundle...')
  console.log(`[Remotion] 分镜帧数: ${storyboard.frames.length}`)
  console.log(`[Remotion] 总帧数: ${totalFrames}`)
  console.log(`[Remotion] 尺寸: ${dimensions.width}x${dimensions.height}`)

  // 3. Bundle React 代码
  const bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
    webpackOverride: (config) => config,
  })

  console.log('[Remotion] Bundle 完成:', bundleLocation)

  // 4. 获取 Composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'StoryboardVideo',
    inputProps: { storyboard, fps },
  })

  console.log('[Remotion] Composition 已选择:', composition.id)

  // 5. 确定输出路径
  const outputPath =
    options.outputPath ??
    path.join(process.cwd(), 'public/outputs', `remotion_${uuid()}.mp4`)

  // 6. 渲染视频
  console.log('[Remotion] 开始渲染...')

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
      fps,
      width: dimensions.width,
      height: dimensions.height,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: { storyboard, fps },
    onProgress: ({ progress }) => {
      console.log(`[Remotion] 渲染进度: ${(progress * 100).toFixed(1)}%`)
      onProgress?.(progress)
    },
    chromiumOptions: {
      headless: true,
    },
    // 从环境变量读取配置
    concurrency: parseInt(process.env.REMOTION_CONCURRENCY ?? '2'),
    jpegQuality: parseInt(process.env.REMOTION_QUALITY ?? '80'),
  })

  console.log('[Remotion] 渲染完成:', outputPath)

  // 7. 返回 Web 访问路径
  return `/outputs/${path.basename(outputPath)}`
}
