/**
 * 视频颜色滤镜系统
 * 提供Instagram风格的颜色滤镜预设
 */

export type FilterId =
  | 'none'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'bw'
  | 'cinematic'
  | 'highcontrast'
  | 'soft'

export interface VideoFilter {
  id: FilterId
  name: string
  nameZh: string
  description: string
  /** CSS滤镜字符串（用于Remotion预览） */
  cssFilter: string
  /** FFmpeg滤镜链（用于导出） */
  ffmpegFilter: string
  /** 缩略图示例色值（用于UI展示） */
  previewGradient: string
}

/**
 * 滤镜预设库
 */
export const VIDEO_FILTERS: Record<FilterId, VideoFilter> = {
  none: {
    id: 'none',
    name: 'Original',
    nameZh: '原始',
    description: '不应用任何滤镜',
    cssFilter: 'none',
    ffmpegFilter: '',
    previewGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  vivid: {
    id: 'vivid',
    name: 'Vivid',
    nameZh: '鲜艳',
    description: '增强饱和度和对比度，色彩更鲜明',
    cssFilter: 'saturate(1.2) contrast(1.15) brightness(1.05)',
    ffmpegFilter: 'eq=saturation=1.2:contrast=1.15:brightness=0.05',
    previewGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    nameZh: '温暖',
    description: '增加暖色调，营造温馨氛围',
    cssFilter: 'sepia(0.2) saturate(1.1) hue-rotate(-5deg)',
    ffmpegFilter:
      'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
    previewGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  cool: {
    id: 'cool',
    name: 'Cool',
    nameZh: '冷调',
    description: '增加冷色调，显得更清爽',
    cssFilter: 'saturate(0.9) hue-rotate(10deg) brightness(1.05)',
    ffmpegFilter: 'eq=saturation=0.9,hue=h=10',
    previewGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage',
    nameZh: '复古',
    description: '复古胶片效果，降低饱和度',
    cssFilter: 'sepia(0.3) saturate(0.8) contrast(0.9) brightness(1.1)',
    ffmpegFilter: 'eq=saturation=0.8:contrast=0.9:brightness=0.1,curves=vintage',
    previewGradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  bw: {
    id: 'bw',
    name: 'Black & White',
    nameZh: '黑白',
    description: '经典黑白效果，增强对比度',
    cssFilter: 'grayscale(1) contrast(1.2)',
    ffmpegFilter: 'hue=s=0,eq=contrast=1.2',
    previewGradient: 'linear-gradient(135deg, #000000 0%, #ffffff 100%)',
  },
  cinematic: {
    id: 'cinematic',
    name: 'Cinematic',
    nameZh: '电影感',
    description: '青橙电影级调色',
    cssFilter:
      'contrast(1.1) saturate(1.1) sepia(0.1) hue-rotate(-5deg) brightness(0.95)',
    ffmpegFilter: 'curves=preset=color_negative,eq=contrast=1.1:saturation=1.1',
    previewGradient: 'linear-gradient(135deg, #134e5e 0%, #ff6b35 100%)',
  },
  highcontrast: {
    id: 'highcontrast',
    name: 'High Contrast',
    nameZh: '高对比',
    description: '极强对比度，醒目视觉',
    cssFilter: 'contrast(1.3) brightness(1.05) saturate(1.1)',
    ffmpegFilter: 'eq=contrast=1.3:brightness=0.05:saturation=1.1',
    previewGradient: 'linear-gradient(135deg, #000000 0%, #e74c3c 100%)',
  },
  soft: {
    id: 'soft',
    name: 'Soft',
    nameZh: '柔和',
    description: '降低对比度，柔和画面',
    cssFilter: 'contrast(0.9) saturate(0.95) brightness(1.05)',
    ffmpegFilter: 'eq=contrast=0.9:saturation=0.95:brightness=0.05',
    previewGradient: 'linear-gradient(135deg, #ffeaa7 0%, #dfe6e9 100%)',
  },
}

/**
 * 获取滤镜配置
 */
export function getFilter(id: FilterId): VideoFilter {
  return VIDEO_FILTERS[id]
}

/**
 * 获取所有滤镜列表
 */
export function getAllFilters(): VideoFilter[] {
  return Object.values(VIDEO_FILTERS)
}

/**
 * 应用滤镜强度调节
 * @param filter 滤镜配置
 * @param intensity 强度 0-100
 * @returns 调整后的CSS滤镜字符串
 */
export function applyCSSFilterIntensity(
  filter: VideoFilter,
  intensity: number
): string {
  if (filter.id === 'none' || intensity === 0) {
    return 'none'
  }

  if (intensity === 100) {
    return filter.cssFilter
  }

  // 解析CSS滤镜并按比例调整
  const ratio = intensity / 100

  // 简化版本：直接混合原始和滤镜效果
  // 通过opacity实现强度调节（使用CSS filter的混合）
  return `opacity(${ratio}) ${filter.cssFilter}`
}

/**
 * 应用FFmpeg滤镜强度调节
 * @param filter 滤镜配置
 * @param intensity 强度 0-100
 * @returns 调整后的FFmpeg滤镜链
 */
export function applyFFmpegFilterIntensity(
  filter: VideoFilter,
  intensity: number
): string {
  if (filter.id === 'none' || intensity === 0 || !filter.ffmpegFilter) {
    return ''
  }

  if (intensity === 100) {
    return filter.ffmpegFilter
  }

  // FFmpeg强度调节需要更复杂的处理
  // 暂时使用全强度，未来可以解析滤镜参数并按比例调整
  return filter.ffmpegFilter
}
