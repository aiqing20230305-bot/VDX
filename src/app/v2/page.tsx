'use client'

/**
 * 超级视频Agent v2.0 - SEKO风格主界面
 * 左侧：对话驱动 + 控制面板
 * 右侧：结构化内容展示
 */
import { useState, useCallback, useEffect } from 'react'
import { Sparkles, History, User, Music } from 'lucide-react'
import { useAgentExecutor } from '@/hooks/useAgentExecutor'
import { VideoPlayer } from '@/components/v2/VideoPlayer'
import { AudioPanel } from '@/components/v2/AudioPanel'
import type { Script, Storyboard, VideoJob } from '@/types'

export default function V2HomePage() {
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'
    content: string
  }>>([])
  const [pendingQuestion, setPendingQuestion] = useState<{
    question: string
    options?: Array<{ label: string; value: string }>
  } | null>(null)

  const { sendMessage, isProcessing, currentState } = useAgentExecutor()

  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [videoJob, setVideoJob] = useState<VideoJob | null>(null)
  const [showAudioPanel, setShowAudioPanel] = useState(false)

  // 同步Agent状态到本地
  useEffect(() => {
    if (currentState.currentScript) {
      setSelectedScript(currentState.currentScript)
    }
    if (currentState.currentStoryboard) {
      setStoryboard(currentState.currentStoryboard)
    }
    if (currentState.videoJob) {
      setVideoJob(currentState.videoJob)
    }
  }, [currentState])

  const handleSend = async () => {
    if (!userInput.trim() || isProcessing) return

    const msg = userInput.trim()
    setUserInput('')

    setMessages(prev => [...prev, { role: 'user', content: msg }])

    try {
      const { finalResponse, requiresUserInput } = await sendMessage(msg)

      setMessages(prev => [...prev, { role: 'assistant', content: finalResponse }])

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
    setTimeout(() => handleSend(), 100)
  }

  const handleQuickStart = (prompt: string) => {
    setUserInput(prompt)
    setTimeout(() => handleSend(), 100)
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-zinc-100">
      {/* 左侧：对话区 */}
      <div className="w-[400px] border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">超级视频Agent</h1>
              <p className="text-xs text-zinc-500">AI驱动的视频创作</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-800 rounded transition">
              <History className="w-4 h-4 text-zinc-400" />
            </button>
            <button
              onClick={() => setShowAudioPanel(!showAudioPanel)}
              className={`p-2 hover:bg-zinc-800 rounded transition ${
                showAudioPanel ? 'bg-cyan-500/10 text-cyan-400' : ''
              }`}
            >
              <Music className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-zinc-800 rounded transition">
              <User className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">有什么新的故事灵感？</h2>
              <p className="text-sm text-zinc-500 mb-6">
                AI会为你创意脚本并自动生成视频
              </p>

              <div className="space-y-2 max-w-sm mx-auto">
                <button
                  onClick={() => handleQuickStart('我想做一个15秒的猫咪视频')}
                  className="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm transition"
                >
                  <div className="font-medium mb-1">🐱 猫咪日常</div>
                  <div className="text-xs text-zinc-500">15秒治愈短片</div>
                </button>
                <button
                  onClick={() => handleQuickStart('做个关于日落的短视频')}
                  className="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm transition"
                >
                  <div className="font-medium mb-1">🌅 日落风光</div>
                  <div className="text-xs text-zinc-500">自然风光短片</div>
                </button>
                <button
                  onClick={() => handleQuickStart('帮我想一个创意视频选题')}
                  className="w-full text-left p-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-sm transition"
                >
                  <div className="font-medium mb-1">✨ 让AI推荐</div>
                  <div className="text-xs text-zinc-500">基于热门趋势</div>
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] px-4 py-2 bg-cyan-500 text-white rounded-2xl rounded-tr-sm text-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[90%] px-4 py-2 bg-zinc-900 rounded-2xl rounded-tl-sm text-sm">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-zinc-900 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300" />
                  <span className="ml-2">思考中...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audio Panel */}
        {showAudioPanel && (
          <div className="border-t border-zinc-800 bg-zinc-900/50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Music className="w-4 h-4 text-cyan-400" />
                  音频控制
                </h3>
                <button
                  onClick={() => setShowAudioPanel(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300"
                >
                  收起
                </button>
              </div>
              <AudioPanel />
            </div>
          </div>
        )}

        {/* Pending Question */}
        {pendingQuestion && (
          <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
            <div className="text-sm font-medium mb-2">{pendingQuestion.question}</div>
            {pendingQuestion.options && (
              <div className="flex flex-col gap-2">
                {pendingQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionClick(opt.value)}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-left transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-zinc-800">
          <div className="relative">
            <input
              type="text"
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入你的想法，AI会为你编排生成..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-cyan-500 transition placeholder-zinc-600"
              disabled={isProcessing}
            />
            <button
              onClick={handleSend}
              disabled={isProcessing || !userInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-500 hover:bg-cyan-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg flex items-center justify-center transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            </button>
          </div>
          <div className="text-xs text-zinc-600 mt-2 text-center">
            Shift+Enter 换行 · Enter 发送
          </div>
        </div>
      </div>

      {/* 右侧：内容展示区 */}
      <div className="flex-1 overflow-y-auto">
        {/* Empty State */}
        {!selectedScript && !storyboard && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-zinc-700" />
              </div>
              <h2 className="text-2xl font-bold mb-3">开始创作你的视频</h2>
              <p className="text-zinc-500">
                在左侧输入框告诉我你的想法
                <br />
                AI会自动生成脚本和分镜
              </p>
            </div>
          </div>
        )}

        {/* Script Display */}
        {selectedScript && !storyboard && (
          <div className="p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  脚本已生成
                </div>
                <h2 className="text-3xl font-bold mb-2">{selectedScript.title}</h2>
                <p className="text-zinc-400">{selectedScript.logline}</p>
              </div>

              <div className="space-y-6">
                {selectedScript.scenes.map((scene, i) => (
                  <div key={i} className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-cyan-400 font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-2">{scene.visual}</div>
                        {scene.narration && (
                          <div className="text-sm text-zinc-400 italic">
                            "{scene.narration}"
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-xs text-zinc-600">
                          <span>{scene.duration}秒</span>
                          {scene.cameraMove && <span>• {scene.cameraMove}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Storyboard Display */}
        {storyboard && (
          <div className="p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                分镜已生成
              </div>
              <h2 className="text-3xl font-bold mb-2">分镜板</h2>
              <p className="text-zinc-400">{storyboard.frames.length} 个镜头</p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {storyboard.frames.map((frame, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Image */}
                  <div className="aspect-video bg-zinc-800 relative">
                    {frame.imageUrl ? (
                      <img
                        src={frame.imageUrl}
                        alt={`Frame ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        帧 {i + 1}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-xs font-medium">
                      {i + 1}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="text-sm mb-2 line-clamp-2">{frame.imagePrompt}</div>
                    <div className="text-xs text-zinc-600">
                      第 {frame.index + 1} 帧 · {frame.duration}秒
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video Player */}
        {videoJob && (
          <div className="p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                视频输出
              </div>
              <h2 className="text-3xl font-bold mb-2">视频生成</h2>
              <p className="text-zinc-400">正在处理您的视频</p>
            </div>

            <VideoPlayer job={videoJob} />
          </div>
        )}
      </div>
    </div>
  )
}
