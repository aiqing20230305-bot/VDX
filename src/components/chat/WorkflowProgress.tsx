/**
 * WorkflowProgress - 工作流进度指示器
 * 展示视频生产流程的高层步骤和状态
 */
'use client'

import { Check, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type WorkflowStep = 'topic' | 'script' | 'storyboard' | 'video'
export type StepStatus = 'completed' | 'in-progress' | 'pending' | 'error'

interface StepConfig {
  id: WorkflowStep
  label: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  { id: 'topic', label: '选题', icon: '💡' },
  { id: 'script', label: '脚本', icon: '📝' },
  { id: 'storyboard', label: '分镜', icon: '🎬' },
  { id: 'video', label: '视频', icon: '🎥' },
]

interface Props {
  currentStep: WorkflowStep
  stepStatuses: Record<WorkflowStep, StepStatus>
  className?: string
  /** 紧凑模式 - 适合固定显示 */
  compact?: boolean
  /** 固定在顶部 */
  fixed?: boolean
}

export function WorkflowProgress({
  currentStep,
  stepStatuses,
  className,
  compact = false,
  fixed = false
}: Props) {
  return (
    <div className={cn(
      'flex items-center justify-between w-full',
      // 紧凑模式
      compact && 'py-2',
      // 固定定位
      fixed && [
        'sticky top-0 z-10',
        'bg-[var(--bg-primary)]/95 backdrop-blur-sm',
        'border-b border-[var(--border-subtle)]',
        'px-4 py-3',
        'shadow-sm'
      ],
      className
    )}>
      {STEPS.map((step, index) => {
        const status = stepStatuses[step.id]
        const isActive = step.id === currentStep
        const isCompleted = status === 'completed'
        const isError = status === 'error'
        const isPending = status === 'pending'

        return (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Node */}
            <div className={cn(
              'flex flex-col items-center flex-shrink-0',
              compact ? 'gap-1' : 'gap-2'
            )}>
              {/* Icon Circle */}
              <div
                className={cn(
                  'relative rounded-full flex items-center justify-center transition-all duration-[150ms]',
                  // 紧凑模式尺寸
                  compact ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base',
                  isCompleted && 'bg-[var(--accent-primary)] text-white',
                  isActive && !isCompleted && 'bg-[var(--bg-tertiary)] border-2 border-[var(--accent-primary)] text-[var(--accent-primary)]',
                  isPending && 'bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-[var(--text-tertiary)]',
                  isError && 'bg-[var(--error)] text-white'
                )}
              >
                {isCompleted && <Check size={compact ? 14 : 16} className="text-white" />}
                {isActive && !isCompleted && !isError && <Loader2 size={compact ? 14 : 16} className="animate-spin" />}
                {isPending && <Circle size={compact ? 10 : 12} className="text-[var(--text-tertiary)]" />}
                {isError && <AlertCircle size={compact ? 14 : 16} />}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'font-medium transition-colors duration-[150ms]',
                  // 紧凑模式字体
                  compact ? 'text-[10px]' : 'text-xs',
                  isActive && 'text-[var(--accent-primary)]',
                  isCompleted && 'text-[var(--text-secondary)]',
                  isPending && 'text-[var(--text-tertiary)]',
                  isError && 'text-[var(--error)]'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < STEPS.length - 1 && (
              <div className={cn(
                'flex-1 h-[2px] bg-[var(--border-subtle)] relative',
                compact ? 'mx-1' : 'mx-2'
              )}>
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 bg-[var(--accent-primary)] transition-all duration-[250ms]',
                    isCompleted ? 'w-full' : 'w-0'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
