/**
 * 视频生成 Worker
 * 处理异步视频生成任务
 */
import { Worker, Job } from 'bullmq'
import { QueueName, VideoGenerationTaskData, TaskProgress } from './queue-manager'
import { runVideoPipeline } from '../video/pipeline'
import type { Storyboard } from '@/types'
import { logger } from '../utils/logger'

const log = logger.context('VideoGenerationWorker')

// Redis 连接配置（与 queue-manager 一致）
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

/**
 * 视频生成任务处理器
 */
async function processVideoGeneration(
  job: Job<VideoGenerationTaskData>
): Promise<{ videoUrl: string; duration: number }> {
  const { storyboardId, config } = job.data

  log.info('Starting video generation', { jobId: job.id, storyboardId, engine: config.engine })

  try {
    // Stage 1: 加载分镜数据
    await job.updateProgress({
      progress: 0,
      stage: 'loading',
      message: '加载分镜数据...',
    } as TaskProgress)

    /**
     * Database Integration: 从持久化存储加载分镜数据
     *
     * 当前: 临时占位，实际数据通过job.data传递
     * 生产: 需要集成 Prisma + LibSQL
     *
     * 实现建议:
     * const storyboard = await prisma.storyboard.findUnique({
     *   where: { id: task.data.storyboardId },
     *   include: { frames: true }
     * })
     */
    const storyboard: Storyboard = {} as any // 临时占位 - 数据库集成待实现

    // Stage 2: 生成视频片段
    await job.updateProgress({
      progress: 10,
      stage: 'generating_clips',
      message: '生成视频片段...',
      currentStep: 0,
      totalSteps: storyboard.frames.length,
    } as TaskProgress)

    // 调用视频生成 Pipeline
    const videoUrl = await runVideoPipeline({
      engine: config.engine || 'remotion',
      storyboard,
      aspectRatio: config.aspectRatio || '16:9',
      onProgress: (frameIndex, total) => {
        const progress = 10 + (frameIndex / total) * 70
        job.updateProgress({
          progress,
          stage: 'generating_clips',
          message: `生成第 ${frameIndex + 1}/${total} 个片段`,
          currentStep: frameIndex + 1,
          totalSteps: total,
        } as TaskProgress)
      },
    })

    // Stage 3: 合成完成
    await job.updateProgress({
      progress: 90,
      stage: 'finalizing',
      message: '完成视频合成...',
    } as TaskProgress)

    // Stage 4: 完成
    await job.updateProgress({
      progress: 100,
      stage: 'completed',
      message: '视频生成完成！',
    } as TaskProgress)

    log.info('Video generation completed', { jobId: job.id, videoUrl })

    // 计算总时长
    const duration = storyboard.frames.reduce((sum, frame) => sum + frame.duration, 0)

    return {
      videoUrl,
      duration,
    }
  } catch (error) {
    log.error('Video generation failed', error, { jobId: job.id })
    throw error
  }
}

/**
 * 创建视频生成 Worker
 */
export function createVideoGenerationWorker(): Worker {
  const worker = new Worker(
    QueueName.VIDEO_GENERATION,
    processVideoGeneration,
    {
      connection: {
        host: new URL(REDIS_URL).hostname,
        port: Number(new URL(REDIS_URL).port) || 6379,
      },
      concurrency: 2, // 同时处理2个任务
      limiter: {
        max: 10, // 每分钟最多10个任务
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

/**
 * 分段生成长视频（每段30秒）
 */
export async function generateLongVideo(
  job: Job<VideoGenerationTaskData & { segments: number }>
): Promise<{ videoUrl: string; duration: number }> {
  const { storyboardId, config, segments } = job.data

  log.info('Starting long video generation', { jobId: job.id, storyboardId, segments })

  const segmentUrls: string[] = []

  // 生成每个片段
  for (let i = 0; i < segments; i++) {
    await job.updateProgress({
      progress: (i / segments) * 90,
      stage: 'generating_segments',
      message: `生成第 ${i + 1}/${segments} 段视频...`,
      currentStep: i + 1,
      totalSteps: segments,
    } as TaskProgress)

    /**
     * 片段生成: 调用视频生成引擎
     *
     * 实现建议: 复用 generateStandardVideo 的核心逻辑
     * 每个片段独立生成，最后拼接
     */
    const segmentUrl = '' // 临时占位 - 需要实现片段生成逻辑
    segmentUrls.push(segmentUrl)
  }

  // 合成所有片段
  await job.updateProgress({
    progress: 90,
    stage: 'merging_segments',
    message: '合成所有片段...',
  } as TaskProgress)

  /**
   * FFmpeg 视频合成: 将多个片段拼接成完整视频
   *
   * 实现建议: 使用 ffmpeg-utils.ts 中的 concatVideos 函数
   * ```typescript
   * const finalVideoUrl = await concatVideos(segmentUrls, {
   *   output: `long-video-${job.id}.mp4`
   * })
   * ```
   */
  const finalVideoUrl = '' // 临时占位 - FFmpeg合成待实现

  await job.updateProgress({
    progress: 100,
    stage: 'completed',
    message: '长视频生成完成！',
  } as TaskProgress)

  return {
    videoUrl: finalVideoUrl,
    duration: segments * 30,
  }
}
