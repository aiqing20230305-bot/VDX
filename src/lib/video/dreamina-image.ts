/**
 * 即梦图片生成 & 风格转换 & 图片处理
 *
 * 能力：
 *   1. text2image  — 文生图（分镜图）
 *   2. image2image — 图生图（风格转换、分镜参考、人物线稿化）
 *   3. 图片格式转换 — 不支持的格式自动转为 PNG/JPG
 *   4. 图片分析    — 用 Claude 分析上传图片的内容和特征
 *
 * 支持两种模式：
 *   - CLI模式（默认）: 使用dreamina命令行工具
 *   - API模式: 直接调用HTTP API（设置DREAMINA_USE_API=true）
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'
import { text2ImageAPI, image2ImageAPI } from './dreamina-api'
import { logger } from '@/lib/utils/logger'

const log = logger.context('DreaminaImage')
const execAsync = promisify(exec)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const USE_API = process.env.DREAMINA_USE_API === 'true'

log.info('Dreamina mode initialized', { mode: USE_API ? 'HTTP API' : 'CLI' })

// ─── CLI 解析 ───────────────────────────────────────────────

interface CLIOutput {
  submit_id: string
  gen_status: 'querying' | 'success' | 'fail'
  fail_reason?: string
  // dreamina CLI 直接返回格式
  result_json?: {
    images?: Array<{ image_url: string; width?: number; height?: number }>
    videos?: Array<{ video_url: string }>
  }
  // jimeng-mcp 格式（轮询 query_result 时）
  item_list?: Array<{
    image?: {
      large_images?: Array<{ image_url: string }>
    }
    common_attr?: { cover_url?: string }
  }>
}

function parseCLI(stdout: string): CLIOutput {
  const i = stdout.indexOf('{')
  if (i === -1) throw new Error(`dreamina 输出无效: ${stdout.substring(0, 200)}`)
  return JSON.parse(stdout.substring(i)) as CLIOutput
}

function extractImageUrls(data: CLIOutput): string[] {
  // 优先从 result_json 提取（CLI 直接返回的格式）
  if (data.result_json?.images?.length) {
    return data.result_json.images.map(img => img.image_url).filter(Boolean)
  }
  // 兜底：从 item_list 提取（query_result 返回的格式）
  if (data.item_list?.length) {
    return data.item_list
      .map(item => item.image?.large_images?.[0]?.image_url ?? item.common_attr?.cover_url)
      .filter(Boolean) as string[]
  }
  return []
}

async function queryUntilDone(submitId: string, maxWaitMs = 120_000): Promise<string[]> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const { stdout } = await execAsync(`dreamina query_result --submit_id=${submitId}`, { timeout: 15_000 })
    const data = parseCLI(stdout)
    if (data.gen_status === 'success') return extractImageUrls(data)
    if (data.gen_status === 'fail') throw new Error(`生成失败: ${data.fail_reason ?? '未知'}`)
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('图片生成超时')
}

// ─── 图片格式转换 ────────────────────────────────────────────

/** dreamina 支持的图片格式 */
const SUPPORTED_FORMATS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/**
 * 确保图片格式被 dreamina 支持
 * 不支持的格式（HEIC、BMP、TIFF、AVIF 等）自动转为 PNG
 */
export async function ensureSupportedFormat(imagePath: string): Promise<string> {
  const ext = path.extname(imagePath).toLowerCase()
  if (SUPPORTED_FORMATS.has(ext)) return imagePath

  // 用 sips（macOS 内置）转换格式
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const outputPath = path.join(UPLOAD_DIR, `${uuid()}.png`)

  try {
    await execAsync(`sips -s format png "${imagePath}" --out "${outputPath}"`, { timeout: 30_000 })
    return outputPath
  } catch {
    // sips 失败时尝试 ffmpeg
    try {
      await execAsync(`ffmpeg -i "${imagePath}" "${outputPath}" -y`, { timeout: 30_000 })
      return outputPath
    } catch {
      throw new Error(`不支持的图片格式 ${ext}，转换失败。请使用 JPG/PNG/WebP 格式。`)
    }
  }
}

/**
 * 下载远程图片到本地（绝对路径，供 CLI 工具使用）
 */
export async function downloadImage(url: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = url.match(/\.(jpg|jpeg|png|webp|heic|bmp|tiff|avif)/i)?.[1] ?? 'png'
  const localPath = path.join(UPLOAD_DIR, `${uuid()}.${ext}`)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载图片失败: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(localPath, buffer)

  return ensureSupportedFormat(localPath)
}

