/**
 * 项目版本历史管理
 * 支持操作回退和版本快照
 */
import type { Frame } from '@/types/workspace'
import { logger } from '../utils/logger'

const log = logger.context('VersionHistory')

const MAX_HISTORY_SIZE = 10 // 最多保留10个历史版本
const HISTORY_KEY_PREFIX = 'project_history_'

export interface ProjectSnapshot {
  id: string
  timestamp: number
  operation: string // 操作描述
  operationType: 'delete' | 'reorder' | 'batch_delete' | 'add' | 'update' | 'manual'
  frames: Frame[] // 快照的帧数据
  frameCount: number // 帧数（用于快速对比）
}

export interface VersionHistory {
  projectId: string
  snapshots: ProjectSnapshot[]
  currentSnapshotId: string | null
}

/**
 * 获取项目的版本历史
 */
export function getVersionHistory(projectId: string): VersionHistory {
  if (typeof window === 'undefined') {
    return { projectId, snapshots: [], currentSnapshotId: null }
  }

  try {
    const key = `${HISTORY_KEY_PREFIX}${projectId}`
    const data = localStorage.getItem(key)
    if (!data) {
      return { projectId, snapshots: [], currentSnapshotId: null }
    }

    const history: VersionHistory = JSON.parse(data)
    return history
  } catch (error) {
    log.error('Failed to load version history', error, { projectId })
    return { projectId, snapshots: [], currentSnapshotId: null }
  }
}

/**
 * 保存快照
 */
export function saveSnapshot(
  projectId: string,
  frames: Frame[],
  operation: string,
  operationType: ProjectSnapshot['operationType']
): ProjectSnapshot {
  const history = getVersionHistory(projectId)

  const snapshot: ProjectSnapshot = {
    id: `snapshot_${Date.now()}`,
    timestamp: Date.now(),
    operation,
    operationType,
    frames: JSON.parse(JSON.stringify(frames)), // 深拷贝
    frameCount: frames.length,
  }

  // 添加新快照
  history.snapshots.push(snapshot)

  // 如果超过最大数量，删除最旧的快照
  if (history.snapshots.length > MAX_HISTORY_SIZE) {
    history.snapshots = history.snapshots.slice(-MAX_HISTORY_SIZE)
  }

  // 保存到 localStorage
  try {
    const key = `${HISTORY_KEY_PREFIX}${projectId}`
    localStorage.setItem(key, JSON.stringify(history))
    log.info('Snapshot saved', { projectId, operation, frameCount: snapshot.frameCount })
  } catch (error) {
    log.error('Failed to save snapshot', error, { projectId, operation })
  }

  return snapshot
}

/**
 * 恢复到指定快照
 */
export function restoreSnapshot(
  projectId: string,
  snapshotId: string
): Frame[] | null {
  const history = getVersionHistory(projectId)
  const snapshot = history.snapshots.find(s => s.id === snapshotId)

  if (!snapshot) {
    log.error('Snapshot not found', new Error('Snapshot not found'), { projectId, snapshotId })
    return null
  }

  // 更新当前快照ID
  history.currentSnapshotId = snapshotId

  // 保存更新后的历史
  try {
    const key = `${HISTORY_KEY_PREFIX}${projectId}`
    localStorage.setItem(key, JSON.stringify(history))
    log.info('Restored to snapshot', { projectId, snapshotId, operation: snapshot.operation })
  } catch (error) {
    log.error('Failed to update history', error, { projectId, snapshotId })
  }

  // 返回快照的帧数据（深拷贝）
  return JSON.parse(JSON.stringify(snapshot.frames))
}

/**
 * 删除项目的所有历史版本
 */
export function clearHistory(projectId: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = `${HISTORY_KEY_PREFIX}${projectId}`
    localStorage.removeItem(key)
    log.info('History cleared', { projectId })
  } catch (error) {
    log.error('Failed to clear history', error, { projectId })
  }
}

/**
 * 获取所有快照的总大小（字节）
 */
export function getHistorySize(projectId: string): number {
  const history = getVersionHistory(projectId)
  const json = JSON.stringify(history)
  return new Blob([json]).size
}

/**
 * 获取快照对比信息
 */
export function compareSnapshots(
  snapshot1: ProjectSnapshot,
  snapshot2: ProjectSnapshot
): {
  frameDiff: number // 帧数差异
  addedFrames: number // 新增帧数
  removedFrames: number // 删除帧数
  modifiedFrames: number // 修改帧数
} {
  const frames1 = snapshot1.frames
  const frames2 = snapshot2.frames

  const frameDiff = frames2.length - frames1.length

  // 统计增删改
  const ids1 = new Set(frames1.map(f => f.id))
  const ids2 = new Set(frames2.map(f => f.id))

  const removedFrames = frames1.filter(f => !ids2.has(f.id)).length
  const addedFrames = frames2.filter(f => !ids1.has(f.id)).length

  // 修改帧数 = 存在于两个快照中但内容不同的帧
  const modifiedFrames = frames2.filter(f2 => {
    if (!ids1.has(f2.id)) return false
    const f1 = frames1.find(f => f.id === f2.id)
    return f1 && JSON.stringify(f1) !== JSON.stringify(f2)
  }).length

  return {
    frameDiff,
    addedFrames,
    removedFrames,
    modifiedFrames,
  }
}

/**
 * 格式化时间戳为相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  // 超过7天显示具体日期
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
