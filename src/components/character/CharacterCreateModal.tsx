'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface CharacterCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CharacterCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: CharacterCreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB')
      return
    }

    setImageFile(file)
    setError(null)

    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // 添加标签
  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  // 移除标签
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // 提交创建
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入角色名称')
      return
    }
    if (!imageFile) {
      setError('请上传参考图片')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 将图片转为 base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(imageFile)
      })
      const referenceImageUrl = await base64Promise

      // 调用创建 API
      const response = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          tags,
          referenceImageUrl,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
        handleClose()
      } else {
        setError(data.error || '创建失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 关闭模态框
  const handleClose = () => {
    if (!loading) {
      setName('')
      setDescription('')
      setTags([])
      setTagInput('')
      setImageFile(null)
      setImagePreview(null)
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-white/18 bg-zinc-900 shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-white/12 p-6">
          <h2 className="font-['Instrument_Serif'] text-2xl font-bold text-zinc-100">
            创建角色
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100 disabled:opacity-50"
            aria-label="关闭"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* 参考图片上传 */}
            <div>
              <label className="mb-2 block font-sans text-sm font-semibold text-zinc-100">
                参考图片 <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
                  imagePreview
                    ? 'border-cyan-400'
                    : 'border-white/12 hover:border-white/18'
                } bg-zinc-900`}
              >
                {imagePreview ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={imagePreview}
                      alt="预览"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <svg
                      className="mx-auto mb-2 text-zinc-500"
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                    <p className="font-sans text-sm text-zinc-400">
                      点击上传图片
                    </p>
                    <p className="mt-1 font-sans text-xs text-zinc-500">
                      支持 JPG、PNG、WEBP（最大 10MB）
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* 角色名称 */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-sans text-sm font-semibold text-zinc-100"
              >
                角色名称 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：小红、李明、主角..."
                className="w-full rounded-lg border border-white/12 bg-zinc-900 px-4 py-2.5 font-sans text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* 角色描述 */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block font-sans text-sm font-semibold text-zinc-100"
              >
                角色描述（可选）
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简短描述角色的特点、用途..."
                rows={3}
                className="w-full resize-none rounded-lg border border-white/12 bg-zinc-900 px-4 py-2.5 font-sans text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* 标签 */}
            <div>
              <label
                htmlFor="tags"
                className="mb-2 block font-sans text-sm font-semibold text-zinc-100"
              >
                标签（可选）
              </label>
              <div className="flex gap-2">
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="输入标签后按回车"
                  className="flex-1 rounded-lg border border-white/12 bg-zinc-900 px-4 py-2.5 font-sans text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border border-white/12 bg-zinc-900 px-4 py-2.5 font-sans text-sm text-cyan-400 transition-colors hover:border-cyan-400"
                >
                  添加
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-cyan-400/10 px-3 py-1 font-sans text-xs text-cyan-400"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-zinc-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 font-sans text-sm text-red-500">
                {error}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-white/12 px-4 py-2.5 font-sans text-sm font-semibold text-zinc-400 transition-colors hover:border-white/18 hover:text-zinc-100 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  创建中...
                </>
              ) : (
                '创建角色'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
