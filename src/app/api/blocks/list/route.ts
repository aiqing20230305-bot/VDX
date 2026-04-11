/**
 * GET /api/blocks/list
 * 获取所有可用的 Building Blocks
 */
import { NextRequest, NextResponse } from 'next/server'
import { listBlocks, initializeBlocks } from '@/lib/blocks'
import type { BlockFilter } from '@/lib/blocks/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('BlocksListAPI')

export async function GET(req: NextRequest) {
  try {
    // 确保 Blocks 已初始化
    initializeBlocks()
    const { searchParams } = new URL(req.url)

    // 构建过滤条件
    const filter: BlockFilter = {}

    const type = searchParams.get('type')
    if (type) filter.type = type as any

    const category = searchParams.get('category')
    if (category) filter.category = category as any

    const search = searchParams.get('search')
    if (search) filter.search = search

    // 获取 Blocks
    const blocks = listBlocks(filter)

    // 简化返回（隐藏 execute 函数）
    const simplified = blocks.map(b => ({
      id: b.id,
      type: b.type,
      category: b.category,
      name: b.name,
      description: b.description,
      icon: b.icon,
      inputs: b.inputs,
      outputs: b.outputs,
      estimatedDuration: b.estimatedDuration,
      cost: b.cost,
    }))

    return NextResponse.json({
      success: true,
      total: simplified.length,
      blocks: simplified,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list blocks'
    log.error('Failed to list blocks', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
