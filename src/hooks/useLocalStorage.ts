/**
 * useLocalStorage - 通用 localStorage 持久化 hook
 * 支持自动序列化/反序列化、类型安全、自动同步
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'

const log = logger.context('LocalStorage')

/**
 * localStorage hook with automatic serialization
 * @param key - localStorage key
 * @param initialValue - initial value if key doesn't exist
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // 状态初始化
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      log.error('Error loading localStorage key', error, { key })
      return initialValue
    }
  })

  // 保存值到 localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // 支持函数式更新
        const valueToStore = value instanceof Function ? value(storedValue) : value

        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))

          // 触发自定义事件，通知其他组件
          window.dispatchEvent(
            new CustomEvent('local-storage-change', {
              detail: { key, value: valueToStore },
            })
          )
        }
      } catch (error) {
        log.error('Error saving localStorage key', error, { key })
      }
    },
    [key, storedValue]
  )

  // 删除值
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        window.dispatchEvent(
          new CustomEvent('local-storage-change', {
            detail: { key, value: null },
          })
        )
      }
    } catch (error) {
      log.error('Error removing localStorage key', error, { key })
    }
  }, [key, initialValue])

  // 监听其他 tab 的变化
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          log.error('Error parsing localStorage value', error, { key })
        }
      }
    }

    // 监听自定义事件（同一 tab 内的变化）
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.key === key) {
        setStoredValue(customEvent.detail.value ?? initialValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-storage-change', handleCustomChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage-change', handleCustomChange)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * 获取 localStorage 使用情况
 */
export function getLocalStorageSize(): { used: number; available: number; percentage: number } {
  if (typeof window === 'undefined') {
    return { used: 0, available: 5 * 1024 * 1024, percentage: 0 }
  }

  let total = 0
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length
    }
  }

  const used = total * 2 // UTF-16 编码，每个字符 2 字节
  const available = 5 * 1024 * 1024 // 大多数浏览器限制 5MB
  const percentage = (used / available) * 100

  return { used, available, percentage }
}

/**
 * 清理旧数据（保留最近 N 个项目）
 */
export function cleanupOldProjects(key: string, keepCount: number = 10) {
  if (typeof window === 'undefined') return

  try {
    const item = window.localStorage.getItem(key)
    if (!item) return

    const projects = JSON.parse(item) as Array<{ id: string; updatedAt: string }>

    // 按更新时间排序
    const sorted = projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    // 只保留最近的项目
    const kept = sorted.slice(0, keepCount)
    window.localStorage.setItem(key, JSON.stringify(kept))

    log.info('Cleaned up old projects', { key, before: projects.length, after: kept.length })
  } catch (error) {
    log.error('Error cleaning up old projects', error, { key })
  }
}
