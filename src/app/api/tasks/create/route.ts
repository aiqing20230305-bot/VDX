/**
 * API: 创建异步任务
 * POST /api/tasks/create
 */
import { NextRequest, NextResponse } from 'next/server'
import { getQueueManager, QueueName, TaskPriority } from '@/lib/queue/queue-manager'
import type { VideoGenerationTaskData, ImageGenerationTaskData, StoryboardTaskData } from '@/lib/queue/queue-manager'
import { logger } from '@/lib/utils/logger'

const log = logger.context('TaskCreateAPI')

export const runtime = 'nodejs'
export const maxDuration = 300

type TaskType = 'video' | 'image' | 'storyboard'

interface CreateTaskRequest {
  type: TaskType
  data: VideoGenerationTaskData | ImageGenerationTaskData | StoryboardTaskData
  priority?: TaskPriority
  delay?: number
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateTaskRequest = await req.json()
    const { type, data, priority, delay } = body

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data' },
        { status: 400 }
      )
    }

    // 根据任务类型选择队列
    let queueName: QueueName
    switch (type) {
      case 'video':
        queueName = QueueName.VIDEO_GENERATION
        break
      case 'image':
        queueName = QueueName.IMAGE_GENERATION
        break
      case 'storyboard':
        queueName = QueueName.STORYBOARD
        break
      default:
        return NextResponse.json(
          { error: `Unknown task type: ${type}` },
          { status: 400 }
        )
    }

    // 创建任务
    const queueManager = getQueueManager()
    const job = await queueManager.addTask(queueName, data, {
      priority: priority ?? TaskPriority.NORMAL,
      delay,
    })

    log.info('Task created', { taskId: job.id, queueName })

    return NextResponse.json({
      taskId: job.id,
      queueName,
      status: 'created',
      message: 'Task created successfully',
    })
  } catch (error: any) {
    log.error('Failed to create task', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create task' },
      { status: 500 }
    )
  }
}
