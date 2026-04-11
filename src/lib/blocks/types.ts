/**
 * Building Blocks 核心类型定义
 * 实现可组合、可复用的视频生产构建块系统
 */

// ─── Block 基础类型 ──────────────────────────────────────────

export type BlockType =
  // 输入类
  | 'input.text'        // 文字输入
  | 'input.image'       // 图片上传
  | 'input.audio'       // 音频上传
  | 'input.video'       // 视频上传
  | 'input.product'     // 产品信息输入
  // 生成类
  | 'generate.script'   // 脚本生成
  | 'generate.storyboard' // 分镜生成
  | 'generate.prompts'  // 提示词生成
  | 'generate.image'    // 图片生成（text2image）
  | 'generate.video'    // 视频生成
  // 处理类
  | 'process.analyze'   // 分析（图片/视频/音频）
  | 'process.transform' // 格式转换/图生图
  | 'process.filter'    // 内容过滤
  | 'process.enhance'   // 质量增强
  | 'process.character' // 人物风格转换
  // 合成类
  | 'compose.merge'     // 视频合并
  | 'compose.overlay'   // 叠加效果
  | 'compose.transition' // 转场
  | 'compose.subtitle'  // 字幕合成
  // 输出类
  | 'output.video'      // 输出视频
  | 'output.export'     // 导出文件

export type BlockCategory = 'input' | 'generate' | 'process' | 'compose' | 'output'

export interface BlockInput {
  name: string
  type: BlockDataType
  description?: string
  required: boolean
  default?: any
  validation?: (value: any) => boolean | string  // 返回 true 或错误信息
}

export interface BlockOutput {
  name: string
  type: BlockDataType
  description?: string
}

export type BlockDataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'Script'
  | 'Storyboard'
  | 'StoryboardFrame'
  | 'ProductAnalysis'
  | 'AudioAnalysisResult'
  | 'VideoJob'
  | 'Asset'
  | 'string[]'
  | 'any'

// ─── Block 执行上下文 ─────────────────────────────────────────

export interface BlockContext {
  workflowId: string
  executionId: string
  userId?: string
  metadata: Record<string, any>

  // 状态管理
  get(key: string): any
  set(key: string, value: any): void

  // 进度回调
  emitProgress(data: ProgressEvent): void
  onProgress(callback: (event: ProgressEvent) => void): void

  // 日志
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void

  // 资产存储
  saveAsset(type: string, data: any): Promise<Asset>
  getAsset(id: string): Promise<Asset | null>
}

export interface ProgressEvent {
  blockId: string
  nodeId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number  // 0-100
  message?: string
  data?: any
}

export interface Asset {
  id: string
  type: 'script' | 'storyboard' | 'image' | 'video' | 'audio' | 'other'
  data: any
  metadata: {
    workflowId: string
    nodeId: string
    createdAt: Date
    size?: number
    url?: string
  }
}

// ─── Block 定义 ───────────────────────────────────────────────

export interface Block {
  id: string
  type: BlockType
  category: BlockCategory
  name: string
  description: string
  icon?: string  // Lucide icon name

  inputs: BlockInput[]
  outputs: BlockOutput[]

  // 核心执行函数
  execute: (inputs: Record<string, any>, context: BlockContext) => Promise<Record<string, any>>

  // 元数据
  estimatedDuration: number  // 预估时长（秒）
  cost?: number  // 预估成本（积分/元）

  // 验证函数（可选）
  validate?: (inputs: Record<string, any>) => Promise<ValidationResult>

  // 可配置项（可选）
  configSchema?: Record<string, any>
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

// ─── Workflow 定义 ────────────────────────────────────────────

export interface Workflow {
  id: string
  name: string
  description: string
  category?: WorkflowCategory

  nodes: WorkflowNode[]
  edges: WorkflowEdge[]

  // 触发条件（可选）
  triggers?: WorkflowTrigger[]

  // 全局配置
  config?: Record<string, any>

  metadata: {
    author?: string
    version: string
    createdAt: Date
    updatedAt: Date
    tags?: string[]
  }
}

export type WorkflowCategory =
  | 'product_promo'   // 产品宣传
  | 'explainer'       // 讲解说明
  | 'tutorial'        // 教程
  | 'music_video'     // 音乐视频
  | 'slideshow'       // 幻灯片
  | 'custom'          // 自定义

export interface WorkflowNode {
  id: string
  blockId: string  // 引用 Block.id

