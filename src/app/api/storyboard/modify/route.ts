import { NextRequest, NextResponse } from 'next/server'
import { parseModificationIntent, applyModification, applyGlobalModification } from '@/lib/ai/prompt-modifier'
import type { Storyboard } from '@/types'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/storyboard/modify
 * 对话式修改分镜提示词
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userMessage: string
      storyboard: Storyboard
    }

    const { userMessage, storyboard } = body

    if (!userMessage || !storyboard) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 })
    }

    // 解析修改意图
    const intent = await parseModificationIntent(userMessage, storyboard)

    if (!intent) {
      return NextResponse.json({
        isModification: false,
        message: '我没有理解到修改指令。可以试试："让第3帧更亮一些"、"所有帧加上电影感"',
      })
    }

    // 应用修改
    let updatedStoryboard: Storyboard

    if (intent.type === 'all_frames') {
      updatedStoryboard = applyGlobalModification(storyboard, intent.modification)
    } else if (intent.frameIndices && intent.frameIndices.length > 0) {
      updatedStoryboard = {
        ...storyboard,
        frames: storyboard.frames.map((f, i) =>
          intent.frameIndices!.includes(i)
            ? applyModification(f, intent.modification)
            : f
        ),
      }
    } else {
      throw new Error('无法确定修改目标')
    }

    return NextResponse.json({
      isModification: true,
      intent,
      storyboard: updatedStoryboard,
      affectedFrames: intent.type === 'all_frames'
        ? storyboard.frames.map((_, i) => i)
        : intent.frameIndices,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Modification failed'
    console.error('[Modify API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
