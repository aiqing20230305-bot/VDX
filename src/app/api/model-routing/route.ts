/**
 * 多模型路由 API
 * 分析分镜并推荐最优生成模型
 */

import { NextRequest, NextResponse } from 'next/server'
import type { StoryboardFrame, ModelRoutingStrategy } from '@/types'
import {
  analyzeStoryboard,
  generateRoutingResult,
  MODEL_CAPABILITIES,
} from '@/lib/ai/model-router'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/model-routing
 *
 * Body:
 * {
 *   storyboardId: string
 *   frames: StoryboardFrame[]
 *   strategy?: ModelRoutingStrategy
 * }
 *
 * Response:
 * {
 *   success: true
 *   data: ModelRoutingResult
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storyboardId, frames, strategy } = body

    if (!storyboardId || !frames || !Array.isArray(frames)) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：storyboardId 和 frames' },
        { status: 400 }
      )
    }

    // 默认策略：平衡模式
    const routingStrategy: ModelRoutingStrategy = strategy || {
      prioritize: 'balanced',
      allowMixedModels: true,
      qualityThreshold: 7,
    }

    // 生成路由结果
    const result = generateRoutingResult(
      storyboardId,
      frames as StoryboardFrame[],
      routingStrategy
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Model Routing Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '模型路由失败',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/model-routing/capabilities
 *
 * 获取模型能力矩阵
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        models: MODEL_CAPABILITIES,
        strategies: [
          {
            name: 'quality',
            label: '质量优先',
            description: '选择质量最高的模型，适合对外展示的精品内容',
          },
          {
            name: 'speed',
            label: '速度优先',
            description: '选择速度最快的模型，适合快速验证和迭代',
          },
          {
            name: 'cost',
            label: '成本优先',
            description: '选择成本最低的模型，适合大批量生产',
          },
          {
            name: 'balanced',
            label: '平衡模式',
            description: '根据场景特征智能推荐，平衡质量、速度和成本',
          },
        ],
      },
    })
  } catch (error) {
    console.error('[Get Capabilities Error]', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取能力矩阵失败',
      },
      { status: 500 }
    )
  }
}
