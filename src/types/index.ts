// ============================================================
// 超级视频Agent — 核心类型系统
// ============================================================

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
export type VideoStyle =
  | 'cinematic'
  | 'anime'
  | 'realistic'
  | 'cartoon'
  | 'documentary'
  | 'commercial'
  | 'short-drama'
  | 'vlog'
  | 'music-video'

export type GenerationMode = 'step-by-step' | 'auto'
export type VideoEngine = 'seedance' | 'kling' | 'ffmpeg' | 'remotion'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// ─── Project ────────────────────────────────────────────────
export interface Project {
  id: string
  title: string
  description?: string
  createdAt: Date
  updatedAt: Date
  scripts: Script[]
  videos: VideoJob[]
}

// ─── Script / 脚本 ──────────────────────────────────────────
export interface ScriptGenerationInput {
  topic?: string          // 选题描述
  images?: string[]       // 上传图片 URL 列表
  duration: number        // 视频时长 (秒)
  aspectRatio: AspectRatio
  count: number           // 生成脚本数量
  style?: VideoStyle
  additionalPrompt?: string
}

export interface ScriptScene {
  index: number
  duration: number        // 该场景时长 (秒)
  visual: string          // 画面描述
  narration?: string      // 解说词
  emotion?: string        // 情绪基调
  cameraMove?: string     // 运镜方式
  soundDesign?: string    // 声音设计
}

export interface Script {
  id: string
  projectId?: string
  title: string
  logline: string         // 一句话概括
  theme: string           // 主题
  style: VideoStyle
  duration: number
  aspectRatio: AspectRatio
  scenes: ScriptScene[]
  generationPrompt?: string
  createdAt: Date
}

// ─── Storyboard / 分镜 ──────────────────────────────────────
export interface StoryboardFrame {
  index: number           // 第几帧
  scriptSceneIndex: number
  imageUrl?: string       // 生成的分镜图片 URL
  imagePrompt: string     // 图片生成提示词
  duration: number        // 该帧时长 (秒)
  description: string     // 画面描述
  cameraAngle: string     // 镜头角度
  transition?: string | { // 转场方式⭐ v1.3.0 扩展：支持字符串或配置对象
    type: 'none' | 'fade' | 'slide' | 'zoom' | 'rotate' | 'wipe'
    config?: Record<string, any>  // 转场配置
  }
  titleAnimation?: {      // 文字动画（可选）⭐ v1.2.0 新增
    type: 'fluid' | 'particle' | 'ascii'
    text: string
    config: Record<string, any>  // 灵活配置
  }
}

export interface Storyboard {
  id: string
  scriptId: string
  totalFrames: number     // 总帧数 (15s=12帧，每5s增加4帧)
  frames: StoryboardFrame[]
  coverPrompt?: string
  subtitles?: SubtitleTrack[]  // 字幕轨道 ⭐ v1.3.0 新增
  createdAt: Date
}

// ─── Video Job / 视频任务 ───────────────────────────────────
export interface VideoJobConfig {
  engine: VideoEngine
  storyboardId: string
  frames?: StoryboardFrame[]
  consistencyPrompt?: string  // 一致性提示词
  characterPrompt?: string    // 角色一致性
  stylePrompt?: string        // 风格一致性
  referenceImageUrl?: string  // 参考图
}

export interface VideoJob {
  id: string
  projectId?: string
  status: JobStatus
  progress: number        // 0-100
  config: VideoJobConfig
  outputUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
  logs: JobLog[]
  createdAt: Date
  updatedAt: Date
}

export interface JobLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  data?: unknown
}

// ─── Video Analysis / 视频分析 ──────────────────────────────
export interface VideoElement {
  type: 'character' | 'scene' | 'object' | 'text' | 'audio' | 'effect'
  description: string
  timeRange?: [number, number]  // [start, end] 秒
  tags: string[]
}

export interface VideoAnalysis {
  id: string
  sourceVideoUrl: string
  duration: number
  aspectRatio: AspectRatio
  style: VideoStyle
  elements: VideoElement[]
  sceneDescriptions: string[]
  moodBoard: string[]
  suggestedEdits: string[]
  createdAt: Date
}

// ─── Subtitle / 字幕系统 ⭐ v1.3.0 新增 ───────────────────────
export type SubtitlePosition = 'top' | 'middle' | 'bottom'
export type SubtitleAlign = 'left' | 'center' | 'right'

export interface SubtitleStyle {
  fontSize?: number          // 字体大小（默认 24）
  fontFamily?: string        // 字体（默认 sans-serif）
  color?: string             // 文字颜色（默认 #FFFFFF）
  backgroundColor?: string   // 背景颜色（可选，默认半透明黑色）
  stroke?: {
    color: string            // 描边颜色
    width: number            // 描边宽度（像素）
  }
  padding?: number           // 内边距（默认 16）
  lineHeight?: number        // 行高（默认 1.5）
  textAlign?: SubtitleAlign  // 对齐方式（默认 center）
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
}

export interface SubtitleEntry {
  startTime: number          // 开始时间（秒）
  endTime: number            // 结束时间（秒）
  text: string               // 字幕文本
  position?: SubtitlePosition // 位置（默认 bottom）
  style?: Partial<SubtitleStyle> // 样式覆盖
}

export interface SubtitleTrack {
  id: string
  entries: SubtitleEntry[]
  defaultStyle?: SubtitleStyle // 默认样式
  enabled?: boolean            // 是否启用（默认 true）
}

// ─── Secondary Creation / 二创 ──────────────────────────────
export interface SecondaryCreationInput {
  analysisId: string
  modifications: ElementModification[]
  newDuration?: number
  preserveElements?: string[]
}

export interface ElementModification {
  elementType: VideoElement['type']
  originalDescription: string
  newDescription: string
  operation: 'replace' | 'remove' | 'add' | 'modify'
}

// ─── Chat / 对话 ────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageType = 'text' | 'script' | 'storyboard' | 'video' | 'action' | 'progress' | 'frame_selector' | 'video_frame_extractor'

export interface ChatMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  metadata?: {
    script?: Script
    storyboard?: Storyboard
    aspectRatio?: '9:16' | '16:9'
    videoJob?: VideoJob
    analysis?: VideoAnalysis
    actions?: QuickAction[]
    progress?: { value: number; label: string }
    generation?: {
      stage: string
      current?: number
      total?: number
      detail?: string
      startedAt?: number
    }
  }
  createdAt: Date
}

export interface QuickAction {
  id: string
  label: string
  description?: string
  action: string
  params?: Record<string, unknown>
  variant?: 'primary' | 'secondary' | 'outline'
}

// ─── Pipeline / 编排 ─────────────────────────────────────────
export interface PipelineStep {
  id: string
  name: string
  status: JobStatus
  input?: unknown
  output?: unknown
  error?: string
  startedAt?: Date
  completedAt?: Date
}

export interface Pipeline {
  id: string
  mode: GenerationMode
  steps: PipelineStep[]
  currentStepIndex: number
  createdAt: Date
}

// ─── Evolution / 进化 ────────────────────────────────────────
export interface EvolutionInsight {
  id: string
  type: 'new-path' | 'hypothesis' | 'optimization' | 'trend'
  title: string
  description: string
  confidence: number      // 0-1
  source: string
  createdAt: Date
}
