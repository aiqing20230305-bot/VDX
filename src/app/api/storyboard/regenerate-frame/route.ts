import { NextRequest, NextResponse } from 'next/server'
import { text2Image, image2Image, ensureSupportedFormat, localizeImageUrl } from '@/lib/video/dreamina-image'
import type { StoryboardFrame } from '@/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('RegenerateFrameAPI')

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/storyboard/regenerate-frame
 * 重新生成单个分镜帧
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      frame: StoryboardFrame
      ratio: '9:16' | '16:9'
      referenceImage?: string
      productImage?: string
    }

    const { frame, ratio, referenceImage, productImage } = body

    if (!frame?.imagePrompt) {
      return NextResponse.json({ error: '分镜帧数据无效' }, { status: 400 })
    }

    let imageUrls: string[]

    // 优先级：产品图 > 参考图 > 纯文生图
    if (productImage) {
      const safePath = await ensureSupportedFormat(productImage)
      imageUrls = await image2Image({
        imagePath: safePath,
        prompt: `${frame.imagePrompt}, product must match reference exactly`,
        ratio,
        model: '5.0',
      })
    } else if (referenceImage) {
      const safePath = await ensureSupportedFormat(referenceImage)
      imageUrls = await image2Image({
        imagePath: safePath,
        prompt: `${frame.imagePrompt}, maintain composition reference`,
        ratio,
        model: '5.0',
      })
    } else {
      imageUrls = await text2Image({
        prompt: frame.imagePrompt,
        ratio,
        model: '5.0',
        resolution: '2k',
      })
    }

    if (!imageUrls[0]) {
      throw new Error('图片生成失败')
    }

    // 本地化图片
    const imageUrl = await localizeImageUrl(imageUrls[0])

    return NextResponse.json({ imageUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Frame regeneration failed'
    log.error('Frame regeneration failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
