/**
 * Template Gallery - 模板选择画廊
 * 展示预设模板，用户可选择模板快速开始
 */
'use client'

import { useState } from 'react'
import { Search, Clock, Film, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import type { VideoTemplate, TemplateCategory } from '@/lib/templates'
import { VIDEO_TEMPLATES, getAllCategories, getTemplatesByCategory } from '@/lib/templates'

interface TemplateGalleryProps {
  onSelect: (template: VideoTemplate) => void
  onClose: () => void
}

export function TemplateGallery({ onSelect, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const categories = getAllCategories()

  // 筛选模板
  const filteredTemplates = getTemplatesByCategory(selectedCategory).filter(template =>
    searchQuery
      ? template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  )

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col shadow-2xl">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              选择模板开始创作
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {VIDEO_TEMPLATES.length} 个专业模板，助你快速开始
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-zinc-200"
            aria-label="关闭"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          {/* 分类筛选 */}
          <div className="flex items-center gap-2 flex-1">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedCategory === category.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* 搜索框 */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* 模板网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Film className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-lg text-zinc-500">未找到匹配的模板</p>
              <p className="text-sm text-zinc-600 mt-2">试试其他关键词或类别</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`group relative bg-zinc-800/50 border border-zinc-700 hover:border-cyan-500 rounded-xl overflow-hidden transition-[border-color,transform,box-shadow] duration-300 text-left ${
                    hoveredId === template.id ? 'scale-105 shadow-xl shadow-cyan-500/20' : ''
                  }`}
                >
                  {/* 缩略图 */}
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <span className="text-4xl">{getCategoryEmoji(template.category)}</span>
                    </div>
                    {hoveredId === template.id && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
                        <div className="text-xs text-zinc-300 space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{template.duration}秒</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            <span>{template.frameCount} 个场景</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-400 transition">
                        {template.name}
                      </h3>
                      <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {template.categoryLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="text-xs text-zinc-600 bg-zinc-900/50 px-2 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hover 提示 */}
                  {hoveredId === template.id && (
                    <div className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 text-center">
          <p className="text-xs text-zinc-600">
            提示：选择模板后，你可以自由编辑每个场景的内容和时长
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * 根据类别返回对应的 emoji
 */
function getCategoryEmoji(category: TemplateCategory): string {
  const emojiMap: Record<TemplateCategory, string> = {
    commercial: '🎯',
    creative: '🎨',
    education: '📚',
    lifestyle: '🌟',
    music: '🎵',
  }
  return emojiMap[category] || '🎬'
}
