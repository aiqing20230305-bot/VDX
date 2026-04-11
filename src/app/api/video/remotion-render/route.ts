/**
 * Remotion 视频渲染 API
 * POST /api/video/remotion-render
 */
import { renderWithRemotion } from '@/lib/video/remotion-pipeline'
import { NextRequest, NextResponse } from 'next/server'
import type { Storyboard } from '@/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('RemotionRenderAPI')

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 分钟

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storyboard, aspectRatio = '16:9', fps = 30, filterId, filterIntensity } = body as {
      storyboard: Storyboard
      aspectRatio?: string
      fps?: number
      filterId?: string
      filterIntensity?: number
    }

    // 1. 验证输入
    if (!storyboard || !storyboard.frames || storyboard.frames.length === 0) {
      return NextResponse.json(
        { error: '无效的分镜数据' },
        { status: 400 }
      )
    }

    // 2. 检查 Remotion 是否启用
    if (process.env.REMOTION_ENABLE !== 'true') {
      return NextResponse.json(
        { error: 'Remotion 未启用，请设置 REMOTION_ENABLE=true' },
        { status: 503 }
      )
    }

    log.info('Starting Remotion render', {
      frameCount: storyboard.frames.length,
      aspectRatio,
      fps,
    })

    // 3. 渲染视频
    const outputUrl = await renderWithRemotion({
      storyboard,
      aspectRatio: aspectRatio as any,
      fps,
      filterId: filterId as any,
      filterIntensity,
      onProgress: (progress) => {
        log.debug('Render progress', { progress: (progress * 100).toFixed(1) + '%' })
      },
    })

    log.info('Render completed successfully', { outputUrl })

    return NextResponse.json({ outputUrl })
  } catch (err) {
    log.error('Remotion render failed', err)
    const message = err instanceof Error ? err.message : String(err)

    // 特定错误处理
    if (message.includes('Puppeteer') || message.includes('browser')) {
      return NextResponse.json(
        {
          error:
            'Puppeteer 未安装，请运行: npx puppeteer browsers install chrome',
        },
        { status: 500 }
      )
    }

    if (message.includes('ENOMEM') || message.includes('memory')) {
      return NextResponse.json(
        {
          error: '内存不足，请降低 REMOTION_CONCURRENCY 或分辨率',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: `渲染失败: ${message}` },
      { status: 500 }
    )
  }
}
