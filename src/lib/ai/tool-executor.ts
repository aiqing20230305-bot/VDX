/**
 * Agent 工具执行器
 * 根据工具名称调用对应的后端API
 */
import type { ToolResult } from './agent-tools'
import { logger } from '@/lib/utils/logger'

const log = logger.context('ToolExecutor')

/**
 * 执行单个工具调用
 */
export async function executeToolCall(
  toolUseId: string,
  toolName: string,
  input: any
): Promise<ToolResult> {
  try {
    log.debug(`Executing ${toolName}`, input)

    switch (toolName) {
      case 'generate_script':
        return await executeGenerateScript(toolUseId, input)

      case 'select_script':
        return await executeSelectScript(toolUseId, input)

      case 'generate_storyboard':
        return await executeGenerateStoryboard(toolUseId, input)

      case 'generate_video':
        return await executeGenerateVideo(toolUseId, input)

      case 'ask_user_preference':
        return await executeAskUserPreference(toolUseId, input)

      case 'analyze_upload':
        return await executeAnalyzeUpload(toolUseId, input)

      default:
        return {
          toolUseId,
          toolName,
          error: `Unknown tool: ${toolName}`,
        }
    }
  } catch (error: any) {
    log.error(`Error executing ${toolName}:`, error)
    return {
      toolUseId,
      toolName,
      error: error.message || 'Tool execution failed',
    }
  }
}

/**
 * 执行多个工具调用（并行）
 */
export async function executeToolCalls(
  toolCalls: Array<{ id: string; name: string; input: any }>
): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(call => executeToolCall(call.id, call.name, call.input))
  )
}

// ─── 工具执行实现 ─────────────────────────────────────────────

async function executeGenerateScript(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  const response = await fetch('/api/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: input.topic,
      duration: input.duration || 30,
      aspectRatio: input.aspectRatio || '9:16',
      count: 3, // 默认生成3个变体
      style: input.style,
      images: input.images,
      audioPath: input.audioPath,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Script generation failed: ${error}`)
  }

  const { scripts } = await response.json()

  return {
    toolUseId,
    toolName: 'generate_script',
    result: {
      scripts,
      count: scripts.length,
    },
  }
}

async function executeSelectScript(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  // 选择脚本只是一个状态更新，不需要API调用
  // 前端会将选择的脚本保存到Agent状态
  return {
    toolUseId,
    toolName: 'select_script',
    result: {
      scriptIndex: input.scriptIndex,
      message: `Script ${input.scriptIndex + 1} selected`,
    },
  }
}

async function executeGenerateStoryboard(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  // script 已通过 ChatPanel 注入到 input 中
  if (!input.script) {
    return {
      toolUseId,
      toolName: 'generate_storyboard',
      error: 'No script selected. Please select a script first.',
    }
  }

  log.info('Generating storyboard with images...')

  const response = await fetch('/api/storyboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      script: input.script,
      fillImages: true, // 显式启用图片生成
      variantMode: input.variantMode || false,
      referenceImages: input.referenceImages || [],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Storyboard generation failed: ${error}`)
  }

  const { storyboard } = await response.json()

  log.info('Storyboard generated with', storyboard.frames.length, 'frames')
  log.debug('Frame URLs:', storyboard.frames.map((f: any) => f.imageUrl || 'no-url'))

  return {
    toolUseId,
    toolName: 'generate_storyboard',
    result: {
      storyboard,
      frameCount: storyboard.frames.length,
    },
  }
}

async function executeGenerateVideo(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  // storyboard 已通过 ChatPanel 注入到 input 中
  if (!input.storyboard) {
    return {
      toolUseId,
      toolName: 'generate_video',
      error: 'No storyboard available. Please generate storyboard first.',
    }
  }

  const response = await fetch('/api/video/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storyboard: input.storyboard,
      engine: input.engine || 'auto',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Video generation failed: ${error}`)
  }

  const { jobId, status } = await response.json()

  return {
    toolUseId,
    toolName: 'generate_video',
    result: {
      jobId,
      status,
      message: 'Video generation started',
    },
  }
}

async function executeAskUserPreference(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  // ask_user_preference 是一个特殊工具
  // 它不执行API调用，而是暂停Agent流程，等待用户输入
  // 返回问题信息，前端会渲染成UI让用户选择

  return {
    toolUseId,
    toolName: 'ask_user_preference',
    result: {
      question: input.question,
      options: input.options || [],
      waitingForUserInput: true,
    },
  }
}

async function executeAnalyzeUpload(
  toolUseId: string,
  input: any
): Promise<ToolResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: input.filePath,
      fileType: input.fileType,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Upload analysis failed: ${error}`)
  }

  const { analysis, suggestions } = await response.json()

  return {
    toolUseId,
    toolName: 'analyze_upload',
    result: {
      analysis,
      suggestions,
    },
  }
}
