import { NextRequest, NextResponse } from 'next/server'
import { compositeStoryboard, autoColumns } from '@/lib/video/storyboard-composite'
import type { Storyboard } from '@/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('StoryboardCompositeAPI')

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      storyboard: Storyboard
    }

    const { storyboard } = body

    if (!storyboard?.frames?.length) {
      return NextResponse.json({ error: '分镜数据无效' }, { status: 400 })
    }

    // 提取有图片的帧
    const framesWithImages = storyboard.frames
      .filter(f => f.imageUrl)
      .map(f => ({
        index: f.index,
        url: f.imageUrl!,
        duration: f.duration,
      }))

    if (framesWithImages.length === 0) {
      return NextResponse.json({ error: '没有生成的分镜图' }, { status: 400 })
    }

    // 合成概览图
    const compositeUrl = await compositeStoryboard({
      frameImages: framesWithImages,
      columns: autoColumns(framesWithImages.length),
      frameWidth: 480,
      gap: 12,
      fontSize: 28,
    })

    return NextResponse.json({ compositeUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Composite failed'
    log.error('Storyboard composite failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
