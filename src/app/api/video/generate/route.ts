import { NextRequest, NextResponse } from 'next/server'
import { generateVideo as seedanceGenerate } from '@/lib/video/seedance'
import { generateVideo as klingGenerate, pollUntilDone as klingPoll } from '@/lib/video/kling'
import { localizeVideoUrl } from '@/lib/video/dreamina-image'
import type { Storyboard, VideoJob } from '@/types'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/utils/logger'
import { updateJobStatus, getJobStatus } from '@/lib/video/job-store'

const log = logger.context('VideoGenerateAPI')

/**
 * POST /api/video/generate
 * 启动视频生成任务（异步）
 */
export async function POST(req: NextRequest) {
  try {
    const { storyboard, engine } = (await req.json()) as {
      storyboard: Storyboard
      engine: 'seedance' | 'kling' | 'ffmpeg' | 'remotion'
    }

    if (!storyboard || !engine) {
      return NextResponse.json({ error: 'Missing storyboard or engine' }, { status: 400 })
    }

    const jobId = uuid()

    // 初始化job状态
    updateJobStatus(jobId, {
      id: jobId,
      status: 'running',
      progress: 0,
      config: { engine, storyboardId: storyboard.id },
      logs: [{ timestamp: new Date(), level: 'info', message: '任务已创建，等待启动...' }],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // 启动后台任务（不等待完成）
    generateVideoInBackground(jobId, storyboard, engine).catch(err => {
      log.error('Background video generation job failed', err, { jobId })
      updateJobStatus(jobId, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    })

    // 立即返回jobId
    return NextResponse.json({
      success: true,
      jobId,
      message: `视频生成任务已启动（引擎：${engine}，共${storyboard.frames.length}帧）`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Video generation failed'
    log.error('Video generation request failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * 后台生成视频（异步执行）
 */
async function generateVideoInBackground(
  jobId: string,
  storyboard: Storyboard,
  engine: 'seedance' | 'kling' | 'ffmpeg' | 'remotion'
) {
  const startTime = Date.now()
  log.info('Background video job started', { jobId, engine, frameCount: storyboard.frames.length })

  try {
    // 更新job状态到内存/数据库
    updateJobStatus(jobId, { status: 'running', progress: 0 })

    // 按帧生成视频片段
    const videoUrls: string[] = []
    const TEST_MODE = process.env.VIDEO_TEST_MODE === 'true' // 测试模式：只生成第一帧
    const framesToGenerate = TEST_MODE ? storyboard.frames.slice(0, 1) : storyboard.frames

    updateJobStatus(jobId, {
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: TEST_MODE
            ? `🧪 测试模式：只生成第1帧（共${storyboard.frames.length}帧）`
            : `开始生成${storyboard.frames.length}帧视频...`,
        },
      ],
    })

    for (let i = 0; i < framesToGenerate.length; i++) {
      const frame = framesToGenerate[i]
      const actualIndex = TEST_MODE ? 0 : i
      if (!frame.imageUrl) continue

      log.debug('Generating frame', {
        jobId,
        frame: actualIndex + 1,
        total: framesToGenerate.length,
        testMode: TEST_MODE,
      })

      let videoUrl: string
      try {
        if (engine === 'seedance') {
          videoUrl = await seedanceGenerate({
            imageUrl: frame.imageUrl,
            prompt: frame.imagePrompt,
            duration: Math.round(frame.duration),
          })
        } else {
          const duration = Math.round(frame.duration) <= 5 ? '5' : '10'
          const job = await klingGenerate({
            imageUrl: frame.imageUrl,
            prompt: frame.imagePrompt,
            duration,
            mode: 'std',
          })
          videoUrl = await klingPoll(job.taskId)
        }

        // 本地化视频URL
        const localUrl = await localizeVideoUrl(videoUrl)
        videoUrls.push(localUrl)

        // 更新进度
        const progress = Math.round(((i + 1) / framesToGenerate.length) * 100)
        updateJobStatus(jobId, {
          progress,
          logs: [
            {
              timestamp: new Date(),
              level: 'info',
              message: `✅ 第 ${actualIndex + 1}/${framesToGenerate.length} 帧完成`,
            },
          ],
        })
      } catch (frameErr) {
        log.error('Frame generation failed', frameErr, { jobId, frame: actualIndex + 1 })
        updateJobStatus(jobId, {
          logs: [
            {
              timestamp: new Date(),
              level: 'error',
              message: `❌ 第 ${actualIndex + 1} 帧生成失败：${frameErr instanceof Error ? frameErr.message : 'Unknown error'}`,
            },
          ],
        })
        // 继续生成下一帧
      }
    }

    /**
     * Video Composition: 合成所有片段为完整视频
     *
     * 当前架构: 使用 Remotion 进行视频合成 (推荐)
     *   - 路径: /api/video/remotion-render
     *   - 优势: 程序化控制，支持转场/字幕/特效
     *
     * 备选方案: 使用 FFmpeg 简单拼接
     *   - 函数: await composeVideos(videoUrls, storyboard)
     *   - 优势: 速度快，资源占用少
     *
     * 实现建议: 优先使用 Remotion，FFmpeg作为备选
     */
    // const finalVideoUrl = await composeVideos(videoUrls, storyboard)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    log.info('Video job completed', { jobId, elapsed: `${elapsed}s`, segmentCount: videoUrls.length })

    // 标记完成
    updateJobStatus(jobId, {
      status: 'completed',
      progress: 100,
      outputUrl: videoUrls[0], // 注意: 当前返回第一帧，生产环境应使用合成后的完整视频
      logs: [
        {
          timestamp: new Date(),
          level: 'info',
          message: `视频生成完成（${elapsed}秒）`,
        },
      ],
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Video generation job error', err, { jobId })

    updateJobStatus(jobId, {
      status: 'failed',
      error: message,
      logs: [
        {
          timestamp: new Date(),
          level: 'error',
          message: `生成失败：${message}`,
        },
      ],
    })
  }
}
