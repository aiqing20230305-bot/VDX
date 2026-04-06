'use client'

import { Character } from '@/types'
import Image from 'next/image'
import { useState } from 'react'

interface CharacterCardProps {
  character: Character
  onClick?: (character: Character) => void
  isSelected?: boolean
}

export function CharacterCard({ character, onClick, isSelected = false }: CharacterCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      onClick={() => onClick?.(character)}
      className={`
        relative overflow-hidden rounded-lg border
        transition-all duration-150 ease-out
        ${onClick ? 'cursor-pointer' : ''}
        ${
          isSelected
            ? 'border-[#06b6d4] ring-2 ring-[#06b6d4]/30'
            : 'border-white/12 hover:border-white/18'
        }
        ${onClick ? 'hover:translate-y-[-2px]' : ''}
        bg-[#1a1a24]
      `}
    >
      {/* 角色缩略图 */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#13131a]">
        {!imageError ? (
          <Image
            src={character.thumbnailUrl || character.referenceImageUrl}
            alt={character.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#71717a]">
            <svg
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
              <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            </svg>
          </div>
        )}

        {/* 使用次数徽章 */}
        {character.usageCount > 0 && (
          <div className="absolute right-2 top-2 rounded-full bg-[#06b6d4]/20 px-2 py-1 text-xs font-medium text-[#06b6d4]">
            {character.usageCount}次
          </div>
        )}
      </div>

      {/* 角色信息 */}
      <div className="p-3">
        <h3 className="font-['DM_Sans'] text-sm font-semibold text-[#f5f5f7] line-clamp-1">
          {character.name}
        </h3>

        {character.description && (
          <p className="mt-1 font-['DM_Sans'] text-xs text-[#a1a1aa] line-clamp-2">
            {character.description}
          </p>
        )}

        {/* 标签 */}
        {character.tags && character.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {character.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-[#06b6d4]/10 px-2 py-0.5 font-['DM_Sans'] text-xs text-[#06b6d4]"
              >
                {tag}
              </span>
            ))}
            {character.tags.length > 3 && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 font-['DM_Sans'] text-xs text-[#71717a]">
                +{character.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute right-2 top-2 rounded-full bg-[#06b6d4] p-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  )
}
