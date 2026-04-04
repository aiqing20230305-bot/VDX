'use client'

import type { VideoJob } from '@/types'
import { Loader2, CheckCircle, XCircle, Play } from 'lucide-react'

interface Props {
  job: VideoJob
}

const statusConfig = {
  pending: { icon: Loader2, color: 'text-zinc-400', label: '等待中', spin: true },
  running: { icon: Loader2, color: 'text-violet-400', label: '生成中', spin: true },
  completed: { icon: CheckCircle, color: 'text-green-400', label: '完成', spin: false },
  failed: { icon: XCircle, color: 'text-red-400', label: '失败', spin: false },
  cancelled: { icon: XCircle, color: 'text-zinc-500', label: '已取消', spin: false },
}

export function VideoProgress({ job }: Props) {
  const config = statusConfig[job.status]
  const Icon = config.icon

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon
            size={16}
            className={`${config.color} ${config.spin ? 'animate-spin' : ''}`}
          />
          <span className="text-sm font-medium text-zinc-200">视频生成</span>
          <span className={`text-xs ${config.color}`}>{config.label}</span>
        </div>
        <span className="text-sm font-mono text-zinc-400">{job.progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-zinc-700 rounded-full h-1.5 mb-2">
        <div
          className="bg-gradient-to-r from-violet-600 to-blue-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      {/* Latest log */}
      {job.logs.length > 0 && (
        <p className="text-xs text-zinc-500 truncate">
          {job.logs[job.logs.length - 1]?.message}
        </p>
      )}

      {/* Output video */}
      {job.status === 'completed' && job.outputUrl && (
        <div className="mt-3">
          <video
            src={job.outputUrl}
            controls
            className="w-full rounded-lg"
            poster={job.thumbnailUrl}
          />
          <div className="flex gap-2 mt-2">
            <a
              href={job.outputUrl}
              download
              className="flex-1 text-center py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg font-medium transition-colors"
            >
              下载视频
            </a>
            <button className="flex items-center gap-1 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg transition-colors">
              <Play size={12} />
              预览
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {job.status === 'failed' && job.error && (
        <p className="text-xs text-red-400 mt-2">{job.error}</p>
      )}
    </div>
  )
}
