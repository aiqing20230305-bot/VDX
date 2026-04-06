'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type WorkflowStage =
  | 'start'
  | 'topic'
  | 'script'
  | 'storyboard'
  | 'character'
  | 'video'
  | 'complete'

interface WorkflowStepperProps {
  currentStage: WorkflowStage
  className?: string
}

const STAGES: Array<{ key: WorkflowStage; label: string; shortLabel: string }> = [
  { key: 'start', label: '选题/上传', shortLabel: '选题' },
  { key: 'script', label: '生成脚本', shortLabel: '脚本' },
  { key: 'storyboard', label: '生成分镜', shortLabel: '分镜' },
  { key: 'character', label: '角色设置', shortLabel: '角色' },
  { key: 'video', label: '生成视频', shortLabel: '视频' },
  { key: 'complete', label: '完成', shortLabel: '完成' },
]

export function WorkflowStepper({ currentStage, className }: WorkflowStepperProps) {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage)

  return (
    <div
      className={cn(
        'sticky top-0 z-40 border-b border-white/8 bg-zinc-950 px-6 py-3',
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
        {STAGES.map((stage, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isUpcoming = index > currentIndex

          return (
            <div key={stage.key} className="flex flex-1 items-center">
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    isCompleted &&
                      'bg-cyan-400 text-zinc-950',
                    isActive &&
                      'bg-cyan-400 text-zinc-950 ring-4 ring-cyan-400/20',
                    isUpcoming &&
                      'border-2 border-white/12 bg-zinc-900 text-zinc-500'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label (hide on mobile for middle stages) */}
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive && 'text-cyan-400',
                    isCompleted && 'text-zinc-100',
                    isUpcoming && 'text-zinc-500',
                    'hidden md:inline',
                    (index === 0 || index === STAGES.length - 1) && 'inline'
                  )}
                >
                  <span className="hidden md:inline">{stage.label}</span>
                  <span className="inline md:hidden">{stage.shortLabel}</span>
                </span>
              </div>

              {/* Connector line (skip last item) */}
              {index < STAGES.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 flex-1 transition-colors',
                    index < currentIndex ? 'bg-cyan-400' : 'bg-white/8'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
