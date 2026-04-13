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
      className="flex flex-wrap gap-3 mt-1" // gap-2 → gap-3 (触摸友好)
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05, // Faster: 0.08s → 0.05s
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
          transition={{ duration: 0.15, ease: 'easeOut' }} // Faster: 0.3s → 0.15s
          onClick={() => onAction?.(action.action, action.params)}
          title={action.description}
          className={cn(
            'group relative flex items-center gap-2', // 新增：支持图标和tooltip
            'px-5 py-3', // px-3 py-1.5 → px-5 py-3 (增大点击区域)
            'min-h-[44px]', // 新增：确保触摸友好 (WCAG 2.1 AA)
            'rounded-lg font-semibold text-base', // Updated: rounded-xl→lg, font-medium→semibold, text-sm→base (16px)
            'transition-all duration-[150ms] ease-out', // Updated: 200ms→150ms (--transition-short)
            'active:scale-[0.98]',
            'cursor-pointer',
            // Primary 样式（Task #268: Cyan gradient + hover transform）
            action.variant === 'primary' && [
              'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white',
              'shadow-[0_1px_2px_rgba(6,182,212,0.3)]',
              'hover:shadow-[0_4px_8px_rgba(6,182,212,0.4)]',
              'hover:-translate-y-[1px]', // Lift effect on hover
            ],
            // Secondary 样式
            action.variant === 'secondary' && [
              'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
              'border border-[var(--border-medium)]',
              'hover:border-[var(--accent-border)]',
              'hover:bg-[rgba(6,182,212,0.08)]',
            ],
            // Outline 样式
            (!action.variant || action.variant === 'outline') && [
              'bg-transparent text-[var(--text-secondary)]',
              'border border-[var(--border-subtle)]',
              'hover:border-[var(--accent-border)]',
              'hover:text-[var(--accent-primary)]',
            ]
          )}
        >
          <span className="relative z-10">{action.label}</span>

          {/* Description tooltip（新增）*/}
          {action.description && (
            <div className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
              'px-3 py-2 rounded-lg',
              'bg-[var(--bg-elevated)] border border-[var(--border-medium)]',
              'text-xs text-[var(--text-secondary)] whitespace-nowrap',
              'opacity-0 group-hover:opacity-100',
              'pointer-events-none transition-opacity duration-200',
              'shadow-lg z-20'
            )}>
              {action.description}
            </div>
          )}
        </motion.button>
      ))}
    </motion.div>
  )
}
