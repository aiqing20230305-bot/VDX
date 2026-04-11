/**
 * GET /api/video/download
 * 下载渲染完成的视频文件
 */
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { logger } from '@/lib/utils/logger'

const log = logger.context('VideoDownloadAPI')

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const videoUrl = searchParams.get('url')

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing video URL parameter' },
        { status: 400 }
      )
    }

    // 验证路径安全性（防止路径遍历攻击）
    if (videoUrl.includes('..') || !videoUrl.startsWith('/outputs/')) {
      return NextResponse.json(
        { error: 'Invalid video URL' },
        { status: 400 }
      )
    }

    // 构建文件路径
    const filePath = path.join(process.cwd(), 'public', videoUrl)

    // 检查文件是否存在
    try {
      await fs.access(filePath)
    } catch {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      )
    }

    // 读取文件
    const fileBuffer = await fs.readFile(filePath)

    // 获取文件名
    const fileName = path.basename(filePath)

    // 返回文件流
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    log.error('Failed to download video', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download video' },
      { status: 500 }
    )
  }
}
