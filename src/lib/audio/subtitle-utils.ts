/**
 * 字幕工具函数（客户端安全）
 * Client-safe subtitle utilities
 */

import type { SubtitleEntry } from '@/types'

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