/**
 * 处理上传的文件 — 保存到本地并确保格式支持
 */
export async function saveUploadedImage(file: File): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = file.name.split('.').pop() ?? 'jpg'
  const localPath = path.join(UPLOAD_DIR, `${uuid()}.${ext}`)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(localPath, buffer)
  return ensureSupportedFormat(localPath)
}

// ─── 文生图 ─────────────────────────────────────────────────

export type ImageRatio = '21:9' | '16:9' | '3:2' | '4:3' | '1:1' | '3:4' | '2:3' | '9:16'
export type ImageModel = '3.0' | '3.1' | '4.0' | '4.1' | '4.5' | '4.6' | '5.0' | 'lab'

export interface Text2ImageInput {
  prompt: string
  ratio?: ImageRatio
  model?: ImageModel
  resolution?: '1k' | '2k' | '4k'
}

/**
 * 文生图 — 用于分镜图生成
 */
export async function text2Image(input: Text2ImageInput): Promise<string[]> {
  // API模式：直接调用HTTP API
  if (USE_API) {
    return text2ImageAPI({
      prompt: input.prompt,
      model: input.model,
      ratio: input.ratio,
      resolution: input.resolution,
    })
  }

  // CLI模式：使用dreamina命令行
  const args = [
    'text2image',
    `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
    `--model_version=${input.model ?? '5.0'}`,
    `--ratio=${input.ratio ?? '16:9'}`,
    `--resolution_type=${input.resolution ?? '2k'}`,
    '--poll=180', // 增加到180秒（3分钟）
  ]

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 210_000 }) // 3.5分钟
  const data = parseCLI(stdout)

  if (data.gen_status === 'success') return extractImageUrls(data)
  return queryUntilDone(data.submit_id, 300_000) // 再等5分钟
}

// ─── 图生图 ─────────────────────────────────────────────────

export interface Image2ImageInput {
  /** 本地图片路径（会自动转换不支持的格式） */
  imagePath: string
  /** 编辑/风格提示词 */
  prompt: string
  ratio?: ImageRatio
  model?: ImageModel
  resolution?: '2k' | '4k'
}

/**
 * 图生图 — 用于：
 *   - 参考图片生成分镜（保留构图和内容方向）
 *   - 人物照片风格转换
 *   - 图片风格统一
 */
export async function image2Image(input: Image2ImageInput): Promise<string[]> {
  // 确保图片格式支持
  const safePath = await ensureSupportedFormat(input.imagePath)

  // API模式：需要将本地图片转为公共URL
  if (USE_API) {
    // 复制图片到public/uploads并获取URL
    const imageUrl = await getPublicImageUrl(safePath)
    return image2ImageAPI({
      imageUrl,
      prompt: input.prompt,
      model: input.model,
      ratio: input.ratio,
      resolution: input.resolution,
    })
  }

  // CLI模式：直接使用本地路径
  const args = [
    'image2image',
    `--images="${safePath}"`,
    `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
    `--model_version=${input.model ?? '5.0'}`,
    `--ratio=${input.ratio ?? '1:1'}`,
    `--resolution_type=${input.resolution ?? '2k'}`,
    '--poll=180', // 增加到180秒
  ]

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 210_000 }) // 3.5分钟
  const data = parseCLI(stdout)

  if (data.gen_status === 'success') return extractImageUrls(data)
  return queryUntilDone(data.submit_id, 300_000) // 再等5分钟
}

/**
 * 将本地图片复制到public/uploads并返回公共URL
 * 用于API模式需要提供图片URL的场景
 */
async function getPublicImageUrl(localPath: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = path.extname(localPath)
  const filename = `${uuid()}${ext}`
  const publicPath = path.join(UPLOAD_DIR, filename)

  // 复制文件
  await fs.copyFile(localPath, publicPath)

  // 返回公共URL（假设服务器运行在localhost:3000）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  return `${baseUrl}/uploads/${filename}`
}

// ─── 人物风格转换 ────────────────────────────────────────────

