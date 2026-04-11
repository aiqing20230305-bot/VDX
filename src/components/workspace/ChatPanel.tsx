/**
 * Chat Panel - 对话式生成界面
 * 集成真实Agent API，支持工具调用和流程编排
 */
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send, Loader2, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Frame } from '@/types/workspace'
import type { ChatMessage, QuickAction } from '@/types'
import { ChatMessage as ChatMessageComponent } from '@/components/chat/ChatMessage'
import { executeToolCalls } from '@/lib/ai/tool-executor'
import type { ToolResult } from '@/lib/ai/agent-tools'
import { useTranslation } from '@/lib/i18n/context'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/contexts/ToastContext'
import { parseError } from '@/lib/utils/error-messages'
import { WorkflowProgress, type WorkflowStep, type StepStatus } from '@/components/chat/WorkflowProgress'
import { generateSmartSuggestions, shouldShowSuggestions } from '@/lib/utils/smart-suggestions'
import { AgentCoordinator, type WorkflowMode } from '@/lib/ai/agents'
import { AgentIndicator } from '@/components/chat/AgentIndicator'
import { useIsMobile } from '@/hooks/useMediaQuery'

const log = logger.context('ChatPanel')
const MAX_INPUT_LENGTH = 2000
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000 // Base delay, will use exponential backoff

export type FlowStage = 'understanding' | 'scripting' | 'storyboarding' | 'completing' | null

interface ChatPanelProps {
  initialQuery?: string
  onGenerationComplete: (frames: Frame[]) => void
  onBackToWelcome: () => void
  onFlowStageChange?: (stage: FlowStage) => void
}

