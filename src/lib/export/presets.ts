/**
 * Export Presets - 导出预设配置
 */
import type { ExportConfig, ExportPreset, Frame, ExportEstimate } from '@/types/workspace'
import {
  predictRenderTime,
  predictFileSize,
  isModelTrained,
  autoTrain,
} from './prediction-model'
import {
  calculateSceneComplexity,
  extractTransitionTypes,
  getExportRecords,
  type ExportFeatures,
} from './prediction-data'

export interface PresetConfig {
  id: ExportPreset
  name: string
  description: string
  icon: string
  videoSettings: ExportConfig['videoSettings']
  recommended: boolean
}

/**
 * 3个预设配置
 */
export const EXPORT_PRESETS: PresetConfig[] = [
  {
    id: 'fast',
    name: '快速导出',
    description: '720p 30fps，适合快速预览和社交媒体分享',
    icon: '⚡',
    videoSettings: {
      resolution: '720p',
      fps: 30,
      format: 'mp4',
      quality: 70,
    },
    recommended: false,
  },
  {
    id: 'balanced',
    name: '平衡模式',
    description: '1080p 30fps，质量与速度兼顾（推荐）',
    icon: '⚖️',
    videoSettings: {
      resolution: '1080p',
      fps: 30,
      format: 'mp4',
      quality: 80,
    },
    recommended: true,
  },
  {
    id: 'highQuality',
    name: '高质量',
    description: '1080p 60fps，最佳画质，适合专业用途',
    icon: '💎',
    videoSettings: {
      resolution: '1080p',
      fps: 60,
      format: 'mp4',
      quality: 90,
    },
    recommended: false,
  },
]

/**
 * 比特率配置（Kbps）
 * 基于分辨率和帧率
 */
const BITRATE_MAP: Record<string, Record<number, number>> = {
  '720p': { 24: 4000, 30: 5000, 60: 8000 },
  '1080p': { 24: 8000, 30: 10000, 60: 16000 },
  '4k': { 24: 35000, 30: 45000, 60: 80000 },
}

/**
 * 渲染速度系数（秒/秒）
 * Remotion 渲染时间约为视频时长的 1.5-3 倍
 */
const RENDER_SPEED_FACTOR: Record<string, number> = {
  '720p': 1.5,
  '1080p': 2.0,
  '4k': 3.5,
}

/**
 * 预估文件大小和渲染时间
 *
 * 算法：
 * 1. 优先使用 ML 模型预测（如果有足够训练数据）
 * 2. Fallback 到经验公式（基于比特率和速度系数）
 * 3. 文件大小 = 视频时长 × 比特率 / 8 / 1024 （MB）
 * 4. 考虑音频轨道（~128Kbps）
 * 5. 考虑质量系数（quality影响压缩率）
 * 6. 渲染时间 = 视频时长 × 速度系数
 */
export function estimateExport(
  frames: Frame[],
  config: ExportConfig
): ExportEstimate & { usedML?: boolean; confidence?: number } {
  // 总时长（秒）
  const duration = frames.reduce((sum, frame) => sum + frame.duration, 0)

  // 获取配置
  const resolution = config.videoSettings.resolution
  const fps = config.videoSettings.fps
  const quality = config.videoSettings.quality || 80
  const format = config.videoSettings.format || 'mp4'

  // 尝试自动训练模型
  autoTrain()

  // 准备 ML 特征
  const features: ExportFeatures = {
    frameCount: frames.length,
    resolution,
    fps,
    videoDuration: duration,
    sceneComplexity: calculateSceneComplexity(frames),
    transitionCount: frames.length - 1,
    transitionTypes: extractTransitionTypes(frames),
    hasAudio: config.audioSettings?.enabled || false,
    hasSubtitles: (config.subtitleTracks?.length || 0) > 0,
    hasWatermark: config.watermark?.enabled || false,
    subtitleTrackCount: config.subtitleTracks?.length || 0,
    format,
    quality,
  }

  // 尝试 ML 预测
  if (isModelTrained()) {
    const mlRenderTime = predictRenderTime(features)
    const mlFileSize = predictFileSize(features)

    if (mlRenderTime !== null && mlFileSize !== null) {
      // 计算置信度（基于训练样本数量）
      const recordCount = getExportRecords().length
      let confidence: number
      if (recordCount < 10) {
        // 少量样本：0.5-0.77
        confidence = Math.min(0.77, 0.5 + recordCount * 0.03)
      } else if (recordCount < 30) {
        // 中等样本：0.7-0.9
        confidence = Math.min(0.9, 0.7 + (recordCount - 10) * 0.01)
      } else {
        // 充足样本：0.9
        confidence = 0.9
      }

      // 使用 ML 预测
      const fileSizeMB = mlFileSize / 1024 / 1024
      return {
        duration,
        fileSizeMin: fileSizeMB * 0.95, // ±5% 误差
        fileSizeMax: fileSizeMB * 1.05,
        renderTime: mlRenderTime,
        usedML: true,
        confidence,
      }
    }
  }

  // Fallback: 经验公式
  const videoBitrate = BITRATE_MAP[resolution]?.[fps] || 10000

  // 质量系数（quality 越高，压缩率越低，文件越大）
  const qualityFactor = quality / 80  // 80 为基准

  // 视频大小（MB）
  const videoSize = (duration * videoBitrate * qualityFactor) / 8 / 1024

  // 音频大小（如果启用）
  const audioSize = config.audioSettings?.enabled
    ? (duration * 128) / 8 / 1024  // 128Kbps AAC
    : 0

  // 总大小（±10% 浮动）
  const totalSize = videoSize + audioSize
  const fileSizeMin = totalSize * 0.9
  const fileSizeMax = totalSize * 1.1

  // 渲染时间
  const speedFactor = RENDER_SPEED_FACTOR[resolution] || 2.0
  const renderTime = duration * speedFactor

  return {
    duration,
    fileSizeMin,
    fileSizeMax,
    renderTime,
    usedML: false,
    confidence: 0.7, // 经验公式置信度
  }
}

/**
 * 智能推荐预设
 *
 * 逻辑：
 * 1. 短视频（<30s）→ 快速导出
 * 2. 中等视频（30-120s）→ 平衡模式
 * 3. 长视频（>120s）→ 根据质量要求推荐
 * 4. 检测动态场景（镜头运动多）→ 60fps
 */
export function recommendPreset(frames: Frame[]): ExportPreset {
  const duration = frames.reduce((sum, frame) => sum + frame.duration, 0)

  // 检测动态场景（有相机运动的帧数占比）
  const dynamicFrames = frames.filter(f => f.cameraMove && f.cameraMove !== 'static').length
  const dynamicRatio = dynamicFrames / frames.length

  // 动态场景多 → 60fps 高质量（优先级最高）
  if (dynamicRatio > 0.4 && duration < 120) {
    return 'highQuality'
  }

  // 短视频 → 快速
  if (duration < 30) {
    return 'fast'
  }

  // 默认平衡
  return 'balanced'
}

/**
 * 格式化文件大小
 */
export function formatFileSize(sizeInMB: number): string {
  if (sizeInMB < 1) {
    return `${Math.round(sizeInMB * 1024)} KB`
  }
  if (sizeInMB < 1024) {
    return `${sizeInMB.toFixed(1)} MB`
  }
  return `${(sizeInMB / 1024).toFixed(2)} GB`
}

/**
 * 格式化渲染时间
 */
export function formatRenderTime(seconds: number): string {
  if (seconds < 60) {
    return `约 ${Math.round(seconds)} 秒`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `约 ${minutes} 分 ${remainingSeconds} 秒`
}
