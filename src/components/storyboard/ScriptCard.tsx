'use client'

import { useState } from 'react'
import type { Script } from '@/types'
import { ChevronDown, ChevronUp, Clock, Film } from 'lucide-react'

interface Props {
  script: Script
  selected?: boolean
  onSelect?: () => void
}

export function ScriptCard({ script, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={`
        w-full rounded-xl border transition-smooth overflow-hidden
        ${selected
          ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
          : 'border-[var(--border-medium)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'
        }
      `}
    >
      {/* Header */}
      <div className="p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Film size={14} className="text-[var(--accent-primary)] flex-shrink-0" />
            <h3 className="text-sm font-semibold text-zinc-100 truncate">{script.title}</h3>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2">{script.logline}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock size={11} />
              {script.duration}s
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
              {script.style}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-400">
              {script.aspectRatio}
            </span>
            <span className="text-xs text-zinc-500">{script.scenes.length} 场景</span>
          </div>
        </div>

        <div className="flex gap-2">
          {onSelect && (
            <button
              onClick={onSelect}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth
                ${selected
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }
              `}
            >
              {selected ? '已选' : '选择'}
            </button>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded scenes */}
      {expanded && (
        <div className="border-t border-zinc-700 divide-y divide-zinc-700/50">
          {script.scenes.map(scene => (
            <div key={scene.index} className="px-3 py-2 flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                {scene.index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 leading-relaxed">{scene.visual}</p>
                {scene.narration && (
                  <p className="text-xs text-zinc-500 mt-1 italic">「{scene.narration}」</p>
                )}
                <div className="flex gap-2 mt-1">
                  {scene.emotion && (
                    <span className="text-xs text-[var(--accent-primary)]">{scene.emotion}</span>
                  )}
                  {scene.cameraMove && (
                    <span className="text-xs text-zinc-500">{scene.cameraMove}</span>
                  )}
                  <span className="text-xs text-zinc-600">{scene.duration}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
