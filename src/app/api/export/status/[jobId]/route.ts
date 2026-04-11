/**
 * 查询导出任务状态
 */
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 从主export route导入（实际项目中应使用共享存储）
// 这里简化处理：使用内存Map模拟
const exportJobs = new Map()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    // 从环境获取job状态（Mock实现）
    // 实际应该从数据库或Redis读取
    const mockJob = {
      id: jobId,
      status: 'completed',
      progress: 100,
      videoUrl: `/outputs/export-${jobId}.mp4`,
    }

    return new Response(JSON.stringify(mockJob), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get status' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
