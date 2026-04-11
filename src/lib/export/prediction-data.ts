/**
 * 导出预估数据收集和管理
 * 用于训练 ML 模型提升预估精度
 */
import { logger } from '@/lib/utils/logger'

export interface ExportFeatures {
  // 基础特征
  frameCount: number
  resolution: '720p' | '1080p' | '2k' | '4k'
  fps: number
  videoDuration: number // 秒

  // 场景复杂度
  sceneComplexity: number // 0-1，基于动态元素数量
  transitionCount: number
  transitionTypes: string[] // ['fade', 'slide', 'zoom', ...]

  // 内容特征
  hasAudio: boolean
  hasSubtitles: boolean
  hasWatermark: boolean
  subtitleTrackCount: number

  // 导出配置
  format: 'mp4' | 'webm' | 'mov'
  quality: number // 0-100
}

export interface ExportActuals {
  renderTime: number // 秒
  fileSize: number // 字节
  timestamp: number // Unix timestamp
}

export interface ExportRecord {
  id: string
  features: ExportFeatures
  actuals: ExportActuals
}

const STORAGE_KEY = 'super-video-export-records'
const MAX_RECORDS = 100 // 保留最近 100 条记录

/**
 * 计算场景复杂度
 * 基于帧的动态元素（相机移动、特效等）
 */
export function calculateSceneComplexity(frames: any[]): number {
  if (!frames || frames.length === 0) return 0

  let complexityScore = 0

  frames.forEach(frame => {
    // 有相机移动 +1
    if (frame.cameraMove && frame.cameraMove !== 'static') {
      complexityScore += 1
    }

    // 时长越短，复杂度越高（需要更多处理）
    if (frame.duration < 3) {
      complexityScore += 0.5
    }
  })

  // 归一化到 0-1
  const maxScore = frames.length * 1.5
  return Math.min(complexityScore / maxScore, 1)
}

/**
 * 提取转场类型统计
 */
export function extractTransitionTypes(frames: any[]): string[] {
  if (!frames || frames.length === 0) return []

  return frames
    .map(f => f.transition || 'fade')
    .filter((v, i, a) => a.indexOf(v) === i) // 去重
}

/**
 * 记录实际导出数据
 */
export function recordExportData(
  features: ExportFeatures,
  actuals: ExportActuals
): void {
  try {
    const records = getExportRecords()

    const newRecord: ExportRecord = {
      id: `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      features,
      actuals
    }

    records.push(newRecord)

    // 保留最近 MAX_RECORDS 条
    if (records.length > MAX_RECORDS) {
      records.shift()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))

    logger.debug('[PredictionData] Recorded export data:', newRecord)
  } catch (error) {
    logger.error('[PredictionData] Failed to record export data:', error)
  }
}

/**
 * 获取所有导出记录
 */
export function getExportRecords(): ExportRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    return JSON.parse(data)
  } catch (error) {
    logger.error('[PredictionData] Failed to get export records:', error)
    return []
  }
}

/**
 * 清空所有记录
 */
export function clearExportRecords(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取记录统计
 */
export function getRecordStats(): {
  count: number
  avgRenderTime: number
  avgFileSize: number
  formatDistribution: Record<string, number>
} {
  const records = getExportRecords()

  if (records.length === 0) {
    return {
      count: 0,
      avgRenderTime: 0,
      avgFileSize: 0,
      formatDistribution: {}
    }
  }

  const totalRenderTime = records.reduce((sum, r) => sum + r.actuals.renderTime, 0)
  const totalFileSize = records.reduce((sum, r) => sum + r.actuals.fileSize, 0)

  const formatDist: Record<string, number> = {}
  records.forEach(r => {
    formatDist[r.features.format] = (formatDist[r.features.format] || 0) + 1
  })

  return {
    count: records.length,
    avgRenderTime: totalRenderTime / records.length,
    avgFileSize: totalFileSize / records.length,
    formatDistribution: formatDist
  }
}
