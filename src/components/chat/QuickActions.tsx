'use client'

import type { QuickAction } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  actions: QuickAction[]
  onAction?: (action: string, params?: Record<string, unknown>) => void
}

export function QuickActions({ actions, onAction }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction?.(action.action, action.params)}
          title={action.description}
          className={cn(
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
            'hover:scale-105 active:scale-95',
            action.variant === 'primary' && 'bg-violet-600 text-white hover:bg-violet-500',
            action.variant === 'secondary' && 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
            (!action.variant || action.variant === 'outline') &&
              'border border-zinc-600 text-zinc-300 hover:border-violet-500 hover:text-violet-300 bg-transparent'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