export const CHARACTER_STYLE_PROMPTS = {
  lineart: 'Convert to clean line art drawing, preserve facial features and body proportions, black lines on white background, detailed contour drawing, manga style outline',
  anime: 'Convert to high quality anime style illustration, preserve character facial features and proportions, anime art style, detailed character design, vibrant colors',
  cartoon3d: 'Convert to 3D cartoon character style like Pixar, preserve facial features and body proportions, smooth rendering, stylized 3D character',
  watercolor: 'Convert to watercolor sketch style, preserve character features and proportions, artistic watercolor painting, soft brush strokes, character portrait',
  cyberpunk: 'Convert to cyberpunk style character illustration, preserve facial features, neon lighting, futuristic outfit, detailed sci-fi character design',
  cg_realistic: 'Convert to photorealistic CG rendering, preserve all facial features and proportions exactly, ultra detailed CG character, subtle stylization, movie quality character render',
} as const

export type CharacterStyle = keyof typeof CHARACTER_STYLE_PROMPTS

/**
 * 人物形象风格转换
 * 真人照片 → 线稿/动漫/CG → 保留特征 → 可作为视频生成参考
 */
export async function convertCharacterStyle(input: {
  imagePath: string
  style: CharacterStyle
  additionalPrompt?: string
  ratio?: ImageRatio
}): Promise<string[]> {
  const prompt = input.additionalPrompt
    ? `${CHARACTER_STYLE_PROMPTS[input.style]}, ${input.additionalPrompt}`
    : CHARACTER_STYLE_PROMPTS[input.style]

  return image2Image({
    imagePath: input.imagePath,
    prompt,
    ratio: input.ratio ?? '9:16',  // 人物默认竖版
    model: '5.0',
  })
}

// ─── 分镜图批量生成 ──────────────────────────────────────────

export interface StoryboardFrameInput {
  /** 帧索引 */
  index: number
  /** 图片生成提示词 */
  imagePrompt: string
  /** 参考图片本地路径（有则用图生图，无则用文生图） */
  referenceImagePath?: string
  /** 图生图时的额外引导词 */
  referenceEditPrompt?: string
}

export interface BatchStoryboardInput {
  frames: StoryboardFrameInput[]
  ratio?: ImageRatio
  /** 逐帧回调 */
  onFrameDone?: (index: number, imageUrl: string) => void
}

/**
 * 批量生成分镜图
 * 每帧自动判断：有参考图 → image2image，无参考图 → text2image
 */
export async function generateStoryboardImages(input: BatchStoryboardInput): Promise<string[]> {
  const results: string[] = []

  for (const frame of input.frames) {
    try {
      let urls: string[]

      if (frame.referenceImagePath) {
        // 图生图：基于参考图片生成分镜
        urls = await image2Image({
          imagePath: frame.referenceImagePath,
          prompt: frame.referenceEditPrompt ?? frame.imagePrompt,
          ratio: input.ratio ?? '16:9',
        })
      } else {
        // 文生图：纯提示词生成
        urls = await text2Image({
          prompt: frame.imagePrompt,
          ratio: input.ratio ?? '16:9',
          model: '5.0',
          resolution: '2k',
        })
      }

      const url = urls[0] ?? ''
      results.push(url)
      if (url) input.onFrameDone?.(frame.index, url)
    } catch (err) {
      log.error('Storyboard frame image generation failed', err, { frameIndex: frame.index })
      results.push('') // 失败帧留空
    }
  }

  return results
}

// ─── 图片本地化（远程URL → 本地可访问路径）──────────────────

/**
 * 将远程图片 URL 下载到 public/uploads/，返回浏览器可访问的路径
 * 即梦返回的图片是带签名的临时 CDN 链接，会过期，必须下载到本地
 */
export async function localizeImageUrl(remoteUrl: string): Promise<string> {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${uuid()}.png`
  const localPath = path.join(UPLOAD_DIR, filename)

  const res = await fetch(remoteUrl)
  if (!res.ok) throw new Error(`下载图片失败: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(localPath, buffer)

  return `/uploads/${filename}`
}

/**
 * 批量本地化图片 URL
 */
export async function localizeImageUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => url ? localizeImageUrl(url) : Promise.resolve('')))
}

/**
 * 本地化视频 URL（下载远程视频到本地）
 */
export async function localizeVideoUrl(remoteUrl: string): Promise<string> {
  if (!remoteUrl || !remoteUrl.startsWith('http')) return remoteUrl

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const filename = `${uuid()}.mp4`
  const localPath = path.join(UPLOAD_DIR, filename)

  const res = await fetch(remoteUrl)
  if (!res.ok) throw new Error(`下载视频失败: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(localPath, buffer)

  return `/uploads/${filename}`
}

/**
 * 批量本地化视频 URL
 */
export async function localizeVideoUrls(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => url ? localizeVideoUrl(url) : Promise.resolve('')))
}
