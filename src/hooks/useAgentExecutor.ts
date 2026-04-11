/**
 * Agent 执行器 Hook
 * 自动处理工具调用循环，驱动视频生成流程
 */
import { useState, useCallback, useRef } from 'react'
import type { ToolResult } from '@/lib/ai/agent-tools'
import type { Script, Storyboard, VideoJob } from '@/types'

interface AgentMessage {
  type: 'text' | 'tool_call' | 'tool_result' | 'question'
  content: string
  toolCalls?: Array<{
    id: string  // tool_use_id from Claude
    name: string
    input: any
  }>
  question?: {
    question: string
    options?: Array<{ label: string; value: string }>
  }
}

interface AgentState {
  currentScript?: Script
  currentStoryboard?: Storyboard
  videoJob?: VideoJob
}

export function useAgentExecutor() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentState, setCurrentState] = useState<AgentState>({})
  const [logs, setLogs] = useState<string[]>([])

  // 生成的脚本列表（用于用户选择）
  const scriptsRef = useRef<Script[]>([])

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1]}] ${msg}`])
  }, [])

  /**
   * 执行单个工具
   */
  const executeTool = useCallback(async (
    toolUseId: string,
    toolName: string,
    input: any
  ): Promise<ToolResult> => {
    addLog(`🔧 执行工具: ${toolName}`)

    try {
      switch (toolName) {
        case 'generate_script': {
          const res = await fetch('/api/script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: input.topic,
              duration: input.duration || 30,
              aspectRatio: input.aspectRatio || '9:16',
              count: 3,
              style: input.style,
              images: input.images,
              audioPath: input.audioPath,
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)

          // 保存脚本列表
          scriptsRef.current = data.scripts || []

          addLog(`✅ 生成了 ${scriptsRef.current.length} 个脚本方案`)

          return {
            toolUseId,
            toolName,
            result: { scripts: scriptsRef.current },
          }
        }

        case 'select_script': {
          const scriptIndex = input.scriptIndex
          if (scriptIndex < 0 || scriptIndex >= scriptsRef.current.length) {
            throw new Error(`Invalid script index: ${scriptIndex}`)
          }

          const selected = scriptsRef.current[scriptIndex]
          setCurrentState(prev => ({ ...prev, currentScript: selected }))

          addLog(`✅ 选择了脚本 ${String.fromCharCode(65 + scriptIndex)}`)

          return {
            toolUseId,
            toolName,
            result: { script: selected },
          }
        }

        case 'generate_storyboard': {
          if (!currentState.currentScript) {
            throw new Error('No script selected')
          }

          const res = await fetch('/api/storyboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              script: currentState.currentScript,
              variantMode: input.variantMode || false,
              referenceImages: input.referenceImages || [],
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)

          setCurrentState(prev => ({ ...prev, currentStoryboard: data.storyboard }))

          addLog(`✅ 生成了 ${data.storyboard?.frames?.length || 0} 帧分镜`)

          return {
            toolUseId,
            toolName,
            result: { storyboard: data.storyboard },
          }
        }

        case 'generate_video': {
          if (!currentState.currentStoryboard) {
            throw new Error('No storyboard available')
          }

          const engine = input.engine || 'auto'

          // 启动视频生成（后台任务）
          const res = await fetch('/api/video/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storyboard: currentState.currentStoryboard,
              engine,
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)

          // 创建 VideoJob 对象
          const videoJob = {
            id: data.jobId,
            status: 'pending',
            progress: 0,
            createdAt: new Date(),
            engine: engine,
            logs: [{ timestamp: new Date(), message: '任务已创建', level: 'info' }],
          } as any

          setCurrentState(prev => ({ ...prev, videoJob }))

          addLog(`✅ 视频生成任务已启动: ${data.jobId}`)

          return {
            toolUseId,
            toolName,
            result: { jobId: data.jobId, engine },
          }
        }

        case 'ask_user_preference': {
          // 特殊处理：不实际执行，而是返回给前端让用户回答
          addLog(`❓ 等待用户回答: ${input.question}`)

          return {
            toolUseId,
            toolName,
            result: {
              requiresUserInput: true,
              question: input.question,
              options: input.options,
            },
          }
        }

        case 'analyze_upload': {
          // 调用分析API（图片/视频/音频）
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: input.filePath,
              fileType: input.fileType,
            }),
          })
          const data = await res.json()
          if (data.error) throw new Error(data.error)

          addLog(`✅ 分析完成: ${input.fileType}`)

          return {
            toolUseId,
            toolName,
            result: data.analysis,
          }
        }

        default:
          throw new Error(`Unknown tool: ${toolName}`)
      }
    } catch (error) {
      addLog(`❌ 工具执行失败: ${error instanceof Error ? error.message : String(error)}`)
      return {
        toolUseId,
        toolName,
        result: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [currentState, addLog])

  /**
   * 发送消息到Agent，自动处理工具调用循环
   */
  const sendMessage = useCallback(async (
    userMessage: string
  ): Promise<{
    finalResponse: string
    requiresUserInput?: {
      question: string
      options?: Array<{ label: string; value: string }>
    }
  }> => {
    setIsProcessing(true)
    addLog(`📝 用户: ${userMessage}`)

    try {
      // 1. 发送消息到Agent
      let res = await fetch('/api/agent/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId || undefined,
        }),
      })

      let data = await res.json()

      // 保存会话ID
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
      }

      // 更新状态
      if (data.state) {
        setCurrentState(prev => ({ ...prev, ...data.state }))
      }

      // 2. 循环处理工具调用
      let maxIterations = 10 // 防止无限循环
      let iterations = 0

      while (data.response?.type === 'tool_call' && iterations < maxIterations) {
        iterations++
        addLog(`🔄 Agent 请求调用 ${data.response.toolCalls.length} 个工具`)

        // 执行所有工具
        const results: ToolResult[] = await Promise.all(
          data.response.toolCalls.map((call: any) =>
            executeTool(call.id, call.name, call.input)
          )
        )

        // 检查是否有工具需要用户输入
        const userInputTool = results.find(r => r.result?.requiresUserInput)
        if (userInputTool) {
          // 需要用户输入，暂停循环
          addLog(`⏸️ 等待用户输入...`)
          return {
            finalResponse: data.response.content || '请回答以下问题：',
            requiresUserInput: {
              question: userInputTool.result.question,
              options: userInputTool.result.options,
            },
          }
        }

        // 3. 提交工具结果到Agent
        res = await fetch('/api/agent/tool-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: data.sessionId,
            results,
          }),
        })

        data = await res.json()

        // 更新状态
        if (data.state) {
          setCurrentState(prev => ({ ...prev, ...data.state }))
        }
      }

      // 4. 返回最终文本响应
      addLog(`✅ Agent: ${data.response.content}`)

      return {
        finalResponse: data.response.content,
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      addLog(`❌ 处理失败: ${errMsg}`)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, addLog, executeTool])

  /**
   * 重置会话
   */
  const reset = useCallback(() => {
    setSessionId(null)
    setCurrentState({})
    setLogs([])
    scriptsRef.current = []
  }, [])

  return {
    sendMessage,
    isProcessing,
    currentState,
    logs,
    reset,
  }
}
