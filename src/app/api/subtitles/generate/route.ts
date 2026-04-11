/**
 * 字幕生成 API
 * 通过 ASR 引擎从音频/视频提取字幕
 */
import { NextRequest, NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/audio/asr-service'
import path from 'path'
import fs from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '@/lib/utils/logger'

const execAsync = promisify(exec)
const log = logger.context('SubtitlesAPI')

export const maxDuration = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const videoUrl = formData.get('videoUrl') as string | null
    const engine = (formData.get('engine') as string) || 'whisper-cpp'
    const language = (formData.get('language') as string) || 'zh'

    if (!audioFile && !videoUrl) {
      return NextResponse.json(
        { error: '需要提供音频文件或视频 URL' },
        { status: 400 }
      )
    }

    let audioPath: string

    // 处理音频文件上传
    if (audioFile) {
      const bytes = await audioFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 保存到临时目录
      const uploadDir = path.join(process.cwd(), 'public/uploads/audio')
      await fs.mkdir(uploadDir, { recursive: true })

      const timestamp = Date.now()
      const filename = `subtitle_${timestamp}_${audioFile.name}`
      audioPath = path.join(uploadDir, filename)

      await fs.writeFile(audioPath, buffer)
    }
    // 从视频 URL 提取音频
    else if (videoUrl) {
      const uploadDir = path.join(process.cwd(), 'public/uploads/audio')
      await fs.mkdir(uploadDir, { recursive: true })

      const timestamp = Date.now()
      const audioFilename = `extracted_${timestamp}.mp3`
      audioPath = path.join(uploadDir, audioFilename)

      // 用 FFmpeg 提取音频
      const videoPath = path.join(process.cwd(), 'public', videoUrl)
      const command = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}" -y`

      log.debug('Extracting audio from video', { videoPath, audioPath })
      await execAsync(command)
    } else {
      return NextResponse.json(
        { error: '无效的输入' },
        { status: 400 }
      )
    }

    log.info('Transcribing audio', { audioPath, engine, language })

    // 调用 ASR 服务
    const subtitles = await transcribeAudio(audioPath, {
      engine: engine as 'whisper-cpp' | 'openai' | 'mock',
      language,
    })

    log.info('Subtitle generation completed', { subtitleCount: subtitles.length })

    // 清理临时文件（可选）
    // await fs.unlink(audioPath)

    return NextResponse.json({
      success: true,
      subtitles,
      audioPath: audioPath.replace(process.cwd() + '/public', ''),
    })
  } catch (error: any) {
    log.error('Subtitle generation failed', error)
    return NextResponse.json(
      { error: `字幕生成失败: ${error.message}` },
      { status: 500 }
    )
  }
}
