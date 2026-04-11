/**
 * GET /api/workflow/templates
 * 获取所有工作流模板列表
 */
import { NextResponse } from 'next/server'
import { ALL_TEMPLATES } from '@/lib/workflow/templates'
import { logger } from '@/lib/utils/logger'

const log = logger.context('WorkflowTemplatesAPI')

export async function GET() {
  try {
    const templates = ALL_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      metadata: t.metadata,
      nodeCount: t.nodes.length,
      edgeCount: t.edges.length,
    }))

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load templates'
    log.error('Failed to load templates', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
