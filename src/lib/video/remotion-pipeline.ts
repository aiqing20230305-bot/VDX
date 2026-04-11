/**
 * Remotion 渲染引擎
 * 负责 Bundle + Render 流程
 */
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { framesToSequences, getVideoDimensions, calculateTotalFrames } from './remotion/utils'
import type { Storyboard, AspectRatio, SubtitleTrack } from '@/types'
import type { WatermarkConfig } from './remotion/WatermarkOverlay'
import type { FilterId } from './filters'
import path from 'path'
import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger'

const log = logger.context('RemotionPipeline')

/**
 * 视频格式到 Remotion codec 的映射
 */
function getCodecForFormat(format: VideoFormat = 'mp4'): 'h264' | 'vp9' | 'prores' {
  const codecMap: Record<VideoFormat, 'h264' | 'vp9' | 'prores'> = {
    mp4: 'h264',    // H.264/AVC - 最广泛兼容
    webm: 'vp9',    // VP9 - 开源格式，适合网页，文件更小
    mov: 'prores',  // ProRes - 专业编辑格式，无损质量
  }
  return codecMap[format]
}

/**
 * 获取视频格式的文件扩展名
 */
function getFileExtension(format: VideoFormat = 'mp4'): string {
  return format
}

export type VideoFormat = 'mp4' | 'webm' | 'mov'

export interface RemotionRenderOptions {
  storyboard: Storyboard
  aspectRatio: AspectRatio
  outputPath?: string
  fps?: number
  format?: VideoFormat
  audioPath?: string
  audioVolume?: number // 0-1
  subtitleTracks?: SubtitleTrack[]
  watermark?: WatermarkConfig
  filterId?: FilterId
  filterIntensity?: number // 0-100
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
  const { storyboard, aspectRatio, fps = 30, format = 'mp4', audioPath, audioVolume = 0.8, subtitleTracks = [], watermark, filterId = 'none', filterIntensity = 100, onProgress } = options

  // 1. 计算视频尺寸
  const dimensions = getVideoDimensions(aspectRatio)

  // 2. 计算总帧数
  const totalFrames = calculateTotalFrames(storyboard.frames, fps)

  log.info('Starting bundle', {
    storyboardFrames: storyboard.frames.length,
    totalFrames,
    dimensions: `${dimensions.width}x${dimensions.height}`
  })

  // 3. Bundle React 代码
  const bundleLocation = await bundle({
    entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
    webpackOverride: (config) => config,
  })

  log.info('Bundle completed', { bundleLocation })

  // 4. 获取 Composition
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'StoryboardVideo',
    inputProps: {
      storyboard,
      fps,
      audioPath,
      audioVolume,
      subtitleTracks,
      watermark,
      filterId,
      filterIntensity
    },
  })

  log.debug('Composition selected', { compositionId: composition.id })

  // 5. 确定输出路径
  const fileExtension = getFileExtension(format)
  const outputPath =
    options.outputPath ??
    path.join(process.cwd(), 'public/outputs', `remotion_${uuid()}.${fileExtension}`)

  // 6. 渲染视频
  const codec = getCodecForFormat(format)
  log.info('Starting render', { format, codec })

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
      fps,
      width: dimensions.width,
      height: dimensions.height,
    },
    serveUrl: bundleLocation,
    codec,
    outputLocation: outputPath,
    inputProps: { storyboard, fps, audioPath, audioVolume, subtitleTracks, watermark },
    onProgress: ({ progress }) => {
      log.debug('Render progress', { progress: `${(progress * 100).toFixed(1)}%` })
      onProgress?.(progress)
    },
    chromiumOptions: {
      headless: true,
    },
    // 从环境变量读取配置
    concurrency: parseInt(process.env.REMOTION_CONCURRENCY ?? '2'),
    jpegQuality: parseInt(process.env.REMOTION_QUALITY ?? '80'),
  })

  log.info('Render completed', { outputPath })

  // 7. 返回 Web 访问路径
  return `/outputs/${path.basename(outputPath)}`
}
