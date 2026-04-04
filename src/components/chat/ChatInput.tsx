'use client'

import { useRef, useState, useCallback } from 'react'
import { Send, Paperclip, Video, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  onSend: (message: string, attachments?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed && files.length === 0) return
    onSend(trimmed, files.length > 0 ? files : undefined)
    setText('')
    setFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, files, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  const addFiles = (newFiles: FileList | null, type: 'image' | 'video') => {
    if (!newFiles) return
    const arr = Array.from(newFiles)
    setFiles(prev => [...prev, ...arr].slice(0, type === 'image' ? 10 : 1))
  }

  return (
    <div className="flex flex-col gap-2">
      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300"
            >
              <span>{file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name}</span>
              <button
                onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className={cn(
        'flex items-end gap-2 bg-zinc-800 border border-zinc-700 rounded-2xl px-3 py-2',
        'focus-within:border-violet-500 transition-colors',
        disabled && 'opacity-50 pointer-events-none'
      )}>
        {/* Attach image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
          title="上传图片"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files, 'image')}
        />

        {/* Attach video */}
        <button
          onClick={() => videoInputRef.current?.click()}
          className="flex-shrink-0 p-1.5 text-zinc-400 hover:text-violet-400 transition-colors"
          title="上传视频（二创）"
        >
          <Video size={18} />
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={e => addFiles(e.target.files, 'video')}
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? '告诉我你想做什么视频…'}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500',
            'resize-none outline-none leading-relaxed py-1',
            'min-h-[24px] max-h-[200px]'
          )}
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && files.length === 0}
          className={cn(
            'flex-shrink-0 p-1.5 rounded-xl transition-all',
            (text.trim() || files.length > 0)
              ? 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/20'
              : 'text-zinc-600 cursor-not-allowed'
          )}
        >
          <Send size={18} />
        </button>
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Enter 发送 · Shift+Enter 换行 · 支持上传图片和视频
      </p>
    </div>
  )
}
