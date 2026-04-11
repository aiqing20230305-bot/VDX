import { NextRequest, NextResponse } from 'next/server'
import { getJobStatus } from '@/lib/video/job-store'
import { logger } from '@/lib/utils/logger'

const log = logger.context('VideoStatusAPI')

/**
 * GET /api/video/status/:jobId
 * 获取视频生成任务状态
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    const job = getJobStatus(jobId)
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get job status'
    log.error('Failed to retrieve job status', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
