/**
 * 即梦（Dreamina）原生HTTP API客户端
 * 比CLI版本更稳定、更快速、更易调试
 */

import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger'

const log = logger.context('DreaminaAPI')

// 即梦API端点（可通过环境变量配置）
const API_BASE_URL = process.env.DREAMINA_API_BASE_URL || 'https://api.jimeng.jianying.com/api/v1'
const API_KEY = process.env.DREAMINA_API_KEY || ''

if (!API_KEY) {
  log.warn('No API key found. Set DREAMINA_API_KEY env variable.')
} else {
  log.debug('API configured', { endpoint: API_BASE_URL, keyPrefix: API_KEY.substring(0, 8) })
}

interface DreaminaTaskResponse {
  code: number
  message: string
  data: {
    task_id: string
    submit_id: string
  }
}

interface DreaminaQueryResponse {
  code: number
  message: string
  data: {
    status: 'pending' | 'processing' | 'success' | 'failed'
    result?: {
      images: Array<{ url: string }>
    }
    error?: string
  }
}

/**
 * 发送HTTP请求到即梦API
 */
async function dreaminaFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`Dreamina API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error(`Dreamina API error: ${data.message || 'Unknown error'}`)
  }

  return data as T
}

/**
 * 轮询任务直到完成
 */
async function pollUntilComplete(
  taskId: string,
  maxWaitMs: number = 300_000 // 5分钟
): Promise<string[]> {
  const startTime = Date.now()
  const pollInterval = 3000 // 每3秒轮询一次

  while (Date.now() - startTime < maxWaitMs) {
    const response = await dreaminaFetch<DreaminaQueryResponse>(
      `/query_result?task_id=${taskId}`,
      { method: 'GET' }
    )

    const { status, result, error } = response.data

    if (status === 'success' && result?.images) {
      return result.images.map(img => img.url)
    }

    if (status === 'failed') {
      throw new Error(`生成失败: ${error || 'Unknown error'}`)
    }

    // 继续等待
    await new Promise(resolve => setTimeout(resolve, pollInterval))
  }

  throw new Error(`任务超时（${maxWaitMs / 1000}秒）`)
}

/**
 * 文生图 - HTTP API版本
 */
export async function text2ImageAPI(params: {
  prompt: string
  model?: string
  ratio?: string
  resolution?: string
}): Promise<string[]> {
  log.debug('text2image request', { promptPreview: params.prompt.substring(0, 100) })

  const response = await dreaminaFetch<DreaminaTaskResponse>('/text2image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: params.prompt,
      model_version: params.model || '5.0',
      ratio: params.ratio || '16:9',
      resolution_type: params.resolution || '2k',
      request_id: uuid(),
    }),
  })

  const taskId = response.data.task_id || response.data.submit_id
  log.debug('Task submitted', { taskId })

  return pollUntilComplete(taskId)
}

/**
 * 图生图 - HTTP API版本
 */
export async function image2ImageAPI(params: {
  imageUrl: string
  prompt: string
  model?: string
  ratio?: string
  resolution?: string
}): Promise<string[]> {
  log.debug('image2image request', { promptPreview: params.prompt.substring(0, 100) })

  const response = await dreaminaFetch<DreaminaTaskResponse>('/image2image', {
    method: 'POST',
    body: JSON.stringify({
      image_url: params.imageUrl,
      prompt: params.prompt,
      model_version: params.model || '5.0',
      ratio: params.ratio || '1:1',
      resolution_type: params.resolution || '2k',
      request_id: uuid(),
    }),
  })

  const taskId = response.data.task_id || response.data.submit_id
  log.debug('Task submitted', { taskId })

  return pollUntilComplete(taskId)
}

/**
 * 查询积分余额
 */
export async function getUserCreditAPI(): Promise<number> {
  try {
    const response = await dreaminaFetch<{ data: { credit: number } }>(
      '/user/credit',
      { method: 'GET' }
    )
    return response.data.credit
  } catch (err) {
    log.error('Failed to get user credit', err)
    return 0
  }
}
