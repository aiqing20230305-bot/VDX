'use client'

import { motion } from 'framer-motion'
import type { ChatMessage as ChatMessageType } from '@/types'
import { QuickActions } from './QuickActions'
import { ScriptCard } from '../storyboard/ScriptCard'
import { StoryboardGrid } from '../storyboard/StoryboardGrid'
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
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
        isAssistant
          ? 'bg-gradient-to-br from-violet-500 to-blue-600 text-white'
          : 'bg-zinc-700 text-zinc-200'
      )}>
        {isAssistant ? '✦' : 'U'}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col gap-2 max-w-[85%]', isAssistant ? 'items-start' : 'items-end')}>
        {/* Text bubble */}
        {message.content && (
          <div className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
            isAssistant
              ? 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
              : 'bg-violet-600 text-white rounded-tr-sm'
          )}>
            <MarkdownText text={message.content} />
          </div>
        )}

        {/* Script cards */}
        {message.metadata?.script && (
          <ScriptCard script={message.metadata.script} />
        )}

        {/* Storyboard grid */}
        {message.metadata?.storyboard && (
          <StoryboardGrid storyboard={message.metadata.storyboard} />
        )}

        {/* Video progress */}
        {message.metadata?.videoJob && (
          <VideoProgress job={message.metadata.videoJob} />
        )}

        {/* Progress bar */}
        {message.metadata?.progress && (
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
