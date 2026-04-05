/**
 * 即梦 Seedance 视频生成封装
 * 通过 dreamina CLI 调用，使用本地登录态
 *
 * 前置条件：
 *   1. 安装 CLI: curl -fsSL https://jimeng.jianying.com/cli | bash
 *   2. 登录: dreamina login
 *   3. 验证: dreamina user_credit
 *
 * 支持模型：
 *   seedance2.0     — 高质量（默认）
 *   seedance2.0fast — 快速
 *
 * 支持比例：1:1, 3:4, 16:9, 4:3, 9:16, 21:9
 * 时长范围：4-15秒
 */
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export type SeedanceModel = 'seedance2.0' | 'seedance2.0fast'
export type SeedanceRatio = '1:1' | '3:4' | '16:9' | '4:3' | '9:16' | '21:9'

export interface SeedanceGenerateInput {
  prompt: string
  model?: SeedanceModel
  duration?: number           // 4-15 秒
  ratio?: SeedanceRatio
  resolution?: '720p'
  imageUrl?: string           // 图生视频的首帧图
  endImageUrl?: string        // 尾帧图
  /** 产品参考图列表，通过 multimodal2video 传入保证产品一致性 */
  productImages?: string[]
}

export interface SeedanceResult {
  submitId: string
  status: 'querying' | 'success' | 'fail'
  videoUrl?: string
  creditCount?: number
  failReason?: string
  queueIdx?: number
}

interface CLIOutput {
  submit_id: string
  gen_status: 'querying' | 'success' | 'fail'
  credit_count?: number
  fail_reason?: string
  queue_info?: { queue_idx: number; queue_length: number }
  // CLI 直接返回格式
  result_json?: {
    videos?: Array<{ video_url: string; duration?: number }>
  }
  // query_result 返回格式
  item_list?: Array<{
    video?: {
      video_url?: string
      origin_video_url?: string
    }
  }>
}

function parseCLIOutput(stdout: string): CLIOutput {
  // CLI 输出可能包含非JSON前缀，找到第一个 { 开始解析
  const jsonStart = stdout.indexOf('{')
  if (jsonStart === -1) throw new Error(`dreamina 输出无效: ${stdout.substring(0, 200)}`)
  return JSON.parse(stdout.substring(jsonStart)) as CLIOutput
}

/** 提交文生视频任务（有产品图时自动走 multimodal2video） */
export async function submitText2Video(input: SeedanceGenerateInput): Promise<SeedanceResult> {
  const hasProductImages = input.productImages && input.productImages.length > 0

  let args: string[]

  if (hasProductImages) {
    // 有产品图：用 multimodal2video 传入所有产品图作为参考
    args = [
      'multimodal2video',
      `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
      `--model_version=${input.model ?? 'seedance2.0'}`,
      `--duration=${Math.max(4, Math.min(input.duration ?? 5, 15))}`,
      ...input.productImages!.map(p => `--image="${p}"`),
    ]
    if (input.imageUrl) args.push(`--image="${input.imageUrl}"`)
  } else {
    args = [
      'text2video',
      `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
      `--model_version=${input.model ?? 'seedance2.0'}`,
      `--duration=${Math.max(4, Math.min(input.duration ?? 5, 15))}`,
    ]
  }

  if (input.ratio) args.push(`--ratio=${input.ratio}`)
  if (input.resolution) args.push(`--video_resolution=${input.resolution}`)

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 30_000 })
  const data = parseCLIOutput(stdout)

  return {
    submitId: data.submit_id,
    status: data.gen_status,
    creditCount: data.credit_count,
    queueIdx: data.queue_info?.queue_idx,
  }
}

/** 提交图生视频任务 */
export async function submitImage2Video(input: SeedanceGenerateInput & { imageUrl: string }): Promise<SeedanceResult> {
  const args = [
    'image2video',
    `--prompt="${input.prompt.replace(/"/g, '\\"')}"`,
    `--image="${input.imageUrl}"`,
    `--model_version=${input.model ?? 'seedance2.0'}`,
    `--duration=${Math.max(4, Math.min(input.duration ?? 5, 15))}`,
  ]

  if (input.ratio) args.push(`--ratio=${input.ratio}`)
  if (input.endImageUrl) args.push(`--end_image="${input.endImageUrl}"`)

  const { stdout } = await execAsync(`dreamina ${args.join(' ')}`, { timeout: 30_000 })
  const data = parseCLIOutput(stdout)

  return {
    submitId: data.submit_id,
    status: data.gen_status,
    creditCount: data.credit_count,
    queueIdx: data.queue_info?.queue_idx,
  }
}

/** 查询任务结果 */
export async function queryResult(submitId: string): Promise<SeedanceResult> {
  const { stdout } = await execAsync(
    `dreamina query_result --submit_id=${submitId}`,
    { timeout: 15_000 }
  )
  const data = parseCLIOutput(stdout)

  // 优先从 result_json 提取，兜底 item_list
  const videoUrl = data.result_json?.videos?.[0]?.video_url
    ?? data.item_list?.[0]?.video?.origin_video_url
    ?? data.item_list?.[0]?.video?.video_url
  return {
    submitId: data.submit_id,
    status: data.gen_status,
    videoUrl,
    creditCount: data.credit_count,
    failReason: data.fail_reason,
    queueIdx: data.queue_info?.queue_idx,
  }
}

/** 轮询直到完成 */
export async function pollUntilDone(
  submitId: string,
  onProgress?: (queueIdx: number) => void,
  maxWaitMs = 600_000,
): Promise<string> {
  const start = Date.now()

  while (Date.now() - start < maxWaitMs) {
    const result = await queryResult(submitId)

    if (result.queueIdx !== undefined) {
      onProgress?.(result.queueIdx)
    }

    if (result.status === 'success' && result.videoUrl) {
      return result.videoUrl
    }

    if (result.status === 'fail') {
      throw new Error(`Seedance 生成失败: ${result.failReason ?? '未知错误'}`)
    }

    await sleep(5000)
  }

  throw new Error('Seedance 生成超时 (10分钟)')
}

/** 统一入口：提交 + 轮询 + 返回视频URL */
export async function generateVideo(input: SeedanceGenerateInput): Promise<string> {
  let result: SeedanceResult

  if (input.imageUrl) {
    result = await submitImage2Video(input as SeedanceGenerateInput & { imageUrl: string })
  } else {
    result = await submitText2Video(input)
  }

  if (result.status === 'success' && result.videoUrl) {
    return result.videoUrl
  }

  return pollUntilDone(result.submitId)
}

/** 获取积分余额 */
export async function getUserCredit(): Promise<number> {
  const { stdout } = await execAsync('dreamina user_credit', { timeout: 10_000 })
  const match = stdout.match(/剩余积分[：:]\s*(\d+)/)?.[1]
    ?? stdout.match(/"credit"\s*:\s*(\d+)/)?.[1]
  return match ? parseInt(match) : 0
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
