'use client'

import { useState } from 'react'
import type { Storyboard, StoryboardFrame } from '@/types'
import { Image as ImageIcon, Clock } from 'lucide-react'

interface Props {
  storyboard: Storyboard
  onFrameClick?: (frame: StoryboardFrame) => void
}

export function StoryboardGrid({ storyboard, onFrameClick }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          分镜图 · {storyboard.totalFrames} 帧
        </h3>
        <span className="text-xs text-zinc-500">点击查看详情</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {storyboard.frames.map(frame => (
          <button
            key={frame.index}
            onClick={() => {
              setSelected(frame.index === selected ? null : frame.index)
              onFrameClick?.(frame)
            }}
            className={`
              relative rounded-lg overflow-hidden aspect-video bg-zinc-900
              border-2 transition-all duration-150
              ${frame.index === selected
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
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-violet-400">帧 {frame.index + 1}</span>
                  <span className="text-xs text-zinc-500">{frame.cameraAngle}</span>
                  <span className="text-xs text-zinc-600">{frame.duration}s</span>
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
