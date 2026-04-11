/**
 * POST /api/workflow/execute
 * 执行工作流
 */
import { NextRequest, NextResponse } from 'next/server'
import { createWorkflowEngine } from '@/lib/workflow/engine'
import { createWorkflowFromTemplate } from '@/lib/workflow/templates'
import { initializeBlocks } from '@/lib/blocks'
import type { Workflow, ProgressEvent } from '@/lib/blocks/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('WorkflowExecuteAPI')

export async function POST(req: NextRequest) {
  try {
    // 确保 Blocks 已初始化
    initializeBlocks()
    const body = await req.json()
    const { workflowId, templateId, workflow: customWorkflow, inputs, stream } = body

    // 从模板创建工作流或使用自定义工作流
    let workflow: Workflow
    if (customWorkflow) {
      // 使用自定义工作流（来自可视化编辑器）
      workflow = customWorkflow as Workflow
    } else if (templateId) {
      workflow = createWorkflowFromTemplate(templateId)
    } else if (workflowId) {
      /**
       * Database Integration: 从持久化存储加载工作流
       *
       * 实现建议:
       * ```typescript
       * const savedWorkflow = await prisma.workflow.findUnique({
       *   where: { id: workflowId },
       *   include: { nodes: true, edges: true }
       * })
       * if (!savedWorkflow) {
       *   throw new Error('Workflow not found')
       * }
       * workflow = {
       *   nodes: savedWorkflow.nodes,
       *   edges: savedWorkflow.edges
       * }
       * ```
       */
      throw new Error('Custom workflow loading not implemented yet - 需要数据库集成')
    } else {
      return NextResponse.json({ error: 'Missing workflow, workflowId or templateId' }, { status: 400 })
    }

    // 创建执行引擎
    const engine = createWorkflowEngine()

    // 流式返回（可选）
    if (stream) {
      const encoder = new TextEncoder()

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const execution = await engine.execute(workflow, inputs, {
              onProgress: (event: ProgressEvent) => {
                // 发送进度事件
                const data = `data: ${JSON.stringify(event)}\n\n`
                controller.enqueue(encoder.encode(data))
              },
            })

            // 发送最终结果
            const finalData = `data: ${JSON.stringify({ type: 'complete', execution })}\n\n`
            controller.enqueue(encoder.encode(finalData))
            controller.close()
          } catch (error) {
            const errorData = `data: ${JSON.stringify({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 非流式：直接执行并返回
    const execution = await engine.execute(workflow, inputs)

    return NextResponse.json({
      success: true,
      execution,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow execution failed'
    log.error('Workflow execution failed', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
