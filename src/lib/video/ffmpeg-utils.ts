/**
 * FFmpeg 工具函数
 * 用于视频拼接、裁剪、转码、添加音频等操作
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

const execAsync = promisify(exec)

export const TMP_DIR = path.join(process.cwd(), 'public', 'tmp')
export const OUTPUT_DIR = path.join(process.cwd(), 'public', 'outputs')

export async function ensureDirs() {
  await fs.mkdir(TMP_DIR, { recursive: true })
  await fs.mkdir(OUTPUT_DIR, { recursive: true })
}

/**
 * 拼接多个视频片段（支持转场）
 */
export async function concatVideos(options: {
  inputFiles: string[]
  transitions?: string[]
  outputFormat?: string
  outputPath?: string
}): Promise<string> {
  const { inputFiles, transitions, outputFormat = 'mp4', outputPath } = options
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}.${outputFormat}`)

  // 写入 concat list 文件
  const listPath = path.join(TMP_DIR, `concat_${uuid()}.txt`)
  const listContent = inputFiles.map(p => `file '${p}'`).join('\n')
  await fs.writeFile(listPath, listContent)

  // 简单拼接（不带转场）
  await execAsync(
    `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${out}" -y`
  )

  await fs.unlink(listPath).catch(() => {})
  return out
}

/**
 * 下载远程视频到本地
 */
export async function downloadVideo(url: string): Promise<string> {
  await ensureDirs()
  const tmpPath = path.join(TMP_DIR, `download_${uuid()}.mp4`)
  await execAsync(`ffmpeg -i "${url}" -c copy "${tmpPath}" -y`)
  return tmpPath
}

/**
 * 添加背景音乐
 */
export async function addBackgroundMusic(
  videoPath: string,
  audioPath: string,
  volume = 0.3,
  outputPath?: string
): Promise<string> {
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}.mp4`)

  await execAsync(
    `ffmpeg -i "${videoPath}" -i "${audioPath}" ` +
    `-filter_complex "[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first[aout]" ` +
    `-map 0:v -map "[aout]" -c:v copy -c:a aac "${out}" -y`
  )

  return out
}

/**
 * 调整视频速度
 */
export async function changeSpeed(
  videoPath: string,
  speed: number,  // 0.5 = 半速, 2.0 = 2倍速
  outputPath?: string
): Promise<string> {
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}.mp4`)
  const videoFilter = `setpts=${1 / speed}*PTS`
  const audioFilter = `atempo=${Math.min(Math.max(speed, 0.5), 2.0)}`

  await execAsync(
    `ffmpeg -i "${videoPath}" -vf "${videoFilter}" -af "${audioFilter}" "${out}" -y`
  )

  return out
}

/**
 * 裁剪视频片段
 */
export async function trimVideo(
  videoPath: string,
  startSec: number,
  durationSec: number,
  outputPath?: string
): Promise<string> {
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}.mp4`)

  await execAsync(
    `ffmpeg -ss ${startSec} -i "${videoPath}" -t ${durationSec} -c copy "${out}" -y`
  )

  return out
}

/**
 * 转换视频比例（加黑边或裁剪）
 */
export async function convertAspectRatio(
  videoPath: string,
  targetRatio: string,   // e.g. '9:16', '16:9', '1:1'
  mode: 'pad' | 'crop' = 'pad',
  outputPath?: string
): Promise<string> {
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}.mp4`)

  const [w, h] = targetRatio.split(':').map(Number)
  const filter = mode === 'pad'
    ? `scale=iw*min(${w}*ih\\,${h}*iw)/(${h}*iw):ih*min(${w}*ih\\,${h}*iw)/(${w}*ih),pad=${w}*max(iw\\,ih)/${Math.max(w,h)}:${h}*max(iw\\,ih)/${Math.max(w,h)}:(ow-iw)/2:(oh-ih)/2`
    : `crop=min(iw\\,ih*${w}/${h}):min(ih\\,iw*${h}/${w})`

  await execAsync(
    `ffmpeg -i "${videoPath}" -vf "${filter}" -c:a copy "${out}" -y`
  )

  return out
}

/**
 * 获取视频信息
 */
export async function getVideoInfo(videoPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  size: number
}> {
  const { stdout } = await execAsync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${videoPath}"`
  )

  const info = JSON.parse(stdout) as {
    streams: Array<{ codec_type: string; width?: number; height?: number; r_frame_rate?: string }>
    format: { duration: string; size: string }
  }

  const videoStream = info.streams.find(s => s.codec_type === 'video')
  const fpsRaw = videoStream?.r_frame_rate?.split('/') ?? ['24', '1']
  const fps = Number(fpsRaw[0]) / Number(fpsRaw[1])

  return {
    duration: parseFloat(info.format.duration),
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    fps,
    size: parseInt(info.format.size),
  }
}

/**
 * 提取视频帧（用于分析）
 */
export async function extractFrames(
  videoPath: string,
  fps = 1,           // 每秒提取帧数
  outputDir?: string
): Promise<string[]> {
  const dir = outputDir ?? path.join(TMP_DIR, `frames_${uuid()}`)
  await fs.mkdir(dir, { recursive: true })

  await execAsync(
    `ffmpeg -i "${videoPath}" -vf "fps=${fps}" "${dir}/frame_%04d.jpg" -y`
  )

  const files = await fs.readdir(dir)
  return files.filter(f => f.endsWith('.jpg')).sort().map(f => path.join(dir, f))
}

/**
 * 获取视频时长（秒）
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    )
    return parseFloat(stdout.trim())
  } catch {
    return 0
  }
}

/**
 * 获取视频元数据
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number
  size: number
  width: number
  height: number
}> {
  try {
    const stats = await fs.stat(videoPath)
    const duration = await getVideoDuration(videoPath)
    
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`
    )
    const [width, height] = stdout.trim().split('x').map(Number)
    
    return {
      duration,
      size: stats.size,
      width: width || 1920,
      height: height || 1080,
    }
  } catch (error) {
    return {
      duration: 0,
      size: 0,
      width: 1920,
      height: 1080,
    }
  }
}

/**
 * 添加字幕（烧录到视频）
 */
export async function burnSubtitles(options: {
  videoPath: string
  subtitles: any
  style?: any
  outputPath?: string
}): Promise<string> {
  const { videoPath, subtitles, style, outputPath } = options
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}_subtitled.mp4`)

  // 生成 SRT 文件
  const srtPath = path.join(TMP_DIR, `${uuid()}.srt`)
  const srtContent = Array.isArray(subtitles)
    ? subtitles.map((sub, i) => {
        return `${i + 1}\n${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n${sub.text}\n`
      }).join('\n')
    : subtitles

  await fs.writeFile(srtPath, srtContent, 'utf-8')

  // 烧录字幕
  await execAsync(
    `ffmpeg -i "${videoPath}" -vf subtitles="${srtPath}" "${out}" -y`
  )

  await fs.unlink(srtPath).catch(() => {})
  return out
}

/**
 * 添加转场效果
 */
export async function addTransitions(options: {
  inputFiles: string[]
  transition: string
  duration: number
  outputPath?: string
}): Promise<string> {
  const { inputFiles, transition, duration, outputPath } = options
  await ensureDirs()
  const out = outputPath ?? path.join(OUTPUT_DIR, `${uuid()}_transitions.mp4`)

  // 简化实现：先直接拼接（完整转场需要复杂的 xfade 滤镜）
  return concatVideos({ inputFiles, outputPath: out })
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}
