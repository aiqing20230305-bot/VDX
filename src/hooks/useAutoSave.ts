/**
 * useAutoSave - 自动保存 hook
 * 防抖保存，避免频繁写入
 */
'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface UseAutoSaveOptions<T> {
  data: T
  onSave: (data: T) => void
  delay?: number // 防抖延迟（毫秒）
  enabled?: boolean // 是否启用自动保存
}

/**
 * 自动保存 hook with debounce
 * @param options - 配置选项
 */
export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const savedDataRef = useRef<string>(JSON.stringify(data))
  const saveCountRef = useRef(0)

  // 立即保存（不防抖）
  const saveImmediately = useCallback(() => {
    if (!enabled) return

    const currentData = JSON.stringify(data)
    if (currentData === savedDataRef.current) {
      // 数据未变化，跳过
      return
    }

    onSave(data)
    savedDataRef.current = currentData
    saveCountRef.current += 1

    // Auto-saved successfully
  }, [data, onSave, enabled])

  // 自动保存（防抖）
  useEffect(() => {
    if (!enabled) return

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 检查数据是否变化
    const currentData = JSON.stringify(data)
    if (currentData === savedDataRef.current) {
      // 数据未变化，不触发保存
      return
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      onSave(data)
      savedDataRef.current = currentData
      saveCountRef.current += 1
      // Auto-saved
    }, delay)

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, delay, enabled])

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // 卸载时立即保存最新数据
      const currentData = JSON.stringify(data)
      if (currentData !== savedDataRef.current && enabled) {
        onSave(data)
        // Saved on unmount
      }
    }
  }, [data, onSave, enabled])

  return {
    saveImmediately,
    saveCount: saveCountRef.current,
  }
}

/**
 * 保存状态指示器 hook
 */
export function useSaveIndicator(delay: number = 2000) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const markSaving = useCallback(() => {
    setStatus('saving')

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setStatus('saved')
    }, delay)
  }, [delay])

  const markUnsaved = useCallback(() => {
    setStatus('unsaved')
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    status,
    markSaving,
    markUnsaved,
  }
}
