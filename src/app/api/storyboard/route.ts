import { NextRequest, NextResponse } from 'next/server'
import { generateStoryboard, fillStoryboardImages } from '@/lib/ai/storyboard-engine'
import type { Script, ScriptScene } from '@/types'
import type { CharacterStyle } from '@/lib/video/dreamina-image'
import type { ProductAnalysis } from '@/lib/ai/product-consistency'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      script: Script
      fillImages?: boolean
      referenceImages?: string[]
      productImages?: string[]
      characterImagePath?: string
      characterStyle?: CharacterStyle
      characterDescriptions?: string[]
      productDescriptions?: string[]
      productAnalysis?: ProductAnalysis
    }

    const {
      script,
      fillImages = true,
      referenceImages,
      productImages,
      characterImagePath,
      characterStyle,
      characterDescriptions,
      productDescriptions,
      productAnalysis,
    } = body

    if (!script?.scenes?.length) {
      return NextResponse.json({ error: '脚本数据无效' }, { status: 400 })
    }

    // 如果有人物/产品描述，注入到脚本场景的 visual 中，让 Claude 生成更精准的提示词
    if (characterDescriptions?.length || productDescriptions?.length) {
      const contextParts: string[] = []
      if (characterDescriptions?.length) {
        contextParts.push(`角色参考：${characterDescriptions.join('；')}`)
      }
      if (productDescriptions?.length) {
        contextParts.push(`产品参考：${productDescriptions.join('；')}`)
      }
      const refContext = contextParts.join('。')

      // 在每个场景的 visual 描述中追加参考信息
      script.scenes = script.scenes.map((scene: ScriptScene) => ({
        ...scene,
        visual: `${scene.visual}（${refContext}）`,
      }))
    }

    // 1. 生成分镜提示词（Claude 会基于注入的参考信息生成更精准的提示词）
    // 如果有产品分析结果，传递给分镜引擎以注入产品一致性约束
    let storyboard = await generateStoryboard(script, productAnalysis)

    // 2. 生成分镜图片
    if (fillImages) {
      try {
        const ratio: '9:16' | '16:9' = script.aspectRatio === '9:16' ? '9:16' : '16:9'

        storyboard = await fillStoryboardImages({
          storyboard,
          ratio,
          referenceImages,
          productImages,
          characterImagePath,
          characterStyle: characterStyle ?? (characterImagePath ? 'cg_realistic' : undefined),
        })
      } catch (imgErr) {
        console.error('[Storyboard] 图片生成失败，返回无图版本:', imgErr)
      }
    }

    return NextResponse.json({ storyboard })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storyboard generation failed'
    console.error('[Storyboard API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
