'use client'

import { useState } from 'react'
import type { Storyboard, StoryboardFrame } from '@/types'
import { Image as ImageIcon, Clock, RefreshCw, Grid3x3, CheckSquare, Square } from 'lucide-react'

interface Props {
  storyboard: Storyboard
  /** 画面比例，决定帧的宽高比 */
  aspectRatio?: '9:16' | '16:9'
  onFrameClick?: (frame: StoryboardFrame) => void
  /** 重新生成整个分镜图 */
  onRegenerate?: () => void
  /** 重新生成单帧 */
  onRegenerateFrame?: (frame: StoryboardFrame) => void
  /** 批量重新生成选中的帧 */
  onBatchRegenerate?: (frameIndices: number[]) => void
  /** 生成合成概览图 */
  onGenerateComposite?: () => void
}

export function StoryboardGrid({ storyboard, aspectRatio = '9:16', onFrameClick, onRegenerate, onRegenerateFrame, onBatchRegenerate, onGenerateComposite }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null)
  const [isCompositing, setIsCompositing] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false) // 批量选择模式
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set()) // 选中的帧索引
  const isVertical = aspectRatio === '9:16'

  const handleGenerateComposite = async () => {
    setIsCompositing(true)
    try {
      const res = await fetch('/api/storyboard-composite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyboard }),
      })
      const data = await res.json() as { compositeUrl?: string; error?: string }
      if (data.compositeUrl) {
        setCompositeUrl(data.compositeUrl)
      }
    } catch (err) {
      console.error('合成失败:', err)
    } finally {
      setIsCompositing(false)
    }
    onGenerateComposite?.()
  }

  const toggleFrameSelection = (index: number) => {
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

  const selectAllFrames = () => {
    setSelectedFrames(new Set(storyboard.frames.map((_, i) => i)))
  }

  const clearSelection = () => {
    setSelectedFrames(new Set())
  }

  const handleBatchRegenerate = () => {
    if (selectedFrames.size === 0) return
    const frameIndices = Array.from(selectedFrames).sort((a, b) => a - b)
    onBatchRegenerate?.(frameIndices)
    setSelectionMode(false)
    clearSelection()
  }

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          分镜图 · {storyboard.totalFrames} 帧
        </h3>
        <div className="flex items-center gap-2">
          {!selectionMode && <span className="text-xs text-zinc-500">点击查看详情</span>}

          {/* 批量选择模式 */}
          {selectionMode && (
            <>
              <span className="text-xs text-zinc-400">
                已选 {selectedFrames.size} 帧
              </span>
              <button
                onClick={selectAllFrames}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                全选
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-zinc-500 hover:text-zinc-400"
              >
                清空
              </button>
              <button
                onClick={handleBatchRegenerate}
                disabled={selectedFrames.size === 0}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={11} />
                重新生成选中
              </button>
            </>
          )}

          {/* 常规按钮 */}
          {!selectionMode && (
            <>
              <button
                onClick={handleGenerateComposite}
                disabled={isCompositing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-blue-400 hover:bg-zinc-700 transition-all disabled:opacity-50"
                title="生成合成概览图"
              >
                <Grid3x3 size={11} />
                {isCompositing ? '合成中…' : '概览图'}
              </button>
            </>
          )}

          {/* 批量选择切换按钮 */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode)
              if (selectionMode) clearSelection()
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              selectionMode
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'text-zinc-400 hover:text-violet-400 hover:bg-zinc-700'
            }`}
            title={selectionMode ? '退出批量选择' : '批量选择重新生成'}
          >
            {selectionMode ? <CheckSquare size={11} /> : <Square size={11} />}
            {selectionMode ? '完成' : '批量选择'}
          </button>

          {!selectionMode && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-violet-400 hover:bg-zinc-700 transition-all"
              title="重新生成全部分镜图"
            >
              <RefreshCw size={11} />
              重新生成全部
            </button>
          )}
        </div>
      </div>

      {/* Composite preview */}
      {compositeUrl && (
        <div className="mb-3 rounded-lg overflow-hidden border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={compositeUrl}
            alt="分镜概览图"
            className="w-full h-auto"
          />
          <div className="p-2 bg-zinc-900/50 flex items-center justify-between">
            <span className="text-xs text-zinc-400">分镜概览图（点击帧查看详情）</span>
            <button
              onClick={() => setCompositeUrl(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              隐藏
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className={`grid gap-1.5 ${isVertical ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {storyboard.frames.map(frame => (
          <button
            key={frame.index}
            onClick={() => {
              if (selectionMode) {
                toggleFrameSelection(frame.index)
              } else {
                setSelected(frame.index === selected ? null : frame.index)
                onFrameClick?.(frame)
              }
            }}
            className={`
              relative rounded-lg overflow-hidden bg-zinc-900
              border-2 transition-all duration-150
              ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}
              ${selectionMode && selectedFrames.has(frame.index)
                ? 'border-violet-500 ring-2 ring-violet-400'
                : frame.index === selected && !selectionMode
                ? 'border-violet-500'
                : 'border-transparent hover:border-zinc-600'
              }
            `}
          >
            {frame.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.imageUrl}
                alt={`Frame ${frame.index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <ImageIcon size={14} className="text-zinc-600" />
                <span className="text-xs text-zinc-600">{frame.index + 1}</span>
              </div>
            )}

            {/* Duration badge */}
            <div className="absolute bottom-0.5 right-0.5 flex items-center gap-0.5 bg-black/70 rounded px-1 py-0.5">
              <Clock size={8} className="text-zinc-400" />
              <span className="text-zinc-400" style={{ fontSize: '9px' }}>{frame.duration}s</span>
            </div>

            {/* Frame number */}
            <div className="absolute top-0.5 left-0.5 bg-black/70 rounded px-1 py-0.5">
              <span className="text-zinc-300 font-bold" style={{ fontSize: '9px' }}>{frame.index + 1}</span>
            </div>

            {/* Checkbox (批量选择模式) */}
            {selectionMode && (
              <div className="absolute top-1 right-1">
                {selectedFrames.has(frame.index) ? (
                  <CheckSquare size={16} className="text-violet-400" />
                ) : (
                  <Square size={16} className="text-zinc-400" />
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Selected frame detail */}
      {selected !== null && (
        <div className="mt-3 p-3 bg-zinc-900 rounded-lg">
          {(() => {
            const frame = storyboard.frames[selected]
            if (!frame) return null
            return (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-violet-400">帧 {frame.index + 1}</span>
                    <span className="text-xs text-zinc-500">{frame.cameraAngle}</span>
                    <span className="text-xs text-zinc-600">{frame.duration}s</span>
                  </div>
                  {onRegenerateFrame && (
                    <button
                      onClick={() => onRegenerateFrame(frame)}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-all"
                    >
                      <RefreshCw size={10} />
                      重新生成此帧
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-300 mb-2">{frame.description}</p>
                <details className="group">
                  <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                    查看提示词
                  </summary>
                  <p className="text-xs text-zinc-500 mt-1 font-mono leading-relaxed break-all">
                    {frame.imagePrompt}
                  </p>
                </details>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
