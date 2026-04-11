/**
 * BullMQ 任务队列管理器
 * 支持视频生成、图片生成等异步任务
 */
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import { Redis } from 'ioredis'

// Redis 配置
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// 创建 Redis 连接
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ 需要
  lazyConnect: true, // 延迟连接
})

// 队列名称枚举
export enum QueueName {
  VIDEO_GENERATION = 'video-generation',
  IMAGE_GENERATION = 'image-generation',
  STORYBOARD = 'storyboard',
}

// 任务优先级
export enum TaskPriority {
  LOW = 10,
  NORMAL = 5,
  HIGH = 1,
  URGENT = 0,
}

// 任务状态
export enum TaskStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

// 视频生成任务数据
export interface VideoGenerationTaskData {
  storyboardId: string
  userId?: string
  config: {
    resolution: string
    fps: number
    engine?: 'seedance' | 'kling' | 'remotion' | 'ffmpeg'
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
    withSubtitles?: boolean
    withTransitions?: boolean
  }
}

// 图片生成任务数据
export interface ImageGenerationTaskData {
  prompt: string
  count: number
  ratio: '9:16' | '16:9'
  model?: string
}

// 分镜生成任务数据
export interface StoryboardTaskData {
  scriptId: string
  fillImages: boolean
  referenceImages?: string[]
}

// 任务进度数据
export interface TaskProgress {
  progress: number // 0-100
  stage: string // 当前阶段描述
  currentStep?: number // 当前步骤
  totalSteps?: number // 总步骤数
  message?: string // 额外信息
}

// 队列管理器
export class QueueManager {
  private queues: Map<QueueName, Queue> = new Map()
  private workers: Map<QueueName, Worker> = new Map()
  private events: Map<QueueName, QueueEvents> = new Map()

  /**
   * 获取或创建队列
   */
  getQueue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection,
        defaultJobOptions: {
          removeOnComplete: 100, // 保留最近100个完成任务
          removeOnFail: 500, // 保留最近500个失败任务
          attempts: 3, // 失败后重试3次
          backoff: {
            type: 'exponential',
            delay: 2000, // 2秒起始延迟
          },
        },
      })
      this.queues.set(name, queue)
    }
    return this.queues.get(name)!
  }

  /**
   * 创建任务
   */
  async addTask<T>(
    queueName: QueueName,
    data: T,
    options?: {
      priority?: TaskPriority
      delay?: number // 延迟执行（毫秒）
      jobId?: string // 自定义任务ID
    }
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName)
    return queue.add(queueName, data, {
      priority: options?.priority ?? TaskPriority.NORMAL,
      delay: options?.delay,
      jobId: options?.jobId,
    })
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(queueName: QueueName, jobId: string): Promise<{
    id: string
    status: TaskStatus
    progress?: TaskProgress
    result?: any
    error?: string
  } | null> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)

    if (!job) return null

    const state = await job.getState()
    const progress = job.progress as TaskProgress | undefined

    return {
      id: job.id!,
      status: state as TaskStatus,
      progress,
      result: job.returnvalue,
      error: job.failedReason,
    }
  }

  /**
   * 取消任务
   */
  async cancelTask(queueName: QueueName, jobId: string): Promise<boolean> {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)

    if (!job) return false

    await job.remove()
    return true
  }

  /**
   * 获取队列统计
   */
  async getQueueStats(queueName: QueueName) {
    const queue = this.getQueue(queueName)
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ])

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    }
  }

  /**
   * 订阅任务进度（用于 WebSocket/SSE）
   */
  onJobProgress(
    queueName: QueueName,
    jobId: string,
    callback: (progress: TaskProgress) => void
  ): () => void {
    const events = this.getQueueEvents(queueName)

    const handler = async (args: { jobId: string; data: any }) => {
      if (args.jobId === jobId) {
        callback(args.data as TaskProgress)
      }
    }

    events.on('progress', handler)

    // 返回取消订阅函数
    return () => {
      events.off('progress', handler)
    }
  }

  /**
   * 订阅任务完成
   */
  onJobCompleted(
    queueName: QueueName,
    jobId: string,
    callback: (result: any) => void
  ): () => void {
    const events = this.getQueueEvents(queueName)

    const handler = async (args: { jobId: string; returnvalue: any }) => {
      if (args.jobId === jobId) {
        callback(args.returnvalue)
      }
    }

    events.on('completed', handler)

    return () => {
      events.off('completed', handler)
    }
  }

  /**
   * 订阅任务失败
   */
  onJobFailed(
    queueName: QueueName,
    jobId: string,
    callback: (error: Error) => void
  ): () => void {
    const events = this.getQueueEvents(queueName)

    const handler = async (args: { jobId: string; failedReason: string }) => {
      if (args.jobId === jobId) {
        callback(new Error(args.failedReason))
      }
    }

    events.on('failed', handler)

    return () => {
      events.off('failed', handler)
    }
  }

  /**
   * 获取队列事件
   */
  private getQueueEvents(queueName: QueueName): QueueEvents {
    if (!this.events.has(queueName)) {
      const events = new QueueEvents(queueName, { connection })
      this.events.set(queueName, events)
    }
    return this.events.get(queueName)!
  }

  /**
   * 清理资源
   */
  async close(): Promise<void> {
    await Promise.all([
      ...Array.from(this.queues.values()).map(q => q.close()),
      ...Array.from(this.workers.values()).map(w => w.close()),
      ...Array.from(this.events.values()).map(e => e.close()),
      connection.quit(),
    ])
  }
}

// 单例
let queueManager: QueueManager | null = null

export function getQueueManager(): QueueManager {
  if (!queueManager) {
    queueManager = new QueueManager()
  }
  return queueManager
}
