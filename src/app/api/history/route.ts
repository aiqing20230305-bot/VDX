/**
 * 历史记录 API
 * 查询和管理生成历史
 */

import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

const log = logger.context('HistoryAPI')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/history
 * 查询历史记录（支持分页和筛选）
 *
 * Query params:
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20）
 * - type: 类型筛选（script | storyboard | video）
 * - status: 状态筛选（pending | running | completed | failed）
 * - search: 搜索关键词
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') // script | storyboard | video
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // 查询项目列表（包含关联数据）
    const projects = await prisma.project.findMany({
      include: {
        scripts: {
          include: {
            storyboards: {
              include: {
                videoJobs: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        videoJobs: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    })

    // 查询总数
    const total = await prisma.project.count()

    // 转换为历史记录格式
    const records: HistoryRecord[] = []

    for (const project of projects) {
      // 脚本记录
      for (const script of project.scripts) {
        if (!type || type === 'script') {
          records.push({
            id: script.id,
            type: 'script',
            title: script.title,
            description: script.logline,
            createdAt: script.createdAt.toISOString(),
            status: 'completed',
            metadata: {
              style: script.style,
              duration: script.duration,
              aspectRatio: script.aspectRatio,
              scenesCount: JSON.parse(script.scenes).length,
            },
          })
        }

        // 分镜记录
        for (const storyboard of script.storyboards) {
          if (!type || type === 'storyboard') {
            records.push({
              id: storyboard.id,
              type: 'storyboard',
              title: `${script.title} - 分镜`,
              description: `共 ${storyboard.totalFrames} 帧`,
              createdAt: storyboard.createdAt.toISOString(),
              status: 'completed',
              metadata: {
                scriptId: script.id,
                totalFrames: storyboard.totalFrames,
                frames: JSON.parse(storyboard.frames),
              },
            })
          }

          // 视频记录
          for (const videoJob of storyboard.videoJobs) {
            if (!type || type === 'video') {
              if (status && videoJob.status !== status) continue

              const config = JSON.parse(videoJob.config)
              records.push({
                id: videoJob.id,
                type: 'video',
                title: `${script.title} - 视频`,
                description: `${config.engine === 'seedance' ? 'Seedance 2.0' : '可灵AI'} 生成`,
                createdAt: videoJob.createdAt.toISOString(),
                status: videoJob.status as any,
                metadata: {
                  storyboardId: storyboard.id,
                  scriptId: script.id,
                  engine: config.engine,
                  progress: videoJob.progress,
                  outputUrl: videoJob.outputUrl,
                  thumbnailUrl: videoJob.thumbnailUrl,
                  duration: videoJob.duration,
                  error: videoJob.error,
                },
              })
            }
          }
        }
      }
    }

    // 搜索筛选
    let filteredRecords = records
    if (search) {
      const searchLower = search.toLowerCase()
      filteredRecords = records.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.description?.toLowerCase().includes(searchLower)
      )
    }

    // 按时间排序
    filteredRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      success: true,
      data: {
        records: filteredRecords,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    log.error('History query failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '查询历史记录失败',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/history?id=xxx&type=xxx
 * 删除历史记录
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type') as 'script' | 'storyboard' | 'video'

    if (!id || !type) {
      return NextResponse.json(
        { success: false, error: '缺少参数：id 和 type' },
        { status: 400 }
      )
    }

    // 根据类型删除
    switch (type) {
      case 'script':
        await prisma.script.delete({ where: { id } })
        break
      case 'storyboard':
        await prisma.storyboard.delete({ where: { id } })
        break
      case 'video':
        await prisma.videoJob.delete({ where: { id } })
        break
      default:
        return NextResponse.json(
          { success: false, error: '无效的类型' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    })
  } catch (error) {
    log.error('Delete history failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      },
      { status: 500 }
    )
  }
}

// ============================================================
// Types
// ============================================================

interface HistoryRecord {
  id: string
  type: 'script' | 'storyboard' | 'video'
  title: string
  description?: string
  createdAt: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  metadata: Record<string, any>
}
