/**
 * 可灵 (Kling) AI 视频生成 API 封装
 * 鉴权：Access Key + Secret Key → JWT (HS256)
 *
 * 重要：中国大陆用户必须使用 api-beijing.klingai.com
 *       接口路径为 /v1/videos/text2video（不是 /generation）
 */
import jwt from 'jsonwebtoken'
import https from 'https'
import type { AspectRatio } from '@/types'

const BASE_HOST = new URL(process.env.KLING_API_URL ?? 'https://api-beijing.klingai.com').hostname
const ACCESS_KEY = process.env.KLING_ACCESS_KEY ?? ''
const SECRET_KEY = process.env.KLING_SECRET_KEY ?? ''

/** 生成可灵 JWT Token（有效期30分钟） */
function generateToken(): string {
  const now = Math.floor(Date.now() / 1000)
  return jwt.sign(
    { iss: ACCESS_KEY, exp: now + 1800, nbf: now - 5 },
    SECRET_KEY,
    { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } }
  )
}

export type KlingMode = 'std' | 'pro'
export type KlingDuration = '5' | '10'
export type KlingModel = 'kling-v1' | 'kling-v1-5' | 'kling-v1-6' | 'kling-v2'

export interface KlingVideoInput {
  prompt: string
  negativePrompt?: string
  modelName?: KlingModel
  imageUrl?: string
  tailImageUrl?: string
  duration?: KlingDuration
  aspectRatio?: AspectRatio
  mode?: KlingMode
  cfgScale?: number
  seed?: number
  callbackUrl?: string
}

export interface KlingJob {
  taskId: string
  status: 'submitted' | 'processing' | 'succeed' | 'failed'
  videoUrl?: string
  coverUrl?: string
  progress?: number
  error?: string
}

interface KlingResponse<T> {
  code: number
  message: string
  request_id: string
  data: T
}

interface KlingTaskResult {
  task_id: string
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
  task_status_msg?: string
  task_result?: {
    videos?: Array<{ id: string; url: string; duration: string }>
  }
  created_at?: number
  updated_at?: number
}

/**
 * 直连请求（绕过系统代理）
 * 可灵北京节点需要中国大陆直连
 */
function directRequest(
  method: 'GET' | 'POST',
  path: string,
  body?: string
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${generateToken()}`,
      'Content-Type': 'application/json',
    }
    if (body) headers['Content-Length'] = String(Buffer.byteLength(body))

    const req = https.request(
      { hostname: BASE_HOST, port: 443, path, method, headers },
      (res) => {
        let data = ''
        res.on('data', chunk => (data += chunk))
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
      }
    )
    req.on('error', reject)
    req.setTimeout(30_000, () => req.destroy(new Error('Request timeout')))
    if (body) req.write(body)
    req.end()
  })
}

async function request<T>(
  method: 'GET' | 'POST',
  endpoint: string,
  body?: unknown
): Promise<T> {
  const bodyStr = body ? JSON.stringify(body) : undefined
  const { status, body: responseText } = await directRequest(method, endpoint, bodyStr)

  let data: KlingResponse<T>
  try {
    data = JSON.parse(responseText) as KlingResponse<T>
  } catch {
    throw new Error(`Kling API 返回非 JSON: ${status} ${responseText.substring(0, 200)}`)
  }

  if (data.code !== 0) {
    throw new Error(
      `Kling API 错误 [code=${data.code}]: ${data.message || '未知错误'} (request_id: ${data.request_id})`
    )
  }

  return data.data
}

// ─── 文生视频 ───────────────────────────────────────────────

export async function text2Video(input: KlingVideoInput): Promise<KlingJob> {
  const result = await request<KlingTaskResult>('POST', '/v1/videos/text2video', {
    model_name: input.modelName ?? 'kling-v1',
    prompt: input.prompt,
    negative_prompt: input.negativePrompt ?? 'blurry, low quality, watermark, text',
    cfg_scale: input.cfgScale ?? 0.5,
    mode: input.mode ?? 'std',
    aspect_ratio: input.aspectRatio ?? '16:9',
    duration: input.duration ?? '5',
    ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
  })
  return parseTaskResult(result)
}

// ─── 图生视频 ───────────────────────────────────────────────

export async function image2Video(input: KlingVideoInput & { imageUrl: string }): Promise<KlingJob> {
  const result = await request<KlingTaskResult>('POST', '/v1/videos/image2video', {
    model_name: input.modelName ?? 'kling-v1',
    prompt: input.prompt,
    negative_prompt: input.negativePrompt ?? 'blurry, low quality, watermark',
    image: input.imageUrl,
    ...(input.tailImageUrl ? { image_tail: input.tailImageUrl } : {}),
    cfg_scale: input.cfgScale ?? 0.5,
    mode: input.mode ?? 'std',
    duration: input.duration ?? '5',
    ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
  })
  return parseTaskResult(result)
}

/** 统一入口：根据是否有图片自动选择文生/图生 */
export async function generateVideo(input: KlingVideoInput): Promise<KlingJob> {
  if (input.imageUrl) {
    return image2Video(input as KlingVideoInput & { imageUrl: string })
  }
  return text2Video(input)
}

// ─── 查询任务 ───────────────────────────────────────────────

export async function getTaskStatus(taskId: string, type: 'text2video' | 'image2video' = 'text2video'): Promise<KlingJob> {
  const result = await request<KlingTaskResult>('GET', `/v1/videos/${type}/${taskId}`)
  return parseTaskResult(result)
}

/** 轮询直到完成 */
export async function pollUntilDone(
  taskId: string,
  onProgress?: (progress: number) => void,
  maxWaitMs = 300_000,
  type: 'text2video' | 'image2video' = 'text2video'
): Promise<string> {
  const start = Date.now()

  while (Date.now() - start < maxWaitMs) {
    const status = await getTaskStatus(taskId, type)
    if (status.progress !== undefined) onProgress?.(status.progress)
    if (status.status === 'succeed' && status.videoUrl) return status.videoUrl
    if (status.status === 'failed') {
      throw new Error(`Kling 视频生成失败: ${status.error ?? '未知错误'}`)
    }
    await sleep(3000)
  }

  throw new Error('Kling 视频生成超时 (5分钟)')
}

function parseTaskResult(raw: KlingTaskResult): KlingJob {
  const video = raw.task_result?.videos?.[0]
  return {
    taskId: raw.task_id,
    status: raw.task_status,
    videoUrl: video?.url,
    error: raw.task_status_msg,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
