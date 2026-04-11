'use client'

/**
 * 工作流进度指示器
 * 显示视频生成流程的当前步骤
 */
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface WorkflowStep {
  id: string
  label: string
  description?: string
}

interface WorkflowProgressProps {
  steps?: WorkflowStep[]
  currentStep: number
  className?: string
  /** 紧凑模式 - 适合固定显示 */
  compact?: boolean
  /** 固定在顶部 */
  fixed?: boolean
}

const DEFAULT_STEPS: WorkflowStep[] = [
  { id: 'input', label: '选题/图片', description: '输入创意或上传图片' },
  { id: 'script', label: '脚本生成', description: 'AI 生成视频脚本' },
  { id: 'storyboard', label: '分镜生成', description: '生成视觉分镜图' },
  { id: 'video', label: '视频合成', description: '渲染最终视频' },
]

export function WorkflowProgress({
  steps = DEFAULT_STEPS,
  currentStep = 0,
  className,
  compact = false,
  fixed = false
}: WorkflowProgressProps) {
  return (
    <div className={cn(
      'flex items-center gap-2',
      'bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]',
      // 紧凑模式 vs 常规模式
      compact ? 'px-3 py-2' : 'px-4 py-3',
      // 固定定位
      fixed && [
        'sticky top-0 z-10',
        // 增强背景（防止内容穿透）
        'backdrop-blur-sm bg-[var(--bg-secondary)]/95',
        'shadow-sm'
      ],
      className
    )}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isPending = index > currentStep

        return (
          <div key={step.id} className="flex items-center gap-2">
            {/* 步骤圆点 */}
            <div
              className={cn(
                'relative rounded-full flex items-center justify-center font-bold transition-all duration-300',
                // 紧凑模式尺寸
                compact ? 'w-6 h-6 text-xs' : 'w-7 h-7 text-xs',
                isCompleted && 'bg-[var(--accent-primary)] text-white',
                isCurrent && [
                  'bg-[var(--accent-primary)] text-white',
                  compact ? 'ring-2 ring-[var(--accent-subtle)]' : 'ring-4 ring-[var(--accent-subtle)]'
                ],
                isPending && 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-2 border-[var(--border-subtle)]'
              )}
              title={step.description}
            >
              {isCompleted ? (
                <Check size={compact ? 12 : 14} strokeWidth={3} />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>

            {/* 步骤标签 */}
            <span
              className={cn(
                'font-medium transition-colors duration-200',
                // 紧凑模式字体
                compact ? 'text-xs' : 'text-sm',
                (isCurrent || isCompleted) ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              )}
              title={step.description}
            >
              {step.label}
            </span>

            {/* 连接线 */}
            {index < steps.length - 1 && (
              <div className={cn(
                'relative h-0.5 mx-1',
                // 紧凑模式连接线
                compact ? 'w-6' : 'w-8'
              )}>
                {/* 背景线 */}
                <div className="absolute inset-0 bg-[var(--border-subtle)]" />
                {/* 进度线 */}
                {isCompleted && (
                  <div className="absolute inset-0 bg-[var(--accent-primary)] transition-all duration-500" />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
