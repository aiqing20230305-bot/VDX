import { NextRequest, NextResponse } from 'next/server'
import { addTextEffects } from '@/lib/ai/text-effects-engine'
import type { Storyboard } from '@/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('TextEffectsAPI')

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      storyboard: Storyboard
      userRequest: string
      effectType?: 'subtitles' | 'titles' | 'bullets' | 'auto'
    }

    const { storyboard, userRequest, effectType = 'auto' } = body

    if (!storyboard || !userRequest) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const result = await addTextEffects({
      storyboard,
      userRequest,
      effectType,
    })

    return NextResponse.json(result)
  } catch (err) {
    log.error('Text effects failed', err)
    const message = err instanceof Error ? err.message : String(err)

    return NextResponse.json(
      { error: `文字效果添加失败: ${message}` },
      { status: 500 }
    )
  }
}
