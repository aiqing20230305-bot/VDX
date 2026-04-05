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
    <div className="flex flex-col gap-3">
      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative flex items-center gap-2 glass rounded-xl px-3 py-1.5 text-xs text-zinc-200 border border-white/10"
            >
              <span className="font-medium">{file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name}</span>
              <button
                onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                className="text-zinc-400 hover:text-purple-400 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row - 玻璃态设计 */}
      <div className={cn(
        'relative flex items-end gap-3 glass rounded-2xl px-4 py-3 border border-white/10',
        'focus-within:border-purple-500/50 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
        'transition-all duration-300',
        disabled && 'opacity-50 pointer-events-none'
      )}>
        {/* 发光边框效果 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />

        {/* Attach image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"
          title="上传图片"
        >
          <Paperclip size={20} />
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
          className="flex-shrink-0 p-2 text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all"
          title="上传视频（二创）"
        >
          <Video size={20} />
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
            'min-h-[28px] max-h-[200px]'
          )}
        />

        {/* Send button - 渐变设计 */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && files.length === 0}
          className={cn(
            'flex-shrink-0 p-2 rounded-xl transition-all relative overflow-hidden',
            (text.trim() || files.length > 0)
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          )}
        >
          <Send size={20} />
        </button>
      </div>

      <p className="text-xs text-zinc-500 text-center font-medium">
        <kbd className="px-2 py-0.5 bg-zinc-800/50 rounded border border-zinc-700/50">Enter</kbd> 发送 ·
        <kbd className="px-2 py-0.5 bg-zinc-800/50 rounded border border-zinc-700/50 mx-1">Shift+Enter</kbd> 换行 ·
        支持上传图片和视频
      </p>
    </div>
  )
}
