import type { VideoJob } from '@/types'

/**
 * 视频生成任务存储
 * 生产环境应使用数据库或Redis
 */
const jobStore = new Map<string, Partial<VideoJob>>()

export function updateJobStatus(jobId: string, update: Partial<VideoJob>) {
  const existing = jobStore.get(jobId) || {}
  const logs = update.logs ? [...(existing.logs || []), ...update.logs] : existing.logs
  jobStore.set(jobId, { ...existing, ...update, logs, updatedAt: new Date() })
}

export function getJobStatus(jobId: string): Partial<VideoJob> | undefined {
  return jobStore.get(jobId)
}
