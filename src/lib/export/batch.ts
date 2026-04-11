/**
 * Batch Export - 批量导出配置
 */
import type { ExportConfig } from '@/types/workspace'

export interface BatchExportPreset {
  id: string
  name: string
  description: string
  configs: Array<{
    resolution: ExportConfig['videoSettings']['resolution']
    fps: ExportConfig['videoSettings']['fps']
    quality: number
    suffix: string  // 文件名后缀，如 "_720p_30fps"
  }>
}

/**
 * 批量导出预设
 */
export const BATCH_EXPORT_PRESETS: BatchExportPreset[] = [
  {
    id: 'social-media',
    name: '社交媒体套装',
    description: '适合多平台发布（抖音/快手/小红书）',
    configs: [
      { resolution: '1080p', fps: 30, quality: 85, suffix: '_1080p' },
      { resolution: '720p', fps: 30, quality: 80, suffix: '_720p' },
    ],
  },
  {
    id: 'quality-tiers',
    name: '多清晰度套装',
    description: '提供高/中/低三档清晰度',
    configs: [
      { resolution: '1080p', fps: 60, quality: 90, suffix: '_高清' },
      { resolution: '1080p', fps: 30, quality: 80, suffix: '_标清' },
      { resolution: '720p', fps: 30, quality: 70, suffix: '_流畅' },
    ],
  },
  {
    id: 'archive-versions',
    name: '存档版本套装',
    description: '高质量存档 + 预览版本',
    configs: [
      { resolution: '4k', fps: 60, quality: 95, suffix: '_存档版' },
      { resolution: '1080p', fps: 30, quality: 75, suffix: '_预览版' },
    ],
  },
]

/**
 * 生成批量导出任务
 */
export function generateBatchExportTasks(
  baseConfig: ExportConfig,
  presetId: string
): ExportConfig[] {
  const preset = BATCH_EXPORT_PRESETS.find(p => p.id === presetId)
  if (!preset) return []

  return preset.configs.map(config => ({
    ...baseConfig,
    videoSettings: {
      ...baseConfig.videoSettings,
      resolution: config.resolution,
      fps: config.fps,
      quality: config.quality,
    },
    projectInfo: {
      ...baseConfig.projectInfo,
      title: `${baseConfig.projectInfo.title}${config.suffix}`,
    },
  }))
}

/**
 * 预估批量导出总大小
 */
export function estimateBatchTotalSize(configs: ExportConfig[], frameDuration: number): number {
  // 简化预估：每个配置的比特率 × 时长
  return configs.reduce((total, config) => {
    const bitrateMap: Record<string, number> = {
      '720p': 5000,
      '1080p': 10000,
      '4k': 45000,
    }

    const bitrate = bitrateMap[config.videoSettings.resolution] || 10000
    const qualityFactor = (config.videoSettings.quality || 80) / 80
    const sizeInMB = (frameDuration * bitrate * qualityFactor) / 8 / 1024

    return total + sizeInMB
  }, 0)
}
