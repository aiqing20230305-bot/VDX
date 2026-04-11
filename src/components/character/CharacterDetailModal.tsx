'use client'

import { Character } from '@/types'
import Image from 'next/image'
import { useState } from 'react'

interface CharacterDetailModalProps {
  character: Character | null
  isOpen: boolean
  onClose: () => void
  onSelect?: (character: Character) => void
}

export function CharacterDetailModal({
  character,
  isOpen,
  onClose,
  onSelect,
}: CharacterDetailModalProps) {
  const [imageError, setImageError] = useState(false)

  if (!isOpen || !character) return null

  const features = character.features

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-white/18 bg-zinc-900 shadow-2xl">
        {/* 标题栏 */}
        <div className="flex items-center justify-between border-b border-white/12 p-6">
          <div>
            <h2 className="font-['Instrument_Serif'] text-2xl font-bold text-zinc-100">
              {character.name}
            </h2>
            {character.description && (
              <p className="mt-1 font-sans text-sm text-zinc-400">
                {character.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
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

        {/* 内容区域 */}
        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* 左侧：参考图片 */}
          <div>
            <div className="overflow-hidden rounded-lg border border-white/12 bg-zinc-900">
              <div className="relative aspect-square w-full">
                {!imageError ? (
                  <Image
                    src={character.referenceImageUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/12 bg-zinc-900 p-4 text-center">
                <p className="font-sans text-2xl font-bold text-cyan-400">
                  {character.usageCount}
                </p>
                <p className="mt-1 font-sans text-xs text-zinc-500">
                  使用次数
                </p>
              </div>
              <div className="rounded-lg border border-white/12 bg-zinc-900 p-4 text-center">
                <p className="font-sans text-2xl font-bold text-cyan-400">
                  {character.tags?.length || 0}
                </p>
                <p className="mt-1 font-sans text-xs text-zinc-500">
                  标签数量
                </p>
              </div>
            </div>
          </div>

          {/* 右侧：特征详情 */}
          <div className="space-y-4">
            {/* 标签 */}
            {character.tags && character.tags.length > 0 && (
              <div>
                <h3 className="mb-2 font-sans text-sm font-semibold text-zinc-100">
                  标签
                </h3>
                <div className="flex flex-wrap gap-2">
                  {character.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-cyan-400/10 px-3 py-1 font-sans text-xs text-cyan-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 特征提取结果 */}
            {features && (
              <>
                {/* 面部特征 */}
                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-zinc-100">
                    面部特征
                  </h3>
                  <div className="space-y-2 rounded-lg border border-white/12 bg-zinc-900 p-4">
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        脸型
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.face.shape}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        眼睛
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.face.eyes}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        发型
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.face.hair}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        肤色
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.face.skin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 体型特征 */}
                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-zinc-100">
                    体型特征
                  </h3>
                  <div className="space-y-2 rounded-lg border border-white/12 bg-zinc-900 p-4">
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        身材
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.body.build}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        高度
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.body.height}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        姿态
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.body.pose}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 风格特征 */}
                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-zinc-100">
                    风格特征
                  </h3>
                  <div className="space-y-2 rounded-lg border border-white/12 bg-zinc-900 p-4">
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        服装
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.style.clothing}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        配色
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.style.colors.join('、')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-xs text-zinc-500">
                        配饰
                      </span>
                      <span className="font-sans text-xs text-zinc-100">
                        {features.style.accessories}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 详细描述 */}
                <div>
                  <h3 className="mb-2 font-sans text-sm font-semibold text-zinc-100">
                    详细描述
                  </h3>
                  <p className="rounded-lg border border-white/12 bg-zinc-900 p-4 font-sans text-xs leading-relaxed text-zinc-400">
                    {features.detailedDescription}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between border-t border-white/12 p-6">
          <div className="font-sans text-xs text-zinc-500">
            创建于 {new Date(character.createdAt).toLocaleDateString('zh-CN')}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-white/12 px-4 py-2.5 font-sans text-sm font-semibold text-zinc-400 transition-colors hover:border-white/18 hover:text-zinc-100"
            >
              关闭
            </button>
            {onSelect && (
              <button
                onClick={() => {
                  onSelect(character)
                  onClose()
                }}
                className="rounded-lg bg-cyan-400 px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-cyan-500"
              >
                使用此角色
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
