/**
 * 输出类 Blocks
 */
import type { Block } from './types'
import fs from 'fs/promises'
import path from 'path'

// ─── output.video ─────────────────────────────────────────────

export const OutputVideoBlock: Block = {
  id: 'output.video',
  type: 'output.video',
  category: 'output',
  name: '视频输出',
  description: '最终视频输出（保存到指定位置或返回 URL）',
  icon: 'Download',

  inputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '视频 URL 或路径',
      required: true,
    },
    {
      name: 'outputName',
      type: 'string',
      description: '输出文件名',
      required: false,
    },
    {
      name: 'outputPath',
      type: 'string',
      description: '输出目录',
      required: false,
      default: 'public/uploads',
    },
  ],

  outputs: [
    {
      name: 'finalUrl',
      type: 'string',
      description: '最终视频 URL',
    },
    {
      name: 'publicUrl',
      type: 'string',
      description: '公开访问 URL',
    },
    {
      name: 'metadata',
      type: 'any',
      description: '视频元数据（时长、大小、分辨率等）',
    },
  ],

  execute: async (inputs, context) => {
    const { videoUrl, outputName, outputPath } = inputs

    context.log('info', `Outputting video: ${videoUrl}`)

    // 确保输出目录存在
    const outputDir = path.join(process.cwd(), outputPath)
    await fs.mkdir(outputDir, { recursive: true })

    // 生成文件名
    const filename = outputName || `video-${Date.now()}.mp4`
    const finalPath = path.join(outputDir, filename)

    // 如果视频在其他位置，复制到输出目录
    if (videoUrl !== finalPath) {
      await fs.copyFile(videoUrl, finalPath)
    }

    // 生成公开 URL
    const publicUrl = `/${outputPath.replace('public/', '')}/${filename}`

    // 获取视频元数据
    const ffmpegUtils = await import('@/lib/video/ffmpeg-utils').catch(() => null)
    const metadata = ffmpegUtils
      ? await ffmpegUtils.getVideoMetadata(finalPath)
      : { duration: 0, size: 0, width: 0, height: 0 }

    context.log('info', `Video output complete: ${publicUrl}`)
    context.log('info', `Duration: ${metadata.duration}s, Size: ${(metadata.size / 1024 / 1024).toFixed(2)}MB`)

    return {
      finalUrl: finalPath,
      publicUrl,
      metadata,
    }
  },

  estimatedDuration: 2,  // 文件复制约 2 秒
  cost: 0,
}

// ─── output.export ────────────────────────────────────────────

export const OutputExportBlock: Block = {
  id: 'output.export',
  type: 'output.export',
  category: 'output',
  name: '导出文件',
  description: '导出中间资产（脚本、分镜、图片等）为文件',
  icon: 'FileDown',

  inputs: [
    {
      name: 'asset',
      type: 'any',
      description: '要导出的资产数据',
      required: true,
    },
    {
      name: 'format',
      type: 'string',
      description: '导出格式',
      required: false,
      default: 'json',
      validation: (value) => ['json', 'txt', 'md', 'srt'].includes(value) || '无效的导出格式',
    },
    {
      name: 'filename',
      type: 'string',
      description: '导出文件名',
      required: false,
    },
  ],

  outputs: [
    {
      name: 'filePath',
      type: 'string',
      description: '导出文件路径',
    },
    {
      name: 'publicUrl',
      type: 'string',
      description: '公开访问 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { asset, format, filename } = inputs

    context.log('info', `Exporting asset as ${format}`)

    const outputDir = path.join(process.cwd(), 'public/exports')
    await fs.mkdir(outputDir, { recursive: true })

    const name = filename || `export-${Date.now()}.${format}`
    const filePath = path.join(outputDir, name)

    // 根据格式序列化数据
    let content: string

    switch (format) {
      case 'json':
        content = JSON.stringify(asset, null, 2)
        break
      case 'txt':
        content = typeof asset === 'string' ? asset : JSON.stringify(asset)
        break
      case 'md':
        content = exportAsMarkdown(asset)
        break
      case 'srt':
        content = exportAsSRT(asset)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    await fs.writeFile(filePath, content, 'utf-8')

    const publicUrl = `/exports/${name}`

    context.log('info', `Asset exported: ${publicUrl}`)

    return { filePath, publicUrl }
  },

  estimatedDuration: 1,  // 文件写入约 1 秒
  cost: 0,
}

// ─── 辅助函数 ─────────────────────────────────────────────────

function exportAsMarkdown(asset: any): string {
  if (asset.scenes) {
    // 脚本格式
    let md = `# ${asset.title}\n\n`
    md += `**时长**: ${asset.duration}秒\n`
    md += `**风格**: ${asset.style}\n\n`
    md += `## 场景列表\n\n`
    asset.scenes.forEach((scene: any) => {
      md += `### 场景 ${scene.index + 1}\n\n`
      md += `- **时长**: ${scene.duration}秒\n`
      md += `- **画面**: ${scene.visual}\n`
      md += `- **解说**: ${scene.narration || '无'}\n\n`
    })
    return md
  } else if (asset.frames) {
    // 分镜格式
    let md = `# 分镜表\n\n`
    md += `**总帧数**: ${asset.frames.length}\n\n`
    asset.frames.forEach((frame: any) => {
      md += `## 第 ${frame.index + 1} 帧\n\n`
      md += `- **时长**: ${frame.duration}秒\n`
      md += `- **描述**: ${frame.description}\n`
      md += `- **镜头**: ${frame.cameraAngle}\n`
      md += `- **提示词**: ${frame.imagePrompt}\n\n`
    })
    return md
  } else {
    return JSON.stringify(asset, null, 2)
  }
}

function exportAsSRT(asset: any): string {
  if (!Array.isArray(asset)) {
    throw new Error('SRT export requires an array of subtitle objects')
  }

  let srt = ''
  asset.forEach((sub: any, i: number) => {
    srt += `${i + 1}\n`
    srt += `${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n`
    srt += `${sub.text}\n\n`
  })

  return srt
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

// ─── 导出所有输出 Blocks ───────────────────────────────────────

export const OutputBlocks: Block[] = [
  OutputVideoBlock,
  OutputExportBlock,
]
