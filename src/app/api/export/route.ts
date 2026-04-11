/**
 * 视频导出API
 * Mock实现：模拟导出流程
 */
import { NextRequest } from 'next/server'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 模拟导出任务存储
const exportJobs = new Map<string, {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  error?: string
  createdAt: Date
}>()

/**
 * POST /api/export
 * 提交导出任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { frames, config } = body

    if (!frames || frames.length === 0) {
      return new Response(JSON.stringify({ error: 'No frames to export' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 创建导出任务
    const jobId = uuid()
    exportJobs.set(jobId, {
      id: jobId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    })

    // 模拟异步处理
    setTimeout(async () => {
      const job = exportJobs.get(jobId)
      if (!job) return

      // 更新为处理中
      job.status = 'processing'
      exportJobs.set(jobId, job)

      // 模拟进度更新
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        const currentJob = exportJobs.get(jobId)
        if (currentJob) {
          currentJob.progress = i
          exportJobs.set(jobId, currentJob)
        }
      }

      // 完成
      const finalJob = exportJobs.get(jobId)
      if (finalJob) {
        finalJob.status = 'completed'
        finalJob.progress = 100
        finalJob.videoUrl = `/outputs/export-${jobId}.mp4` // Mock URL
        exportJobs.set(jobId, finalJob)
      }
    }, 100)

    return new Response(JSON.stringify({ jobId }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    logger.error('[Export API] Request failed', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Export failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
