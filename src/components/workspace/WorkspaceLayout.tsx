/**
 * 三栏式工作区布局
 * 左侧：项目导航 | 中间：主内容区 | 右侧：控制面板
 */
'use client'

import { useState, ReactNode } from 'react'
import { WorkspaceState, ViewMode } from '@/types/workspace'
import { LayoutGrid, Film, Menu, Settings } from 'lucide-react'

interface WorkspaceLayoutProps {
  state: WorkspaceState
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  leftSidebar: ReactNode
  rightSidebar?: ReactNode
  header?: ReactNode
  children: ReactNode
  onPreview?: () => void
}

export function WorkspaceLayout({
  state,
  viewMode,
  onViewModeChange,
  leftSidebar,
  rightSidebar,
  header,
  children,
  onPreview,
}: WorkspaceLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-zinc-100">
      {/* 左侧边栏 */}
      <aside
        className={`
          border-r border-zinc-800 bg-zinc-950/50 transition-[width] duration-300
          ${leftCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          {!leftCollapsed && (
            <h2 className="text-sm font-semibold text-zinc-400">项目</h2>
          )}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="p-1.5 hover:bg-zinc-800 rounded transition"
            aria-label={leftCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
        <div className={leftCollapsed ? 'hidden' : 'block'}>
          {leftSidebar}
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 流程进度条 */}
        {header}

        {/* 顶部工具栏 */}
        {(state === 'timeline' || state === 'grid') && (
          <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
            {/* 视图切换 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewModeChange('timeline')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition
                  ${viewMode === 'timeline'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }
                `}
              >
                <Film className="w-4 h-4" />
                时间轴
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition
                  ${viewMode === 'grid'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }
                `}
              >
                <LayoutGrid className="w-4 h-4" />
                网格
              </button>
            </div>

            {/* 右侧操作 */}
            <div className="flex items-center gap-2">
              <button
                onClick={onPreview}
                disabled={!onPreview}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="预览视频"
              >
                预览
              </button>
              <button
                onClick={() => {
                  // 跳转到导出页面
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('workspace:export'))
                  }
                }}
                className="px-4 py-2 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-lg text-sm font-medium transition"
                data-tour="export-button"
              >
                导出视频
              </button>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* 右侧边栏 */}
      {rightSidebar && (
        <aside
          className={`
            border-l border-zinc-800 bg-zinc-950/50 transition-[width] duration-300
            ${rightCollapsed ? 'w-16' : 'w-80'}
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            {!rightCollapsed && (
              <h2 className="text-sm font-semibold text-zinc-400">设置</h2>
            )}
            <button
              onClick={() => setRightCollapsed(!rightCollapsed)}
              className="p-1.5 hover:bg-zinc-800 rounded transition"
              aria-label={rightCollapsed ? '展开控制面板' : '收起控制面板'}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <div className={rightCollapsed ? 'hidden' : 'block'}>
            {rightSidebar}
          </div>
        </aside>
      )}
    </div>
  )
}
