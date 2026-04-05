/**
 * 视频关键帧提取
 * 从视频片段中提取关键帧，用于后续分镜生成的参考
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

const execAsync = promisify(exec)

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'uploads')

export interface KeyFrameExtractionOptions {
  /** 视频文件路径 */
  videoPath: string
  /** 提取模式 */
  mode: 'auto' | 'scene' | 'interval' | 'specific'
  /** 自动模式：最多提取几帧 */
  maxFrames?: number
  /** 间隔模式：每N秒提取一帧 */
  intervalSeconds?: number
  /** 特定时间点：[1.5, 3.2, 5.8] 秒 */
  timestamps?: number[]
  /** 场景检测阈值 (0-1, 默认 0.4) */
  sceneThreshold?: number
}

export interface ExtractedFrame {
  /** 帧索引 */
  index: number
  /** 时间戳（秒） */
  timestamp: number
  /** 本地文件路径 */
  path: string
  /** URL 路径 */
  url: string
}

/**
 * 提取视频关键帧
 */
export async function extractKeyFrames(
  options: KeyFrameExtractionOptions
): Promise<ExtractedFrame[]> {
  const { videoPath, mode, maxFrames = 5, intervalSeconds = 2, timestamps, sceneThreshold = 0.4 } = options

  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // 获取视频时长
  const duration = await getVideoDuration(videoPath)

  let extractedFrames: ExtractedFrame[] = []

  switch (mode) {
    case 'auto':
      // 自动提取：均匀分布提取 N 帧
      extractedFrames = await extractUniformFrames(videoPath, duration, maxFrames)
      break

    case 'interval':
      // 间隔提取：每 N 秒提取一帧
      extractedFrames = await extractIntervalFrames(videoPath, duration, intervalSeconds)
      break

    case 'specific':
      // 特定时间点提取
      if (!timestamps || timestamps.length === 0) {
        throw new Error('specific 模式需要提供 timestamps')
      }
      extractedFrames = await extractSpecificFrames(videoPath, timestamps)
      break

    case 'scene':
      // 场景切换检测
      extractedFrames = await extractSceneFrames(videoPath, sceneThreshold, maxFrames)
      break
  }

  return extractedFrames
}

/**
 * 获取视频时长（秒）
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  const { stdout } = await execAsync(cmd)
  return parseFloat(stdout.trim())
}

/**
 * 均匀分布提取帧
 */
async function extractUniformFrames(
  videoPath: string,
  duration: number,
  maxFrames: number
): Promise<ExtractedFrame[]> {
  const frames: ExtractedFrame[] = []
  const interval = duration / (maxFrames + 1) // +1 避免首尾

  for (let i = 0; i < maxFrames; i++) {
    const timestamp = interval * (i + 1)
    const filename = `frame_${uuid()}.jpg`
    const outputPath = path.join(OUTPUT_DIR, filename)

    // FFmpeg 提取单帧
    const cmd = `ffmpeg -ss ${timestamp.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`
    await execAsync(cmd)

    frames.push({
      index: i,
      timestamp,
      path: outputPath,
      url: `/uploads/${filename}`,
    })
  }

  return frames
}

/**
 * 间隔提取帧
 */
async function extractIntervalFrames(
  videoPath: string,
  duration: number,
  intervalSeconds: number
): Promise<ExtractedFrame[]> {
  const frames: ExtractedFrame[] = []
  let timestamp = intervalSeconds // 从第一个间隔开始

  let index = 0
  while (timestamp < duration) {
    const filename = `frame_${uuid()}.jpg`
    const outputPath = path.join(OUTPUT_DIR, filename)

    const cmd = `ffmpeg -ss ${timestamp.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`
    await execAsync(cmd)

    frames.push({
      index: index++,
      timestamp,
      path: outputPath,
      url: `/uploads/${filename}`,
    })

    timestamp += intervalSeconds
  }

  return frames
}

/**
 * 特定时间点提取
 */
async function extractSpecificFrames(
  videoPath: string,
  timestamps: number[]
): Promise<ExtractedFrame[]> {
  const frames: ExtractedFrame[] = []

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i]
    const filename = `frame_${uuid()}.jpg`
    const outputPath = path.join(OUTPUT_DIR, filename)

    const cmd = `ffmpeg -ss ${timestamp.toFixed(2)} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`
    await execAsync(cmd)

    frames.push({
      index: i,
      timestamp,
      path: outputPath,
      url: `/uploads/${filename}`,
    })
  }

  return frames
}

/**
 * 场景切换检测提取
 * 使用 FFmpeg 的 scene detect 过滤器
 */
async function extractSceneFrames(
  videoPath: string,
  threshold: number,
  maxFrames: number
): Promise<ExtractedFrame[]> {
  // 1. 检测场景切换时间点
  const sceneFile = path.join(OUTPUT_DIR, `scenes_${uuid()}.txt`)
  const detectCmd = `ffmpeg -i "${videoPath}" -vf "select='gt(scene,${threshold})',showinfo" -f null - 2>&1 | grep "pts_time" | sed 's/.*pts_time:\\([0-9.]*\\).*/\\1/' > "${sceneFile}"`

  await execAsync(detectCmd)

  // 2. 读取场景时间点
  const sceneData = await fs.readFile(sceneFile, 'utf-8')
  const timestamps = sceneData
    .split('\n')
    .filter(Boolean)
    .map(t => parseFloat(t))
    .slice(0, maxFrames) // 限制最大帧数

  await fs.unlink(sceneFile).catch(() => {}) // 删除临时文件

  // 3. 提取这些时间点的帧
  return extractSpecificFrames(videoPath, timestamps)
}

/**
 * 快速预览提取（第一帧）
 */
export async function extractFirstFrame(videoPath: string): Promise<string> {
  const filename = `thumb_${uuid()}.jpg`
  const outputPath = path.join(OUTPUT_DIR, filename)

  const cmd = `ffmpeg -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}"`
  await execAsync(cmd)

  return `/uploads/${filename}`
}

/**
 * 批量提取所有片段的关键帧
 */
export async function extractFramesFromMultipleVideos(
  videoClips: Array<{ path: string; duration: number }>,
  mode: 'auto' | 'scene' = 'auto'
): Promise<ExtractedFrame[]> {
  const allFrames: ExtractedFrame[] = []

  for (const clip of videoClips) {
    const frames = await extractKeyFrames({
      videoPath: clip.path,
      mode,
      maxFrames: mode === 'auto' ? 2 : 3, // 每个片段提取 2-3 帧
    })
    allFrames.push(...frames)
  }

  return allFrames
}
