'use client'

import { useState } from 'react'
import { Film, Image as ImageIcon, Sparkles } from 'lucide-react'

interface Props {
  videoUrl: string
  videoPath: string
  onExtracted: (frames: Array<{ url: string; path: string; timestamp: number }>) => void
}

/**
 * 视频关键帧提取器
 * 用于从生成的视频中提取关键帧，作为后续分镜的参考
 */
export function VideoFrameExtractor({ videoUrl, videoPath, onExtracted }: Props) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [mode, setMode] = useState<'auto' | 'scene'>('auto')
  const [maxFrames, setMaxFrames] = useState(5)

  const handleExtract = async () => {
    setIsExtracting(true)
    try {
      const res = await fetch('/api/video/extract-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoPath,
          mode,
          maxFrames,
        }),
      })

      const data = await res.json() as {
        frames?: Array<{ url: string; path: string; timestamp: number }>
        error?: string
      }

      if (data.error) throw new Error(data.error)
      if (data.frames) {
        onExtracted(data.frames)
      }
    } catch (err) {
      console.error('关键帧提取失败:', err)
      alert(`提取失败：${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Film size={16} className="text-violet-400" />
        <h3 className="text-sm font-semibold text-zinc-200">提取关键帧</h3>
        <span className="text-xs text-zinc-500">
          用于保持角色/场景一致性
        </span>
      </div>

      {/* Video Preview */}
      <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
        />
      </div>

      {/* Extraction Mode */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400">提取模式：</label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('auto')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
              mode === 'auto'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <ImageIcon size={12} />
              自动均匀提取
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              均匀分布，适合大多数场景
            </div>
          </button>
          <button
            onClick={() => setMode('scene')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
              mode === 'scene'
                ? 'bg-violet-600 text-white'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            <div className="flex items-center justify-center gap-1">
              <Sparkles size={12} />
              场景切换检测
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              智能检测关键画面
            </div>
          </button>
        </div>
      </div>

      {/* Max Frames */}
      {mode === 'auto' && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-400">
            提取帧数：<span className="text-zinc-300">{maxFrames} 帧</span>
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={maxFrames}
            onChange={(e) => setMaxFrames(parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>少一点</span>
            <span>多一点</span>
          </div>
        </div>
      )}

      {/* Extract Button */}
      <button
        onClick={handleExtract}
        disabled={isExtracting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ImageIcon size={14} />
        {isExtracting ? '提取中…' : '提取关键帧作为参考'}
      </button>

      {/* Usage Tips */}
      <div className="text-xs text-zinc-500 bg-zinc-900/50 rounded-lg p-2.5 space-y-1">
        <div className="font-medium text-zinc-400">💡 使用场景：</div>
        <div>• 故事类视频：保持角色外观一致</div>
        <div>• 系列视频：延续场景风格</div>
        <div>• 二次创作：基于已有画面扩展</div>
      </div>
    </div>
  )
}
