/**
 * POST /api/agent/message
 * 智能Agent对话入口
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAgentInstance } from '@/lib/ai/agent-orchestrator'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/utils/logger'

const log = logger.context('AgentMessageAPI')

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId: providedSessionId } = await req.json() as {
      message: string
      sessionId?: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // 获取或创建会话
    const sessionId = providedSessionId || uuid()
    const agent = getAgentInstance(sessionId)

    // 处理消息
    const response = await agent.processMessage(message)

    return NextResponse.json({
      sessionId,
      response,
      state: agent.getState(),
    })
  } catch (error) {
    log.error('Failed to process message', error)
    const message = error instanceof Error ? error.message : 'Failed to process message'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
