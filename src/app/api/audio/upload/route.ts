/**
 * POST /api/audio/upload
 * 上传音频文件到临时目录
 */
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { logger } from '@/lib/utils/logger'

const log = logger.context('AudioUploadAPI')

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('audio') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP3, WAV, M4A, AAC are supported' },
        { status: 400 }
      )
    }

    // 验证文件大小（最大 50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // 创建临时目录
    const tempDir = join(process.cwd(), 'public', 'uploads', 'audio')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
    }

    // 生成唯一文件名
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const fileName = `audio_${timestamp}.${extension}`
    const filePath = join(tempDir, fileName)

    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const publicPath = `/uploads/audio/${fileName}`

    log.info('Audio file uploaded', {
      originalName: file.name,
      size: file.size,
      path: publicPath,
    })

    return NextResponse.json({
      success: true,
      path: publicPath,
      fileName,
      size: file.size,
    })
  } catch (error: any) {
    log.error('Failed to upload audio', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload audio' },
      { status: 500 }
    )
  }
}
