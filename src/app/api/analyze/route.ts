import { NextRequest, NextResponse } from 'next/server'
import { analyzeVideo } from '@/lib/ai/analysis-engine'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    let videoPath: string

    if (contentType.includes('multipart/form-data')) {
      // 文件上传
      const formData = await req.formData()
      const file = formData.get('video') as File | null

      if (!file) {
        return NextResponse.json({ error: '请上传视频文件' }, { status: 400 })
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadDir, { recursive: true })

      const ext = file.name.split('.').pop() ?? 'mp4'
      videoPath = path.join(uploadDir, `${uuid()}.${ext}`)

      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(videoPath, buffer)

    } else {
      // JSON with URL
      const { url } = await req.json() as { url: string }
      if (!url) return NextResponse.json({ error: '请提供视频URL' }, { status: 400 })
      videoPath = url
    }

    const analysis = await analyzeVideo(videoPath)
    return NextResponse.json({ analysis })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Video analysis failed'
    console.error('[Analyze API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
