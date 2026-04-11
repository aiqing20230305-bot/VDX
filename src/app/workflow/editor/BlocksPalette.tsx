/**
 * Blocks 面板
 * 显示所有可用的 Blocks，支持拖拽到画布
 */
'use client'

import { useState, useEffect } from 'react'
import { BLOCK_ICON_MAP, DEFAULT_BLOCK_ICON } from '@/lib/blocks/iconMap'
import { logger } from '@/lib/utils/logger'

interface Block {
  id: string
  name: string
  category: string
  description: string
  icon?: string
  inputs: any[]
  outputs: any[]
}

const CategoryLabels = {
  input: '输入',
  generate: '生成',
  process: '处理',
  compose: '合成',
  output: '输出',
}

export function BlocksPalette() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [filter, setFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // 加载 Blocks
  useEffect(() => {
    fetch('/api/blocks/list')
      .then((res) => res.json())
      .then((data) => setBlocks(data.blocks || []))
      .catch((err) => logger.error('Failed to load blocks:', err))
  }, [])

  // 过滤 Blocks
  const filteredBlocks = blocks.filter((block) => {
    const matchesSearch = block.name.toLowerCase().includes(filter.toLowerCase()) ||
      block.description.toLowerCase().includes(filter.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || block.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // 按分类分组
  const groupedBlocks = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = []
    acc[block.category].push(block)
    return acc
  }, {} as Record<string, Block[]>)

  // 拖拽开始
  const onDragStart = (event: React.DragEvent, block: Block) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(block))
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* 标题 */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-cyan-400">Building Blocks</h2>
        <p className="text-xs text-zinc-500 mt-1">拖拽添加到画布</p>
      </div>

      {/* 搜索和过滤 */}
      <div className="p-4 space-y-3 border-b border-zinc-800">
        <input
          type="text"
          placeholder="搜索 Blocks..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2 py-1 text-xs rounded ${
              categoryFilter === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            全部
          </button>
          {Object.entries(CategoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-2 py-1 text-xs rounded ${
                categoryFilter === key
                  ? 'bg-cyan-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks 列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedBlocks).map(([category, categoryBlocks]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">
              {CategoryLabels[category as keyof typeof CategoryLabels] || category}
            </h3>

            <div className="space-y-2">
              {categoryBlocks.map((block) => {
                const Icon = (block.icon && BLOCK_ICON_MAP[block.icon]) || DEFAULT_BLOCK_ICON

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, block)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 rounded cursor-move transition"
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{block.name}</div>
                        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {block.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
                          <span>{block.inputs.length} 输入</span>
                          <span>·</span>
                          <span>{block.outputs.length} 输出</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredBlocks.length === 0 && (
          <div className="text-center text-zinc-500 py-8">未找到匹配的 Blocks</div>
        )}
      </div>
    </div>
  )
}
