/**
 * POST /api/video/render
 * 创建视频渲染任务（使用 Remotion）
 */
import { NextRequest, NextResponse } from 'next/server'
import { getQueueManager, QueueName } from '@/lib/queue/queue-manager'
import type { Frame } from '@/types/workspace'
import type { SubtitleTrack } from '@/types'
import type { WatermarkConfig } from '@/lib/video/remotion/WatermarkOverlay'
import type { FilterId } from '@/lib/video/filters'
import { logger } from '@/lib/utils/logger'

const log = logger.context('VideoRenderAPI')

export const runtime = 'nodejs'
export const maxDuration = 300

export interface VideoRenderConfig {
  resolution: '720p' | '1080p' | '2k' | '4k'
  fps: number
  format: 'mp4' | 'webm'
  quality: number // 0-100
}

export interface VideoRenderRequest {
  projectId: string
  projectTitle: string
  frames: Frame[]
  config: VideoRenderConfig
  audioPath?: string
  subtitleTracks?: SubtitleTrack[]
  watermark?: WatermarkConfig
  filterSettings?: {
    filterId: FilterId
    intensity: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: VideoRenderRequest = await req.json()
    const { projectId, projectTitle, frames, config, audioPath, subtitleTracks, watermark, filterSettings } = body

    // 验证
    if (!projectId || !frames || frames.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, frames' },
        { status: 400 }
      )
    }

    log.info('Creating render task', {
      projectId,
      frameCount: frames.length,
      resolution: config.resolution,
      fps: config.fps,
    })

    // 创建渲染任务
    const queueManager = getQueueManager()
    const job = await queueManager.addTask(
      QueueName.VIDEO_GENERATION,
      {
        type: 'render',
        projectId,
        projectTitle: projectTitle || `视频_${Date.now()}`,
        frames,
        config: {
          resolution: config.resolution || '1080p',
          fps: config.fps || 30,
          format: config.format || 'mp4',
          quality: config.quality || 80,
        },
        audioPath,
        subtitleTracks: subtitleTracks || [],
        watermark,
        filterSettings,
      },
      {
        priority: 1, // 高优先级
      }
    )

    log.info('Render task created', { taskId: job.id, projectId })

    return NextResponse.json({
      taskId: job.id,
      queueName: QueueName.VIDEO_GENERATION,
      status: 'created',
      message: 'Video render task created',
    })
  } catch (error: any) {
    log.error('Failed to create render task', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create render task' },
      { status: 500 }
    )
  }
}
