'use client'

/**
 * Remotion 预览组件
 * 显示分镜预览和文字效果编辑器
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { Storyboard } from '@/types'
import { TextEffectsEditor } from '../editor/TextEffectsEditor'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/utils/logger'

interface RemotionPreviewProps {
  storyboard: Storyboard
  onClose: () => void
  onSave: (updatedStoryboard: Storyboard) => void
}

export function RemotionPreview({ storyboard, onClose, onSave }: RemotionPreviewProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [editingStoryboard, setEditingStoryboard] = useState<Storyboard>(storyboard)
  const [isPlaying, setIsPlaying] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [renderTime, setRenderTime] = useState<number | null>(null)

  // 渲染当前帧
  const renderFrame = useCallback(async (frameIndex: number) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/video/remotion-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboard: editingStoryboard,
          frameIndex,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '预览失败')
      }

      // 获取渲染时间
      const renderTimeHeader = res.headers.get('X-Render-Time')
      if (renderTimeHeader) {
        setRenderTime(parseInt(renderTimeHeader))
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewImage(prevUrl => {
        if (prevUrl) URL.revokeObjectURL(prevUrl)
        return url
      })
    } catch (err) {
      logger.error('[Preview] 渲染失败:', err)
      alert(err instanceof Error ? err.message : '预览失败')
    } finally {
      setIsLoading(false)
    }
  }, [editingStoryboard])

  // 当前帧或分镜变化时重新渲染
  useEffect(() => {
    renderFrame(currentFrame)
  }, [currentFrame, renderFrame])

  // 播放逻辑
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1
        if (next >= editingStoryboard.frames.length) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, 1000)  // 每秒切换一帧

    return () => clearInterval(interval)
  }, [isPlaying, editingStoryboard.frames.length])

  // 清理 URL
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
      }
    }
  }, [previewImage])

  const handlePrevFrame = () => {
    setCurrentFrame(prev => Math.max(0, prev - 1))
  }

  const handleNextFrame = () => {
    setCurrentFrame(prev => Math.min(editingStoryboard.frames.length - 1, prev + 1))
  }

  const handleSave = () => {
    onSave(editingStoryboard)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="w-full h-full flex" onClick={(e) => e.stopPropagation()}>
          {/* 左侧：分帧列表 */}
          <div className="w-64 bg-[var(--bg-tertiary)] border-r border-white/10 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">分镜列表</h3>
              <span className="text-xs text-zinc-400">
                {editingStoryboard.frames.length} 帧
              </span>
            </div>

            <div className="space-y-2">
              {editingStoryboard.frames.map((frame, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentFrame(i)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all',
                    'hover:bg-white/5',
                    i === currentFrame
                      ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30'
                      : 'bg-[var(--bg-tertiary)] border border-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-100">
                      第 {i + 1} 帧
                    </span>
                    <span className="text-xs text-zinc-400">{frame.duration}秒</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">
                    {frame.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 右侧：预览区域 */}
          <div className="flex-1 flex flex-col">
            {/* 顶部工具栏 */}
            <div className="bg-[var(--bg-tertiary)] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-zinc-100">预览编辑器</h2>
                {renderTime !== null && (
                  <span className="text-xs text-zinc-400">
                    渲染耗时: {renderTime}ms
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="关闭预览"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* 预览画面 */}
            <div className="flex-1 flex items-center justify-center bg-zinc-950 relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-zinc-300">渲染中...</span>
                  </div>
                </div>
              )}

              {previewImage && (
                <img
                  src={previewImage}
                  alt={`Frame ${currentFrame + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {!previewImage && !isLoading && (
                <div className="text-center text-zinc-500">
                  <p>无预览内容</p>
                </div>
              )}
            </div>

            {/* 播放控制 */}
            <div className="bg-[var(--bg-tertiary)] border-t border-white/10 px-6 py-4">
              <div className="flex items-center gap-4">
                {/* 控制按钮 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevFrame}
                    disabled={currentFrame === 0}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      currentFrame === 0
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-300 hover:bg-white/10'
                    )}
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 transition-all text-white"
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  <button
                    onClick={handleNextFrame}
                    disabled={currentFrame === editingStoryboard.frames.length - 1}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      currentFrame === editingStoryboard.frames.length - 1
                        ? 'text-zinc-600 cursor-not-allowed'
                        : 'text-zinc-300 hover:bg-white/10'
                    )}
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                {/* 进度条 */}
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={editingStoryboard.frames.length - 1}
                    value={currentFrame}
                    onChange={(e) => setCurrentFrame(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-cyan-500 [&::-webkit-slider-thumb]:to-cyan-600
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-gradient-to-r
                      [&::-moz-range-thumb]:from-cyan-500 [&::-moz-range-thumb]:to-cyan-600
                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0"
                  />
                  <span className="text-sm text-zinc-400 min-w-[4rem] text-right">
                    {currentFrame + 1} / {editingStoryboard.frames.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 文字效果编辑器 */}
            <TextEffectsEditor
              storyboard={editingStoryboard}
              onUpdate={setEditingStoryboard}
            />

            {/* 底部操作栏 */}
            <div className="bg-[var(--bg-tertiary)] border-t border-white/10 px-6 py-4 flex items-center justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-white/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 transition-all text-white font-medium shadow-[0_4px_20px_rgba(168,85,247,0.3)]"
              >
                保存并渲染
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
