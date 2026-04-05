import { NextRequest, NextResponse } from 'next/server'
import { extractKeyFrames, type KeyFrameExtractionOptions } from '@/lib/video/frame-extraction'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/video/extract-frames
 * 从视频中提取关键帧
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      videoPath: string
      mode?: 'auto' | 'scene' | 'interval' | 'specific'
      maxFrames?: number
      intervalSeconds?: number
      timestamps?: number[]
      sceneThreshold?: number
    }

    const {
      videoPath,
      mode = 'auto',
      maxFrames = 5,
      intervalSeconds = 2,
      timestamps,
      sceneThreshold = 0.4,
    } = body

    if (!videoPath) {
      return NextResponse.json({ error: '缺少 videoPath' }, { status: 400 })
    }

    const options: KeyFrameExtractionOptions = {
      videoPath,
      mode,
      maxFrames,
      intervalSeconds,
      timestamps,
      sceneThreshold,
    }

    const frames = await extractKeyFrames(options)

    return NextResponse.json({
      frames,
      count: frames.length,
      mode,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Frame extraction failed'
    console.error('[Extract Frames API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
