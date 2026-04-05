/**
 * OpenAI Whisper API 引擎
 * 文档：https://platform.openai.com/docs/guides/speech-to-text
 * 价格：$0.006/分钟 ≈ ¥0.042/分钟
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import type { ASREngine, TranscriptionResult } from './types'

const execAsync = promisify(exec)

export class OpenAIASREngine implements ASREngine {
  name = 'openai'
  priority = 3  // 第三优先级（贵且需要代理）

  private apiKey: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey)
  }

  estimateCost(durationSeconds: number): number {
    // $0.006/分钟，按汇率 1:7 计算
    return (durationSeconds / 60) * 0.006 * 7
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('未配置 OPENAI_API_KEY')
    }

    // 检查文件是否存在
    if (!existsSync(audioPath)) {
      throw new Error(`音频文件不存在: ${audioPath}`)
    }

    // 检查文件大小（Whisper API 限制 25MB）
    const stats = await fs.stat(audioPath)
    if (stats.size > 25 * 1024 * 1024) {
      throw new Error(`音频文件过大（${(stats.size / 1024 / 1024).toFixed(1)}MB），Whisper API 限制 25MB`)
    }

    try {
      // 使用 curl 调用 Whisper API
      const cmd = `curl -s -X POST https://api.openai.com/v1/audio/transcriptions \
        -H "Authorization: Bearer ${this.apiKey}" \
        -H "Content-Type: multipart/form-data" \
        -F "file=@${audioPath}" \
        -F "model=whisper-1" \
        -F "language=zh" \
        -F "response_format=verbose_json"`

      const { stdout } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024,  // 10MB
      })

      const result = JSON.parse(stdout)

      if (result.error) {
        throw new Error(`Whisper API 错误: ${result.error.message}`)
      }

      return {
        text: result.text,
        segments: result.segments?.map((s: any) => ({
          start: s.start,
          end: s.end,
          text: s.text,
        })),
        language: result.language,
        duration: result.duration,
      }
    } catch (err) {
      throw new Error(`OpenAI ASR 失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
