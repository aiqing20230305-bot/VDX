/**
 * 视频生成 Pipeline
 * 编排 Seedance / Kling / FFmpeg / Remotion 完成完整视频生成
 */
import type {
  Storyboard,
  VideoJob,
  VideoJobConfig,
  VideoEngine,
  AspectRatio,
} from '@/types'
import { generateVideo as seedanceGenerate } from './seedance'
import { generateVideo as klingGenerate, pollUntilDone as klingPoll } from './kling'
import { concatVideos, downloadVideo } from './ffmpeg-utils'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/utils/logger'

const log = logger.context('VideoPipeline')

export interface PipelineOptions {
  engine: VideoEngine
  storyboard: Storyboard
  aspectRatio: AspectRatio
  consistencyPrompt?: string
  referenceImageUrl?: string
  /** 产品图片路径列表，每帧视频生成时都传入保证产品一致性 */
  productImages?: string[]
  onProgress?: (frameIndex: number, total: number, videoUrl?: string) => void
}

/**
 * 主 Pipeline：逐帧生成视频片段，然后拼接
 */
export async function runVideoPipeline(options: PipelineOptions): Promise<string> {
  const { engine, storyboard, aspectRatio, onProgress } = options
  const frames = storyboard.frames

  // Remotion 引擎：直接渲染完整视频（不需要逐帧生成）
  if (engine === 'remotion') {
    const { renderWithRemotion } = await import('./remotion-pipeline')

    const outputUrl = await renderWithRemotion({
      storyboard,
      aspectRatio,
      onProgress: (progress) => {
        // 将 0-1 进度转换为帧索引
        onProgress?.(Math.floor(progress * frames.length), frames.length)
      },
    })

    return outputUrl
  }

  // Seedance / Kling 引擎：逐帧生成后拼接
  const clipUrls: string[] = []

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    onProgress?.(i, frames.length)

    let clipUrl: string

    try {
      if (engine === 'seedance') {
        // dreamina CLI: 有产品图时走 multimodal2video，保证产品一致性
        clipUrl = await seedanceGenerate({
          prompt: buildPrompt(frame.imagePrompt, options.consistencyPrompt),
          imageUrl: frame.imageUrl ?? options.referenceImageUrl,
          model: 'seedance2.0',
          duration: Math.max(4, Math.min(Math.round(frame.duration), 15)),
          ratio: aspectRatio as '16:9' | '9:16' | '1:1',
          productImages: options.productImages,
        })

      } else if (engine === 'kling') {
        const job = await klingGenerate({
          prompt: buildPrompt(frame.imagePrompt, options.consistencyPrompt),
          imageUrl: frame.imageUrl ?? options.referenceImageUrl,
          duration: frame.duration >= 7 ? '10' : '5',
          aspectRatio,
          mode: 'std',
        })
        clipUrl = await klingPoll(job.taskId, () => onProgress?.(i, frames.length))

      } else {
        throw new Error(`Engine "${engine}" requires additional setup`)
      }

      clipUrls.push(clipUrl)
      onProgress?.(i + 1, frames.length, clipUrl)

    } catch (err) {
      log.error('Frame generation failed', err, { frameIndex: i })
      throw err
    }
  }

  // 下载所有片段到本地后拼接
  const localPaths: string[] = []
  for (const url of clipUrls) {
    const localPath = await downloadVideo(url)
    localPaths.push(localPath)
  }

  const finalVideoPath = await concatVideos({
    inputFiles: localPaths,
  })
  return `/outputs/${finalVideoPath.split('/outputs/')[1]}`
}

function buildPrompt(framePrompt: string, consistencyPrompt?: string): string {
  if (!consistencyPrompt) return framePrompt
  return `${consistencyPrompt}, ${framePrompt}`
}

/**
 * 快速单帧预览（不拼接）
 */
export async function generatePreviewClip(
  framePrompt: string,
  engine: VideoEngine,
  aspectRatio: AspectRatio,
  duration = 3
): Promise<string> {
  if (engine === 'seedance') {
    return seedanceGenerate({ prompt: framePrompt, model: 'seedance2.0', duration: Math.max(4, duration) })
  }

  if (engine === 'kling') {
    const job = await klingGenerate({ prompt: framePrompt, duration: '5', aspectRatio })
    return klingPoll(job.taskId)
  }

  throw new Error(`Engine "${engine}" not supported for preview`)
}

export function createVideoJob(config: VideoJobConfig): VideoJob {
  return {
    id: uuid(),
    status: 'pending',
    progress: 0,
    config,
    logs: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
