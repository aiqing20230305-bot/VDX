import { NextRequest, NextResponse } from 'next/server'
import { generateStoryboardVariants } from '@/lib/ai/storyboard-engine'
import { buildCompositeStoryboardPrompt } from '@/lib/ai/storyboard-engine'
import { text2Image, localizeImageUrl } from '@/lib/video/dreamina-image'
import type { Script, AudioAnalysisResult } from '@/types'
import type { ProductAnalysis } from '@/lib/ai/product-consistency'
import { logger } from '@/lib/utils/logger'

const log = logger.context('StoryboardVariantsAPI')

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * POST /api/storyboard/variants
 * 生成3个分镜变体（不同镜头语言），每个变体生成一张合成概览图
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      script: Script
      productAnalysis?: ProductAnalysis
      audioAnalysis?: AudioAnalysisResult
    }

    const { script, productAnalysis, audioAnalysis } = body

    if (!script?.scenes?.length) {
      return NextResponse.json({ error: '脚本数据无效' }, { status: 400 })
    }

    log.info('Starting storyboard variant generation', { sceneCount: script.scenes.length })

    // 1. 生成3个变体（不同镜头语言）
    const variants = await generateStoryboardVariants(script, productAnalysis, audioAnalysis)

    log.info('Generated variants, creating preview images', { variantCount: variants.length })

    // 2. 为每个变体生成概览图
    const variantsWithPreview = await Promise.all(
      variants.map(async (variant, index) => {
        try {
          // 生成合成提示词（所有帧的组合）
          const compositePrompt = buildCompositeStoryboardPrompt(variant.storyboard)

          log.debug('Generating preview image for variant', {
            variantIndex: index + 1,
            promptPreview: compositePrompt.substring(0, 100),
          })

          // 生成概览图
          const imageUrls = await text2Image({
            prompt: compositePrompt,
            ratio: script.aspectRatio === '9:16' ? '9:16' : '16:9',
            model: '5.0',
            resolution: '2k',
          })

          if (!imageUrls[0]) {
            throw new Error('概览图生成失败')
          }

          // 本地化图片URL
          const previewUrl = await localizeImageUrl(imageUrls[0])

          return {
            ...variant,
            previewImageUrl: previewUrl,
          }
        } catch (err) {
          log.error('Preview image generation failed for variant', err, { variantIndex: index + 1 })
          return {
            ...variant,
            previewImageUrl: undefined,
          }
        }
      })
    )

    log.info('Storyboard variants completed', { variantCount: variantsWithPreview.length })

    return NextResponse.json({ variants: variantsWithPreview })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storyboard variants generation failed'
    log.error('Storyboard variants generation failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