export function ChatPanel({ initialQuery, onGenerationComplete, onBackToWelcome, onFlowStageChange }: ChatPanelProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const isMobile = useIsMobile() // P0: 响应式设计
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<string | null>(null) // 临时进度提示
  const [flowStage, setFlowStage] = useState<FlowStage>(null) // 流程阶段
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null) // 失败的消息（用于重试）
  const [retryCount, setRetryCount] = useState(0) // 当前重试次数
  const sessionIdRef = useRef<string>('')
  const currentScriptsRef = useRef<any[]>([])
  const currentScriptRef = useRef<any>(null)
  const currentStoryboardRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // 选题流程状态
  const [isWaitingForTopics, setIsWaitingForTopics] = useState(false)
  const currentTopicsRef = useRef<any[]>([])
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  // 双Agent协作系统
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('auto') // 'auto' | 'collaborative'
  const coordinatorRef = useRef<AgentCoordinator | null>(null)
  const [useDualAgent, setUseDualAgent] = useState(false) // 开发者模式：启用双Agent系统

  // Helper: 创建消息ID
  const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // Helper: 创建标准格式ChatMessage
  const createMessage = (params: {
    role: 'user' | 'assistant'
    content: string
    type?: 'text' | 'action' | 'progress'
    streaming?: boolean
    tempId?: string
    metadata?: ChatMessage['metadata']
  }): ChatMessage => ({
    id: params.tempId || generateMessageId(),
    role: params.role,
    type: params.type || 'text',
    content: params.content,
    streaming: params.streaming,
    tempId: params.tempId,
    metadata: params.metadata,
    createdAt: new Date(),
  })

  // 生成 session ID
  useEffect(() => {
    sessionIdRef.current = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }, [])

  // 初始化Agent Coordinator
  useEffect(() => {
    if (!coordinatorRef.current) {
      coordinatorRef.current = new AgentCoordinator(workflowMode)
      log.info('AgentCoordinator initialized', { mode: workflowMode })
    }
  }, [workflowMode])

  // 滚动到底部
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  // 检测用户是否在底部
  const checkIfAtBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return true

    const threshold = 50 // 50px threshold
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    return isAtBottom
  }, [])

  // 监听滚动事件，检测用户是否手动滚动
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const isAtBottom = checkIfAtBottom()
      setShowScrollButton(!isAtBottom)

      // 如果用户滚动到底部，重新启用自动滚动
      if (isAtBottom && !autoScrollEnabled) {
        setAutoScrollEnabled(true)
      }
      // 如果用户向上滚动，暂停自动滚动
      else if (!isAtBottom && autoScrollEnabled) {
        setAutoScrollEnabled(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [autoScrollEnabled, checkIfAtBottom])

  // 新消息时自动滚动到底部（仅当启用自动滚动时）
  useEffect(() => {
    if (autoScrollEnabled && messages.length > 0) {
      // 延迟滚动，确保 DOM 已更新
      const timer = setTimeout(() => scrollToBottom(true), 100)
      return () => clearTimeout(timer)
    }
  }, [messages, autoScrollEnabled, scrollToBottom])

  // Helper: 更新flowStage并通知父组件
  const updateFlowStage = (stage: FlowStage) => {
    setFlowStage(stage)
    onFlowStageChange?.(stage)
  }

  // 自动处理初始query
  useEffect(() => {
    if (initialQuery && messages.length === 0) {
      handleSend(initialQuery)
    }
  }, [initialQuery])

  const handleSend = async (message?: string) => {
    const userMessage = message || input.trim()
    if (!userMessage || isProcessing) return

    if (!message) setInput('')

    // 1. 乐观UI：立即添加用户消息
    setMessages(prev => [...prev, createMessage({
      role: 'user',
      content: userMessage,
      type: 'text',
    })])

    // 2. 立即添加AI思考状态（骨架屏/思考中）
    const aiTempId = `ai-thinking-${Date.now()}`
    setMessages(prev => [...prev, createMessage({
      role: 'assistant',
      content: '',
      type: 'text',
      streaming: true,
      tempId: aiTempId,
    })])

    setIsProcessing(true)

    // 开始流程：设置为"理解需求"阶段
    if (!flowStage) {
      updateFlowStage('understanding')
      setCurrentProgress(t('chat.progress.understanding'))
    }

    try {
      // 根据模式选择处理函数
      if (useDualAgent) {
        await processDualAgentMessage(userMessage)
      } else {
        await processAgentMessage(userMessage)
      }

      setLastFailedMessage(null) // 清除之前失败的消息
      setRetryCount(0) // 重置重试计数

      // 3. 成功后移除思考状态消息（实际消息会在processAgentMessage中添加）
      setMessages(prev => prev.filter(msg => msg.tempId !== aiTempId))
    } catch (error) {
      log.error('Error processing message:', error)

      // 保存失败的消息，用于重试
      setLastFailedMessage(userMessage)

      // 自动重试逻辑
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const nextRetryCount = retryCount + 1
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount) // 指数退避：1s, 2s, 4s

        log.info(`Auto-retry attempt ${nextRetryCount}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`)

        // 显示重试提示
        toast.showInfo(
          '自动重试中...',
          `第 ${nextRetryCount}/${MAX_RETRY_ATTEMPTS} 次重试 (${delay / 1000}s后)`
        )

        setRetryCount(nextRetryCount)

        // 延迟后自动重试
        setTimeout(() => {
          handleRetry(userMessage)
        }, delay)

        return // 不显示错误消息，直接重试
      }

      // 超过最大重试次数，显示错误
      log.error('Max retry attempts reached')
      setRetryCount(0) // 重置重试计数

      // 使用友好的错误消息
      const friendlyError = parseError(error)

      // Toast显示错误并提供手动重试按钮
      toast.showError(friendlyError.title, friendlyError.message, {
        label: t('common.retry') || '重试',
        onClick: () => {
          setRetryCount(0) // 重置计数器
          handleRetry(userMessage)
        },
      })

      // 移除思考状态消息，添加错误消息
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.tempId !== aiTempId)
        return [...filtered, createMessage({
          role: 'assistant',
          content: `**${friendlyError.title}**\n\n${friendlyError.message}\n\n已自动重试 ${MAX_RETRY_ATTEMPTS} 次，请检查网络连接或稍后再试。`,
          type: 'text',
        })]
      })
      setIsProcessing(false)
      setCurrentProgress(null)
    }
  }

  /**
   * 重试上次失败的请求
   */
  const handleRetry = async (messageToRetry: string) => {
    if (isProcessing) return

    log.info('Retrying failed message:', messageToRetry)
    toast.showInfo('重试中...', '正在重新发送请求')

    setIsProcessing(true)
    setCurrentProgress(t('chat.progress.understanding'))

    try {
      if (useDualAgent) {
        await processDualAgentMessage(messageToRetry)
      } else {
        await processAgentMessage(messageToRetry)
      }
      setLastFailedMessage(null)
      toast.showSuccess('重试成功', '请求已重新发送')
    } catch (error) {
      log.error('Retry failed:', error)
      const friendlyError = parseError(error)
      toast.showError('重试失败', friendlyError.message, {
        label: '再试一次',
        onClick: () => handleRetry(messageToRetry),
      })
      setIsProcessing(false)
      setCurrentProgress(null)
    }
  }

  /**
   * 处理双Agent系统消息（实验性）- 支持流式响应
   */
  const processDualAgentMessage = async (userMessage: string) => {
    try {
      if (!coordinatorRef.current) {
        coordinatorRef.current = new AgentCoordinator(workflowMode)
      }

      // 更新coordinator模式
      coordinatorRef.current.setMode(workflowMode)

      // 调用双Agent API（流式）
      const response = await fetch('/api/agent/dual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userInput: {
            /**
             * Input Type Detection
             *
             * 当前: 固定为 'topic' 类型
             * 目标: 根据用户输入智能识别类型（topic/image/audio）
             *
             * 实现建议:
             * 1. 检测文件附件:
             *    - 如果用户上传了图片 → type: 'image'
             *    - 如果用户上传了音频 → type: 'audio'
             *    - 否则默认 → type: 'topic'
             *
             * 2. 检测逻辑:
             *    const detectInputType = (message: string, attachments?: File[]) => {
             *      if (attachments && attachments.length > 0) {
             *        const firstFile = attachments[0]
             *        if (firstFile.type.startsWith('image/')) return 'image'
             *        if (firstFile.type.startsWith('audio/')) return 'audio'
             *      }
             *      return 'topic'
             *    }
             *
             * 3. 附件数据结构:
             *    - 添加 useState: const [attachments, setAttachments] = useState<File[]>([])
             *    - ChatInput 组件支持文件上传
             *    - 传递 attachments 到 API:
             *      userInput: {
             *        type: detectInputType(userMessage, attachments),
             *        content: userMessage,
             *        attachments: attachments.map(f => ({
             *          name: f.name,
             *          type: f.type,
             *          url: await uploadFile(f) // 先上传到 /api/upload
             *        }))
             *      }
             *
             * 4. API 处理:
             *    - /api/agent/dual 根据 type 路由不同处理逻辑
             *    - type: 'image' → 调用图片分析 API
             *    - type: 'audio' → 调用音频分析 API
             *    - type: 'topic' → 正常文本处理
             *
             * 参考:
             * - src/app/legacy/page.tsx（已支持图片上传检测）
             * - src/components/chat/ChatInput.tsx（需增加附件上传）
             */
            type: 'topic',
            content: userMessage,
          },
          mode: workflowMode,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      // 检查是否是流式响应
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // 流式响应处理
        await handleStreamingResponse(response)
      } else {
        // 非流式响应（TechnicalExecutor）
        const result = await response.json()
        log.debug('Dual Agent response received', result)

        if (result.type === 'technical_executor_response') {
          // TechnicalExecutor的结构化响应
          setMessages(prev => [...prev, createMessage({
            role: 'assistant',
            content: `⚙️ **技术方案**\n\n${JSON.stringify(result.content, null, 2)}`,
            type: 'text',
            metadata: {
              agent: 'technical-executor',
              stage: result.stage,
            },
          })])
        }
      }

      setCurrentProgress(null)
      setIsProcessing(false)
    } catch (error) {
      throw error
    }
  }

  /**
   * 处理SSE流式响应
   */
  const handleStreamingResponse = async (response: Response) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let accumulatedContent = ''
    let aiMessageId: string | null = null

    try {
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const event = JSON.parse(data)

              if (event.type === 'chunk') {
                // 流式内容块
                accumulatedContent += event.content

                if (!aiMessageId) {
                  // 创建新的AI消息
                  const newMsg = createMessage({
                    role: 'assistant',
                    content: accumulatedContent,
                    type: 'text',
                    streaming: true,
                    metadata: {
                      agent: event.agent,
                      stage: event.stage,
                    },
                  })
                  aiMessageId = newMsg.id
                  setMessages(prev => [...prev, newMsg])
                } else {
                  // 更新现有消息
                  setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ))
                }
              } else if (event.type === 'done') {
                // 流式完成
                if (aiMessageId) {
                  setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, streaming: false }
                      : msg
                  ))
                }

                // 如果需要确认
                if (event.requiresConfirmation) {
                  const confirmAction: QuickAction = {
                    id: 'confirm_creative',
                    label: '确认创意方案',
                    action: 'confirm_creative_proposal',
                    variant: 'primary',
                  }
                  setMessages(prev => [...prev, createMessage({
                    role: 'assistant',
                    content: '💡 提示：请确认上述创意方案，确认后将进入技术规划阶段。',
                    type: 'action',
                    metadata: { actions: [confirmAction] },
                  })])
                }
              } else if (event.type === 'error') {
                throw new Error(event.error)
              }
            } catch (parseError) {
              log.error('Failed to parse SSE data:', parseError, data)
            }
          }
        }
      }
    } finally {
      reader?.releaseLock()
    }
  }

  /**
   * 处理Agent消息（核心流程）
   */
  const processAgentMessage = async (userMessage: string, toolResults?: ToolResult[]) => {
    try {
      // 调用 Agent API
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          userMessage: toolResults ? undefined : userMessage,
          toolResults,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const agentMessage = await response.json()
      log.debug('Agent response received', agentMessage)

      // 处理不同类型的响应
      if (agentMessage.type === 'tool_call') {
        // Agent 想要调用工具
        await handleToolCalls(agentMessage)
      } else if (agentMessage.type === 'text') {
        // 纯文本响应

        // 如果正在等待选题推荐，尝试解析JSON
        if (isWaitingForTopics) {
          try {
            // 尝试从响应中提取JSON
            const jsonMatch = agentMessage.content.match(/\{[\s\S]*"topics"[\s\S]*\}/)
            if (jsonMatch) {
              const topicsData = JSON.parse(jsonMatch[0])
              if (topicsData.topics && Array.isArray(topicsData.topics)) {
                currentTopicsRef.current = topicsData.topics

                // 创建选题卡片消息（使用QuickActions显示）
                const topicActions: QuickAction[] = topicsData.topics.map((topic: any, index: number) => ({
                  id: `topic_${index}`,
                  label: topic.title,
                  description: `${topic.description} | ${topic.style} | ${topic.duration}秒`,
                  action: 'select_topic',
                  params: { topicIndex: index },
                  variant: 'secondary' as const,
                }))

                setMessages(prev => [...prev, createMessage({
                  role: 'assistant',
                  content: '💡 提示：已为你推荐以下选题，点击选择一个开始创作',
                  type: 'action',
                  metadata: { actions: topicActions },
                })])

                setIsWaitingForTopics(false)
                setIsProcessing(false)
                return
              }
            }
          } catch (error) {
            log.error('Failed to parse topics JSON', error)
            // 如果解析失败，继续正常显示文本
          }
          setIsWaitingForTopics(false)
        }

        const suggestionContext = {
          messageContent: agentMessage.content,
          hasScript: !!currentScriptRef.current,
          hasStoryboard: !!currentStoryboardRef.current,
          currentStage: flowStage || undefined,
        }

        // 生成智能建议
        const smartActions = shouldShowSuggestions(suggestionContext)
          ? generateSmartSuggestions(suggestionContext)
          : []

        setMessages(prev => [...prev, createMessage({
          role: 'assistant',
          content: agentMessage.content,
          type: 'text',
          metadata: smartActions.length > 0 ? { actions: smartActions } : undefined,
        })])

        // 清除临时进度
        setCurrentProgress(null)
        setIsProcessing(false)

        // 检查是否完成生成
        await checkGenerationComplete()
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * 处理工具调用
   */
  const handleToolCalls = async (agentMessage: any) => {
    const { toolCalls, content } = agentMessage

    // 显示Agent的思考过程（仅显示重要信息）
    if (content && !content.includes('工具') && !content.includes('调用')) {
      setMessages(prev => [...prev, createMessage({
        role: 'assistant',
        content,
        type: 'text',
      })])
    }

    // 执行所有工具调用，注入必要的上下文
    log.debug('Executing tools', { count: toolCalls.length })

    // 为工具调用注入上下文信息
    const toolCallsWithContext = toolCalls.map((call: any) => {
      if (call.name === 'generate_storyboard' && currentScriptRef.current) {
        // 注入当前选中的脚本
        return {
          ...call,
          input: {
            ...call.input,
            script: currentScriptRef.current,
          },
        }
      }
      if (call.name === 'generate_video' && currentStoryboardRef.current) {
        // 注入当前分镜
        return {
          ...call,
          input: {
            ...call.input,
            storyboard: currentStoryboardRef.current,
          },
        }
      }
      return call
    })

    const results: ToolResult[] = await executeToolCalls(toolCallsWithContext)

    // 处理特殊工具：ask_user_preference
    const questionResult = results.find(r => r.toolName === 'ask_user_preference')
    if (questionResult && questionResult.result?.waitingForUserInput) {
      // 显示选项让用户选择
      setMessages(prev => [...prev, createMessage({
        role: 'assistant',
        content: questionResult.result.question,
        type: 'action',
        metadata: {
          actions: questionResult.result.options.map((opt: any, idx: number) => ({
            id: `option-${idx}`,
            label: opt.label,
            action: 'select_option',
            params: { value: opt.value || opt.label },
            variant: 'secondary' as const,
          }))
        },
      })])
      setIsProcessing(false)
      return
    }

    // 保存关键数据到 ref
    results.forEach(result => {
      if (result.toolName === 'generate_script' && result.result?.scripts) {
        // 暂存生成的脚本列表
        currentScriptsRef.current = result.result.scripts
        log.debug('Scripts generated', { count: result.result.scripts.length })

        // 显示成功提示
        toast.showSuccess(
          '脚本生成完成',
          `已生成 ${result.result.scripts.length} 个脚本方案供选择`
        )
      } else if (result.toolName === 'select_script') {
        // 暂存选择的脚本
        const scriptIndex = result.result?.scriptIndex ?? 0
        if (currentScriptsRef.current[scriptIndex]) {
          currentScriptRef.current = currentScriptsRef.current[scriptIndex]
          log.debug('Script selected', { index: scriptIndex })
        }
      } else if (result.toolName === 'generate_storyboard' && result.result?.storyboard) {
        // 保存分镜板
        currentStoryboardRef.current = result.result.storyboard
        log.info('Storyboard generated', { frameCount: result.result.frameCount })

        // 显示成功提示
        toast.showSuccess(
          '分镜生成完成',
          `已生成 ${result.result.frameCount} 个分镜帧，准备跳转到编辑器`
        )
      }
    })

    // 更新流程进度（临时显示，不添加到消息列表）
    results.forEach(result => {
      if (result.error) {
        setMessages(prev => [...prev, createMessage({
          role: 'assistant',
          content: `${t('chat.error.warning')}${result.error}`,
          type: 'text',
        })])
      } else {
        // 更新临时进度和流程阶段
        if (result.toolName === 'generate_script') {
          setCurrentProgress(t('chat.progress.scripting'))
          updateFlowStage('scripting')
        } else if (result.toolName === 'select_script') {
          setCurrentProgress(t('chat.progress.storyboarding'))
          updateFlowStage('storyboarding')
        } else if (result.toolName === 'generate_storyboard') {
          setCurrentProgress(t('chat.progress.completing'))
          updateFlowStage('completing')
        } else if (result.toolName === 'generate_video') {
          setCurrentProgress(t('chat.progress.videoGenerating'))
        }

        // 1秒后清除临时进度
        setTimeout(() => {
          setCurrentProgress(null)
        }, 2000)
      }
    })

    // 提交工具结果给Agent，继续对话
    await processAgentMessage('', results)
  }

  /**
   * 检查生成是否完成，如果完成则跳转Timeline
   */
  const checkGenerationComplete = async () => {
    if (currentStoryboardRef.current) {
      const storyboard = currentStoryboardRef.current

      // 转换为 Frame 格式
      const frames: Frame[] = storyboard.frames.map((frame: any, index: number) => ({
        id: `frame-${index + 1}`,
        index,
        imagePrompt: frame.imagePrompt || frame.prompt,
        sceneDescription: frame.sceneDescription || frame.description,
        duration: frame.duration || 3,
        cameraMove: frame.cameraMove,
        imageUrl: frame.imageUrl || frame.url,
      }))

      log.info('Generation complete, navigating to Timeline', { frameCount: frames.length })

      // 显示完成提示
      setMessages(prev => [...prev, createMessage({
        role: 'assistant',
        content: t('chat.complete').replace('{{count}}', String(frames.length)),
        type: 'text',
      })])

      // 延迟让用户看到完成消息
      await new Promise(resolve => setTimeout(resolve, 1500))

      onGenerationComplete(frames)
    }
  }

  /**
   * 处理QuickAction点击
   */
  const handleAction = async (action: string, params?: Record<string, unknown>) => {
    log.debug('QuickAction triggered', { action, params })

    // 根据action类型执行不同逻辑
    switch (action) {
      case 'select_option':
        // 处理选项选择(来自ask_user_preference)
        const optionValue = params?.value as string
        setMessages(prev => [...prev, createMessage({
          role: 'user',
          content: optionValue,
          type: 'text',
        })])
        setIsProcessing(true)
        await processAgentMessage(optionValue)
        break

      case 'suggest_topics':
        // 选题推荐流程
        setMessages(prev => [...prev, createMessage({
          role: 'user',
          content: '帮我推荐一些选题',
          type: 'text',
        })])
        setIsWaitingForTopics(true)
        setIsProcessing(true)
        await processAgentMessage('请推荐5个视频选题，返回JSON格式：{"topics":[{"title":"...","description":"...","style":"...","duration":15,"tags":[]}]}')
        break

      case 'select_topic':
        // 用户选择了一个选题
        const topicIndex = params?.topicIndex as number
        const selectedTopic = currentTopicsRef.current[topicIndex]
        if (selectedTopic) {
          setMessages(prev => [...prev, createMessage({
            role: 'user',
            content: `我选择：${selectedTopic.title}`,
            type: 'text',
          })])
          setIsProcessing(true)
          // 直接进入脚本生成，带上选题信息
          await processAgentMessage(`我要创作关于"${selectedTopic.title}"的视频。${selectedTopic.description}。请生成脚本。`)
        }
        break

      case 'confirm_creative_proposal':
        // 双Agent系统：确认创意方案，进入技术规划
        if (coordinatorRef.current) {
          const currentProposal = coordinatorRef.current.getState().data.creativeProposal
          if (currentProposal) {
            // 保存创意方案到coordinator
            coordinatorRef.current.saveCreativeProposal(currentProposal)

            setMessages(prev => [...prev, createMessage({
              role: 'user',
              content: '✅ 确认创意方案，请进入技术规划阶段',
              type: 'text',
            })])

            setIsProcessing(true)

            // 调用dual API进入技术规划阶段
            try {
              const response = await fetch('/api/agent/dual', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: sessionIdRef.current,
                  type: 'creative_proposal',
                  data: currentProposal,
                }),
              })

              if (response.ok) {
                toast.showSuccess('进入技术规划', '正在分析可行性...')
              }
            } catch (error) {
              log.error('Failed to save creative proposal', error)
              toast.showError('保存失败', '无法保存创意方案')
            } finally {
              setIsProcessing(false)
            }
          }
        }
        break

      default:
        // 其他action暂时转换为文本消息发送给Agent
        const actionMessage = `${action}${params ? ` ${JSON.stringify(params)}` : ''}`
        setMessages(prev => [...prev, createMessage({
          role: 'user',
          content: actionMessage,
          type: 'text',
        })])
        setIsProcessing(true)
        await processAgentMessage(actionMessage)
        break
    }
  }

  // 流程阶段映射：flowStage -> WorkflowStep
  const getCurrentStep = (): WorkflowStep => {
    switch (flowStage) {
      case 'understanding': return 'topic'
      case 'scripting': return 'script'
      case 'storyboarding': return 'storyboard'
      case 'completing': return 'video'
      default: return 'topic'
    }
  }

  // 计算每个步骤的状态
  const getStepStatuses = (): Record<WorkflowStep, StepStatus> => {
    const currentStep = getCurrentStep()
    const stepOrder: WorkflowStep[] = ['topic', 'script', 'storyboard', 'video']
    const currentIndex = stepOrder.indexOf(currentStep)

    return {
      topic: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'in-progress' : 'pending',
      script: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'in-progress' : 'pending',
      storyboard: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'in-progress' : 'pending',
      video: currentIndex === 3 ? 'in-progress' : 'pending',
    }
  }

  // P0: 判断流程是否完成（用于隐藏过时的QuickActions）
  const isFlowCompleted = currentStoryboardRef.current !== null || flowStage === 'completing'

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* 顶部导航 + 流程进度 - P1.3: 固定在顶部 */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onBackToWelcome}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('chat.backButton')}
          </button>

          {/* 工作流进度指示器 - 始终显示（修复P0问题）*/}
          <div className="flex items-center gap-4">
            <WorkflowProgress
              currentStep={getCurrentStep()}
              stepStatuses={getStepStatuses()}
              compact={isMobile}
              className="max-w-2xl"
            />

            {/* Agent指示器 - 显示当前工作的Agent */}
            {useDualAgent && coordinatorRef.current && coordinatorRef.current.getCurrentAgentInfo() && (
              <AgentIndicator
                currentAgent={coordinatorRef.current.getCurrentAgentInfo()!}
                stage={coordinatorRef.current.getState().stage}
              />
            )}
          </div>

          {/* 开发者控制（双Agent开关 + 模式切换） */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseDualAgent(!useDualAgent)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg border transition',
                useDualAgent
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'
              )}
              title={useDualAgent ? '点击关闭双Agent系统' : '点击启用双Agent系统（实验性）'}
            >
              {useDualAgent ? '🤖 双Agent' : '单Agent'}
            </button>
            {useDualAgent && (
              <button
                onClick={() => setWorkflowMode(prev => prev === 'auto' ? 'collaborative' : 'auto')}
                className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                title={workflowMode === 'auto' ? '全自动模式' : '协作模式（需确认）'}
              >
                {workflowMode === 'auto' ? '⚡ Auto' : '🤝 Collab'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 relative" data-tour="chat-area">
        {messages.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p className="text-sm">{t('chat.emptyState')}</p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          {/* 渲染消息列表 - Task #236: 添加消息分组 */}
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1]
            // 检测对话轮次变化：上一条AI → 当前用户 + 时间间隔>1分钟
            const isNewRound = index > 0 && prevMsg && (
              prevMsg.role === 'assistant' &&
              msg.role === 'user' &&
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 60000
            )

            return (
              <div key={msg.id}>
                {/* Task #236: 对话轮次分隔符 */}
                {isNewRound && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                    <span className="text-[10px] text-[var(--text-tertiary)] font-medium font-['DM_Sans']">
                      新对话轮次
                    </span>
                    <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  </div>
                )}

                <ChatMessageComponent
                  message={msg}
                  onAction={handleAction}
                  hideActions={isFlowCompleted} // P0: 流程完成后隐藏QuickActions
                />
              </div>
            )
          })}

          {/* 临时进度提示（浮动显示，自动消失） */}
          {currentProgress && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2 text-cyan-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{currentProgress}</span>
                </div>
              </div>
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 新消息提示按钮 - P1.2 Enhanced */}
        {showScrollButton && (
          <button
            onClick={() => {
              setAutoScrollEnabled(true)
              scrollToBottom(true)
            }}
            className={cn(
              'fixed bottom-24 left-1/2 -translate-x-1/2', // 居中显示
              'px-4 py-2 rounded-full',
              'bg-[var(--accent-primary)] text-white text-sm font-medium',
              'shadow-lg hover:shadow-xl hover:scale-105',
              'transition-all duration-200',
              'flex items-center gap-2 z-10',
              'animate-bounce-subtle', // 新增：subtle bounce
              'hover:bg-[var(--accent-hover)]'
            )}
            aria-label="查看新消息"
          >
            <ArrowDown className="w-4 h-4" />
            <span>新消息</span>
          </button>
        )}
      </div>

      {/* 输入框 */}
      <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={t('chat.inputPlaceholder')}
            className="w-full h-14 bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-14 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition placeholder-zinc-600"
            disabled={isProcessing}
            maxLength={MAX_INPUT_LENGTH}
          />
          <button
            onClick={() => handleSend()}
            disabled={isProcessing || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 rounded-lg flex items-center justify-center transition shadow-lg shadow-cyan-500/20 disabled:shadow-none"
            aria-label={t('chat.sendButton')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {/* 输入提示和字符计数 */}
        <div className="flex items-center justify-between mt-2 text-xs text-zinc-600">
          <div className="flex items-center gap-2">
            <span className={`transition-colors ${input.length > MAX_INPUT_LENGTH * 0.9 ? 'text-yellow-500' : ''} ${input.length === MAX_INPUT_LENGTH ? 'text-red-500 font-medium' : ''}`}>
              {input.length}/{MAX_INPUT_LENGTH}
            </span>
            {input.length > MAX_INPUT_LENGTH * 0.9 && (
              <span className="text-yellow-500">接近字数限制</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono">Enter</kbd>
            <span>发送消息</span>
          </div>
        </div>
      </div>
    </div>
  )
}
