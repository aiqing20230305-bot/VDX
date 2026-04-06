'use client'

import { motion } from 'framer-motion'
import { Lightbulb, Info, Sparkles } from 'lucide-react'
import type { ChatMessage as ChatMessageType } from '@/types'
import { QuickActions } from './QuickActions'
import { GenerationProgress, type GenerationStage } from './GenerationProgress'
import { ScriptCard } from '../storyboard/ScriptCard'
import { StoryboardGrid } from '../storyboard/StoryboardGrid'
import { FrameSelector } from '../storyboard/FrameSelector'
import { VideoProgress } from '../video/VideoProgress'
import { cn } from '@/lib/utils/cn'

interface Props {
  message: ChatMessageType
  onAction?: (action: string, params?: Record<string, unknown>) => void
}

export function ChatMessage({ message, onAction }: Props) {
  const isAssistant = message.role === 'assistant'
  const isSystemGuidance = isAssistant && message.type === 'action' && !message.metadata?.script && !message.metadata?.storyboard
  const isGeneratedContent = message.metadata?.script || message.metadata?.storyboard || message.metadata?.videoJob

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-4', isAssistant ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar - Industrial Minimalism */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-smooth',
        isAssistant
          ? 'bg-[var(--accent-primary)] text-white'
          : 'glass border border-white/10 text-[var(--text-primary)]'
      )}>
        <span style={{ fontFamily: 'var(--font-body)' }}>
          {isAssistant ? '✦' : 'U'}
        </span>
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-3 max-w-[85%]', isAssistant ? 'items-start' : 'items-end')}>
        {/* Text bubble - Industrial Minimalism v1.8.0 */}
        {message.content && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-smooth',
              isSystemGuidance && isAssistant
                ? 'bg-white/5 border border-white/10 px-5 py-3 rounded-tl-sm flex items-start gap-3'
                : isAssistant
                  ? 'glass border border-[var(--border-subtle)] px-5 py-3 rounded-tl-sm hover:border-[var(--accent-border)]'
                  : 'bg-[var(--accent-primary)] text-white px-5 py-3 rounded-tr-sm hover:bg-[var(--accent-hover)]'
            )}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {isSystemGuidance && isAssistant && (
              <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <MarkdownText text={message.content} />
            </div>
          </motion.div>
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

        {/* Quick actions */}
        {message.metadata?.actions && message.metadata.actions.length > 0 && (
          <QuickActions actions={message.metadata.actions} onAction={onAction} />
        )}
      </div>
    </motion.div>
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
