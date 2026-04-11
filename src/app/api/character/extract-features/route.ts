/**
 * 角色特征自动提取API
 * POST /api/character/extract-features
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractCharacterFeatures } from '@/lib/ai/character-extractor'
import { logger } from '@/lib/utils/logger'

const log = logger.context('CharacterExtractAPI')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referenceImageUrl } = body

    if (!referenceImageUrl) {
      return NextResponse.json(
        { error: '缺少参数：referenceImageUrl' },
        { status: 400 }
      )
    }

    log.info('Extracting character features', { imageUrl: referenceImageUrl })

    // 提取角色特征
    const features = await extractCharacterFeatures(referenceImageUrl)

    log.info('Character features extracted successfully', {
      hasFeatures: !!features,
      keywordsCount: features.promptKeywords.length,
    })

    return NextResponse.json({
      success: true,
      data: features,
    })
  } catch (error: any) {
    log.error('Failed to extract character features', error)
    return NextResponse.json(
      {
        error: error.message || '提取角色特征失败',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
