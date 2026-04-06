'use client'

import { Character } from '@/types'
import { useState, useEffect } from 'react'
import { CharacterCard } from './CharacterCard'

interface CharacterLibraryProps {
  onSelect?: (character: Character) => void
  selectedCharacterId?: string
  showCreateButton?: boolean
  onCreateClick?: () => void
}

export function CharacterLibrary({
  onSelect,
  selectedCharacterId,
  showCreateButton = true,
  onCreateClick,
}: CharacterLibraryProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 获取角色列表
  useEffect(() => {
    fetchCharacters()
  }, [searchQuery, selectedTags])

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','))
      params.append('limit', '50')

      const response = await fetch(`/api/character?${params}`)
      const data = await response.json()

      if (data.success) {
        setCharacters(data.characters)
      } else {
        setError(data.error || '加载失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 获取所有唯一标签
  const allTags = Array.from(
    new Set(characters.flatMap((char) => char.tags || []))
  ).sort()

  // 切换标签筛选
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 搜索和筛选栏 */}
      <div className="border-b border-white/8 bg-[#13131a] p-4">
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="搜索角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/12 bg-[#1a1a24] px-4 py-2 font-['DM_Sans'] text-sm text-[#f5f5f7] placeholder-[#71717a] transition-colors focus:border-[#06b6d4] focus:outline-none"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a]"
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
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {/* 创建按钮 */}
          {showCreateButton && (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 rounded-lg bg-[#06b6d4] px-4 py-2 font-['DM_Sans'] text-sm font-semibold text-white transition-all hover:bg-[#0891b2]"
            >
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
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              创建角色
            </button>
          )}
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 font-['DM_Sans'] text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-[#06b6d4] text-white'
                    : 'bg-white/5 text-[#a1a1aa] hover:bg-white/10'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="rounded-full bg-white/5 px-3 py-1 font-['DM_Sans'] text-xs font-medium text-[#71717a] hover:bg-white/10"
              >
                清除筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* 角色网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#06b6d4] border-t-transparent" />
              <p className="font-['DM_Sans'] text-sm text-[#a1a1aa]">加载中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="font-['DM_Sans'] text-sm text-[#ef4444]">{error}</p>
              <button
                onClick={fetchCharacters}
                className="mt-2 font-['DM_Sans'] text-sm text-[#06b6d4] hover:underline"
              >
                重试
              </button>
            </div>
          </div>
        ) : characters.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto mb-3 text-[#71717a]"
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
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
              <p className="font-['DM_Sans'] text-sm text-[#a1a1aa]">
                {searchQuery || selectedTags.length > 0
                  ? '未找到匹配的角色'
                  : '还没有角色，点击上方按钮创建'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {characters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onClick={onSelect}
                isSelected={character.id === selectedCharacterId}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {!loading && !error && characters.length > 0 && (
        <div className="border-t border-white/8 bg-[#13131a] px-4 py-3">
          <p className="font-['DM_Sans'] text-xs text-[#71717a]">
            共 {characters.length} 个角色
            {searchQuery && ` · 搜索"${searchQuery}"`}
            {selectedTags.length > 0 && ` · 已选标签：${selectedTags.join(', ')}`}
          </p>
        </div>
      )}
    </div>
  )
}
