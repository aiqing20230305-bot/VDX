/**
 * 双Agent协作系统 API
 * ContentDirector + TechnicalExecutor
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  AgentCoordinator,
  type WorkflowMode,
} from '@/lib/ai/agents/agent-coordinator'
import { invokeContentDirector } from '@/lib/ai/agents/content-director'
import { invokeTechnicalExecutor } from '@/lib/ai/agents/technical-executor'
import { logger } from '@/lib/utils/logger'

// Session store (in-memory for now)
const coordinators = new Map<string, AgentCoordinator>()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 获取或创建coordinator实例
 */
function getCoordinator(sessionId: string, mode: WorkflowMode = 'auto'): AgentCoordinator {
  if (!coordinators.has(sessionId)) {
    coordinators.set(sessionId, new AgentCoordinator(mode))
  }
  return coordinators.get(sessionId)!
}

/**
 * POST - 处理用户输入
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userInput, mode = 'auto' } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    if (!userInput) {
      return NextResponse.json({ error: 'userInput required' }, { status: 400 })
    }

    const coordinator = getCoordinator(sessionId, mode)

    // 路由用户输入
    const routing = await coordinator.handleUserInput(userInput)

    logger.info('[Dual Agent] Routing decision', { routing, sessionId })

    // 根据路由决策调用相应Agent
    if (routing.agent === 'content-director') {
      // 准备调用（记录日志）
      coordinator.prepareContentDirectorCall({
        type: userInput.type === 'topic' ? 'topic' : 'reference',
        topic: userInput.type === 'topic' ? userInput.content : undefined,
        reference: userInput.type !== 'topic' ? userInput.content : undefined,
      })

      // 直接调用server-only函数
      const generator = invokeContentDirector(
        {
          type: userInput.type === 'topic' ? 'topic' : 'reference',
          topic: userInput.type === 'topic' ? userInput.content : undefined,
          reference: userInput.type !== 'topic' ? userInput.content : undefined,
        },
        coordinator.getState().conversationHistory
      )

      // 流式响应（SSE）
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generator) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'chunk',
                  agent: 'content-director',
                  content: chunk,
                  stage: coordinator.getState().stage,
                })}\n\n`)
              )
            }

            // 发送完成信号
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                agent: 'content-director',
                stage: coordinator.getState().stage,
                requiresConfirmation: routing.requiresConfirmation,
              })}\n\n`)
            )
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error'
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: msg })}\n\n`)
            )
          } finally {
            controller.close()
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else if (routing.agent === 'technical-executor') {
      // 准备调用（记录日志）
      const input = {
        creativeProposal: coordinator.getState().data.creativeProposal!,
        constraints: userInput.constraints,
      }
      coordinator.prepareTechnicalExecutorCall(input)

      // 直接调用server-only函数
      const result = await invokeTechnicalExecutor(input)

      // 记录响应
      coordinator.recordTechnicalExecutorResponse(result)

      return NextResponse.json({
        type: 'technical_executor_response',
        agent: 'technical-executor',
        content: result,
        stage: coordinator.getState().stage,
        requiresConfirmation: routing.requiresConfirmation,
      })
    }

    return NextResponse.json({ error: 'Unknown routing decision' }, { status: 500 })
  } catch (error: any) {
    logger.error('[Dual Agent API] Error', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - 获取coordinator状态
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  const coordinator = coordinators.get(sessionId)

  if (!coordinator) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json(coordinator.getState())
}

/**
 * PUT - 保存创意方案或技术方案
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, type, data } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const coordinator = coordinators.get(sessionId)

    if (!coordinator) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (type === 'creative_proposal') {
      coordinator.saveCreativeProposal(data)
    } else if (type === 'technical_plan') {
      coordinator.saveTechnicalPlan(data)
    } else {
      return NextResponse.json({ error: 'Unknown data type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, state: coordinator.getState() })
  } catch (error: any) {
    logger.error('[Dual Agent API] PUT Error', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
