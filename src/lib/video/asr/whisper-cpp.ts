/**
 * Whisper.cpp 引擎（本地，免费）
 * 需要用户安装：brew install whisper-cpp
 * 或从源码编译：https://github.com/ggerganov/whisper.cpp
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import type { ASREngine, TranscriptionResult, TranscriptionSegment } from './types'
import { logger } from '@/lib/utils/logger'

const execAsync = promisify(exec)
const log = logger.context('Whisper.cpp')

export class WhisperCppEngine implements ASREngine {
  name = 'whisper-cpp'
  priority = 1  // 最高优先级（免费）

  private whisperPath: string
  private modelName: string
  private modelsDir: string

  constructor() {
    // 从环境变量获取配置
    this.whisperPath = process.env.WHISPER_CPP_PATH || '/opt/homebrew/bin/whisper-cli'
    this.modelName = process.env.WHISPER_CPP_MODEL || 'medium'  // tiny/base/small/medium/large
    this.modelsDir = process.env.WHISPER_CPP_MODELS_DIR || path.join(process.env.HOME || '', '.whisper-models')
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 检查 whisper-cli 是否安装
      const { stdout } = await execAsync(`which whisper-cli || which ${this.whisperPath}`)
      if (!stdout.trim()) return false

      // 检查模型文件是否存在
      const modelPath = this.getModelPath()
      return existsSync(modelPath)
    } catch {
      return false
    }
  }

  estimateCost(durationSeconds: number): number {
    return 0  // 本地免费
  }

  async transcribe(audioPath: string): Promise<TranscriptionResult> {
    // 检查模型文件
    const modelPath = this.getModelPath()
    if (!existsSync(modelPath)) {
      throw new Error(`Whisper 模型文件不存在: ${modelPath}\n请运行: bash ${path.join(__dirname, 'download-whisper-model.sh')} ${this.modelName}`)
    }

    // 转换音频为 16kHz WAV（Whisper 要求）
    const wavPath = audioPath.replace(/\.[^.]+$/, '_16k.wav')
    await this.convertToWav(audioPath, wavPath)

    try {
      // 运行 whisper-cpp
      const cmd = `${this.whisperPath} -m "${modelPath}" -f "${wavPath}" -l zh --output-txt --output-srt --output-json`

      log.info('开始转写:', cmd)
      const startTime = Date.now()

      await execAsync(cmd, {
        maxBuffer: 50 * 1024 * 1024,  // 50MB
        timeout: 300000,  // 5分钟超时
      })

      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      log.info(`转写完成，耗时 ${duration}秒`)

      // 读取输出的 JSON 文件
      const jsonPath = wavPath.replace('.wav', '.wav.json')
      const jsonContent = await fs.readFile(jsonPath, 'utf-8')
      const result = JSON.parse(jsonContent)

      // 清理临时文件
      await this.cleanup(wavPath)

      return {
        text: result.transcription || result.text || '',
        segments: result.segments?.map((s: any): TranscriptionSegment => ({
          start: s.offsets?.from || s.start || 0,
          end: s.offsets?.to || s.end || 0,
          text: s.text || '',
        })),
        language: 'zh',
      }
    } catch (err) {
      // 清理临时文件
      await this.cleanup(wavPath)
      throw new Error(`Whisper.cpp 转写失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  private getModelPath(): string {
    // 模型文件命名规则：ggml-{model}.bin
    return path.join(this.modelsDir, `ggml-${this.modelName}.bin`)
  }

  private async convertToWav(inputPath: string, outputPath: string): Promise<void> {
    // 使用 FFmpeg 转换为 16kHz 单声道 WAV
    const cmd = `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`

    try {
      await execAsync(cmd)
    } catch (err) {
      throw new Error(`音频转换失败: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  private async cleanup(wavPath: string): Promise<void> {
    const files = [
      wavPath,
      wavPath + '.txt',
      wavPath + '.srt',
      wavPath + '.json',
    ]

    await Promise.allSettled(files.map(f => fs.unlink(f)))
  }
}
