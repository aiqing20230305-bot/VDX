'use client'

/**
 * Agent 智能服务测试页面
 * 验证对话式自动化视频生成
 */
import { useState } from 'react'
import { useAgentExecutor } from '@/hooks/useAgentExecutor'

export default function AgentTestPage() {
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
  }>>([])
  const [pendingQuestion, setPendingQuestion] = useState<{
    question: string
    options?: Array<{ label: string; value: string }>
  } | null>(null)

  const { sendMessage, isProcessing, currentState, logs } = useAgentExecutor()

  const handleSend = async () => {
    if (!userInput.trim() || isProcessing) return

    const msg = userInput.trim()
    setUserInput('')

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: msg }])

    try {
      const { finalResponse, requiresUserInput } = await sendMessage(msg)

      // 添加Agent响应
      setMessages(prev => [...prev, { role: 'assistant', content: finalResponse }])

      // 检查是否需要用户输入
      if (requiresUserInput) {
        setPendingQuestion(requiresUserInput)
      } else {
        setPendingQuestion(null)
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ 错误：${error instanceof Error ? error.message : String(error)}`,
        },
      ])
    }
  }

  const handleOptionClick = (value: string) => {
    setUserInput(value)
    setPendingQuestion(null)
    // 自动发送
    setTimeout(() => {
      const btn = document.getElementById('send-btn')
      btn?.click()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* 左侧：对话区 */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-cyan-400">🤖 超级视频Agent</h1>
          <p className="text-sm text-zinc-400 mt-1">
            智能对话式视频生成 - 说出你的想法，AI自动完成
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <p className="mb-4">👋 试试这些：</p>
              <div className="space-y-2">
                <button
                  onClick={() => setUserInput('我想做一个15秒的猫咪视频')}
                  className="block mx-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition"
                >
                  我想做一个15秒的猫咪视频
                </button>
                <button
                  onClick={() => setUserInput('做个关于日落的短视频')}
                  className="block mx-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition"
                >
                  做个关于日落的短视频
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300" />
                  <span className="ml-2 text-sm">Agent 思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pending Question */}
        {pendingQuestion && (
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
            <div className="text-sm font-medium mb-2">{pendingQuestion.question}</div>
            {pendingQuestion.options && (
              <div className="flex flex-wrap gap-2">
                {pendingQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt.value)}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-sm font-medium transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-zinc-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="告诉我你想做什么视频..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-4 py-3 focus:outline-none focus:border-cyan-500"
              disabled={isProcessing}
            />
            <button
              id="send-btn"
              onClick={handleSend}
              disabled={isProcessing || !userInput.trim()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-700 disabled:text-zinc-500 rounded font-medium transition"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* 右侧：状态和日志 */}
      <div className="w-96 border-l border-zinc-800 flex flex-col">
        {/* Current State */}
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">当前状态</h3>

          {currentState.currentScript && (
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-xs text-green-400 font-medium">✓ 脚本已选择</div>
              <div className="text-xs text-zinc-400 mt-1">
                {currentState.currentScript.scenes.length} 个场景
              </div>
            </div>
          )}

          {currentState.currentStoryboard && (
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-xs text-green-400 font-medium">✓ 分镜已生成</div>
              <div className="text-xs text-zinc-400 mt-1">
                {currentState.currentStoryboard.frames.length} 帧
              </div>
            </div>
          )}

          {currentState.videoJob && (
            <div className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded">
              <div className="text-xs text-green-400 font-medium">✓ 视频生成中</div>
              <div className="text-xs text-zinc-400 mt-1">
                任务ID: {currentState.videoJob.id?.slice(0, 8)}...
              </div>
            </div>
          )}

          {!currentState.currentScript &&
            !currentState.currentStoryboard &&
            !currentState.videoJob && (
              <div className="text-xs text-zinc-500">尚未开始</div>
            )}
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-zinc-400 mb-3">执行日志</h3>
          <div className="font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <div className="text-zinc-600">等待操作...</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes('❌')
                      ? 'text-red-400'
                      : log.includes('✅')
                      ? 'text-green-400'
                      : log.includes('🔧')
                      ? 'text-cyan-400'
                      : 'text-zinc-400'
                  }
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
