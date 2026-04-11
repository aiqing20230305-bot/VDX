/**
 * MobileNavBar - 移动端底部导航栏
 * 单手可操作的底部导航
 */
'use client'

import { Home, MessageSquare, Film, Grid3x3, Download } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { WorkspaceState } from '@/types/workspace'

interface MobileNavBarProps {
  currentState: WorkspaceState
  onNavigate: (state: WorkspaceState) => void
  className?: string
}

const NAV_ITEMS = [
  {
    id: 'welcome' as WorkspaceState,
    icon: Home,
    label: '首页',
  },
  {
    id: 'chat' as WorkspaceState,
    icon: MessageSquare,
    label: '对话',
  },
  {
    id: 'timeline' as WorkspaceState,
    icon: Film,
    label: '时间轴',
  },
  {
    id: 'grid' as WorkspaceState,
    icon: Grid3x3,
    label: '网格',
  },
  {
    id: 'export' as WorkspaceState,
    icon: Download,
    label: '导出',
  },
]

export function MobileNavBar({ currentState, onNavigate, className }: MobileNavBarProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800',
        'pb-safe', // iOS Safe Area底部间距
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = currentState === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center justify-center',
                'min-w-[56px] min-h-[56px]', // 触摸目标
                'rounded-lg transition-all',
                'active:scale-95',
                isActive
                  ? 'text-cyan-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                'w-6 h-6 mb-1',
                isActive && 'drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
              )} />
              <span className={cn(
                'text-xs font-medium',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
