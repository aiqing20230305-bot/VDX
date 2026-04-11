/**
 * Agent Coordinator - Agent协调器
 *
 * 职责：
 * 1. 管理ContentDirector和TechnicalExecutor之间的协作
 * 2. 路由用户请求到合适的Agent
 * 3. 协调Agent间的通信
 * 4. 维护工作流状态
 */

import type { ChatMessage } from '@/types'

// 只导入类型和常量，避免导入server-only依赖
export const CONTENT_DIRECTOR_AGENT = {
  id: 'content-director' as const,
  name: '内容架构师',
  avatar: '🎬',
  description: '我负责理解你的创意意图，规划视频的叙事结构和视觉风格',
}

export const TECHNICAL_EXECUTOR_AGENT = {
  id: 'technical-executor' as const,
  name: '技术执行专家',
  avatar: '⚙️',
  description: '我负责将创意方案转化为技术实现，选择最佳工具链路，优化生成效果',
}

// 工作流模式
export type WorkflowMode = 'auto' | 'collaborative'

// 工作流阶段
export type WorkflowStage =
  | 'understanding' // 理解需求
  | 'creative_planning' // 创意规划
  | 'technical_planning' // 技术规划
  | 'execution' // 执行生成
  | 'review' // 审查优化
  | 'completed' // 完成

// Agent间消息协议
export interface AgentMessage {
  from: 'content-director' | 'technical-executor' | 'coordinator' | 'user'
  to: 'content-director' | 'technical-executor' | 'coordinator' | 'user'
  type:
    | 'request' // 请求
    | 'response' // 响应
    | 'feedback' // 反馈
    | 'question' // 提问
    | 'notification' // 通知
  content: any
  metadata?: {
    timestamp: Date
    stage: WorkflowStage
    requiresUserConfirmation?: boolean
  }
}

// 工作流状态
export interface WorkflowState {
  mode: WorkflowMode
  stage: WorkflowStage
  currentAgent: 'content-director' | 'technical-executor' | null

  // 工作流数据
  data: {
    userInput?: {
      type: 'topic' | 'image' | 'video' | 'audio'
      content: any
    }
    creativeProposal?: any
    technicalPlan?: any
    executionResults?: any[]
  }

  // 对话历史
  conversationHistory: ChatMessage[]

  // Agent间通信日志
  agentMessages: AgentMessage[]
}

/**
 * Agent Coordinator 类
 */
export class AgentCoordinator {
  private state: WorkflowState

  constructor(mode: WorkflowMode = 'auto') {
    this.state = {
      mode,
      stage: 'understanding',
      currentAgent: null,
      data: {},
      conversationHistory: [],
      agentMessages: [],
    }
  }

  /**
   * 获取当前状态
   */
  getState(): WorkflowState {
    return { ...this.state }
  }

  /**
   * 设置工作流模式
   */
  setMode(mode: WorkflowMode) {
    this.state.mode = mode
  }

  /**
   * 处理用户输入
   */
  async handleUserInput(input: {
    type: 'topic' | 'image' | 'video' | 'audio'
    content: any
  }): Promise<{
    agent: 'content-director' | 'technical-executor'
    shouldStream: boolean
    requiresConfirmation: boolean
  }> {
    this.state.data.userInput = input

    // 根据输入类型和当前阶段，决定路由到哪个Agent
    if (this.state.stage === 'understanding' || this.state.stage === 'creative_planning') {
      // 创意阶段 → ContentDirector
      this.state.currentAgent = 'content-director'
      this.state.stage = 'creative_planning'

      return {
        agent: 'content-director',
        shouldStream: true,
        requiresConfirmation: this.state.mode === 'collaborative',
      }
    } else if (this.state.stage === 'technical_planning') {
      // 技术阶段 → TechnicalExecutor
      this.state.currentAgent = 'technical-executor'

      return {
        agent: 'technical-executor',
        shouldStream: false,
        requiresConfirmation: this.state.mode === 'collaborative',
      }
    }

    // 默认先给ContentDirector
    return {
      agent: 'content-director',
      shouldStream: true,
      requiresConfirmation: false,
    }
  }

  /**
   * 准备ContentDirector调用（由API route执行）
   */
  prepareContentDirectorCall(input: any) {
    this.logAgentMessage({
      from: 'coordinator',
      to: 'content-director',
      type: 'request',
      content: input,
      metadata: {
        timestamp: new Date(),
        stage: this.state.stage,
      },
    })
    return { agent: 'content-director', input }
  }

  /**
   * 准备TechnicalExecutor调用（由API route执行）
   */
  prepareTechnicalExecutorCall(input: any) {
    this.logAgentMessage({
      from: 'coordinator',
      to: 'technical-executor',
      type: 'request',
      content: input,
      metadata: {
        timestamp: new Date(),
        stage: this.state.stage,
      },
    })
    return { agent: 'technical-executor', input }
  }

  /**
   * 记录TechnicalExecutor响应
   */
  recordTechnicalExecutorResponse(result: any) {
    this.logAgentMessage({
      from: 'technical-executor',
      to: 'coordinator',
      type: 'response',
      content: result,
      metadata: {
        timestamp: new Date(),
        stage: this.state.stage,
      },
    })
  }

  /**
   * 保存创意方案
   */
  saveCreativeProposal(proposal: any) {
    this.state.data.creativeProposal = proposal
    this.state.stage = 'technical_planning'

    // 如果是自动模式，立即进入技术规划
    if (this.state.mode === 'auto') {
      this.state.currentAgent = 'technical-executor'
    }
  }