  // 画布位置（用于可视化编辑）
  position: {
    x: number
    y: number
  }

  // 节点配置（覆盖 Block 默认值）
  config?: Record<string, any>

  // UI 元数据
  ui?: {
    label?: string
    color?: string
    collapsed?: boolean
  }
}

export interface WorkflowEdge {
  id: string
  source: string  // 源节点 ID
  sourceOutput: string  // 源输出端口名称
  target: string  // 目标节点 ID
  targetInput: string  // 目标输入端口名称

  // 数据转换函数（可选）
  transform?: string  // 序列化的函数代码

  // UI 元数据
  ui?: {
    animated?: boolean
    color?: string
  }
}

export type WorkflowTriggerType = 'manual' | 'schedule' | 'webhook' | 'event'

export interface WorkflowTrigger {
  type: WorkflowTriggerType
  config: Record<string, any>
}

// ─── Workflow 执行 ────────────────────────────────────────────

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: WorkflowExecutionStatus

  // 输入数据
  inputs: Record<string, any>

  // 执行结果
  outputs?: Record<string, any>
  error?: string

  // 时间统计
  startedAt: Date
  completedAt?: Date
  duration?: number  // 毫秒

  // 节点执行记录
  nodeExecutions: NodeExecution[]

  // 成本统计
  totalCost?: number

  metadata?: Record<string, any>
}

export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export interface NodeExecution {
  nodeId: string
  blockId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

  inputs: Record<string, any>
  outputs?: Record<string, any>
  error?: string

  startedAt?: Date
  completedAt?: Date
  duration?: number  // 毫秒

  retryCount: number
  logs: ExecutionLog[]
}

export interface ExecutionLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
}

// ─── Workflow 模板 ────────────────────────────────────────────

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: WorkflowCategory

  thumbnail?: string
  workflow: Workflow

  // 示例输入（用于预览）
  exampleInputs?: Record<string, any>

  metadata: {
    author: string
    authorAvatar?: string
    usageCount: number
    rating: number
    reviews: number
    tags: string[]

    // 预估统计
    estimatedDuration: number  // 秒
    estimatedCost: number  // 积分/元

    // 版本控制
    version: string
    publishedAt: Date
    updatedAt: Date
  }
}

// ─── Agent 系统 ───────────────────────────────────────────────

export type AgentType =
  | 'script-agent'       // 脚本专家（Claude）
  | 'image-agent'        // 图片生成专家（即梦）
  | 'video-agent'        // 视频生成专家（Seedance/Kling）
  | 'composition-agent'  // 后期合成专家（FFmpeg/Remotion）
  | 'analysis-agent'     // 分析专家（Claude Vision）

export interface Agent {
  id: string
  type: AgentType
  name: string
  description: string

  // 能力列表（该 Agent 能执行哪些 Block 类型）
  capabilities: BlockType[]

  // 并发控制
  maxConcurrency: number
  currentLoad: number  // 当前负载（0-100）

  // 优先级（1-10，越高越优先）
  priority: number

  // 状态
  status: AgentStatus
  currentTasks: Task[]

  // 统计
  stats: {
    totalTasks: number
    successTasks: number
    failedTasks: number
    averageDuration: number  // 毫秒
    lastActive: Date
  }
}

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline'

export interface Task {
  id: string
  blockId: string
  nodeId: string
  executionId: string

  inputs: Record<string, any>
  context: BlockContext

  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: number

  retryCount: number
  maxRetries: number

  createdAt: Date
  startedAt?: Date
  completedAt?: Date

  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
  onProgress?: (progress: ProgressEvent) => void
}

// ─── Block Registry ───────────────────────────────────────────

export interface BlockRegistry {
  register(block: Block): void
  unregister(blockId: string): void
  get(blockId: string): Block | undefined
  list(filter?: BlockFilter): Block[]
  exists(blockId: string): boolean
}

export interface BlockFilter {
  type?: BlockType
  category?: BlockCategory
  capabilities?: string[]
  search?: string
}
