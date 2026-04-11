/**
 * KeyboardShortcutsPanel - 快捷键帮助面板
 * 显示所有可用的键盘快捷键
 */
'use client'

import { X } from 'lucide-react'
import {
  getShortcutLabel,
  GLOBAL_SHORTCUTS,
  TIMELINE_SHORTCUTS,
  NAVIGATION_SHORTCUTS,
} from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function KeyboardShortcutsPanel({ isOpen, onClose }: KeyboardShortcutsPanelProps) {
  if (!isOpen) return null

  const shortcutGroups = [
    {
      title: '全局快捷键',
      shortcuts: Object.values(GLOBAL_SHORTCUTS),
    },
    {
      title: '视图导航',
      shortcuts: Object.values(NAVIGATION_SHORTCUTS),
    },
    {
      title: '时间轴编辑',
      shortcuts: Object.values(TIMELINE_SHORTCUTS),
    },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">键盘快捷键</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-zinc-800 rounded-lg flex items-center justify-center transition"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-cyan-400 mb-4">{group.title}</h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition"
                  >
                    <span className="text-sm text-zinc-300">{shortcut.description}</span>
                    <kbd className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-zinc-100 bg-zinc-700 border border-zinc-600 rounded">
                      {getShortcutLabel(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Tip */}
        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4">
          <p className="text-xs text-zinc-500 text-center">
            提示：在输入框中使用 Esc 键可以快速退出
          </p>
        </div>
      </div>
    </div>
  )
}
