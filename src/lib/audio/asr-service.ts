/**
 * ASR (Automatic Speech Recognition) Service
 * 语音识别服务，支持多种引擎
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import type { SubtitleEntry } from '@/types'
import { logger } from '../utils/logger'

const execAsync = promisify(exec)
const log = logger.context('ASRService')

/**
 * ASR配置
 */
interface ASRConfig {
  engine: 'whisper-cpp' | 'openai' | 'mock'
  model?: string // whisper模型（tiny/base/small/medium/large）
  language?: string // 语言代码（zh/en/auto）
}

const DEFAULT_CONFIG: ASRConfig = {
  engine: (process.env.ASR_ENGINES?.split(',')[0] as any) || 'mock',
  model: process.env.WHISPER_CPP_MODEL || 'medium',
  language: 'zh', // 默认中文
}

/**
 * Whisper.cpp输出解析
 * 格式示例：
 * [00:00:00.000 --> 00:00:02.500]  大家好，欢迎观看本期视频
 * [00:00:02.500 --> 00:00:05.000]  今天我们来聊聊AI视频制作
 */
function parseWhisperOutput(output: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const lines = output.split('\n')

  for (const line of lines) {
    const match = line.match(/\[(\d{2}):(\d{2}):(\d{2}\.\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}\.\d{3})\]\s*(.+)/)
    if (match) {
      const [_, startH, startM, startS, endH, endM, endS, text] = match

      const startTime =
        parseInt(startH) * 3600 +
        parseInt(startM) * 60 +
        parseFloat(startS)

      const endTime =
        parseInt(endH) * 3600 +
        parseInt(endM) * 60 +
        parseFloat(endS)

      entries.push({
        startTime,
        endTime,
        text: text.trim(),
      })
    }
  }

  return entries
}

/**
 * 使用Whisper.cpp进行语音识别
 */
async function transcribeWithWhisperCpp(
  audioPath: string,
  config: ASRConfig
): Promise<SubtitleEntry[]> {
  try {
    // 检查whisper-cli是否可用
    try {
      await execAsync('which whisper-cli')
    } catch {
      throw new Error(
        'whisper-cli not found. Install with: brew install whisper-cpp'
      )
    }

    // 执行whisper识别
    const command = `whisper-cli -m ${config.model} -l ${config.language} -osrt ${audioPath}`
    log.debug('Running whisper-cli', { command })

    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
    })

    if (stderr) {
      log.warn('Whisper stderr output', { stderr })
    }

    // 解析输出
    const entries = parseWhisperOutput(stdout)
    log.info('Subtitle entries generated', { count: entries.length })

    return entries
  } catch (error: any) {
    log.error('Whisper.cpp transcription failed', error)
    throw new Error(`Whisper识别失败: ${error.message}`)
  }
}

/**
 * 使用OpenAI Whisper API进行语音识别
 */
async function transcribeWithOpenAI(
  audioPath: string,
  config: ASRConfig
): Promise<SubtitleEntry[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  try {
    // 读取音频文件
    const audioBuffer = await fs.readFile(audioPath)
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer]))
    formData.append('model', 'whisper-1')
    formData.append('language', config.language || 'zh')
    formData.append('response_format', 'srt')

    // 调用OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const srtContent = await response.text()
    const entries = parseSRT(srtContent)
    log.info('Subtitle entries generated via OpenAI', { count: entries.length })

    return entries
  } catch (error: any) {
    log.error('OpenAI Whisper transcription failed', error)
    throw new Error(`OpenAI识别失败: ${error.message}`)
  }
}

/**
 * Mock ASR（用于测试）
 */
async function transcribeWithMock(
  audioPath: string,
  config: ASRConfig
): Promise<SubtitleEntry[]> {
  log.info('Using mock ASR for testing')

  // 生成模拟字幕（每3秒一条）
  return [
    {
      startTime: 0,
      endTime: 3,
      text: '大家好，欢迎观看本期视频',
    },
    {
      startTime: 3,
      endTime: 6,
      text: '今天我们来聊聊AI视频制作',
    },
    {
      startTime: 6,
      endTime: 9,
      text: '这是一项非常有趣的技术',
    },
    {
      startTime: 9,
      endTime: 12,
      text: '让我们一起探索更多可能性',
    },
  ]
}

/**
 * 主ASR函数
 */
export async function transcribeAudio(
  audioPath: string,
  config: Partial<ASRConfig> = {}
): Promise<SubtitleEntry[]> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  log.info('Transcribing audio', { engine: fullConfig.engine })

  switch (fullConfig.engine) {
    case 'whisper-cpp':
      return transcribeWithWhisperCpp(audioPath, fullConfig)
    case 'openai':
      return transcribeWithOpenAI(audioPath, fullConfig)
    case 'mock':
      return transcribeWithMock(audioPath, fullConfig)
    default:
      throw new Error(`Unknown ASR engine: ${fullConfig.engine}`)
  }
}

/**
 * 解析SRT格式字幕
 */
export function parseSRT(srtContent: string): SubtitleEntry[] {
  const entries: SubtitleEntry[] = []
  const blocks = srtContent.trim().split('\n\n')

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length < 3) continue

    // 跳过序号行
    const timeLine = lines[1]
    const textLines = lines.slice(2)

    // 解析时间戳：00:00:00,000 --> 00:00:02,500
    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    )
    if (!timeMatch) continue

    const [_, startH, startM, startS, startMs, endH, endM, endS, endMs] = timeMatch

    const startTime =
      parseInt(startH) * 3600 +
      parseInt(startM) * 60 +
      parseInt(startS) +
      parseInt(startMs) / 1000

    const endTime =
      parseInt(endH) * 3600 +
      parseInt(endM) * 60 +
      parseInt(endS) +
      parseInt(endMs) / 1000

    entries.push({
      startTime,
      endTime,
      text: textLines.join('\n').trim(),
    })
  }

  return entries
}

/**
 * 生成SRT格式字幕
 */
export function generateSRT(entries: SubtitleEntry[]): string {
  return entries
    .map((entry, index) => {
      const startH = Math.floor(entry.startTime / 3600).toString().padStart(2, '0')
      const startM = Math.floor((entry.startTime % 3600) / 60).toString().padStart(2, '0')
      const startS = Math.floor(entry.startTime % 60).toString().padStart(2, '0')
      const startMs = Math.floor((entry.startTime % 1) * 1000).toString().padStart(3, '0')

      const endH = Math.floor(entry.endTime / 3600).toString().padStart(2, '0')
      const endM = Math.floor((entry.endTime % 3600) / 60).toString().padStart(2, '0')
      const endS = Math.floor(entry.endTime % 60).toString().padStart(2, '0')
      const endMs = Math.floor((entry.endTime % 1) * 1000).toString().padStart(3, '0')

      return `${index + 1}\n${startH}:${startM}:${startS},${startMs} --> ${endH}:${endM}:${endS},${endMs}\n${entry.text}\n`
    })
    .join('\n')
}
