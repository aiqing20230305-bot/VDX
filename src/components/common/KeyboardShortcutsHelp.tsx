/**
 * KeyboardShortcutsHelp - 键盘快捷键帮助面板
 * 显示所有可用的快捷键列表
 */
'use client'

import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { useKeyboardShortcuts, formatShortcut, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  onClose: () => void
}

export function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  // Escape 关闭帮助
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.ESCAPE,
      handler: onClose,
    },
  ])

  const shortcutGroups = [
    {
      title: '通用操作',
      shortcuts: [
        { config: SHORTCUTS.SAVE, description: '保存项目' },
        { config: SHORTCUTS.UNDO, description: '撤销上一步操作' },
        { config: SHORTCUTS.REDO, description: '重做上一步操作' },
        { config: SHORTCUTS.ESCAPE, description: '取消选择 / 返回上一级' },
      ],
    },
    {
      title: '编辑操作',
      shortcuts: [
        { config: SHORTCUTS.SELECT_ALL, description: '全选所有场景' },
        { config: SHORTCUTS.DUPLICATE, description: '复制选中的场景' },
        { config: SHORTCUTS.DELETE, description: '删除选中的场景' },
        { config: SHORTCUTS.BACKSPACE, description: '删除选中的场景（备用）' },
      ],
    },
    {
      title: '视图切换',
      shortcuts: [
        { config: SHORTCUTS.TOGGLE_TIMELINE, description: '切换到时间轴视图' },
        { config: SHORTCUTS.TOGGLE_GRID, description: '切换到网格视图' },
      ],
    },
    {
      title: '播放控制',
      shortcuts: [
        { config: SHORTCUTS.PLAY_PAUSE, description: '播放/暂停预览' },
      ],
    },
    {
      title: '帮助',
      shortcuts: [
        { config: SHORTCUTS.HELP, description: '显示快捷键帮助' },
      ],
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100">键盘快捷键</h2>
              <p className="text-sm text-zinc-500">提升你的工作效率</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 hover:bg-zinc-800 rounded-lg flex items-center justify-center transition"
            aria-label="关闭快捷键帮助"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-8">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition"
                    >
                      <span className="text-sm text-zinc-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-300 min-w-[80px] text-center">
                        {formatShortcut(shortcut.config)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
          <p className="text-xs text-zinc-500 text-center">
            按 <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] mx-1">Esc</kbd> 关闭此窗口
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 快捷键帮助按钮 - 浮动在右下角
 */
export function KeyboardShortcutsButton() {
  const [showHelp, setShowHelp] = useState(false)

  // Shift + ? 显示帮助
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.HELP,
      handler: () => setShowHelp(true),
    },
  ])

  return (
    <>
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-full flex items-center justify-center transition shadow-lg z-40 group"
        title="键盘快捷键 (Shift + ?)"
      >
        <Keyboard className="w-5 h-5 text-zinc-400 group-hover:text-cyan-400 transition" />
      </button>

      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}
    </>
  )
}
