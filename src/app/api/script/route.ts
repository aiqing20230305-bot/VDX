import { NextRequest, NextResponse } from 'next/server'
import { generateScripts } from '@/lib/ai/script-engine'
import type { ScriptGenerationInput } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  try {
    const input = await req.json() as ScriptGenerationInput

    if (!input.topic && (!input.images || input.images.length === 0)) {
      return NextResponse.json(
        { error: '请提供选题描述或图片' },
        { status: 400 }
      )
    }

    if (!input.duration || input.duration < 5) {
      return NextResponse.json(
        { error: '视频时长至少5秒' },
        { status: 400 }
      )
    }

    const scripts = await generateScripts({
      ...input,
      count: Math.min(input.count ?? 3, 5),
      aspectRatio: input.aspectRatio ?? '16:9',
    })

    return NextResponse.json({ scripts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Script generation failed'
    console.error('[Script API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
