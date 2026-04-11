/**
 * Export History - 导出历史记录管理
 */
import type { ExportConfig } from '@/types/workspace'
import { logger } from '@/lib/utils/logger'

export interface ExportHistoryItem {
  id: string
  timestamp: number
  config: ExportConfig
  videoUrl?: string
  fileSize?: number  // 实际文件大小（MB）
  duration: number   // 视频时长（秒）
  status: 'completed' | 'failed'
}

const STORAGE_KEY = 'export-history'
const MAX_HISTORY_ITEMS = 20

/**
 * 获取导出历史
 */
export function getExportHistory(): ExportHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    const history: ExportHistoryItem[] = JSON.parse(data)
    // 按时间倒序
    return history.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    logger.error('Failed to load export history:', error)
    return []
  }
}

/**
 * 添加导出记录
 */
export function addExportHistory(item: Omit<ExportHistoryItem, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return

  try {
    const history = getExportHistory()

    const newItem: ExportHistoryItem = {
      ...item,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    // 添加到开头
    history.unshift(newItem)

    // 保持最多 MAX_HISTORY_ITEMS 条记录
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory))
  } catch (error) {
    logger.error('Failed to save export history:', error)
  }
}

/**
 * 删除导出记录
 */
export function deleteExportHistory(id: string) {
  if (typeof window === 'undefined') return

  try {
    const history = getExportHistory()
    const filtered = history.filter(item => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    logger.error('Failed to delete export history:', error)
  }
}

/**
 * 清空导出历史
 */
export function clearExportHistory() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    logger.error('Failed to clear export history:', error)
  }
}

/**
 * 获取最近一次导出配置
 */
export function getLastExportConfig(): ExportConfig | null {
  const history = getExportHistory()
  const lastCompleted = history.find(item => item.status === 'completed')
  return lastCompleted?.config || null
}

/**
 * 格式化时间
 */
export function formatExportTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
