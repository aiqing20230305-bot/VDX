/**
 * 工作流工具栏
 * 顶部工具栏，提供保存、加载、执行、清空等操作
 */
'use client'

import { useState } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { Play, Save, FolderOpen, Trash2, Download, Upload } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

interface WorkflowToolbarProps {
  workflowName: string
  onNameChange: (name: string) => void
  nodes: Node[]
  edges: Edge[]
  onClear: () => void
}

export function WorkflowToolbar({
  workflowName,
  onNameChange,
  nodes,
  edges,
  onClear,
}: WorkflowToolbarProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<string | null>(null)

  // 保存工作流到本地存储
  const handleSave = () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      savedAt: new Date().toISOString(),
    }

    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '{}')
    savedWorkflows[workflowName] = workflow
    localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows))

    alert(`工作流 "${workflowName}" 已保存`)
  }

  // 导出工作流为 JSON
  const handleExport = () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
    }

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入工作流
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const text = await file.text()
      const workflow = JSON.parse(text)

      // 通知父组件更新（需要扩展 props）
      alert('导入功能需要父组件支持，请在 page.tsx 中添加对应逻辑')
    }
    input.click()
  }

  // 加载工作流列表
  const handleLoad = () => {
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '{}')
    const names = Object.keys(savedWorkflows)

    if (names.length === 0) {
      alert('暂无保存的工作流')
      return
    }

    const choice = prompt(`选择要加载的工作流：\n${names.join('\n')}`)
    if (!choice || !savedWorkflows[choice]) return

    const workflow = savedWorkflows[choice]
    alert('加载功能需要父组件支持，请在 page.tsx 中添加对应逻辑')
  }

  // 执行工作流
  const handleExecute = async () => {
    if (nodes.length === 0) {
      alert('工作流为空，无法执行')
      return
    }

    setIsExecuting(true)
    setExecutionResult(null)

    try {
      // 转换为 API 格式
      const workflowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          blockId: node.data.blockId,
          config: node.data.config || {},
        })),
        edges: edges.map(edge => ({
          from: edge.source,
          to: edge.target,
          outputKey: edge.sourceHandle || 'default',
          inputKey: edge.targetHandle || 'default',
        })),
      }

      // 提示用户输入执行参数
      const inputsStr = prompt('输入执行参数（JSON 格式）：\n例如: {"user_input": "一只猫"}')
      const inputs = inputsStr ? JSON.parse(inputsStr) : {}

      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: workflowData, inputs }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '执行失败')
      }

      const result = await response.json()
      setExecutionResult(`✅ 执行完成！耗时 ${result.execution.duration}ms`)
    } catch (error) {
      setExecutionResult(`❌ 执行失败：${error instanceof Error ? error.message : String(error)}`)
      logger.error('Execution error:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  // 清空画布
  const handleClear = () => {
    if (nodes.length === 0) return
    if (!confirm('确定要清空画布吗？此操作不可恢复。')) return
    onClear()
  }

  return (
    <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-lg shadow-xl px-4 py-2 flex items-center gap-3">
      {/* 工作流名称 */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm font-medium w-48 focus:outline-none focus:border-cyan-500"
        placeholder="工作流名称"
      />

      <div className="h-6 w-px bg-zinc-700" />

      {/* 操作按钮 */}
      <button
        onClick={handleSave}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 rounded text-sm transition"
        title="保存到本地"
      >
        <Save className="w-4 h-4" />
        保存
      </button>

      <button
        onClick={handleLoad}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 rounded text-sm transition"
        title="加载工作流"
      >
        <FolderOpen className="w-4 h-4" />
        加载
      </button>

      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 rounded text-sm transition"
        title="导出为 JSON"
      >
        <Download className="w-4 h-4" />
        导出
      </button>

      <button
        onClick={handleImport}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 rounded text-sm transition"
        title="导入 JSON"
      >
        <Upload className="w-4 h-4" />
        导入
      </button>

      <div className="h-6 w-px bg-zinc-700" />

      {/* 执行按钮 */}
      <button
        onClick={handleExecute}
        disabled={isExecuting || nodes.length === 0}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded text-sm font-medium transition"
      >
        <Play className="w-4 h-4" />
        {isExecuting ? '执行中...' : '执行工作流'}
      </button>

      {/* 清空按钮 */}
      <button
        onClick={handleClear}
        disabled={nodes.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-50 rounded text-sm transition"
        title="清空画布"
      >
        <Trash2 className="w-4 h-4" />
        清空
      </button>

      {/* 统计信息 */}
      <div className="ml-auto text-xs text-zinc-500">
        {nodes.length} 节点 · {edges.length} 连接
      </div>

      {/* 执行结果 */}
      {executionResult && (
        <div className="ml-3 text-sm px-3 py-1.5 bg-zinc-800 rounded">
          {executionResult}
        </div>
      )}
    </div>
  )
}
