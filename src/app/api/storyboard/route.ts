import { NextRequest, NextResponse } from 'next/server'
import { generateStoryboard, fillStoryboardImages } from '@/lib/ai/storyboard-engine'
import type { Script } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { script, fillImages = true } = await req.json() as {
      script: Script
      fillImages?: boolean  // 是否用即梦生成分镜图片
    }

    if (!script?.scenes?.length) {
      return NextResponse.json({ error: '脚本数据无效' }, { status: 400 })
    }

    // 1. 生成分镜提示词
    let storyboard = await generateStoryboard(script)

    // 2. 用即梦生成分镜图片（可选）
    if (fillImages) {
      try {
        const ratio = script.aspectRatio === '9:16' ? '9:16'
          : script.aspectRatio === '1:1' ? '1:1'
          : '16:9'

        storyboard = await fillStoryboardImages({
          storyboard,
          ratio,
        })
      } catch (imgErr) {
        console.error('[Storyboard] 图片生成失败，返回无图版本:', imgErr)
        // 图片生成失败不阻断流程，返回无图分镜
      }
    }

    return NextResponse.json({ storyboard })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Storyboard generation failed'
    console.error('[Storyboard API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
