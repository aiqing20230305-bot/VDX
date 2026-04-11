/**
 * 合成类 Blocks
 */
import type { Block } from './types'

// ─── compose.merge ────────────────────────────────────────────

export const ComposeMergeBlock: Block = {
  id: 'compose.merge',
  type: 'compose.merge',
  category: 'compose',
  name: '视频合并',
  description: '使用 FFmpeg 将多个视频片段合并为一个',
  icon: 'Combine',

  inputs: [
    {
      name: 'videoUrls',
      type: 'string[]',
      description: '视频片段 URL 列表',
      required: true,
      validation: (value) => Array.isArray(value) && value.length > 0 || '至少需要一个视频',
    },
    {
      name: 'transitions',
      type: 'string[]',
      description: '转场效果列表（可选）',
      required: false,
    },
    {
      name: 'outputFormat',
      type: 'string',
      description: '输出格式',
      required: false,
      default: 'mp4',
    },
  ],

  outputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '合并后的视频 URL',
    },
    {
      name: 'duration',
      type: 'number',
      description: '总时长（秒）',
    },
  ],

  execute: async (inputs, context) => {
    const { videoUrls, transitions, outputFormat } = inputs

    context.log('info', `Merging ${videoUrls.length} video clips`)

    // 动态导入避免编译时错误
    const ffmpegUtils = await import('@/lib/video/ffmpeg-utils').catch(() => null)

    if (!ffmpegUtils) {
      throw new Error('FFmpeg utilities not available')
    }

    const outputPath = await ffmpegUtils.concatVideos({
      inputFiles: videoUrls,
      transitions,
      outputFormat,
    })

    const duration = await ffmpegUtils.getVideoDuration(outputPath)

    context.log('info', `Video merged: ${duration}s`)

    return {
      videoUrl: outputPath,
      duration,
    }
  },

  estimatedDuration: 20,  // FFmpeg 合并约 20 秒
  cost: 0,
}

// ─── compose.subtitle ─────────────────────────────────────────

export const ComposeSubtitleBlock: Block = {
  id: 'compose.subtitle',
  type: 'compose.subtitle',
  category: 'compose',
  name: '字幕合成',
  description: '使用 FFmpeg 或 Remotion 添加字幕',
  icon: 'Subtitles',

  inputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '视频 URL',
      required: true,
    },
    {
      name: 'subtitles',
      type: 'any',
      description: '字幕数据（SRT 格式或对象数组）',
      required: true,
    },
    {
      name: 'engine',
      type: 'string',
      description: '合成引擎',
      required: false,
      default: 'ffmpeg',
      validation: (value) => ['ffmpeg', 'remotion'].includes(value) || '引擎必须是 ffmpeg 或 remotion',
    },
    {
      name: 'style',
      type: 'any',
      description: '字幕样式配置',
      required: false,
    },
  ],

  outputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '带字幕的视频 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { videoUrl, subtitles, engine, style } = inputs

    context.log('info', `Adding subtitles using ${engine}`)

    let outputPath: string

    if (engine === 'ffmpeg') {
      const ffmpegUtils = await import('@/lib/video/ffmpeg-utils').catch(() => null)
      if (!ffmpegUtils) {
        throw new Error('FFmpeg utilities not available')
      }
      outputPath = await ffmpegUtils.burnSubtitles({
        videoPath: videoUrl,
        subtitles,
        style,
      })
    } else {
      // Remotion 字幕合成（暂未实现，降级到 FFmpeg）
      context.log('warn', 'Remotion engine not available, falling back to FFmpeg')
      const ffmpegUtils = await import('@/lib/video/ffmpeg-utils').catch(() => null)
      if (!ffmpegUtils) {
        throw new Error('FFmpeg utilities not available')
      }
      outputPath = await ffmpegUtils.burnSubtitles({
        videoPath: videoUrl,
        subtitles,
        style,
      })
    }

    context.log('info', `Subtitles added: ${outputPath}`)

    return { videoUrl: outputPath }
  },

  estimatedDuration: 15,  // 字幕合成约 15 秒
  cost: 0,
}

// ─── compose.transition ───────────────────────────────────────

export const ComposeTransitionBlock: Block = {
  id: 'compose.transition',
  type: 'compose.transition',
  category: 'compose',
  name: '转场效果',
  description: '在视频片段之间添加转场效果',
  icon: 'ArrowRightLeft',

  inputs: [
    {
      name: 'videoUrls',
      type: 'string[]',
      description: '视频片段列表',
      required: true,
    },
    {
      name: 'transitionType',
      type: 'string',
      description: '转场类型',
      required: false,
      default: 'fade',
      validation: (value) => ['fade', 'slide', 'zoom', 'rotate', 'wipe'].includes(value) || '无效的转场类型',
    },
    {
      name: 'duration',
      type: 'number',
      description: '转场时长（秒）',
      required: false,
      default: 0.5,
    },
  ],

  outputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '带转场的视频 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { videoUrls, transitionType, duration } = inputs

    context.log('info', `Adding ${transitionType} transitions`)

    const ffmpegUtils = await import('@/lib/video/ffmpeg-utils').catch(() => null)
    if (!ffmpegUtils) {
      throw new Error('FFmpeg utilities not available')
    }

    const outputPath = await ffmpegUtils.addTransitions({
      inputFiles: videoUrls,
      transition: transitionType,
      duration,
    })

    context.log('info', `Transitions added: ${outputPath}`)

    return { videoUrl: outputPath }
  },

  estimatedDuration: 25,  // 转场渲染约 25 秒
  cost: 0,
}

// ─── 导出所有合成 Blocks ───────────────────────────────────────

export const ComposeBlocks: Block[] = [
  ComposeMergeBlock,
  ComposeSubtitleBlock,
  ComposeTransitionBlock,
]