  /**
   * 保存技术方案
   */
  saveTechnicalPlan(plan: any) {
    this.state.data.technicalPlan = plan
    this.state.stage = 'execution'

    // 如果是自动模式，立即开始执行
    if (this.state.mode === 'auto') {
      /**
       * Future Enhancement: 自动触发视频生成流程
       *
       * 实现建议:
       * 1. 使用事件系统 (EventEmitter) 通知外部监听器
       * 2. 返回一个 Promise，让API route处理后续流程
       * 3. 集成异步任务队列 (BullMQ)，自动创建视频生成任务
       *
       * 示例:
       * ```typescript
       * this.emit('technicalPlanReady', {
       *   sessionId: this.state.sessionId,
       *   plan: this.state.data.technicalPlan,
       *   creativeProposal: this.state.data.creativeProposal
       * })
       * ```
       *
       * 当前架构: 前端通过UI交互手动触发视频生成
       * 未来架构: 自动模式下无需用户确认即可开始生成
       */
      // 暂不实现 - 需要重新设计API交互模式
    }
  }

  /**
   * Agent间通信
   *
   * 当前实现: 仅记录消息日志，不进行实际通信处理
   * 未来增强: 实现Agent间的双向反馈和迭代优化机制
   */
  async sendMessageBetweenAgents(
    from: 'content-director' | 'technical-executor',
    to: 'content-director' | 'technical-executor',
    content: any
  ): Promise<void> {
    this.logAgentMessage({
      from,
      to,
      type: 'request',
      content,
      metadata: {
        timestamp: new Date(),
        stage: this.state.stage,
      },
    })

    /**
     * Future Enhancement: Agent间通信处理逻辑
     *
     * 使用场景:
     * 1. TechnicalExecutor发现场景无法实现 → 通知ContentDirector调整创意方案
     * 2. ContentDirector提出新需求 → 请求TechnicalExecutor评估技术可行性
     * 3. 迭代优化: 双向反馈，持续改进方案
     *
     * 实现方案:
     * ```typescript
     * // 定义消息类型
     * type AgentMessageType =
     *   | { type: 'feasibility_issue'; scene: number; reason: string }
     *   | { type: 'adjustment_request'; changes: any }
     *   | { type: 'quality_concern'; metric: string; value: number }
     *
     * // 根据消息类型路由到对应Agent
     * if (to === 'content-director') {
     *   const response = await invokeContentDirector({
     *     type: 'adjustment',
     *     feedback: content
     *   })
     *   this.logAgentMessage({ from: to, to: from, type: 'response', content: response })
     * }
     * ```
     *
     * 依赖:
     * - Agent需要支持"调整模式"，接受反馈并重新生成方案
     * - 需要定义清晰的消息协议和错误处理机制
     * - 考虑最大迭代次数限制，避免无限循环
     *
     * 当前架构: 单向工作流（ContentDirector → TechnicalExecutor → 执行）
     * 未来架构: 双向反馈循环，支持迭代优化
     */
    // 暂不实现 - 需要重新设计Agent接口以支持反馈调整
  }

  /**
   * 记录Agent消息
   */
  private logAgentMessage(message: AgentMessage) {
    this.state.agentMessages.push(message)
  }

  /**
   * 添加对话历史
   */
  addToConversationHistory(message: ChatMessage) {
    this.state.conversationHistory.push(message)
  }

  /**
   * 清空状态（开始新项目）
   */
  reset() {
    this.state = {
      mode: this.state.mode, // 保留模式设置
      stage: 'understanding',
      currentAgent: null,
      data: {},
      conversationHistory: [],
      agentMessages: [],
    }
  }

  /**
   * 获取当前应该显示的Agent信息
   */
  getCurrentAgentInfo(): typeof CONTENT_DIRECTOR_AGENT | typeof TECHNICAL_EXECUTOR_AGENT | null {
    if (this.state.currentAgent === 'content-director') {
      return CONTENT_DIRECTOR_AGENT
    } else if (this.state.currentAgent === 'technical-executor') {
      return TECHNICAL_EXECUTOR_AGENT
    }
    return null
  }

  /**
   * 获取工作流进度描述
   */
  getProgressDescription(): string {
    const stageDescriptions: Record<WorkflowStage, string> = {
      understanding: '📋 理解你的需求...',
      creative_planning: '🎬 规划创意方案...',
      technical_planning: '⚙️ 设计技术方案...',
      execution: '🎥 生成视频中...',
      review: '👀 审查优化中...',
      completed: '✅ 完成！',
    }
    return stageDescriptions[this.state.stage]
  }

  /**
   * 判断是否需要用户确认
   */
  shouldRequestUserConfirmation(): boolean {
    if (this.state.mode === 'auto') {
      return false
    }

    // 协作模式下，这些阶段需要确认
    return (
      this.state.stage === 'creative_planning' ||
      this.state.stage === 'technical_planning'
    )
  }
}

/**
 * 创建全局协调器实例
 */
let globalCoordinator: AgentCoordinator | null = null

export function getGlobalCoordinator(mode?: WorkflowMode): AgentCoordinator {
  if (!globalCoordinator) {
    globalCoordinator = new AgentCoordinator(mode)
  }
  return globalCoordinator
}

export function resetGlobalCoordinator() {
  globalCoordinator = null
}
