'use client'

import { useState, useEffect } from 'react'
import { Character } from '@/types'
import Image from 'next/image'
import { CharacterCreateModal } from './CharacterCreateModal'

interface CharacterSelectorProps {
  value?: string | null // 当前选中的角色ID
  onChange?: (characterId: string | null) => void
  compact?: boolean // 紧凑模式
  showLabel?: boolean // 显示标签
  allowNone?: boolean // 允许"无角色"选项
}

export function CharacterSelector({
  value,
  onChange,
  compact = false,
  showLabel = true,
  allowNone = true,
}: CharacterSelectorProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false) // Task #232: 角色创建弹窗状态

  // 获取角色列表
  useEffect(() => {
    fetchCharacters()
  }, [])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/character?limit=50')
      const data = await response.json()

      if (data.success) {
        setCharacters(data.characters)
      } else {
        setError('加载失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 获取选中角色的显示信息
  const selectedCharacter = characters.find((c) => c.id === value)

  // 处理选择
  const handleSelect = (characterId: string | null) => {
    onChange?.(characterId)
    setIsOpen(false)
  }

  if (compact) {
    // 紧凑模式：下拉选择框
    return (
      <>
      <div className="relative">
        {showLabel && (
          <label className="mb-1.5 block font-sans text-xs font-semibold text-zinc-400">
            角色一致性
          </label>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-white/12 bg-zinc-900 px-3 py-2 font-sans text-sm text-zinc-100 transition-colors hover:border-white/18 focus:border-cyan-400 focus:outline-none"
        >
          <span className="truncate">
            {selectedCharacter ? selectedCharacter.name : '无角色（默认）'}
          </span>
          <svg
            className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* 选项列表 */}
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-white/18 bg-zinc-900 shadow-xl">
              {loading ? (
                <div className="p-3 text-center font-sans text-sm text-zinc-400">
                  加载中...
                </div>
              ) : error ? (
                <div className="p-3 text-center font-sans text-sm text-red-500">
                  {error}
                </div>
              ) : (
                <>
                  {/* 无角色选项 */}
                  {allowNone && (
                    <button
                      type="button"
                      onClick={() => handleSelect(null)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${
                        !value ? 'bg-white/8' : ''
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
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
                          className="text-zinc-500"
                        >
                          <line x1="2" x2="22" y1="2" y2="22" />
                          <path d="M16 16v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1" />
                          <path d="M8 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-sans text-sm font-medium text-zinc-100">
                          无角色（默认）
                        </div>
                        <div className="font-sans text-xs text-zinc-500">
                          不使用角色一致性
                        </div>
                      </div>
                    </button>
                  )}

                  {/* 角色列表 */}
                  {characters.length === 0 ? (
                    <div className="p-6 text-center">
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
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p className="font-sans text-sm text-zinc-400">
                        还没有角色
                      </p>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-2 inline-block font-sans text-sm text-cyan-400 hover:underline cursor-pointer"
                      >
                        创建第一个角色
                      </button>
                    </div>
                  ) : (
                    characters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => handleSelect(character.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/5 ${
                          value === character.id ? 'bg-white/8' : ''
                        }`}
                      >
                        {/* 缩略图 */}
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                          {character.thumbnailUrl || character.referenceImageUrl ? (
                            <Image
                              src={character.thumbnailUrl || character.referenceImageUrl}
                              alt={character.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-zinc-500">
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
                                <circle cx="12" cy="8" r="5" />
                                <path d="M20 21a8 8 0 0 0-16 0" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* 角色信息 */}
                        <div className="flex-1 overflow-hidden">
                          <div className="truncate font-sans text-sm font-medium text-zinc-100">
                            {character.name}
                          </div>
                          {character.description && (
                            <div className="truncate font-sans text-xs text-zinc-500">
                              {character.description}
                            </div>
                          )}
                        </div>

                        {/* 选中标记 */}
                        {value === character.id && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-cyan-400"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Task #232: 角色创建弹窗 */}
      <CharacterCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          fetchCharacters() // 刷新角色列表
        }}
      />
      </>
    )
  }

  // 完整模式：卡片网格
  return (
    <>
    <div className="flex flex-col gap-3">
      {showLabel && (
        <div className="flex items-center justify-between">
          <label className="font-sans text-sm font-semibold text-zinc-100">
            选择角色
          </label>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-400/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            创建角色
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="font-sans text-sm text-zinc-400">加载中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <p className="font-sans text-sm text-red-500">{error}</p>
            <button
              onClick={fetchCharacters}
              className="mt-2 font-sans text-sm text-cyan-400 hover:underline"
            >
              重试
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {/* 无角色选项 */}
          {allowNone && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                !value
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/12 bg-zinc-900 hover:border-white/18'
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-500"
                >
                  <line x1="2" x2="22" y1="2" y2="22" />
                  <path d="M16 16v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1" />
                  <path d="M8 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
                </svg>
              </div>
              <span className="text-center font-sans text-xs font-medium text-zinc-400">
                无角色
              </span>
            </button>
          )}

          {/* 角色列表 */}
          {characters.map((character) => (
            <button
              key={character.id}
              type="button"
              onClick={() => handleSelect(character.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all ${
                value === character.id
                  ? 'border-cyan-400 bg-cyan-400/10'
                  : 'border-white/12 bg-zinc-900 hover:border-white/18'
              }`}
            >
              {/* 缩略图 */}
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-white/5">
                {character.thumbnailUrl || character.referenceImageUrl ? (
                  <Image
                    src={character.thumbnailUrl || character.referenceImageUrl}
                    alt={character.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="5" />
                      <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 角色名称 */}
              <span className="line-clamp-2 text-center font-sans text-xs font-medium text-zinc-100">
                {character.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Task #232: 角色创建弹窗 */}
    <CharacterCreateModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSuccess={() => {
        setIsModalOpen(false)
        fetchCharacters() // 刷新角色列表
      }}
    />
    </>
  )
}
