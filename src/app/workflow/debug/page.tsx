'use client'

/**
 * 工作流调试页面
 * 显示详细的执行日志，帮助诊断数据流问题
 */
import { useState } from 'react'

export default function WorkflowDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTest = async () => {
    setIsRunning(true)
    setLogs([])

    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1]}] ${msg}`])

    try {
      addLog('🚀 开始测试：两节点工作流 (input.text -> process.filter)')

      const workflow = {
        nodes: [
          { id: 'n1', blockId: 'input.text', config: {} },
          { id: 'n2', blockId: 'process.filter', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'n1', sourceOutput: 'text', target: 'n2', targetInput: 'prompt' },
        ],
      }

      const inputs = {
        user_input: '一只橙色的猫坐在窗台上'
      }

      addLog(`📦 工作流定义: ${workflow.nodes.length} 节点, ${workflow.edges.length} 边`)
      addLog(`📥 输入: ${JSON.stringify(inputs)}`)

      addLog('📡 发送请求到 /api/workflow/execute...')

      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow, inputs }),
      })

      const data = await response.json()

      if (!response.ok) {
        addLog(`❌ 执行失败: ${data.error}`)
        return
      }

      addLog(`✅ 执行成功！耗时 ${data.execution.duration}ms`)

      // 显示节点执行详情
      data.execution.nodeExecutions.forEach((ne: any) => {
        addLog(``)
        addLog(`📍 节点 ${ne.nodeId} (${ne.blockId}):`)
        addLog(`   状态: ${ne.status}`)
        addLog(`   输入: ${JSON.stringify(ne.inputs || {})}`)
        addLog(`   输出: ${JSON.stringify(ne.outputs || {})}`)
        if (ne.error) {
          addLog(`   ❌ 错误: ${ne.error}`)
        }
        if (ne.duration) {
          addLog(`   ⏱ 耗时: ${ne.duration}ms`)
        }
      })

      addLog(``)
      addLog(`📤 最终输出: ${JSON.stringify(data.execution.outputs)}`)

    } catch (error) {
      addLog(`❌ 请求失败: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">工作流调试器</h1>
          <p className="text-zinc-400">测试节点间数据传递</p>
        </div>

        {/* Control */}
        <div className="mb-6">
          <button
            onClick={runTest}
            disabled={isRunning}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-medium transition"
          >
            {isRunning ? '执行中...' : '运行测试'}
          </button>
        </div>

        {/* Logs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="font-mono text-sm space-y-1 max-h-[600px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-zinc-500">点击"运行测试"开始...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes('❌')
                      ? 'text-red-400'
                      : log.includes('✅')
                      ? 'text-green-400'
                      : log.includes('📍')
                      ? 'text-cyan-400 font-semibold'
                      : 'text-zinc-300'
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-xs text-zinc-500">
          <p>💡 提示：此页面会显示每个节点的输入输出，帮助诊断数据流问题。</p>
          <p className="mt-1">   检查项：节点的输出是否正确保存？下游节点的输入是否正确接收？</p>
        </div>
      </div>
    </div>
  )
}
