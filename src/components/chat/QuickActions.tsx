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
            'px-3 py-1.5 rounded-xl text-sm font-medium transition-smooth cursor-pointer',
            'hover:scale-105 active:scale-95',
            action.variant === 'primary' && 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]',
            action.variant === 'secondary' && 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
            (!action.variant || action.variant === 'outline') &&
              'border border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-[var(--accent-border)] hover:text-[var(--accent-primary)] bg-transparent'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
