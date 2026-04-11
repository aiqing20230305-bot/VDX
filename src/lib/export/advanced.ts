/**
 * Advanced Export Options - 高级导出选项
 */

/**
 * 格式配置
 */
export interface FormatOption {
  id: string
  name: string
  extension: string
  description: string
  compatibility: string
  recommended: boolean
}

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'mp4-h264',
    name: 'MP4 (H.264)',
    extension: 'mp4',
    description: '最广泛支持的格式',
    compatibility: '所有设备和平台',
    recommended: true,
  },
  {
    id: 'webm-vp9',
    name: 'WebM (VP9)',
    extension: 'webm',
    description: '开源格式，适合网页',
    compatibility: '现代浏览器',
    recommended: false,
  },
  {
    id: 'mov-prores',
    name: 'MOV (ProRes)',
    extension: 'mov',
    description: '专业编辑格式',
    compatibility: 'Final Cut Pro / Premiere',
    recommended: false,
  },
]

/**
 * 质量预设
 */
export interface QualityPreset {
  id: string
  name: string
  description: string
  bitrate: {
    '720p': number
    '1080p': number
    '4k': number
  }
  quality: number  // JPEG质量
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'web-optimized',
    name: 'Web优化',
    description: '较小文件，快速加载',
    bitrate: {
      '720p': 3000,
      '1080p': 6000,
      '4k': 20000,
    },
    quality: 70,
  },
  {
    id: 'balanced',
    name: '平衡',
    description: '质量与大小兼顾',
    bitrate: {
      '720p': 5000,
      '1080p': 10000,
      '4k': 45000,
    },
    quality: 80,
  },
  {
    id: 'high-quality',
    name: '高质量',
    description: '最佳画质，较大文件',
    bitrate: {
      '720p': 8000,
      '1080p': 16000,
      '4k': 80000,
    },
    quality: 90,
  },
]

/**
 * 水印配置
 */
export interface WatermarkConfig {
  enabled: boolean
  type: 'text' | 'image'
  // 文字水印
  text?: string
  fontSize?: number
  fontColor?: string
  // 图片水印
  imageUrl?: string
  opacity?: number
  // 通用
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  margin?: { x: number; y: number }  // 距离边缘的像素
}

export const DEFAULT_WATERMARK_CONFIG: WatermarkConfig = {
  enabled: false,
  type: 'text',
  text: '',
  fontSize: 24,
  fontColor: '#FFFFFF',
  opacity: 0.8,
  position: 'bottom-right',
  margin: { x: 20, y: 20 },
}

/**
 * 位置选项
 */
export const WATERMARK_POSITIONS = [
  { value: 'top-left', label: '左上' },
  { value: 'top-right', label: '右上' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-right', label: '右下' },
  { value: 'center', label: '居中' },
] as const
