/**
 * API: 订阅任务进度（Server-Sent Events）
 * GET /api/tasks/progress?taskId=xxx&queueName=xxx
 *
 * 客户端使用：
 * const eventSource = new EventSource('/api/tasks/progress?taskId=xxx&queueName=video-generation')
 * eventSource.addEventListener('progress', (e) => {
 *   const data = JSON.parse(e.data)
 *   console.log(data.progress) // 0-100
 * })
 */
import { NextRequest } from 'next/server'
import { getQueueManager, QueueName } from '@/lib/queue/queue-manager'
import type { TaskProgress } from '@/lib/queue/queue-manager'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('taskId')
  const queueName = searchParams.get('queueName') as QueueName | null

  if (!taskId || !queueName) {
    return new Response('Missing required query params: taskId, queueName', {
      status: 400,
    })
  }

  // SSE 响应头
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const queueManager = getQueueManager()

      // 发送初始连接事件
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      )

      // 订阅进度更新
      const unsubscribeProgress = queueManager.onJobProgress(
        queueName,
        taskId,
        (progress: TaskProgress) => {
          controller.enqueue(
            encoder.encode(
              `event: progress\ndata: ${JSON.stringify(progress)}\n\n`
            )
          )
        }
      )

      // 订阅任务完成
      const unsubscribeCompleted = queueManager.onJobCompleted(
        queueName,
        taskId,
        (result: any) => {
          controller.enqueue(
            encoder.encode(
              `event: completed\ndata: ${JSON.stringify(result)}\n\n`
            )
          )
          cleanup()
          controller.close()
        }
      )

      // 订阅任务失败
      const unsubscribeFailed = queueManager.onJobFailed(
        queueName,
        taskId,
        (error: Error) => {
          controller.enqueue(
            encoder.encode(
              `event: failed\ndata: ${JSON.stringify({ error: error.message })}\n\n`
            )
          )
          cleanup()
          controller.close()
        }
      )

      // 清理函数
      const cleanup = () => {
        unsubscribeProgress()
        unsubscribeCompleted()
        unsubscribeFailed()
      }

      // 客户端断开连接时清理
      req.signal.addEventListener('abort', () => {
        cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
