'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export type GenerationStage =
  | 'analyzing'      // 分析选题
  | 'scripting'      // 生成脚本
  | 'storyboarding'  // 生成分镜提示词
  | 'generating_images' // 生成分镜图片
  | 'generating_video'  // 生成视频
  | 'compositing'    // 合成拼接
  | 'done'
  | 'error'

interface StageConfig {
  label: string
  subtext: string
  estimateSeconds: number
  emoji: string
}

const STAGE_CONFIG: Record<GenerationStage, StageConfig> = {
  analyzing:         { label: '分析选题', subtext: '理解创意方向…', estimateSeconds: 5, emoji: '🔍' },
  scripting:         { label: '生成脚本', subtext: '发散创意，构建叙事…', estimateSeconds: 15, emoji: '📝' },
  storyboarding:     { label: '构建分镜', subtext: '设计镜头语言和画面…', estimateSeconds: 10, emoji: '🎬' },
  generating_images: { label: '生成分镜图', subtext: '即梦正在绘制画面…', estimateSeconds: 60, emoji: '🖼️' },
  generating_video:  { label: '生成视频', subtext: '视频引擎渲染中…', estimateSeconds: 120, emoji: '🎥' },
  compositing:       { label: '合成拼接', subtext: 'FFmpeg 处理中…', estimateSeconds: 10, emoji: '🔧' },
  done:              { label: '完成', subtext: '', estimateSeconds: 0, emoji: '✅' },
  error:             { label: '出错了', subtext: '', estimateSeconds: 0, emoji: '❌' },
}

interface Props {
  stage: GenerationStage
  /** 当前帧/总帧（图片或视频生成时） */
  current?: number
  total?: number
  /** 额外信息 */
  detail?: string
  /** 开始时间 */
  startedAt?: number
}

export function GenerationProgress({ stage, current, total, detail, startedAt }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const config = STAGE_CONFIG[stage]

  // 实时计时
  useEffect(() => {
    if (stage === 'done' || stage === 'error') return
    const start = startedAt ?? Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [stage, startedAt])

  // 计算进度百分比
  const progress = (() => {
    if (stage === 'done') return 100
    if (stage === 'error') return 0
    if (current !== undefined && total) {
      return Math.round((current / total) * 100)
    }
    // 基于估计时间的渐进式进度（永远不到100%）
    const ratio = elapsed / config.estimateSeconds
    return Math.min(Math.round(ratio * 90), 95)
  })()

  // 预估剩余时间
  const remainingText = (() => {
    if (stage === 'done' || stage === 'error') return ''
    if (current !== undefined && total && current > 0) {
      const perItem = elapsed / current
      const remaining = Math.round(perItem * (total - current))
      return remaining > 60
        ? `约 ${Math.ceil(remaining / 60)} 分钟`
        : `约 ${remaining} 秒`
    }
    const remaining = Math.max(0, config.estimateSeconds - elapsed)
    if (remaining <= 0) return '即将完成…'
    return remaining > 60
      ? `约 ${Math.ceil(remaining / 60)} 分钟`
      : `约 ${remaining} 秒`
  })()

  if (stage === 'done') return null

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 p-4 space-y-3">
      {/* Stage header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={stage}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-lg"
            >
              {config.emoji}
            </motion.span>
          </AnimatePresence>
          <div>
            <span className="text-sm font-medium text-zinc-200">{config.label}</span>
            {config.subtext && (
              <span className="text-xs text-zinc-500 ml-2">{config.subtext}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {stage !== 'error' && <Loader2 size={12} className="animate-spin text-[var(--accent-primary)]" />}
          <span>{formatTime(elapsed)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {/* Shimmer effect */}
        {stage !== 'error' && (
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
              style={{ animationDuration: '2s' }}
            />
          </div>
        )}
      </div>

      {/* Detail row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          {current !== undefined && total
            ? `${current} / ${total} ${stage === 'generating_images' ? '帧' : '片段'}`
            : detail ?? ''
          }
        </span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500">{progress}%</span>
          {remainingText && (
            <span className="text-zinc-600">{remainingText}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}
