/**
 * 视频渲染 Worker（Remotion）
 * 处理视频导出和渲染任务
 */
import { Worker, Job } from 'bullmq'
import { QueueName, TaskProgress } from './queue-manager'
import { renderWithRemotion } from '../video/remotion-pipeline'
import type { AspectRatio, Storyboard, StoryboardFrame, SubtitleTrack } from '@/types'
import type { Frame } from '@/types/workspace'
import type { WatermarkConfig } from '../video/remotion/WatermarkOverlay'
import type { FilterId } from '../video/filters'
import path from 'path'
import fs from 'fs/promises'
import { logger } from '../utils/logger'

const log = logger.context('RenderWorker')

// Redis 连接配置
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

/**
 * 视频渲染任务数据
 */
export interface VideoRenderTaskData {
  type: 'render'
  projectId: string
  projectTitle: string
  frames: Frame[]
  config: {
    resolution: '720p' | '1080p' | '2k' | '4k'
    fps: number
    format: 'mp4' | 'webm' | 'mov'
    quality: number
  }
  audioPath?: string
  subtitleTracks?: SubtitleTrack[]
  watermark?: WatermarkConfig
  filterSettings?: {
    filterId: FilterId
    intensity: number
  }
}

/**
 * 分辨率映射
 */
const RESOLUTION_MAP: Record<string, AspectRatio> = {
  '720p': '16:9',
  '1080p': '16:9',
  '2k': '16:9',
  '4k': '16:9',
}

/**
 * 视频渲染任务处理器
 */
async function processVideoRender(
  job: Job<VideoRenderTaskData>
): Promise<{ videoUrl: string; fileSize: number; duration: number }> {
  const { projectId, projectTitle, frames, config, audioPath, subtitleTracks, watermark, filterSettings } = job.data

  log.info('Starting video render', {
    jobId: job.id,
    projectTitle,
    resolution: config.resolution,
    fps: config.fps,
    frameCount: frames.length
  })

  try {
    // Stage 1: 验证帧数据
    await job.updateProgress({
      progress: 0,
      stage: 'validating',
      message: '验证视频帧数据...',
    } as TaskProgress)

    if (!frames || frames.length === 0) {
      throw new Error('No frames to render')
    }

    // 检查每一帧是否有有效的图片路径
    const invalidFrames = frames.filter((frame) => !frame.imageUrl)
    if (invalidFrames.length > 0) {
      throw new Error(`${invalidFrames.length} frames missing image URL`)
    }

    log.debug('Frame validation passed', { frameCount: frames.length })

    // Stage 2: 准备输出目录
    await job.updateProgress({
      progress: 5,
      stage: 'preparing',
      message: '准备输出目录...',
    } as TaskProgress)

    const outputDir = path.join(process.cwd(), 'public/outputs')
    await fs.mkdir(outputDir, { recursive: true })

    // Stage 3: 调用 Remotion 渲染
    await job.updateProgress({
      progress: 10,
      stage: 'rendering',
      message: '开始 Remotion 渲染...',
    } as TaskProgress)

    const aspectRatio = RESOLUTION_MAP[config.resolution] || '16:9'

    // 将 workspace Frame 转换为 StoryboardFrame
    const storyboardFrames: StoryboardFrame[] = frames.map((frame, index) => ({
      index,
      scriptSceneIndex: index,
      imageUrl: frame.imageUrl,
      imagePrompt: frame.imagePrompt,
      duration: frame.duration,
      description: frame.sceneDescription,
      cameraAngle: frame.cameraMove || 'medium shot',
      transition: 'fade',
    }))

    // 构建 Storyboard 对象
    const storyboard: Storyboard = {
      id: projectId,
      scriptId: projectId,
      totalFrames: frames.length,
      frames: storyboardFrames,
      createdAt: new Date(),
    }

    // 调用 Remotion 渲染
    const videoUrl = await renderWithRemotion({
      storyboard,
      aspectRatio,
      fps: config.fps,
      format: config.format || 'mp4',
      audioPath,
      audioVolume: 0.8, // 默认音量80%（可以从config中读取）
      subtitleTracks: subtitleTracks || [],
      watermark,
      filterId: filterSettings?.filterId,
      filterIntensity: filterSettings?.intensity,
      onProgress: (progress) => {
        // Remotion 进度映射到 10% - 95%
        const overallProgress = 10 + progress * 85
        job.updateProgress({
          progress: overallProgress,
          stage: 'rendering',
          message: `渲染进度: ${(progress * 100).toFixed(1)}%`,
        } as TaskProgress)
      },
    })

    log.info('Remotion render completed', { videoUrl })

    // Stage 4: 获取文件信息
    await job.updateProgress({
      progress: 95,
      stage: 'finalizing',
      message: '完成渲染，准备文件信息...',
    } as TaskProgress)

    const filePath = path.join(process.cwd(), 'public', videoUrl)
    const stats = await fs.stat(filePath)
    const fileSize = stats.size

    log.info('File size calculated', { sizeMB: (fileSize / 1024 / 1024).toFixed(2) })

    // Stage 5: 完成
    await job.updateProgress({
      progress: 100,
      stage: 'completed',
      message: '视频渲染完成！',
    } as TaskProgress)

    log.info('Render job completed', { jobId: job.id })

    return {
      videoUrl,
      fileSize,
      duration: frames.reduce((sum, frame) => sum + frame.duration, 0),
    }
  } catch (error) {
    log.error('Render job failed', error, { jobId: job.id })
    throw error
  }
}

/**
 * 创建视频渲染 Worker
 */
export function createVideoRenderWorker(): Worker {
  const worker = new Worker(
    QueueName.VIDEO_GENERATION,
    async (job) => {
      // 根据任务类型路由到不同的处理器
      if (job.data.type === 'render') {
        return processVideoRender(job)
      }
      // 其他类型任务由原 video-generation-worker 处理
      throw new Error(`Unknown task type: ${job.data.type}`)
    },
    {
      connection: {
        host: new URL(REDIS_URL).hostname,
        port: Number(new URL(REDIS_URL).port) || 6379,
      },
      concurrency: 1, // 渲染任务很重，串行处理
      limiter: {
        max: 3, // 每分钟最多3个渲染任务
        duration: 60000,
      },
    }
  )

  // 监听 Worker 事件
  worker.on('completed', (job) => {
    log.info('Job completed', { jobId: job.id })
  })

  worker.on('failed', (job, err) => {
    log.error('Job failed', err, { jobId: job?.id })
  })

  worker.on('error', (err) => {
    log.error('Worker error', err)
  })

  return worker
}
