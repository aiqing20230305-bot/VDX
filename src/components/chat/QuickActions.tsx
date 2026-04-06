'use client'

import { motion } from 'framer-motion'
import type { QuickAction } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  actions: QuickAction[]
  onAction?: (action: string, params?: Record<string, unknown>) => void
}

export function QuickActions({ actions, onAction }: Props) {
  return (
    <motion.div
      className="flex flex-wrap gap-2 mt-1"
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          variants={{
            hidden: { opacity: 0, y: 10, scale: 0.95 },
            visible: { opacity: 1, y: 0, scale: 1 },
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
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
        </motion.button>
      ))}
    </motion.div>
  )
}
