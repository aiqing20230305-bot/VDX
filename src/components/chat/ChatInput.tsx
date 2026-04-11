'use client'

import { useRef, useState, useCallback } from 'react'
import { Send, Paperclip, Video, Music, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  onSend: (message: string, attachments?: File[]) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [justSent, setJustSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed && files.length === 0) return

    onSend(trimmed, files.length > 0 ? files : undefined)
    setText('')
    setFiles([])

    // 成功反馈动画
    setJustSent(true)
    setTimeout(() => setJustSent(false), 1000)

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

  const addFiles = (newFiles: FileList | null, type: 'image' | 'video' | 'audio') => {
    if (!newFiles) return
    const arr = Array.from(newFiles)
    const maxFiles = type === 'image' ? 10 : 1 // 图片最多10个，视频/音频最多1个

    // 文件大小验证
    const maxSize = type === 'image' ? 10 * 1024 * 1024 : 100 * 1024 * 1024 // 图片10MB，视频/音频100MB
    const validFiles = arr.filter(file => {
      if (file.size > maxSize) {
        alert(`文件 ${file.name} 太大，${type === 'image' ? '图片' : '视频/音频'}最大支持 ${maxSize / 1024 / 1024}MB`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...validFiles].slice(0, maxFiles))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* File preview */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap px-1">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-xl px-3 py-1.5 text-xs text-zinc-200 border border-[var(--border-subtle)]"
            >
              <span className="font-medium">{file.name.length > 20 ? file.name.slice(0, 18) + '…' : file.name}</span>
              <button
                onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-smooth"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row - Industrial Minimalism v1.8.0 */}
      <div className={cn(
        'relative flex items-end gap-3 bg-[var(--bg-tertiary)] rounded-2xl px-4 py-3 border border-[var(--border-subtle)]',
        'focus-within:border-[var(--accent-border)]',
        'transition-smooth',
        disabled && 'opacity-50 pointer-events-none'
      )}>
        {/* Attach image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-xl transition-smooth"
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
          className="flex-shrink-0 p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-xl transition-smooth"
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

        {/* Attach audio */}
        <button
          onClick={() => audioInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] rounded-xl transition-smooth"
          title="上传音频（音乐视频）"
        >
          <Music size={20} />
        </button>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => addFiles(e.target.files, 'audio')}
        />

        {/* Textarea */}
        <div className="flex-1 flex flex-col">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? '告诉我你想做什么视频…'}
            rows={1}
            className={cn(
              'flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]',
              'resize-none outline-none leading-relaxed py-1',
              'min-h-[28px] max-h-[200px]'
            )}
            style={{ fontFamily: 'var(--font-body)' }}
          />
          {/* Character count */}
          {text.length > 0 && (
            <div className="text-[10px] text-[var(--text-tertiary)] text-right mt-1">
              {text.length} 字符 {text.length > 500 && '· 建议 50-500 字'}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && files.length === 0}
          className={cn(
            'flex-shrink-0 p-2.5 rounded-xl transition-all duration-300',
            (text.trim() || files.length > 0)
              ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed',
            justSent && 'scale-110 bg-green-500'
          )}
        >
          {justSent ? <Check size={18} /> : <Send size={18} />}
        </button>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] text-center font-medium" style={{ fontFamily: 'var(--font-body)' }}>
        <kbd className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)]">Enter</kbd> 发送 ·
        <kbd className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded border border-[var(--border-subtle)] mx-1">Shift+Enter</kbd> 换行 ·
        支持图片（≤10MB）、视频/音频（≤100MB）
      </p>
    </div>
  )
}
