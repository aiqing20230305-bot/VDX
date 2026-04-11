'use client'

/**
 * 视频预览模态框
 * 快速预览当前分镜状态，无需导出完整视频
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipBack, SkipForward, Maximize2 } from 'lucide-react'
import type { Frame } from '@/types/workspace'
import Image from 'next/image'

interface PreviewModalProps {
  frames: Frame[]
  isOpen: boolean
  onClose: () => void
}

export function PreviewModal({ frames, isOpen, onClose }: PreviewModalProps) {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const playbackTimerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  const currentFrame = frames[currentFrameIndex]

  // 播放逻辑：使用 requestAnimationFrame 实现平滑播放
  const play = useCallback(() => {
    if (!frames.length) return

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const frameDuration = (currentFrame?.duration || 3) * 1000

      const progress = Math.min((elapsed / frameDuration) * 100, 100)
      setProgress(progress)

      if (elapsed >= frameDuration) {
        // 切换到下一帧
        setCurrentFrameIndex((prev) => {
          const next = prev + 1
          if (next >= frames.length) {
            // 播放完毕
            setIsPlaying(false)
            setProgress(0)
            return 0
          }
          return next
        })
        startTimeRef.current = 0
      } else {
        playbackTimerRef.current = requestAnimationFrame(animate)
      }
    }

    playbackTimerRef.current = requestAnimationFrame(animate)
  }, [frames.length, currentFrame?.duration])

  // 停止播放
  const pause = useCallback(() => {
    if (playbackTimerRef.current) {
      cancelAnimationFrame(playbackTimerRef.current)
      playbackTimerRef.current = null
    }
    startTimeRef.current = 0
  }, [])

  // 播放/暂停切换
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
    }
  }, [isPlaying, pause])

  // 上一帧
  const previousFrame = useCallback(() => {
    pause()
    setIsPlaying(false)
    setProgress(0)
    setCurrentFrameIndex((prev) => Math.max(0, prev - 1))
  }, [pause])

  // 下一帧
  const nextFrame = useCallback(() => {
    pause()
    setIsPlaying(false)
    setProgress(0)
    setCurrentFrameIndex((prev) => Math.min(frames.length - 1, prev + 1))
  }, [frames.length, pause])

  // 跳转到指定帧
  const seekToFrame = useCallback((index: number) => {
    pause()
    setIsPlaying(false)
    setProgress(0)
    setCurrentFrameIndex(Math.max(0, Math.min(frames.length - 1, index)))
  }, [frames.length, pause])

  // 播放状态改变时启动/停止播放
  useEffect(() => {
    if (isPlaying) {
      play()
    } else {
      pause()
    }
  }, [isPlaying, play, pause])

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          e.preventDefault()
          previousFrame()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextFrame()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, togglePlayPause, previousFrame, nextFrame, onClose])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        cancelAnimationFrame(playbackTimerRef.current)
      }
    }
  }, [])

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      pause()
      setIsPlaying(false)
      setProgress(0)
      setCurrentFrameIndex(0)
    }
  }, [isOpen, pause])

  if (!isOpen || !frames.length) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* 模态框内容 */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="relative w-full max-w-6xl mx-4 bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">视频预览</h2>
              <p className="text-sm text-zinc-400 mt-1">
                第 {currentFrameIndex + 1} / {frames.length} 帧
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-800 transition text-zinc-400 hover:text-zinc-100"
              aria-label="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 视频显示区域 */}
          <div className="relative aspect-video bg-black">
            {currentFrame?.imageUrl && (
              <Image
                src={currentFrame.imageUrl}
                alt={currentFrame.imagePrompt || `帧 ${currentFrameIndex + 1}`}
                fill
                className="object-contain"
                priority
              />
            )}

            {/* 帧描述覆盖层 */}
            {currentFrame?.imagePrompt && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-sm text-zinc-100">{currentFrame.imagePrompt}</p>
              </div>
            )}

            {/* 播放状态指示器 */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* 进度条 */}
          <div className="relative h-1 bg-zinc-800">
            <div
              className="absolute inset-y-0 left-0 bg-cyan-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 控制栏 */}
          <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800">
            <div className="flex items-center gap-4">
              {/* 播放控制 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={previousFrame}
                  disabled={currentFrameIndex === 0}
                  className="p-2 rounded-lg hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-100"
                  aria-label="上一帧"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlayPause}
                  className="p-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition text-white"
                  aria-label={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={nextFrame}
                  disabled={currentFrameIndex === frames.length - 1}
                  className="p-2 rounded-lg hover:bg-zinc-800 transition disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400 hover:text-zinc-100"
                  aria-label="下一帧"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* 时间轴缩略图（可选：简化版仅显示进度点） */}
              <div className="flex-1 flex items-center gap-1">
                {frames.map((frame, index) => (
                  <button
                    key={frame.id}
                    onClick={() => seekToFrame(index)}
                    className={`flex-1 h-2 rounded-full transition ${
                      index === currentFrameIndex
                        ? 'bg-cyan-500'
                        : index < currentFrameIndex
                        ? 'bg-cyan-500/40'
                        : 'bg-zinc-700'
                    } hover:bg-cyan-400`}
                    aria-label={`跳转到第 ${index + 1} 帧`}
                  />
                ))}
              </div>

              {/* 快捷键提示 */}
              <div className="text-xs text-zinc-500">
                <span className="hidden sm:inline">空格: 播放/暂停 · ←→: 上/下一帧 · Esc: 关闭</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
