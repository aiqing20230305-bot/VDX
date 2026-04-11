'use client'

/**
 * Building Blocks 测试页面
 * 用于测试工作流执行和 Block 系统
 */
import { useState, useEffect } from 'react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  nodeCount: number
  edgeCount: number
}

interface Block {
  id: string
  name: string
  category: string
  description: string
  icon?: string
  inputs: any[]
  outputs: any[]
  estimatedDuration: number
  cost?: number
}

export default function TestBlocksPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [executing, setExecuting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  // 加载模板列表
  useEffect(() => {
    fetch('/api/workflow/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(err => console.error('Failed to load templates:', err))
  }, [])

  // 加载 Blocks 列表
  useEffect(() => {
    fetch('/api/blocks/list')
      .then(res => res.json())
      .then(data => setBlocks(data.blocks || []))
      .catch(err => console.error('Failed to load blocks:', err))
  }, [])

  // 执行工作流
  const handleExecute = async () => {
    if (!selectedTemplate) {
      setError('请选择模板')
      return
    }

    setExecuting(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          inputs,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Execution failed')
      }

      setResult(data.execution)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setExecuting(false)
    }
  }

  // 按分类分组 Blocks
  const blocksByCategory = blocks.reduce((acc, block) => {
    if (!acc[block.category]) acc[block.category] = []
    acc[block.category].push(block)
    return acc
  }, {} as Record<string, Block[]>)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-cyan-400">Building Blocks 测试</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：模板选择和执行 */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h2 className="text-2xl font-semibold mb-4">工作流模板</h2>

              <div className="space-y-3">
                {templates.map(template => (
                  <label
                    key={template.id}
                    className={`block p-4 rounded border cursor-pointer transition ${
                      selectedTemplate === template.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mr-3"
                    />
                    <div className="inline-block">
                      <div className="font-semibold">{template.name}</div>
                      <div className="text-sm text-zinc-400">{template.description}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {template.nodeCount} 节点 · {template.edgeCount} 连接
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3">输入参数</h3>
                <textarea
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 font-mono text-sm"
                  rows={6}
                  placeholder='输入 JSON 格式参数，例如：\n{\n  "user_input": "智能手表产品介绍",\n  "uploaded_images": [{"url": "/uploads/watch.jpg"}]\n}'
                  value={JSON.stringify(inputs, null, 2)}
                  onChange={(e) => {
                    try {
                      setInputs(JSON.parse(e.target.value))
                    } catch {}
                  }}
                />
              </div>

              <button
                onClick={handleExecute}
                disabled={executing || !selectedTemplate}
                className="mt-4 w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded transition"
              >
                {executing ? '执行中...' : '执行工作流'}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded text-red-400">
                  {error}
                </div>
              )}

              {result && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500 rounded">
                  <div className="font-semibold text-green-400 mb-2">执行成功</div>
                  <div className="text-sm space-y-1">
                    <div>状态: {result.status}</div>
                    <div>耗时: {result.duration}ms</div>
                    <div>成本: {result.totalCost} 积分</div>
                    <div>节点数: {result.nodeExecutions.length}</div>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-cyan-400">查看详情</summary>
                    <pre className="mt-2 text-xs bg-zinc-800 p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：Blocks 列表 */}
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <h2 className="text-2xl font-semibold mb-4">可用 Blocks ({blocks.length})</h2>

            <div className="space-y-4">
              {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                <div key={category}>
                  <h3 className="font-semibold text-cyan-400 mb-2 capitalize">{category}</h3>
                  <div className="space-y-2">
                    {categoryBlocks.map(block => (
                      <div
                        key={block.id}
                        className="p-3 bg-zinc-800 rounded border border-zinc-700 hover:border-zinc-600 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{block.name}</div>
                            <div className="text-xs text-zinc-400 mt-1">{block.description}</div>
                            <div className="text-xs text-zinc-500 mt-2">
                              {block.inputs.length} 输入 · {block.outputs.length} 输出
                              {block.estimatedDuration > 0 && ` · ~${block.estimatedDuration}s`}
                              {block.cost && ` · ${block.cost} 积分`}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
