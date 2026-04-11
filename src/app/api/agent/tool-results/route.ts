/**
 * POST /api/agent/tool-results
 * 提交工具执行结果，继续Agent对话
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAgentInstance } from '@/lib/ai/agent-orchestrator'
import type { ToolResult } from '@/lib/ai/agent-tools'
import { logger } from '@/lib/utils/logger'

const log = logger.context('AgentToolResultsAPI')

export async function POST(req: NextRequest) {
  try {
    const { sessionId, results } = await req.json() as {
      sessionId: string
      results: ToolResult[]
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Tool results required' }, { status: 400 })
    }

    const agent = getAgentInstance(sessionId)

    // 提交结果并继续对话
    const response = await agent.submitToolResults(results)

    return NextResponse.json({
      sessionId,
      response,
      state: agent.getState(),
    })
  } catch (error) {
    log.error('Failed to process tool results', error)
    const message = error instanceof Error ? error.message : 'Failed to process tool results'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
