/**
 * Block 执行上下文实现
 */
import type { BlockContext, ProgressEvent, Asset, ExecutionLog } from './types'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/utils/logger'

export class BlockContextImpl implements BlockContext {
  workflowId: string
  executionId: string
  userId?: string
  metadata: Record<string, any>

  private state: Map<string, any> = new Map()
  private assets: Map<string, Asset> = new Map()
  private logs: ExecutionLog[] = []
  private progressCallbacks: Array<(event: ProgressEvent) => void> = []

  constructor(config: {
    workflowId: string
    executionId: string
    userId?: string
    metadata?: Record<string, any>
  }) {
    this.workflowId = config.workflowId
    this.executionId = config.executionId
    this.userId = config.userId
    this.metadata = config.metadata || {}
  }

  // ─── 状态管理 ─────────────────────────────────────────────

  get(key: string): any {
    return this.state.get(key)
  }

  set(key: string, value: any): void {
    this.state.set(key, value)
  }

  has(key: string): boolean {
    return this.state.has(key)
  }

  delete(key: string): void {
    this.state.delete(key)
  }

  getAllState(): Record<string, any> {
    return Object.fromEntries(this.state)
  }

  // ─── 进度回调 ─────────────────────────────────────────────

  emitProgress(data: ProgressEvent): void {
    this.log('info', `Progress: ${data.status}`, data)
    this.progressCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (err) {
        logger.error('[BlockContext] Progress callback error:', err)
      }
    })
  }

  onProgress(callback: (event: ProgressEvent) => void): void {
    this.progressCallbacks.push(callback)
  }

  // ─── 日志 ─────────────────────────────────────────────────

  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry: ExecutionLog = {
      timestamp: new Date(),
      level,
      message,
      data,
    }
    this.logs.push(logEntry)

    // 使用环境感知的logger
    const log = logger.context(`BlockContext:${this.executionId.substring(0, 8)}`)
    switch (level) {
      case 'info':
        log.info(message, data || '')
        break
      case 'warn':
        log.warn(message, data || '')
        break
      case 'error':
        log.error(message, data || '')
        break
    }
  }

  getLogs(): ExecutionLog[] {
    return [...this.logs]
  }

  // ─── 资产存储 ─────────────────────────────────────────────

  async saveAsset(type: string, data: any): Promise<Asset> {
    const asset: Asset = {
      id: uuid(),
      type: type as any,
      data,
      metadata: {
        workflowId: this.workflowId,
        nodeId: '', // 由调用者补充
        createdAt: new Date(),
      },
    }
    this.assets.set(asset.id, asset)
    this.log('info', `Asset saved: ${asset.id} (${type})`)
    return asset
  }

  async getAsset(id: string): Promise<Asset | null> {
    return this.assets.get(id) || null
  }

  async listAssets(type?: string): Promise<Asset[]> {
    const allAssets = Array.from(this.assets.values())
    if (type) {
      return allAssets.filter(a => a.type === type)
    }
    return allAssets
  }

  async deleteAsset(id: string): Promise<boolean> {
    const deleted = this.assets.delete(id)
    if (deleted) {
      this.log('info', `Asset deleted: ${id}`)
    }
    return deleted
  }

  // ─── 辅助方法 ─────────────────────────────────────────────

  /**
   * 获取执行摘要
   */
  getSummary() {
    return {
      workflowId: this.workflowId,
      executionId: this.executionId,
      userId: this.userId,
      stateKeys: Array.from(this.state.keys()),
      assetCount: this.assets.size,
      logCount: this.logs.length,
      metadata: this.metadata,
    }
  }

  /**
   * 清理资源（执行结束后调用）
   */
  cleanup(): void {
    this.state.clear()
    this.assets.clear()
    this.logs = []
    this.progressCallbacks = []
  }
}

/**
 * 创建一个新的执行上下文
 */
export function createBlockContext(config: {
  workflowId: string
  executionId?: string
  userId?: string
  metadata?: Record<string, any>
}): BlockContext {
  return new BlockContextImpl({
    workflowId: config.workflowId,
    executionId: config.executionId || uuid(),
    userId: config.userId,
    metadata: config.metadata,
  })
}
