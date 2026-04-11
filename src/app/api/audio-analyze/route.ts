import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { analyzeAudio } from '@/lib/audio/audio-analyzer'
import { logger } from '@/lib/utils/logger'

const log = logger.context('AudioAnalyzeAPI')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/audio-analyze
 * 上传并分析音频文件
 *
 * Request body: FormData with 'audio' file
 * Response: AudioAnalysisResult
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: 'Invalid audio format. Supported: MP3, WAV, OGG, M4A' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大50MB）
    const maxSize = 50 * 1024 * 1024
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Audio file too large. Max size: 50MB' },
        { status: 400 }
      )
    }

    // 保存到临时目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'audio')
    await mkdir(uploadDir, { recursive: true })

    const timestamp = Date.now()
    const fileName = `audio_${timestamp}_${audioFile.name}`
    const filePath = path.join(uploadDir, fileName)

    const arrayBuffer = await audioFile.arrayBuffer()
    await writeFile(filePath, Buffer.from(arrayBuffer))

    log.info('Audio file saved', { filePath, fileName })

    // 分析音频
    const analysis = await analyzeAudio(filePath)

    log.info('Audio analysis completed', {
      duration: analysis.duration,
      bpm: analysis.beat.bpm,
      segmentCount: analysis.segments.length,
      lyricCount: analysis.lyrics.length,
    })

    return NextResponse.json({
      success: true,
      audioPath: `/uploads/audio/${fileName}`,
      analysis,
    })
  } catch (error) {
    log.error('Audio analysis failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Audio analysis failed' },
      { status: 500 }
    )
  }
}
