'use client'

import { useState } from 'react'
import type { Storyboard } from '@/types'
import { CheckSquare, Square, Play } from 'lucide-react'

interface Props {
  storyboard: Storyboard
  aspectRatio?: '9:16' | '16:9'
  onConfirm: (selectedIndices: number[], engine: 'seedance' | 'kling') => void
  onCancel: () => void
}

/**
 * 帧选择器 - 选择用于视频生成的分镜帧
 */
export function FrameSelector({ storyboard, aspectRatio = '9:16', onConfirm, onCancel }: Props) {
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(
    new Set(storyboard.frames.map((_, i) => i)) // 默认全选
  )
  const [engine, setEngine] = useState<'seedance' | 'kling'>('seedance')
  const isVertical = aspectRatio === '9:16'

  const toggleFrame = (index: number) => {
    setSelectedFrames(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const selectAll = () => {
    setSelectedFrames(new Set(storyboard.frames.map((_, i) => i)))
  }

  const clearAll = () => {
    setSelectedFrames(new Set())
  }

  const handleConfirm = () => {
    if (selectedFrames.size === 0) {
      alert('请至少选择一帧')
      return
    }
    const sortedIndices = Array.from(selectedFrames).sort((a, b) => a - b)
    onConfirm(sortedIndices, engine)
  }

  const totalDuration = Array.from(selectedFrames)
    .map(i => storyboard.frames[i].duration)
    .reduce((sum, d) => sum + d, 0)

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">选择用于生成的帧</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            已选 {selectedFrames.size}/{storyboard.totalFrames} 帧 · 总时长 {totalDuration.toFixed(1)}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className="text-xs text-blue-400 hover:text-blue-300">
            全选
          </button>
          <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-400">
            清空
          </button>
        </div>
      </div>

      {/* Frame Grid */}
      <div className={`grid gap-1.5 ${isVertical ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {storyboard.frames.map((frame, i) => (
          <button
            key={i}
            onClick={() => toggleFrame(i)}
            className={`
              relative rounded-lg overflow-hidden bg-[var(--bg-secondary)]
              border-2 transition-smooth
              ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}
              ${selectedFrames.has(i)
                ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-border)]'
                : 'border-[var(--border-medium)] hover:border-[var(--border-strong)]'
              }
            `}
          >
            {frame.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.imageUrl}
                alt={`Frame ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <span className="text-xs">{i + 1}</span>
              </div>
            )}

            {/* Frame number */}
            <div className="absolute top-0.5 left-0.5 bg-black/70 rounded px-1 py-0.5">
              <span className="text-zinc-300 font-bold" style={{ fontSize: '9px' }}>{i + 1}</span>
            </div>

            {/* Checkbox */}
            <div className="absolute top-1 right-1">
              {selectedFrames.has(i) ? (
                <CheckSquare size={16} className="text-[var(--accent-primary)]" />
              ) : (
                <Square size={16} className="text-[var(--text-secondary)]" />
              )}
            </div>

            {/* Duration */}
            <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1 py-0.5">
              <span className="text-zinc-400" style={{ fontSize: '8px' }}>{frame.duration}s</span>
            </div>
          </button>
        ))}
      </div>

      {/* Engine Selection */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400">选择生成引擎：</label>
        <div className="flex gap-2">
          <button
            onClick={() => setEngine('seedance')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-smooth ${
              engine === 'seedance'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            🎬 Seedance 2.0
          </button>
          <button
            onClick={() => setEngine('kling')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm transition-smooth ${
              engine === 'kling'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            🌟 可灵AI
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={selectedFrames.size === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={14} />
          开始生成视频
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-all"
        >
          取消
        </button>
      </div>
    </div>
  )
}
