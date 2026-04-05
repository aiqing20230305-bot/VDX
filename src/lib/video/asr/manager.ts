/**
 * ASR 引擎管理器
 * 支持多引擎自动降级
 */
import type { ASREngine, ASREngineType, TranscriptionResultWithEngine } from './types'
import { WhisperCppEngine } from './whisper-cpp'
import { AliyunASREngine } from './aliyun'
import { OpenAIASREngine } from './openai'

export class ASRManager {
  private engines: ASREngine[]
  private enabledEngines: Set<ASREngineType>

  constructor() {
    // 从环境变量读取启用的引擎（逗号分隔）
    // 默认：whisper-cpp（本地免费）
    const enabledStr = process.env.ASR_ENGINES || 'whisper-cpp'
    this.enabledEngines = new Set(enabledStr.split(',').map(s => s.trim()) as ASREngineType[])

    // 初始化所有引擎
    const allEngines: ASREngine[] = [
      new WhisperCppEngine(),
      new AliyunASREngine(),
      new OpenAIASREngine(),
    ]

    // 过滤启用的引擎并按优先级排序
    this.engines = allEngines
      .filter(e => this.enabledEngines.has(e.name as ASREngineType))
      .sort((a, b) => a.priority - b.priority)

    console.log('[ASRManager] 启用的引擎:', this.engines.map(e => e.name).join(', '))
  }

  /**
   * 转写音频（自动选择可用引擎）
   */
  async transcribe(audioPath: string): Promise<TranscriptionResultWithEngine> {
    if (this.engines.length === 0) {
      throw new Error('没有可用的 ASR 引擎，请配置 ASR_ENGINES 环境变量')
    }

    const errors: string[] = []

    for (const engine of this.engines) {
      try {
        // 检查引擎是否可用
        const available = await engine.isAvailable()
        if (!available) {
          console.warn(`[ASRManager] ${engine.name} 不可用，跳过`)
          errors.push(`${engine.name}: 未配置或不可用`)
          continue
        }

        console.log(`[ASRManager] 使用 ${engine.name} 进行转写...`)
        const startTime = Date.now()

        const result = await engine.transcribe(audioPath)

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        console.log(`[ASRManager] ${engine.name} 转写成功，耗时 ${duration}秒`)

        return {
          ...result,
          engine: engine.name,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.warn(`[ASRManager] ${engine.name} 失败: ${errorMsg}`)
        errors.push(`${engine.name}: ${errorMsg}`)
        // 继续尝试下一个引擎
      }
    }

    // 所有引擎都失败了
    throw new Error(
      `所有 ASR 引擎都失败了:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
    )
  }

  /**
   * 获取可用引擎列表
   */
  async getAvailableEngines(): Promise<Array<{ name: string; available: boolean; cost: string }>> {
    const results = await Promise.all(
      this.engines.map(async engine => {
        const available = await engine.isAvailable()
        const cost = engine.estimateCost(60)  // 估算1分钟的成本
        return {
          name: engine.name,
          available,
          cost: cost === 0 ? '免费' : `¥${cost.toFixed(4)}/分钟`,
        }
      })
    )
    return results
  }

  /**
   * 估算成本（选择最优引擎）
   */
  async estimateCost(durationSeconds: number): Promise<{ engine: string; cost: number }> {
    for (const engine of this.engines) {
      const available = await engine.isAvailable()
      if (available) {
        return {
          engine: engine.name,
          cost: engine.estimateCost(durationSeconds),
        }
      }
    }

    throw new Error('没有可用的 ASR 引擎')
  }
}

// 单例
let managerInstance: ASRManager | null = null

export function getASRManager(): ASRManager {
  if (!managerInstance) {
    managerInstance = new ASRManager()
  }
  return managerInstance
}
