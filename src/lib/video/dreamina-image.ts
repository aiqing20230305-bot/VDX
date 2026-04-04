/**
 * 即梦图片生成 & 风格转换
 * 用于：
 *   1. 分镜图生成（text2image）
 *   2. 人物形象转线稿/风格化（image2image）— 保留人物特征供视频生成参考
 *
 * 依赖 dreamina CLI（需已登录）
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

const execAsync = promisify(exec)
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

interface DreaminaResult {
  submitId: string
  status: 'querying' | 'success' | 'fail'
  imageUrls?: string[]
  failReason?: string
}

interface CLIOutput {
  submit_id: string
  gen_status: 'querying' | 'success' | 'fail'
  fail_reason?: string
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
  if (!data.item_list) return []
  return data.item_list
    .map(item => item.image?.large_images?.[0]?.image_url ?? item.common_attr?.cover_url)
    .filter(Boolean) as string[]
}

async function queryUntilDone(submitId: string, maxWaitMs = 120_000): Promise<string[]> {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    const { stdout } = await execAsync(`dreamina query_result --submit_id=${submitId}`, { timeout: 15_000 })
    const data = parseCLI(stdout)

    if (data.gen_status === 'success') {
      return extractImageUrls(data)
    }
    if (data.gen_status === 'fail') {
      throw new Error(`生成失败: ${data.fail_reason ?? '未知错误'}`)
    }
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('图片生成超时')
}

// ─── 分镜图生成 ─────────────────────────────────────────────

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
 * 返回图片 URL 列表
 */
export async function text2Image(input: Text2ImageInput): Promise<string[]> {
  const args = [
    'text2image',
    `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
    `--model_version=${input.model ?? '5.0'}`,
    `--ratio=${input.ratio ?? '16:9'}`,
    `--resolution_type=${input.resolution ?? '2k'}`,
    '--poll=60',
  ]

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 90_000 })
  const data = parseCLI(stdout)

  if (data.gen_status === 'success') {
    return extractImageUrls(data)
  }

  // 还在生成中，轮询
  return queryUntilDone(data.submit_id)
}

// ─── 人物形象转风格 ─────────────────────────────────────────

/**
 * 人物线稿化风格列表
 * 这些提示词可将真人照片转为保留特征的风格化图片
 * 转换后的图片可作为视频生成的参考，绕过"不支持真人参考"的限制
 */
export const CHARACTER_STYLE_PROMPTS = {
  /** 线稿 — 保留轮廓和五官特征，去除真实肤色 */
  lineart: 'Convert to clean line art drawing, preserve facial features and body proportions, black lines on white background, detailed contour drawing, manga style outline',

  /** 动漫风 — 保留人物特征的动漫化 */
  anime: 'Convert to high quality anime style illustration, preserve character facial features and proportions, anime art style, detailed character design, vibrant colors',

  /** 3D 卡通 — 保留特征的 Pixar 风 */
  cartoon3d: 'Convert to 3D cartoon character style like Pixar, preserve facial features and body proportions, smooth rendering, stylized 3D character',

  /** 水彩速写 — 艺术化但保留特征 */
  watercolor: 'Convert to watercolor sketch style, preserve character features and proportions, artistic watercolor painting, soft brush strokes, character portrait',

  /** 赛博朋克 — 科幻风格化 */
  cyberpunk: 'Convert to cyberpunk style character illustration, preserve facial features, neon lighting, futuristic outfit, detailed sci-fi character design',

  /** CG 写实 — 接近真人但过滤为 CG 风格 */
  cg_realistic: 'Convert to photorealistic CG rendering, preserve all facial features and proportions exactly, ultra detailed CG character, subtle stylization, movie quality character render',
} as const

export type CharacterStyle = keyof typeof CHARACTER_STYLE_PROMPTS

export interface CharacterStyleInput {
  /** 人物照片本地路径 */
  imagePath: string
  /** 风格类型 */
  style: CharacterStyle
  /** 额外提示词（叠加在风格提示词之后） */
  additionalPrompt?: string
  /** 输出比例 */
  ratio?: ImageRatio
  /** 模型版本 */
  model?: ImageModel
}

/**
 * 人物形象风格转换
 * 真人照片 → 线稿/动漫/3D 等风格 → 保留人物特征
 * 转换后的图片可安全用于视频生成参考
 */
export async function convertCharacterStyle(input: CharacterStyleInput): Promise<string[]> {
  const stylePrompt = CHARACTER_STYLE_PROMPTS[input.style]
  const prompt = input.additionalPrompt
    ? `${stylePrompt}, ${input.additionalPrompt}`
    : stylePrompt

  const args = [
    'image2image',
    `--images="${input.imagePath}"`,
    `--prompt="${prompt.replace(/"/g, '\\"')}"`,
    `--model_version=${input.model ?? '5.0'}`,
    `--ratio=${input.ratio ?? '1:1'}`,
    '--resolution_type=2k',
    '--poll=60',
  ]

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 90_000 })
  const data = parseCLI(stdout)

  if (data.gen_status === 'success') {
    return extractImageUrls(data)
  }

  return queryUntilDone(data.submit_id)
}

/**
 * 下载远程图片到本地（供 image2image 使用）
 */
export async function downloadImage(url: string): Promise<string> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = url.match(/\.(jpg|jpeg|png|webp)/i)?.[1] ?? 'jpg'
  const localPath = path.join(UPLOAD_DIR, `${uuid()}.${ext}`)

  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(localPath, buffer)
  return localPath
}

// ─── 批量分镜图生成 ─────────────────────────────────────────

export interface StoryboardImageInput {
  /** 每帧的图片生成提示词 */
  framePrompts: string[]
  /** 统一比例 */
  ratio?: ImageRatio
  /** 角色一致性参考（风格化后的角色图） */
  characterRef?: string
}

/**
 * 批量生成分镜图
 * 逐帧生成，返回图片 URL 数组（与 framePrompts 一一对应）
 */
export async function generateStoryboardImages(input: StoryboardImageInput): Promise<string[]> {
  const results: string[] = []

  for (const prompt of input.framePrompts) {
    const fullPrompt = input.characterRef
      ? `${prompt}, consistent character design`
      : prompt

    const urls = await text2Image({
      prompt: fullPrompt,
      ratio: input.ratio ?? '16:9',
      model: '5.0',
      resolution: '2k',
    })

    results.push(urls[0] ?? '')
  }

  return results
}
