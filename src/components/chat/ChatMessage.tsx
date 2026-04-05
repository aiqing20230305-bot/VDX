'use client'

import { motion } from 'framer-motion'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-4', isAssistant ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar - 增强 */}
      <div className={cn(
        'relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold group',
        isAssistant
          ? 'bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 text-white shadow-neon'
          : 'glass border border-white/10 text-zinc-200'
      )}>
        {isAssistant && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-cyan-400 opacity-0 group-hover:opacity-70 blur-2xl transition-all duration-500" />
        )}
        <span className="relative z-10" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          {isAssistant ? '✦' : 'U'}
        </span>
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-3 max-w-[85%]', isAssistant ? 'items-start' : 'items-end')}>
        {/* Text bubble - 创意活力风格 v1.6.0 */}
        {message.content && (
          <div
            className={cn(
              'px-5 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300',
              isAssistant
                ? 'bubble-gradient backdrop-blur-xl rounded-tl-sm hover:shadow-glow card-tilt'
                : 'bg-gradient-to-br from-purple-500 via-violet-600 to-blue-600 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.5)] hover:-translate-y-0.5'
            )}
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            <MarkdownText text={message.content} />
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
          <div className="w-full bg-zinc-700 rounded-full h-1.5">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${message.metadata.progress.value}%` }}
            />
            <p className="text-xs text-zinc-400 mt-1">{message.metadata.progress.label}</p>
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
