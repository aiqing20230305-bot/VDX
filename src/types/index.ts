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

// ─── Audio / 音频 ──────────────────────────────────────────
export interface AudioAnalysisResult {
  duration: number
  beat: {
    bpm: number
    beats: number[]
    bars: number[]
    timeSignature: string
  }
  lyrics: Array<{
    startTime: number
    endTime: number
    text: string
    keywords: string[]
  }>
  mood: Array<{
    timestamp: number
    energy: number
    valence: number
    tempo: 'slow' | 'medium' | 'fast'
    intensity: 'low' | 'medium' | 'high'
  }>
  segments: Array<{
    type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro'
    startTime: number
    endTime: number
    energy: number
  }>
}

// ─── Script / 脚本 ──────────────────────────────────────────
export interface ScriptGenerationInput {
  topic?: string          // 选题描述
  images?: string[]       // 上传图片 URL 列表
  audioPath?: string      // 音频文件路径 ⭐ 新增
  audioAnalysis?: AudioAnalysisResult // 音频分析结果 ⭐ 新增
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
  titles?: TitleTrack[]        // 标题轨道 ⭐ v1.3.0 新增
  bullets?: BulletTrack[]      // 弹幕轨道 ⭐ v1.3.0 新增
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

// ─── Title Animation / 标题动画 ⭐ v1.3.0 新增 ──────────────
export type TitleAnimationType =
  | 'slideIn'     // 滑动进入
  | 'fadeIn'      // 淡入
  | 'zoomIn'      // 缩放进入
  | 'bounceIn'    // 弹跳进入
  | 'rotateIn'    // 旋转进入
  | 'typewriter'  // 打字机效果
  | 'none'        // 无动画

export type TitleAnimationDirection = 'left' | 'right' | 'top' | 'bottom'
export type TitlePosition = 'top' | 'center' | 'bottom'
export type TitleAlign = 'left' | 'center' | 'right'

export interface TitleStyle {
  fontSize?: number          // 字体大小（默认 48）
  fontFamily?: string        // 字体（默认 sans-serif）
  fontWeight?: string | number // 字重（默认 bold）
  color?: string             // 文字颜色（默认 #FFFFFF）
  backgroundColor?: string   // 背景颜色（可选）
  stroke?: {
    color: string            // 描边颜色
    width: number            // 描边宽度
  }
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  padding?: number           // 内边距（默认 24）
  textAlign?: TitleAlign     // 对齐方式（默认 center）
  letterSpacing?: number     // 字间距（默认 0）
}

export interface TitleAnimationConfig {
  type: TitleAnimationType
  direction?: TitleAnimationDirection // 方向（适用于 slideIn）
  duration?: number          // 动画时长（帧数，默认 30）
  delay?: number             // 延迟（帧数，默认 0）
  easing?: string            // 缓动函数（默认 ease-out）
  exitAnimation?: boolean    // 是否有退出动画（默认 false）
  exitDuration?: number      // 退出动画时长（帧数，默认 20）
}

export interface TitleEntry {
  startTime: number          // 开始时间（秒）
  endTime: number            // 结束时间（秒）
  text: string               // 标题文本
  position?: TitlePosition   // 位置（默认 center）
  style?: Partial<TitleStyle> // 样式
  animation?: TitleAnimationConfig // 动画配置
}

export interface TitleTrack {
  id: string
  entries: TitleEntry[]
  defaultStyle?: TitleStyle  // 默认样式
  defaultAnimation?: TitleAnimationConfig // 默认动画
  enabled?: boolean          // 是否启用（默认 true）
}

// ─── Bullet Comments / 弹幕 ⭐ v1.3.0 新增 ─────────────────
export interface BulletStyle {
  fontSize?: number          // 字体大小（默认 24）
  fontFamily?: string        // 字体（默认 sans-serif）
  fontWeight?: string | number // 字重（默认 normal）
  color?: string             // 文字颜色（默认 #FFFFFF）
  backgroundColor?: string   // 背景颜色（可选）
  stroke?: {
    color: string            // 描边颜色
    width: number            // 描边宽度
  }
  shadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
  padding?: number           // 内边距（默认 8）
  opacity?: number           // 不透明度（默认 0.9）
}

export interface BulletEntry {
  id: string                 // 唯一标识
  time: number               // 出现时间（秒）
  text: string               // 弹幕文本
  style?: Partial<BulletStyle> // 样式覆盖
  speed?: number             // 滚动速度（像素/秒，默认 200）
  lane?: number              // 指定轨道（可选，用于固定位置）
}

export interface BulletTrack {
  id: string
  entries: BulletEntry[]
  defaultStyle?: BulletStyle // 默认样式
  defaultSpeed?: number      // 默认速度（像素/秒，默认 200）
  laneHeight?: number        // 轨道高度（像素，默认 40）
  maxLanes?: number          // 最大轨道数（默认 10）
  enabled?: boolean          // 是否启用（默认 true）
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
export type MessageType = 'text' | 'script' | 'storyboard' | 'storyboard_variants' | 'video' | 'action' | 'progress' | 'frame_selector' | 'video_frame_extractor'

export interface ChatMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  metadata?: {
    script?: Script
    storyboard?: Storyboard
    variants?: Array<{
      id: string
      name: string
      description: string
      cinematicStyle: string
      previewImageUrl?: string
      storyboard: Storyboard
    }>
    aspectRatio?: '9:16' | '16:9'
    videoJob?: VideoJob
    analysis?: VideoAnalysis
    actions?: QuickAction[]
    topics?: Array<{
      title: string
      description: string
      style: string
      duration: number
      tags: string[]
    }>
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

// ─── Multi-Model Routing / 多模型路由 ⭐ v1.5.0 新增 ──────────
export type ModelType = 'seedance' | 'kling'
export type SceneComplexity = 'simple' | 'medium' | 'complex'
export type MotionIntensity = 'static' | 'slow' | 'medium' | 'fast' | 'dynamic'

export interface ModelCapabilities {
  model: ModelType
  strengths: string[]        // 擅长领域
  weaknesses: string[]       // 不擅长领域
  bestForStyles: VideoStyle[] // 最适合的风格
  maxDuration: number        // 最大时长（秒）
  costPerSecond: number      // 成本（相对值）
  qualityScore: number       // 质量分数（0-10）
  speedScore: number         // 速度分数（0-10）
  consistencyScore: number   // 一致性分数（0-10）
}

export interface StyleAnalysisResult {
  frameIndex: number
  style: VideoStyle
  complexity: SceneComplexity
  motionIntensity: MotionIntensity
  hasCharacters: boolean     // 是否有人物
  hasText: boolean           // 是否有文字
  hasFastAction: boolean     // 是否有快速动作
  hasComplexCamera: boolean  // 是否有复杂镜头运动
  keywords: string[]         // 关键特征词
  recommendedModel: ModelType
  confidence: number         // 0-1，推荐置信度
}

export interface ModelRoutingDecision {
  frameIndex: number
  selectedModel: ModelType
  reason: string             // 选择原因
  alternativeModel?: ModelType
  confidence: number         // 0-1
  estimatedQuality: number   // 0-10 预估质量
  estimatedCost: number      // 相对成本
}

export interface ModelRoutingStrategy {
  prioritize: 'quality' | 'speed' | 'cost' | 'balanced'
  forceModel?: ModelType     // 强制使用某个模型
  allowMixedModels: boolean  // 是否允许混合使用模型
  qualityThreshold: number   // 质量阈值（0-10）
  budgetLimit?: number       // 预算上限
}

export interface ModelRoutingResult {
  storyboardId: string
  strategy: ModelRoutingStrategy
  decisions: ModelRoutingDecision[]
  summary: {
    seedanceCount: number
    klingCount: number
    estimatedTotalCost: number
    estimatedAverageQuality: number
  }
  createdAt: Date
}

// ─── Character Consistency / 角色一致性 ─────────────────────
export interface CharacterFeatures {
  // 视觉特征
  face: {
    shape: string    // 脸型
    eyes: string     // 眼睛特征
    hair: string     // 发型发色
    skin: string     // 肤色
  }
  body: {
    build: string    // 体型
    height: string   // 相对高度
    pose: string     // 典型姿态
  }
  style: {
    clothing: string     // 服装风格
    colors: string[]     // 主要配色
    accessories: string  // 配饰
  }

  // 语义特征
  detailedDescription: string
  promptKeywords: string[]

  // 特征向量（用于相似度搜索）
  embedding: number[]
}

export interface Character {
  id: string
  name: string
  description?: string         // 用户输入的描述
  referenceImageUrl: string    // 参考图 URL
  thumbnailUrl?: string        // 缩略图 URL
  features?: CharacterFeatures // 提取的特征（可选，创建时可能还未提取）
  tags: string[]               // 标签（风格、类型）
  usageCount: number           // 使用次数
  createdAt: Date
  updatedAt: Date
}

export interface CharacterConsistencyOptions {
  characterId: string          // 使用的角色 ID
  enableVerification: boolean  // 是否启用一致性验证
  referenceStrength: number    // 参考强度 0-1
}
