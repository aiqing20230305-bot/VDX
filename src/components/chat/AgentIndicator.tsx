/**
 * AgentIndicator - 当前工作Agent指示器
 * 显示哪个Agent正在工作，以及工作流阶段
 */
'use client'

import { cn } from '@/lib/utils/cn'
import type { WorkflowStage } from '@/lib/ai/agents'

interface AgentInfo {
  id: 'content-director' | 'technical-executor'
  name: string
  avatar: string
  description: string
}

interface AgentIndicatorProps {
  currentAgent: AgentInfo | null
  stage: WorkflowStage
  className?: string
  animated?: boolean
}

const STAGE_DESCRIPTIONS: Record<WorkflowStage, string> = {
  understanding: '理解你的需求',
  creative_planning: '规划创意方案',
  technical_planning: '设计技术方案',
  execution: '生成视频中',
  review: '审查优化中',
  completed: '完成',
}

const STAGE_COLORS: Record<WorkflowStage, string> = {
  understanding: 'from-blue-500/20 to-cyan-500/20',
  creative_planning: 'from-purple-500/20 to-pink-500/20',
  technical_planning: 'from-orange-500/20 to-amber-500/20',
  execution: 'from-green-500/20 to-emerald-500/20',
  review: 'from-indigo-500/20 to-violet-500/20',
  completed: 'from-green-600/20 to-teal-600/20',
}

export function AgentIndicator({
  currentAgent,
  stage,
  className,
  animated = true,
}: AgentIndicatorProps) {
  if (!currentAgent) return null

  const isWorking = stage !== 'completed'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 px-4 py-2',
        'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-full',
        'text-sm',
        // 渐变背景（根据阶段变化）
        'bg-gradient-to-r',
        STAGE_COLORS[stage],
        // 入场动画
        animated && 'animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
    >
      {/* Agent头像 */}
      <span
        className={cn(
          'text-xl',
          // 脉冲动画（工作中）
          isWorking && animated && 'animate-pulse'
        )}
        aria-label={currentAgent.name}
      >
        {currentAgent.avatar}
      </span>

      {/* Agent信息 */}
      <div className="flex flex-col gap-0.5">
        <span className="font-medium text-[var(--text-primary)]">
          {currentAgent.name}
        </span>
        <span
          className={cn(
            'text-xs text-[var(--text-tertiary)]',
            isWorking && 'flex items-center gap-1.5'
          )}
        >
          {STAGE_DESCRIPTIONS[stage]}
          {/* 工作中指示器 */}
          {isWorking && animated && (
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
