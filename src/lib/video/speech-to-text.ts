/**
 * 语音识别（ASR）模块 - 多引擎支持
 * 支持 Whisper.cpp（本地）、阿里云、OpenAI 等多种引擎
 */
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import { getASRManager } from './asr/manager'
import type { TranscriptionResult, TranscriptionResultWithEngine } from './asr/types'

const execAsync = promisify(exec)

// 重新导出类型
export type { TranscriptionResult, TranscriptionResultWithEngine, TranscriptionSegment } from './asr/types'

/**
 * 从视频提取音频
 */
export async function extractAudioFromVideo(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, '_audio.mp3')

  // 使用 FFmpeg 提取音频（转为 MP3）
  const cmd = `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -q:a 2 "${audioPath}" -y`

  try {
    await execAsync(cmd)
    return audioPath
  } catch (err) {
    throw new Error(`音频提取失败: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * 转写音频（自动选择最优引擎）
 */
export async function transcribeAudio(audioPath: string): Promise<TranscriptionResultWithEngine> {
  const manager = getASRManager()
  const result = await manager.transcribe(audioPath)

  console.log(`[ASR] 使用引擎: ${result.engine}`)
  console.log(`[ASR] 识别文字长度: ${result.text.length} 字符`)

  return result
}

/**
 * 从视频中提取语音文字（一步到位）
 */
export async function transcribeVideoSpeech(videoPath: string): Promise<TranscriptionResultWithEngine> {
  // 1. 提取音频
  console.log('[ASR] 提取音频...')
  const audioPath = await extractAudioFromVideo(videoPath)

  try {
    // 2. 转写文字（自动选择引擎）
    console.log('[ASR] 开始转写...')
    const result = await transcribeAudio(audioPath)

    // 3. 清理临时音频文件
    await fs.unlink(audioPath).catch(() => {})

    return result
  } catch (err) {
    // 清理临时文件
    await fs.unlink(audioPath).catch(() => {})
    throw err
  }
}

/**
 * 将分段转写结果格式化为易读文本
 */
export function formatTranscription(result: TranscriptionResult | TranscriptionResultWithEngine): string {
  if (!result.segments || result.segments.length === 0) {
    return result.text
  }

  return result.segments
    .map(s => {
      const timestamp = `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s]`
      return `${timestamp} ${s.text.trim()}`
    })
    .join('\n')
}

/**
 * 获取可用的 ASR 引擎列表
 */
export async function getAvailableASREngines() {
  const manager = getASRManager()
  return await manager.getAvailableEngines()
}

/**
 * 估算语音识别成本
 */
export async function estimateASRCost(durationSeconds: number) {
  const manager = getASRManager()
  return await manager.estimateCost(durationSeconds)
}
