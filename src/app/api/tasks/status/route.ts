/**
 * API: 查询任务状态
 * GET /api/tasks/status?taskId=xxx&queueName=xxx
 */
import { NextRequest, NextResponse } from 'next/server'
import { getQueueManager, QueueName } from '@/lib/queue/queue-manager'
import { logger } from '@/lib/utils/logger'

const log = logger.context('TaskStatusAPI')

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')
    const queueName = searchParams.get('queueName') as QueueName | null

    if (!taskId || !queueName) {
      return NextResponse.json(
        { error: 'Missing required query params: taskId, queueName' },
        { status: 400 }
      )
    }

    const queueManager = getQueueManager()
    const status = await queueManager.getTaskStatus(queueName, taskId)

    if (!status) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(status)
  } catch (error: any) {
    log.error('Failed to get task status', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get task status' },
      { status: 500 }
    )
  }
}
