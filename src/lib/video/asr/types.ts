/**
 * 语音识别（ASR）统一接口
 */

export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  text: string
  segments?: TranscriptionSegment[]
  language?: string
  duration?: number
}

export interface TranscriptionResultWithEngine extends TranscriptionResult {
  engine: string
}

export interface ASREngine {
  /** 引擎名称 */
  name: string

  /** 转写音频文件 */
  transcribe(audioPath: string): Promise<TranscriptionResult>

  /** 检查引擎是否可用 */
  isAvailable(): Promise<boolean>

  /** 估算成本（人民币/秒） */
  estimateCost(durationSeconds: number): number

  /** 引擎优先级（越小越优先） */
  priority: number
}

export type ASREngineType = 'whisper-cpp' | 'aliyun' | 'openai' | 'tencent' | 'baidu'
