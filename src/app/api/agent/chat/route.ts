/**
 * 超级视频Agent 对话API
 * 流式响应 + 工具调用执行
 */
import { NextRequest } from 'next/server'
import { getAgentInstance } from '@/lib/ai/agent-orchestrator'
import type { ToolResult } from '@/lib/ai/agent-tools'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 处理用户消息（初始或工具结果提交）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userMessage, toolResults } = body

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'sessionId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const agent = getAgentInstance(sessionId)

    let response

    if (toolResults) {
      // 提交工具执行结果，继续对话
      response = await agent.submitToolResults(toolResults as ToolResult[])
    } else if (userMessage) {
      // 处理用户消息
      response = await agent.processMessage(userMessage)
    } else {
      return new Response(JSON.stringify({ error: 'userMessage or toolResults required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    logger.error('[Agent Chat API] Request failed', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * 获取Agent状态
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'sessionId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const agent = getAgentInstance(sessionId)
    const state = agent.getState()

    return new Response(JSON.stringify(state), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
