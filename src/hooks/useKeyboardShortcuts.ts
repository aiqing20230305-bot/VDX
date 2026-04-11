/**
 * useKeyboardShortcuts - 键盘快捷键管理 Hook
 * 提供全局快捷键注册、监听和优先级管理
 */
'use client'

import { useEffect, useCallback, useRef } from 'react'

// 修饰键类型
type ModifierKey = 'ctrl' | 'cmd' | 'shift' | 'alt'

// 快捷键基础配置（模板）
export interface ShortcutTemplate {
  key: string
  modifiers?: ModifierKey[] | readonly ModifierKey[]
  description: string
  preventDefault?: boolean
}

// 快捷键完整配置（包含处理函数）
export interface ShortcutConfig extends ShortcutTemplate {
  handler: (event: KeyboardEvent) => void
  enabled?: boolean
  priority?: number // 优先级，数字越大越优先
  disabled?: boolean // 禁用状态
}

// 快捷键分组
export interface ShortcutGroup {
  title: string
  shortcuts: ShortcutConfig[]
}

/**
 * 检查修饰键是否匹配
 */
function matchModifiers(
  event: KeyboardEvent,
  modifiers: ModifierKey[] | readonly ModifierKey[] = []
): boolean {
  const hasCtrl = modifiers.includes('ctrl')
  const hasCmd = modifiers.includes('cmd')
  const hasShift = modifiers.includes('shift')
  const hasAlt = modifiers.includes('alt')

  // Mac: Cmd = metaKey, Windows/Linux: Ctrl = ctrlKey
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const primaryModifier = isMac
    ? (hasCmd && event.metaKey) || (hasCtrl && event.ctrlKey)
    : (hasCtrl && event.ctrlKey) || (hasCmd && event.metaKey)

  return (
    primaryModifier === (hasCtrl || hasCmd) &&
    event.shiftKey === hasShift &&
    event.altKey === hasAlt
  )
}

/**
 * 生成快捷键显示文本
 */
export function getShortcutLabel(config: ShortcutTemplate | ShortcutConfig): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const modifiers = config.modifiers || []

  const parts: string[] = []

  if (modifiers.includes('ctrl') || modifiers.includes('cmd')) {
    parts.push(isMac ? '⌘' : 'Ctrl')
  }
  if (modifiers.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift')
  }
  if (modifiers.includes('alt')) {
    parts.push(isMac ? '⌥' : 'Alt')
  }

  // 特殊键显示
  const keyMap: Record<string, string> = {
    ' ': 'Space',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'Escape': 'Esc',
    'Delete': isMac ? '⌫' : 'Del',
    'Backspace': isMac ? '⌫' : 'Backspace',
  }

  parts.push(keyMap[config.key] || config.key.toUpperCase())

  return parts.join(isMac ? '' : '+')
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: {
    enabled?: boolean
    scope?: string // 作用域，用于调试
  } = {}
) {
  const { enabled = true, scope = 'global' } = options
  const shortcutsRef = useRef<ShortcutConfig[]>(shortcuts)

  // 更新 shortcuts ref
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // 忽略输入框中的快捷键（除了 Escape）
      const target = event.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInput && event.key !== 'Escape') {
        return
      }

      // 按优先级排序
      const sortedShortcuts = [...shortcutsRef.current].sort(
        (a, b) => (b.priority || 0) - (a.priority || 0)
      )

      // 查找匹配的快捷键
      for (const config of sortedShortcuts) {
        if (config.enabled === false) continue

        if (
          event.key.toLowerCase() === config.key.toLowerCase() &&
          matchModifiers(event, config.modifiers)
        ) {
          if (config.preventDefault !== false) {
            event.preventDefault()
            event.stopPropagation()
          }
          config.handler(event)
          break // 只执行第一个匹配的快捷键
        }
      }
    },
    [enabled]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])
}

/**
 * 生成快捷键显示文本（别名）
 */
export const formatShortcut = getShortcutLabel

/**
 * 预定义快捷键常量
 */
export const SHORTCUTS = {
  // 保存和退出
  SAVE: { key: 's', modifiers: ['cmd' as const], description: '保存项目' },
  ESCAPE: { key: 'Escape', description: '取消/关闭' },

  // 编辑操作
  UNDO: { key: 'z', modifiers: ['cmd' as const], description: '撤销' },
  REDO: { key: 'z', modifiers: ['cmd' as const, 'shift' as const], description: '重做' },
  SELECT_ALL: { key: 'a', modifiers: ['cmd' as const], description: '全选' },
  DUPLICATE: { key: 'd', modifiers: ['cmd' as const], description: '复制' },
  DELETE: { key: 'Delete', description: '删除' },
  BACKSPACE: { key: 'Backspace', description: '删除（备用）' },

  // 视图切换
  TOGGLE_TIMELINE: { key: '1', modifiers: ['cmd' as const], description: '时间轴视图' },
  TOGGLE_GRID: { key: '2', modifiers: ['cmd' as const], description: '网格视图' },

  // 播放控制
  PLAY_PAUSE: { key: ' ', description: '播放/暂停' },

  // 导航
  VIEW_WELCOME: { key: '1', modifiers: ['cmd' as const], description: '欢迎页' },
  VIEW_CHAT: { key: '2', modifiers: ['cmd' as const], description: '对话生成' },
  VIEW_TIMELINE: { key: '3', modifiers: ['cmd' as const], description: '时间轴' },
  VIEW_GRID: { key: '4', modifiers: ['cmd' as const], description: '网格视图' },
  VIEW_EXPORT: { key: '5', modifiers: ['cmd' as const], description: '导出' },

  // 其他
  HELP: { key: '?', modifiers: ['shift' as const], description: '快捷键帮助' },
  SEARCH: { key: 'k', modifiers: ['cmd' as const], description: '搜索' },
  NEW_PROJECT: { key: 'n', modifiers: ['cmd' as const], description: '新建项目' },
  HISTORY: { key: 'h', modifiers: ['cmd' as const], description: '历史记录' },
  SETTINGS: { key: ',', modifiers: ['cmd' as const], description: '设置' },
} as const

/**
 * 快捷键分组（用于帮助面板）
 */
export const GLOBAL_SHORTCUTS = {
  SEARCH: SHORTCUTS.SEARCH,
  NEW_PROJECT: SHORTCUTS.NEW_PROJECT,
  HELP: SHORTCUTS.HELP,
  ESCAPE: SHORTCUTS.ESCAPE,
  HISTORY: SHORTCUTS.HISTORY,
  SETTINGS: SHORTCUTS.SETTINGS,
}

export const TIMELINE_SHORTCUTS = {
  PLAY_PAUSE: SHORTCUTS.PLAY_PAUSE,
  PREV_FRAME: { key: 'ArrowLeft', description: '上一帧' },
  NEXT_FRAME: { key: 'ArrowRight', description: '下一帧' },
  DUPLICATE: SHORTCUTS.DUPLICATE,
  DELETE: SHORTCUTS.DELETE,
  UNDO: SHORTCUTS.UNDO,
  REDO: SHORTCUTS.REDO,
}

export const NAVIGATION_SHORTCUTS = {
  VIEW_WELCOME: SHORTCUTS.VIEW_WELCOME,
  VIEW_CHAT: SHORTCUTS.VIEW_CHAT,
  VIEW_TIMELINE: SHORTCUTS.VIEW_TIMELINE,
  VIEW_GRID: SHORTCUTS.VIEW_GRID,
  VIEW_EXPORT: SHORTCUTS.VIEW_EXPORT,
}
