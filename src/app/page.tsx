'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { TokenStats } from '@/components/TokenStats'
import {
  buildWelcomeMessage,
  buildScriptSelectionActions,
  buildPostStoryboardActions,
  buildModeSelectionActions,
} from '@/lib/ai/chat-actions'
import type {
  ChatMessage as ChatMessageType,
  Script,
  Storyboard,
  VideoJob,
  VideoAnalysis,
  GenerationMode,
} from '@/types'
import { v4 as uuid } from 'uuid'

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [mode, setMode] = useState<GenerationMode>('step-by-step')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    setMessages([buildWelcomeMessage()])
  }, [])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = useCallback(
    (msg: Partial<ChatMessageType> & { role: ChatMessageType['role'] }): string => {
      const full: ChatMessageType = {
        id: uuid(),
        type: 'text',
        content: '',
        createdAt: new Date(),
        ...msg,
      }
      setMessages(prev => [...prev, full])
      return full.id
    },
    []
  )

  const updateMessage = useCallback((id: string, update: Partial<ChatMessageType>) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...update } : m)))
  }, [])

  const streamChat = useCallback(
    async (userMessage: string, context?: string) => {
      const history = messages
        .filter(m => m.role !== 'system' && m.type === 'text')
        .slice(-10)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const assistantId = addMessage({ role: 'assistant', content: '' })
      setIsLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, history, context }),
        })

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

          for (const line of lines) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data) as { text?: string; error?: string }
              if (parsed.text) {
                accumulated += parsed.text
                updateMessage(assistantId, { content: accumulated })
              }
            } catch {
              // skip parse errors
            }
          }
        }
      } finally {
        setIsLoading(false)
      }
    },
    [messages, addMessage, updateMessage]
  )

  const generateScripts = useCallback(
    async (params: {
      topic?: string
      duration?: number
      aspectRatio?: string
      count?: number
      images?: string[]
    }) => {
      addMessage({
        role: 'assistant',
        content: '正在生成多个创意脚本方案，请稍候…',
        metadata: { progress: { value: 10, label: '分析选题，发散创意…' } },
      })
      setIsLoading(true)

      try {
        const res = await fetch('/api/script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: params.topic,
            duration: params.duration ?? 30,
            aspectRatio: params.aspectRatio ?? '16:9',
            count: params.count ?? 3,
            images: params.images ?? [],
          }),
        })

        const data = (await res.json()) as { scripts?: Script[]; error?: string }
        if (data.error) throw new Error(data.error)
        if (!data.scripts?.length) throw new Error('No scripts returned')

        const newScripts = data.scripts
        setScripts(newScripts)

        addMessage({
          role: 'assistant',
          type: 'action',
          content: `生成了 ${newScripts.length} 个创意方案！选择你喜欢的，或者让我重新发散：`,
          metadata: {
            actions: buildScriptSelectionActions(newScripts.length),
          },
        })

        for (const script of newScripts) {
          addMessage({ role: 'assistant', type: 'script', content: '', metadata: { script } })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成失败'
        addMessage({ role: 'assistant', content: `脚本生成失败：${msg}。请重试或修改描述。` })
      } finally {
        setIsLoading(false)
      }
    },
    [addMessage]
  )

  const generateStoryboard = useCallback(
    async (script: Script, currentMode: GenerationMode) => {
      addMessage({
        role: 'assistant',
        content: `好的，为《${script.title}》生成分镜图中…`,
        metadata: { progress: { value: 20, label: '分析脚本结构…' } },
      })
      setIsLoading(true)

      try {
        const res = await fetch('/api/storyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script }),
        })

        const data = (await res.json()) as { storyboard?: Storyboard; error?: string }
        if (data.error) throw new Error(data.error)
        if (!data.storyboard) throw new Error('No storyboard returned')

        setStoryboard(data.storyboard)

        addMessage({
          role: 'assistant',
          type: 'storyboard',
          content: `分镜图完成！共 ${data.storyboard.totalFrames} 帧，覆盖完整 ${script.duration} 秒。接下来选择生成引擎：`,
          metadata: {
            storyboard: data.storyboard,
            actions: buildPostStoryboardActions(),
          },
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : '分镜生成失败'
        addMessage({ role: 'assistant', content: `分镜图生成失败：${msg}` })
      } finally {
        setIsLoading(false)
      }
    },
    [addMessage]
  )

  // Use ref to allow handleAction to call generateStoryboard without stale closure
  const generateStoryboardRef = useRef(generateStoryboard)
  generateStoryboardRef.current = generateStoryboard
  const selectedScriptRef = useRef(selectedScript)
  selectedScriptRef.current = selectedScript
  const storyboardRef = useRef(storyboard)
  storyboardRef.current = storyboard
  const scriptsRef = useRef(scripts)
  scriptsRef.current = scripts

  const handleAction = useCallback(
    (action: string, params?: Record<string, unknown>) => {
      switch (action) {
        case 'start_from_topic':
          addMessage({
            role: 'assistant',
            content:
              '请描述你的视频选题。可以告诉我：主题是什么？大概多长时间？目标平台（抖音/B站/横屏等）？',
          })
          break

        case 'start_from_images':
          addMessage({
            role: 'assistant',
            content:
              '请上传你的参考图片（最多10张），然后告诉我：这些图片想表达什么？视频时长？',
          })
          break

        case 'start_from_video':
          addMessage({
            role: 'assistant',
            content:
              '请上传你想二创的视频文件，我会深度分析所有元素，然后问你想怎么改。',
          })
          break

        case 'suggest_topics':
          streamChat(
            '帮我推荐5个当前最有传播力的短视频选题，每个给出简单说明和适合的风格'
          )
          break

        case 'select_script': {
          const idx = (params?.index as number) ?? 0
          const script = scriptsRef.current[idx]
          if (!script) return
          setSelectedScript(script)
          addMessage({
            role: 'user',
            content: `选择方案 ${['A', 'B', 'C', 'D', 'E'][idx] ?? idx + 1}：${script.title}`,
          })
          addMessage({
            role: 'assistant',
            type: 'action',
            content: `选好了！《${script.title}》\n\n选择创作模式：`,
            metadata: { actions: buildModeSelectionActions() },
          })
          break
        }

        case 'set_mode': {
          const newMode = (params?.mode as GenerationMode) ?? 'step-by-step'
          setMode(newMode)
          const script = selectedScriptRef.current
          if (!script) return
          addMessage({
            role: 'user',
            content: newMode === 'auto' ? '全自动模式' : '步骤审核模式',
          })
          addMessage({
            role: 'assistant',
            content:
              newMode === 'auto'
                ? '全自动模式开启！将自动完成：分镜 → 视频生成。我来搞定！'
                : '步骤审核模式，每个环节我都会等你确认。先来生成分镜图：',
          })
          generateStoryboardRef.current(script, newMode)
          break
        }

        case 'generate_video': {
          const engine = (params?.engine as string) ?? 'seedance'
          const sb = storyboardRef.current
          if (!sb) return

          addMessage({
            role: 'user',
            content: `使用 ${engine === 'seedance' ? 'Seedance 2.0' : '可灵AI'} 生成`,
          })

          const jobId = uuid()
          const job: VideoJob = {
            id: jobId,
            status: 'running',
            progress: 0,
            config: { engine: engine as VideoJob['config']['engine'], storyboardId: sb.id },
            logs: [{ timestamp: new Date(), level: 'info', message: '开始生成视频...' }],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const msgId = addMessage({
            role: 'assistant',
            type: 'video',
            content: '',
            metadata: { videoJob: job },
          })

          // Simulate progress updates (real pipeline would use job polling)
          simulateVideoProgress(msgId, job, sb.totalFrames, updateMessage)
          break
        }

        case 'gen_with_params': {
          const topic = params?.topic as string
          const duration = params?.duration as number
          const aspectRatio = params?.aspectRatio as string
          if (!topic) break
          const ratioLabel = aspectRatio === '9:16' ? '竖屏' : aspectRatio === '1:1' ? '方形' : '横屏'
          addMessage({ role: 'user', content: `${duration}秒 · ${ratioLabel}` })
          generateScripts({ topic, duration, aspectRatio, count: 3 })
          break
        }

        case 'regenerate_scripts':
          addMessage({
            role: 'assistant',
            content:
              '好的，告诉我调整方向，比如想换个风格或者换个角度？或者直接让我重新发散：',
          })
          break

        default:
          break
      }
    },
    [addMessage, streamChat, updateMessage]
  )

  const handleSend = useCallback(
    async (message: string, files?: File[]) => {
      if (!message && (!files || files.length === 0)) return

      const displayMsg = message || (files?.map(f => f.name).join(', ') ?? '')
      addMessage({ role: 'user', content: displayMsg })

      // Video upload → analysis
      const videoFile = files?.find(f => f.type.startsWith('video/'))
      if (videoFile) {
        addMessage({
          role: 'assistant',
          content: `正在分析视频《${videoFile.name}》，提取所有元素…`,
          metadata: { progress: { value: 5, label: '上传中…' } },
        })
        setIsLoading(true)

        const formData = new FormData()
        formData.append('video', videoFile)

        try {
          const res = await fetch('/api/analyze', { method: 'POST', body: formData })
          const data = (await res.json()) as { analysis?: VideoAnalysis; error?: string }

          if (data.analysis) {
            const a = data.analysis
            addMessage({
              role: 'assistant',
              type: 'action',
              content: `视频分析完成！发现 ${a.elements.length} 个元素，${a.sceneDescriptions.length} 个场景。

**风格**：${a.style}
**情绪**：${a.moodBoard.slice(0, 3).join('、')}

**AI建议的二创方向**：
${a.suggestedEdits
  .slice(0, 3)
  .map((s, i) => `${i + 1}. ${s}`)
  .join('\n')}

你想怎么二创？可以描述修改方向，也可以直接选以上建议。`,
              metadata: {
                actions: a.suggestedEdits.slice(0, 3).map((edit, i) => ({
                  id: `edit_${i}`,
                  label: `方向${i + 1}`,
                  description: edit,
                  action: 'secondary_creation',
                  params: { suggestion: edit },
                  variant: 'secondary' as const,
                })),
              },
            })
          }
        } catch {
          addMessage({ role: 'assistant', content: '视频分析失败，请确认视频格式正确' })
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Script generation intent detection
      const lower = message.toLowerCase()
      const isScriptIntent =
        lower.includes('生成') ||
        lower.includes('做') ||
        lower.includes('创作') ||
        lower.includes('视频') ||
        lower.includes('脚本') ||
        lower.includes('想拍') ||
        lower.includes('题材') ||
        lower.includes('选题') ||
        lower.includes('创意') ||
        lower.includes('拍摄')

      if (isScriptIntent && message.length > 5) {
        // 检查用户是否已提供时长和比例信息
        const durationMatch = message.match(/(\d+)\s*秒/)
        const hasRatio =
          lower.includes('9:16') || lower.includes('16:9') || lower.includes('1:1') ||
          lower.includes('竖') || lower.includes('横') ||
          lower.includes('抖音') || lower.includes('tiktok') || lower.includes('b站')

        // 如果缺少关键信息，先问询
        if (!durationMatch && !hasRatio) {
          addMessage({
            role: 'assistant',
            type: 'action',
            content: `好的主题！在生成创意脚本前，确认几个参数：

**视频时长？**
**画面比例？**（决定目标平台）`,
            metadata: {
              actions: [
                { id: 'd15_916', label: '15秒 · 竖屏', description: '抖音/快手', action: 'gen_with_params', params: { topic: message, duration: 15, aspectRatio: '9:16' }, variant: 'primary' },
                { id: 'd30_916', label: '30秒 · 竖屏', description: '短视频', action: 'gen_with_params', params: { topic: message, duration: 30, aspectRatio: '9:16' }, variant: 'secondary' },
                { id: 'd30_169', label: '30秒 · 横屏', description: 'B站/YouTube', action: 'gen_with_params', params: { topic: message, duration: 30, aspectRatio: '16:9' }, variant: 'secondary' },
                { id: 'd60_169', label: '60秒 · 横屏', description: '长视频', action: 'gen_with_params', params: { topic: message, duration: 60, aspectRatio: '16:9' }, variant: 'outline' },
                { id: 'd15_11', label: '15秒 · 方形', description: '小红书/Instagram', action: 'gen_with_params', params: { topic: message, duration: 15, aspectRatio: '1:1' }, variant: 'outline' },
              ],
            },
          })
          return
        }

        const duration = durationMatch ? parseInt(durationMatch[1]) : 30
        const is916 =
          lower.includes('9:16') || lower.includes('竖') ||
          lower.includes('抖音') || lower.includes('短视频') || lower.includes('tiktok')
        const is11 = lower.includes('1:1') || lower.includes('方') || lower.includes('小红书')

        await generateScripts({
          topic: message,
          duration,
          aspectRatio: is11 ? '1:1' : is916 ? '9:16' : '16:9',
          count: 3,
        })
        return
      }

      // Default: chat
      await streamChat(message)
    },
    [addMessage, streamChat, generateScripts, setIsLoading]
  )

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          ✦
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">超级视频Agent</h1>
          <p className="text-xs text-zinc-500">AI视频生产力OS</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <TokenStats />
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading ? 'bg-violet-400 animate-pulse' : 'bg-green-500'
              }`}
            />
            <span className="text-xs text-zinc-500">{isLoading ? '生成中…' : '就绪'}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} onAction={handleAction} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              ✦
            </div>
            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}

// Simulate video generation progress for demo/development
function simulateVideoProgress(
  msgId: string,
  job: VideoJob,
  totalFrames: number,
  updateMessage: (id: string, update: Partial<ChatMessageType>) => void
) {
  let progress = 0
  let frame = 0

  const interval = setInterval(() => {
    progress += Math.random() * 6 + 2
    frame = Math.min(Math.floor((progress / 100) * totalFrames), totalFrames)

    if (progress >= 100) {
      progress = 100
      clearInterval(interval)

      updateMessage(msgId, {
        metadata: {
          videoJob: {
            ...job,
            status: 'completed',
            progress: 100,
            outputUrl: '/outputs/demo.mp4',
            logs: [
              ...job.logs,
              {
                timestamp: new Date(),
                level: 'info' as const,
                message: `视频生成完成，共 ${totalFrames} 帧`,
              },
            ],
          },
        },
      })
      return
    }

    updateMessage(msgId, {
      metadata: {
        videoJob: {
          ...job,
          status: 'running',
          progress: Math.round(progress),
          logs: [
            ...job.logs,
            {
              timestamp: new Date(),
              level: 'info' as const,
              message: `正在生成第 ${frame}/${totalFrames} 帧…`,
            },
          ],
        },
      },
    })
  }, 1500)
}
