/**
 * 任务进度条组件
 * 显示异步任务的实时进度
 */
'use client'

import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { TaskProgress, TaskStatus } from '@/lib/queue/queue-manager'

interface TaskProgressBarProps {
  status: TaskStatus | null
  progress: TaskProgress | null
  error: string | null
  className?: string
}

export function TaskProgressBar({
  status,
  progress,
  error,
  className = '',
}: TaskProgressBarProps) {
  if (!status) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 状态标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'active' && (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          )}
          {status === 'failed' && (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-sm font-medium text-zinc-200">
            {getStatusLabel(status)}
          </span>
        </div>
        {progress && (
          <span className="text-xs text-zinc-500">
            {Math.round(progress.progress)}%
          </span>
        )}
      </div>

      {/* 进度条 */}
      {status !== 'completed' && status !== 'failed' && (
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress?.progress ?? 0}%` }}
          />
        </div>
      )}

      {/* 当前阶段信息 */}
      {progress?.message && (
        <p className="text-xs text-zinc-400">{progress.message}</p>
      )}

      {/* 步骤进度 */}
      {progress?.currentStep !== undefined && progress?.totalSteps && (
        <p className="text-xs text-zinc-500">
          {progress.currentStep} / {progress.totalSteps}
        </p>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}

function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'waiting':
      return '等待中'
    case 'active':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'delayed':
      return '延迟中'
    default:
      return '未知状态'
  }
}
