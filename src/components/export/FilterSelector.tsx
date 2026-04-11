'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { getAllFilters, type FilterId, type VideoFilter } from '@/lib/video/filters'
import { cn } from '@/lib/utils/cn'

interface FilterSelectorProps {
  value: FilterId
  intensity: number
  onChange: (filterId: FilterId, intensity: number) => void
}

export function FilterSelector({ value, intensity, onChange }: FilterSelectorProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterId>(value)
  const [filterIntensity, setFilterIntensity] = useState(intensity)
  const filters = getAllFilters()

  const handleFilterClick = (filter: VideoFilter) => {
    setSelectedFilter(filter.id)
    onChange(filter.id, filterIntensity)
  }

  const handleIntensityChange = (newIntensity: number) => {
    setFilterIntensity(newIntensity)
    onChange(selectedFilter, newIntensity)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-cyan-400" />
        <h3 className="text-sm font-semibold text-zinc-200">颜色滤镜</h3>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter)}
            className={cn(
              'group relative overflow-hidden rounded-lg transition-all',
              'border-2',
              selectedFilter === filter.id
                ? 'border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'border-white/10 hover:border-white/20'
            )}
            aria-label={`Select ${filter.nameZh} filter`}
          >
            {/* Preview Gradient */}
            <div
              className="h-20 w-full transition-transform group-hover:scale-105"
              style={{
                background: filter.previewGradient,
              }}
            />

            {/* Filter Name */}
            <div className="bg-[var(--bg-tertiary)] px-3 py-2">
              <p
                className={cn(
                  'text-xs font-medium transition-colors',
                  selectedFilter === filter.id ? 'text-cyan-400' : 'text-zinc-300'
                )}
              >
                {filter.nameZh}
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">
                {filter.description}
              </p>
            </div>

            {/* Selected Indicator */}
            {selectedFilter === filter.id && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Intensity Slider */}
      {selectedFilter !== 'none' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400">滤镜强度</label>
            <span className="text-xs font-medium text-zinc-300">{filterIntensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filterIntensity}
            onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:bg-cyan-500
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Filter intensity"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>轻微</span>
            <span>强烈</span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-zinc-500 bg-[var(--bg-tertiary)] rounded-lg p-2.5 space-y-1">
        <div className="font-medium text-zinc-400">💡 使用建议：</div>
        <div>• 鲜艳/高对比：适合产品展示、活力视频</div>
        <div>• 温暖/柔和：适合人物、生活场景</div>
        <div>• 冷调/电影感：适合科技、商务视频</div>
        <div>• 复古/黑白：适合艺术、怀旧主题</div>
      </div>
    </div>
  )
}
