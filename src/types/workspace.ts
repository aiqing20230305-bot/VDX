/**
 * Workspace State Machine
 * 基于 SEKO 产品链路的状态定义
 */

export type WorkspaceState =
  | 'welcome'      // Hero + 灵感画廊
  | 'chat'         // 对话式生成
  | 'timeline'     // 时间轴编辑 ⭐ 核心工作状态
  | 'grid'         // 网格浏览
  | 'export'       // 导出配置

export type ViewMode = 'timeline' | 'grid'

export interface Project {
  id: string
  title: string
  thumbnail?: string
  createdAt: Date
  updatedAt: Date
  frameCount: number
  duration: number
  status: 'draft' | 'generating' | 'completed'
}

export interface Frame {
  id: string
  index: number
  imageUrl?: string
  imagePrompt: string
  duration: number
  sceneDescription: string
  cameraMove?: string
  isGenerating?: boolean
}

export interface WorkspaceContext {
  state: WorkspaceState
  viewMode: ViewMode
  currentProject: Project | null
  frames: Frame[]
  selectedFrameId: string | null
  exportConfig: ExportConfig | null
}

export type ExportPreset = 'fast' | 'balanced' | 'highQuality' | 'custom'

export interface ExportConfig {
  preset?: ExportPreset
  projectInfo: {
    title: string
    description: string
  }
  videoSettings: {
    resolution: '1080p' | '720p' | '4k'
    fps: 24 | 30 | 60
    format: 'mp4' | 'mov' | 'webm'
    quality?: number  // 1-100, JPEG quality for Remotion
    bitrate?: number  // kbps, optional manual override
  }
  audioSettings?: {
    enabled: boolean
    source: 'preset' | 'upload' | 'none'
    presetId?: string
    uploadedFile?: string
    volume: number  // 0-100
  }
  subtitleTracks?: import('@/types').SubtitleTrack[]
  productInfo?: {
    color: string
    features: string[]
  }
  style: {
    theme: string
    mood: string
  }
  watermark?: {
    enabled: boolean
    type: 'text' | 'image'
    text?: string
    fontSize?: number
    fontColor?: string
    imageUrl?: string
    opacity?: number
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    margin?: { x: number; y: number }
  }
  filterSettings?: {
    filterId: import('@/lib/video/filters').FilterId
    intensity: number  // 0-100
  }
}

export interface ExportEstimate {
  duration: number      // 视频总时长（秒）
  fileSizeMin: number  // 最小文件大小（MB）
  fileSizeMax: number  // 最大文件大小（MB）
  renderTime: number   // 预估渲染时间（秒）
  usedML?: boolean     // 是否使用 ML 模型预测
  confidence?: number  // 预估置信度（0-1）
}
