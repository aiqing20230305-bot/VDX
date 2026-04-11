'use client'

import { useState, useEffect } from 'react'
import type { Script } from '@/types'
import { ChevronDown, ChevronUp, Clock, Film, Copy, Check } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { logger } from '@/lib/utils/logger'

interface Props {
  script: Script
  selected?: boolean
  onSelect?: () => void
}

export function ScriptCard({ script, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showSuccess } = useToast()

  useEffect(() => {
    // Trigger animation on next frame for smoother rendering
    const frameId = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(frameId)
  }, [])

  const copyScriptText = async () => {
    // 生成完整脚本文本
    let text = `${script.title}\n${script.logline}\n\n`
    text += `时长: ${script.duration}s | 风格: ${script.style} | 比例: ${script.aspectRatio}\n\n`
    text += '--- 场景详情 ---\n\n'

    script.scenes.forEach(scene => {
      text += `场景 ${scene.index + 1} (${scene.duration}s):\n`
      text += `${scene.visual}\n`
      if (scene.narration) {
        text += `旁白: "${scene.narration}"\n`
      }
      if (scene.emotion || scene.cameraMove) {
        text += `[${[scene.emotion, scene.cameraMove].filter(Boolean).join(' · ')}]\n`
      }
      text += '\n'
    })

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      showSuccess('复制成功', '脚本内容已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      logger.error('复制失败:', err)
    }
  }

  return (
    <div
      className={`
        w-full rounded-xl border transition-all duration-300 ease-out overflow-hidden
        ${selected
          ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]'
          : 'border-[var(--border-medium)] bg-[var(--bg-secondary)] hover:border-[var(--border-strong)]'
        }
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'}
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
          <button
            onClick={copyScriptText}
            className="p-1.5 text-zinc-500 hover:text-[var(--accent-primary)] transition-colors"
            title="复制脚本"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
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
