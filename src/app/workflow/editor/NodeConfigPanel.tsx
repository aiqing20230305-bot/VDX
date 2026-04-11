/**
 * 节点配置面板
 * 右侧面板，显示选中节点的详细信息和配置选项
 */
'use client'

import { useState, useEffect } from 'react'
import type { Node } from '@xyflow/react'
import { X, Settings, Trash2 } from 'lucide-react'

interface NodeConfigPanelProps {
  node: Node
  onClose: () => void
  onUpdate: (config: Record<string, any>) => void
  onDelete: () => void
}

export function NodeConfigPanel({ node, onClose, onUpdate, onDelete }: NodeConfigPanelProps) {
  const nodeData = node.data as any
  const [config, setConfig] = useState<Record<string, any>>(nodeData.config || {})

  // 同步节点数据变化
  useEffect(() => {
    setConfig(nodeData.config || {})
  }, [nodeData.config])

  const handleInputChange = (inputName: string, value: any) => {
    const newConfig = { ...config, [inputName]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  const renderInputField = (input: any) => {
    const value = config[input.name] ?? input.default ?? ''

    switch (input.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleInputChange(input.name, e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span className="text-sm">{input.description}</span>
          </label>
        )

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(input.name, parseFloat(e.target.value) || 0)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
            placeholder={input.description}
          />
        )

      case 'string':
        if (input.multiline) {
          return (
            <textarea
              value={value}
              onChange={(e) => handleInputChange(input.name, e.target.value)}
              rows={4}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm resize-none"
              placeholder={input.description}
            />
          )
        }
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
            placeholder={input.description}
          />
        )

      case 'enum':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
          >
            <option value="">请选择...</option>
            {input.options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case 'string[]':
        return (
          <textarea
            value={Array.isArray(value) ? value.join('\n') : ''}
            onChange={(e) => handleInputChange(input.name, e.target.value.split('\n').filter(Boolean))}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm resize-none"
            placeholder="每行一个值"
          />
        )

      default:
        return (
          <input
            type="text"
            value={typeof value === 'object' ? JSON.stringify(value) : value}
            onChange={(e) => handleInputChange(input.name, e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm"
            placeholder={input.description}
          />
        )
    }
  }

  return (
    <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* 标题栏 */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold">节点配置</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-800 rounded transition"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 基本信息 */}
      <div className="p-4 border-b border-zinc-800">
        <div className="text-sm text-zinc-400 mb-1">Block 类型</div>
        <div className="font-semibold text-cyan-400">{(nodeData as any).blockName}</div>

        <div className="text-sm text-zinc-400 mt-3 mb-1">节点 ID</div>
        <div className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded">{node.id}</div>

        {nodeData.estimatedDuration !== undefined && (
          <>
            <div className="text-sm text-zinc-400 mt-3 mb-1">预计耗时</div>
            <div className="text-sm">{nodeData.estimatedDuration}秒</div>
          </>
        )}

        {nodeData.cost !== undefined && nodeData.cost > 0 && (
          <>
            <div className="text-sm text-zinc-400 mt-3 mb-1">消耗积分</div>
            <div className="text-sm">{nodeData.cost} 积分</div>
          </>
        )}
      </div>

      {/* 输入配置 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-zinc-400 mb-3">输入参数</h3>

        {nodeData.inputs?.length === 0 ? (
          <div className="text-sm text-zinc-500">此 Block 无需配置参数</div>
        ) : (
          <div className="space-y-4">
            {nodeData.inputs?.map((input: any) => (
              <div key={input.name}>
                <label className="block text-sm font-medium mb-1.5">
                  {input.name}
                  {input.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderInputField(input)}
                {input.description && (
                  <div className="text-xs text-zinc-500 mt-1">{input.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition"
        >
          <Trash2 className="w-4 h-4" />
          删除节点
        </button>
      </div>
    </div>
  )
}
