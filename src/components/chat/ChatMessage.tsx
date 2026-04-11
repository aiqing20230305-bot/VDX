'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Info, Sparkles } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types'
import { QuickActions } from './QuickActions'
import { GenerationProgress, type GenerationStage } from './GenerationProgress'
import { ScriptCard } from '../storyboard/ScriptCard'
import { StoryboardGrid } from '../storyboard/StoryboardGrid'
import { StoryboardVariantSelector } from '../storyboard/StoryboardVariantSelector'
import { FrameSelector } from '../storyboard/FrameSelector'
import { VideoProgress } from '../video/VideoProgress'
import { cn } from '@/lib/utils/cn'

interface Props {
  message: ChatMessageType
  onAction?: (action: string, params?: Record<string, unknown>) => void
  hideActions?: boolean // P0: 流程完成后隐藏过时的QuickActions
}

export function ChatMessage({ message, onAction, hideActions = false }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const isAssistant = message.role === 'assistant'
  const isSystemGuidance = isAssistant && message.type === 'action' && !message.metadata?.script && !message.metadata?.storyboard
  const isGeneratedContent = message.metadata?.script || message.metadata?.storyboard || message.metadata?.videoJob

  useEffect(() => {
    // Trigger animation on next frame for smoother rendering
    const frameId = requestAnimationFrame(() => {
      setIsVisible(true)
    })
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      className={cn(
        'flex gap-4 transition-all duration-300 ease-out',
        isAssistant ? 'flex-row' : 'flex-row-reverse',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[10px]'
      )}
    >
      {/* Avatar - Industrial Minimalism */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-smooth',
        isAssistant
          ? 'bg-[var(--accent-primary)] text-white'
          : 'bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
      )}>
        <span style={{ fontFamily: 'var(--font-body)' }}>
          {isAssistant ? '✦' : 'U'}
        </span>
      </div>

      {/* Content */}
      <div className={cn(
        'flex flex-col gap-3',
        isAssistant ? 'items-start w-full' : 'items-end max-w-[70%] ml-auto',
      )}>
        {/* AI Thinking State - Skeleton Screen */}
        {message.streaming && isAssistant && (
          <div
            className="w-full bg-[rgba(6,182,212,0.05)] border border-[rgba(6,182,212,0.1)] px-5 py-3 rounded-lg"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <div className="flex gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs">思考中...</span>
            </div>
          </div>
        )}

        {/* Text bubble - UX Optimized v2.1 */}
        {message.content && !message.streaming && (
          <div
            className={cn(
              'group text-sm leading-relaxed whitespace-pre-wrap transition-all duration-[150ms] ease-out',
              // User message: compact, right-aligned, cyan left border
              !isAssistant && 'bg-[var(--bg-secondary)] border-l-2 border-[var(--accent-primary)] px-4 py-3 rounded-lg',
              // AI message (system guidance): ENHANCED v2.1 - Task #237: 更强视觉效果
              isSystemGuidance && isAssistant && 'w-full bg-[rgba(6,182,212,0.15)] border-l-[6px] border-[var(--accent-primary)] border-t border-r border-b border-[rgba(6,182,212,0.25)] px-6 py-4 rounded-lg flex items-start gap-4 shadow-[0_0_20px_rgba(6,182,212,0.2)] animate-pulse-subtle',
              // AI message (regular): full-width, light cyan bg
              !isSystemGuidance && isAssistant && 'w-full bg-[rgba(6,182,212,0.05)] border border-[rgba(6,182,212,0.1)] px-5 py-3 rounded-lg hover:border-[rgba(6,182,212,0.2)]',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[5px]'
            )}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {isSystemGuidance && isAssistant && (
              <div className="relative flex-shrink-0 mt-0.5">
                <Lightbulb className="w-6 h-6 text-[var(--accent-primary)] relative z-10" />
                {/* Breathing glow effect */}
                <div className="absolute inset-0 animate-ping opacity-20">
                  <Lightbulb className="w-6 h-6 text-[var(--accent-primary)]" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <MarkdownText text={message.content} />

              {/* Task #235: 消息时间戳 */}
              {message.createdAt && (
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--text-tertiary)] font-['DM_Sans']">
                    {formatRelativeTime(message.createdAt)}
                  </span>
                  {/* 复制按钮（鼠标悬停显示）*/}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(message.content)
                      // 可选：显示toast提示
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] p-1"
                    title="复制消息"
                    aria-label="复制消息内容"
                  >
                    <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Script cards */}
        {message.metadata?.script && (
          <ScriptCard script={message.metadata.script} />
        )}

        {/* Storyboard grid */}
        {message.metadata?.storyboard && message.type !== 'frame_selector' && (
          <StoryboardGrid
            storyboard={message.metadata.storyboard}
            aspectRatio={message.metadata.aspectRatio ?? '9:16'}
            onRegenerate={() => onAction?.('regenerate_storyboard')}
            onRegenerateFrame={(frame) => onAction?.('regenerate_frame', { frameIndex: frame.index, frame })}
            onBatchRegenerate={(frameIndices) => onAction?.('batch_regenerate_frames', { frameIndices })}
          />
        )}

        {/* Frame Selector */}
        {message.type === 'frame_selector' && message.metadata?.storyboard && (
          <FrameSelector
            storyboard={message.metadata.storyboard}
            aspectRatio={message.metadata.aspectRatio ?? '9:16'}
            onConfirm={(frameIndices, engine) => onAction?.('generate_video_with_frames', { frameIndices, engine })}
            onCancel={() => onAction?.('cancel_frame_selection')}
          />
        )}

        {/* Storyboard Variant Selector */}
        {message.type === 'storyboard_variants' && message.metadata?.variants && (
          <StoryboardVariantSelector
            variants={message.metadata.variants}
            onSelect={(variantId) => onAction?.('select_storyboard_variant', { variantId })}
          />
        )}

        {/* Video progress */}
        {message.metadata?.videoJob && (
          <VideoProgress
            job={message.metadata.videoJob}
            onExtractFrames={() => onAction?.('extract_video_frames', { videoJob: message.metadata?.videoJob })}
          />
        )}

        {/* Video Frame Extractor */}
        {message.type === 'video_frame_extractor' && message.metadata?.videoJob && (
          <div className="space-y-2">
            {/* VideoFrameExtractor 组件会在这里渲染，但需要在 page.tsx 中处理 */}
          </div>
        )}

        {/* Generation progress */}
        {message.metadata?.generation && (
          <GenerationProgress
            stage={message.metadata.generation.stage as GenerationStage}
            current={message.metadata.generation.current}
            total={message.metadata.generation.total}
            detail={message.metadata.generation.detail}
            startedAt={message.metadata.generation.startedAt}
          />
        )}

        {/* Legacy progress bar */}
        {message.metadata?.progress && !message.metadata?.generation && (
          <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
            <div
              className="bg-[var(--accent-primary)] h-1.5 rounded-full transition-smooth"
              style={{ width: `${message.metadata.progress.value}%` }}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">{message.metadata.progress.label}</p>
          </div>
        )}

        {/* Quick actions - P0: 流程完成后隐藏 */}
        {!hideActions && message.metadata?.actions && message.metadata.actions.length > 0 && (
          <QuickActions actions={message.metadata.actions} onAction={onAction} />
        )}
      </div>
    </div>
  )
}

function MarkdownText({ text }: { text: string }) {
  // Simple markdown: **bold**, *italic*, \n
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={i}>{part.slice(1, -1)}</em>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

// Task #235: 格式化相对时间
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const createdDate = new Date(date)
  const diffMs = now.getTime() - createdDate.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) return '刚刚'
  if (diffSec < 60) return `${diffSec}秒前`
  if (diffMin < 60) return `${diffMin}分钟前`
  if (diffHour < 24) return `${diffHour}小时前`
  if (diffDay === 1) return '昨天'
  if (diffDay < 7) return `${diffDay}天前`

  // 超过7天显示具体日期
  return createdDate.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
