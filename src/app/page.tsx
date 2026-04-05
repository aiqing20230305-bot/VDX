'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatInput } from '@/components/chat/ChatInput'
import { RemotionPreview } from '@/components/video/RemotionPreview'
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
  StoryboardFrame,
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
  const [showPreview, setShowPreview] = useState(false)
  /** 上下文状态：记录当前等待的回答类型 */
  const [contextState, setContextState] = useState<{
    type: 'waiting_image_confirmation' | 'waiting_style' | 'waiting_duration' | 'waiting_text_effects' | null
    data?: Record<string, unknown>
  }>({ type: null })
  /** 用户上传的参考图片，按类型分类 */
  const [uploadedRefs, setUploadedRefs] = useState<{
    characters: Array<{ path: string; description: string }>
    products: Array<{ path: string; description: string }>
    scenes: Array<{ path: string; description: string }>
    all: string[]
  }>({ characters: [], products: [], scenes: [], all: [] })
  /** 产品深度分析结果（用于一致性约束） */
  const [productAnalysis, setProductAnalysis] = useState<{
    type: string
    visualPrompt: string
    criticalFeatures: string[]
    negativePrompt: string
    suggestions?: string[]
    renderingRules?: string
  } | null>(null)
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
      // 构建更完整的对话历史（包含最近的交互动作）
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-15) // 增加历史长度
        .map(m => {
          // 如果是 action 类型，简化为文本
          if (m.type === 'action') {
            return { role: m.role as 'user' | 'assistant', content: m.content }
          }
          return { role: m.role as 'user' | 'assistant', content: m.content }
        })
        .filter(m => m.content) // 过滤空内容

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
      style?: string
    }) => {
      const progressId = addMessage({
        role: 'assistant',
        content: '',
        metadata: {
          generation: { stage: 'scripting', startedAt: Date.now() },
        },
      })
      setIsLoading(true)

      try {
        const res = await fetch('/api/script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: params.topic,
            duration: params.duration ?? 30,
            aspectRatio: params.aspectRatio ?? '9:16',
            count: params.count ?? 3,
            images: params.images ?? [],
            style: params.style,
          }),
        })

        const data = (await res.json()) as { scripts?: Script[]; error?: string }
        if (data.error) throw new Error(data.error)
        if (!data.scripts?.length) throw new Error('No scripts returned')

        const newScripts = data.scripts
        setScripts(newScripts)

        // 完成进度条
        updateMessage(progressId, {
          metadata: { generation: { stage: 'done' } },
        })

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
        updateMessage(progressId, {
          metadata: { generation: { stage: 'error', detail: msg } },
        })
        addMessage({ role: 'assistant', content: `脚本生成失败：${msg}。请重试或修改描述。` })
      } finally {
        setIsLoading(false)
      }
    },
    [addMessage]
  )

  const generateStoryboard = useCallback(
    async (script: Script, currentMode: GenerationMode) => {
      const totalFrames = Math.max(3, Math.round(script.duration / 3.5))
      const progressId = addMessage({
        role: 'assistant',
        content: '',
        metadata: {
          generation: {
            stage: 'storyboarding',
            total: totalFrames,
            current: 0,
            detail: `《${script.title}》 · ${totalFrames} 帧`,
            startedAt: Date.now(),
          },
        },
      })
      setIsLoading(true)

      // 阶段1：生成分镜提示词后，进入图片生成阶段
      const stageTimer = setTimeout(() => {
        updateMessage(progressId, {
          metadata: {
            generation: {
              stage: 'generating_images',
              total: totalFrames,
              current: 0,
              detail: `正在用即梦生成 ${totalFrames} 帧分镜图…`,
              startedAt: Date.now(),
            },
          },
        })
      }, 8000)

      try {
        const res = await fetch('/api/storyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            referenceImages: uploadedRefs.all.length > 0 ? uploadedRefs.all : undefined,
            productImages: uploadedRefs.products.length > 0 ? uploadedRefs.products.map(p => p.path) : undefined,
            characterImagePath: uploadedRefs.characters[0]?.path,
            characterDescriptions: uploadedRefs.characters.map(c => c.description),
            productDescriptions: uploadedRefs.products.map(p => p.description),
            productAnalysis: productAnalysis ?? undefined,
          }),
        })

        clearTimeout(stageTimer)

        const data = (await res.json()) as { storyboard?: Storyboard; error?: string }
        if (data.error) throw new Error(data.error)
        if (!data.storyboard) throw new Error('No storyboard returned')

        setStoryboard(data.storyboard)

        // 完成进度
        updateMessage(progressId, {
          metadata: { generation: { stage: 'done' } },
        })

        const filledCount = data.storyboard.frames.filter(f => f.imageUrl).length

        addMessage({
          role: 'assistant',
          type: 'storyboard',
          content: `分镜图完成！共 ${data.storyboard.totalFrames} 帧${filledCount > 0 ? `（${filledCount} 帧已生成图片）` : ''}，覆盖完整 ${script.duration} 秒。接下来选择生成引擎：`,
          metadata: {
            storyboard: data.storyboard,
            aspectRatio: (script.aspectRatio === '9:16' ? '9:16' : '16:9') as '9:16' | '16:9',
            actions: buildPostStoryboardActions(),
          },
        })
      } catch (err) {
        clearTimeout(stageTimer)
        const msg = err instanceof Error ? err.message : '分镜生成失败'
        updateMessage(progressId, {
          metadata: { generation: { stage: 'error', detail: msg } },
        })
        addMessage({ role: 'assistant', content: `分镜图生成失败：${msg}` })
      } finally {
        setIsLoading(false)
      }
    },
    [addMessage, updateMessage, uploadedRefs]
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
    async (action: string, params?: Record<string, unknown>) => {
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
          await streamChat(
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

        case 'select_frames_for_video': {
          // 展示帧选择界面
          const sb = storyboardRef.current
          if (!sb) return

          addMessage({
            role: 'user',
            content: '选择用于生成的帧',
          })

          addMessage({
            role: 'assistant',
            type: 'frame_selector',
            content: '请选择想用的分镜帧：',
            metadata: {
              storyboard: sb,
              aspectRatio: (sb.frames[0]?.imagePrompt?.includes('16:9') ? '16:9' : '9:16') as '9:16' | '16:9',
            },
          })
          break
        }

        case 'generate_video_with_frames': {
          // 使用选中的帧生成视频
          const engine = (params?.engine as 'seedance' | 'kling') ?? 'seedance'
          const frameIndices = (params?.frameIndices as number[]) ?? []
          const sb = storyboardRef.current
          if (!sb || frameIndices.length === 0) return

          addMessage({
            role: 'user',
            content: `使用 ${frameIndices.length} 帧 · ${engine === 'seedance' ? 'Seedance 2.0' : '可灵AI'} 生成`,
          })

          // 创建只包含选中帧的临时 storyboard
          const selectedFrames = frameIndices.map(i => sb.frames[i])
          const filteredStoryboard = {
            ...sb,
            frames: selectedFrames,
            totalFrames: selectedFrames.length,
          }

          const jobId = uuid()
          const job: VideoJob = {
            id: jobId,
            status: 'running',
            progress: 0,
            config: { engine, storyboardId: filteredStoryboard.id },
            logs: [{ timestamp: new Date(), level: 'info', message: `开始生成视频（${selectedFrames.length} 帧）...` }],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          const msgId = addMessage({
            role: 'assistant',
            type: 'video',
            content: '',
            metadata: { videoJob: job },
          })

          simulateVideoProgress(msgId, job, selectedFrames.length, updateMessage)
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

        case 'add_text_effects': {
          const sb = storyboardRef.current
          if (!sb) return

          addMessage({
            role: 'user',
            content: '添加文字效果',
          })

          addMessage({
            role: 'assistant',
            type: 'action',
            content: '选择要添加的文字效果类型：',
            metadata: {
              actions: [
                {
                  id: 'add_subtitles',
                  label: '📝 添加字幕',
                  description: '时间轴同步字幕',
                  action: 'add_subtitles',
                  variant: 'primary',
                },
                {
                  id: 'add_titles',
                  label: '🎬 添加标题动画',
                  description: '6 种动画效果',
                  action: 'add_titles',
                  variant: 'primary',
                },
                {
                  id: 'add_bullets',
                  label: '💬 添加弹幕',
                  description: '右向左滚动弹幕',
                  action: 'add_bullets',
                  variant: 'secondary',
                },
              ],
            },
          })
          break
        }

        case 'add_subtitles':
        case 'add_titles':
        case 'add_bullets': {
          const effectType = action === 'add_subtitles' ? 'subtitles' : action === 'add_titles' ? 'titles' : 'bullets'
          const effectName = action === 'add_subtitles' ? '字幕' : action === 'add_titles' ? '标题动画' : '弹幕'

          addMessage({
            role: 'user',
            content: `添加${effectName}`,
          })

          // 设置上下文状态，等待用户输入文字效果描述
          setContextState({
            type: 'waiting_text_effects',
            data: { effectType },
          })

          addMessage({
            role: 'assistant',
            content: `请描述你想要的${effectName}内容。例如：\n${
              effectType === 'subtitles' ? '- "在视频开始时显示：欢迎来到超级视频"\n- "第3秒到第5秒显示：这是一个测试"' :
              effectType === 'titles' ? '- "在视频开头添加标题：超级视频 v1.3，使用缩放进入效果"\n- "5秒后显示：精彩内容即将呈现"' :
              '- "添加弹幕：666、太酷了、awesome"\n- "在第2秒出现：这个效果真棒"'
            }`,
          })
          break
        }

        case 'preview_text_effects': {
          const sb = storyboardRef.current
          if (!sb) {
            addMessage({
              role: 'assistant',
              content: '⚠️ 请先生成分镜图再预览文字效果',
            })
            return
          }

          addMessage({
            role: 'user',
            content: '预览文字效果',
          })

          // 打开预览模态框
          setShowPreview(true)
          break
        }

        case 'pick_ratio': {
          // Step 1 完成，进入 Step 2: 选时长
          const topic1 = params?.topic as string
          const ratio = params?.aspectRatio as string
          const ratioEmoji = ratio === '9:16' ? '📱' : '🖥️'
          const ratioName = ratio === '9:16' ? '竖屏 9:16' : '横屏 16:9'
          addMessage({ role: 'user', content: `${ratioEmoji} ${ratioName}` })
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '选择视频时长：',
            metadata: {
              actions: [
                { id: 't15', label: '15秒', description: '短视频', action: 'pick_duration', params: { topic: topic1, aspectRatio: ratio, duration: 15 }, variant: 'primary' },
                { id: 't30', label: '30秒', description: '标准短视频', action: 'pick_duration', params: { topic: topic1, aspectRatio: ratio, duration: 30 }, variant: 'primary' },
                { id: 't60', label: '1分钟', action: 'pick_duration', params: { topic: topic1, aspectRatio: ratio, duration: 60 }, variant: 'secondary' },
                { id: 't180', label: '3分钟', action: 'pick_duration', params: { topic: topic1, aspectRatio: ratio, duration: 180 }, variant: 'secondary' },
                { id: 't300', label: '5分钟', action: 'pick_duration', params: { topic: topic1, aspectRatio: ratio, duration: 300 }, variant: 'outline' },
              ],
            },
          })
          break
        }

        case 'pick_duration': {
          // Step 2 完成，进入 Step 3: 选风格
          const topic2 = params?.topic as string
          const dur = params?.duration as number
          const ar = params?.aspectRatio as string
          if (!topic2) break
          const durLabel = dur >= 60 ? `${dur / 60}分钟` : `${dur}秒`
          addMessage({ role: 'user', content: `⏱ ${durLabel}` })
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '选择视频风格：',
            metadata: {
              actions: [
                { id: 's_real', label: '📷 真实写实', description: '真人实拍质感', action: 'pick_style', params: { topic: topic2, aspectRatio: ar, duration: dur, style: 'realistic' }, variant: 'primary' },
                { id: 's_cine', label: '🎬 电影质感', description: '电影级画面', action: 'pick_style', params: { topic: topic2, aspectRatio: ar, duration: dur, style: 'cinematic' }, variant: 'primary' },
                { id: 's_anime', label: '🎨 动漫风格', description: '日系/国漫', action: 'pick_style', params: { topic: topic2, aspectRatio: ar, duration: dur, style: 'anime' }, variant: 'secondary' },
                { id: 's_3d', label: '🧊 3D卡通', description: 'Pixar/皮克斯风', action: 'pick_style', params: { topic: topic2, aspectRatio: ar, duration: dur, style: 'cartoon' }, variant: 'secondary' },
                { id: 's_flat', label: '✏️ 扁平插画', description: '商业插画风', action: 'pick_style', params: { topic: topic2, aspectRatio: ar, duration: dur, style: 'commercial' }, variant: 'outline' },
              ],
            },
          })
          break
        }

        case 'pick_style': {
          // Step 3 完成，展示确认卡片
          const topic3 = params?.topic as string
          const dur3 = params?.duration as number
          const ar3 = params?.aspectRatio as string
          const style3 = params?.style as string
          if (!topic3) break
          const styleLabels: Record<string, string> = { realistic: '📷 真实写实', cinematic: '🎬 电影质感', anime: '🎨 动漫风格', cartoon: '🧊 3D卡通', commercial: '✏️ 扁平插画' }
          const ratioLabel = ar3 === '9:16' ? '📱 竖屏' : '🖥️ 横屏'
          const durLabel3 = dur3 >= 60 ? `${dur3 / 60}分钟` : `${dur3}秒`

          addMessage({ role: 'user', content: styleLabels[style3] ?? style3 })
          addMessage({
            role: 'assistant',
            type: 'action',
            content: `确认创作参数：

**方向**：${ratioLabel}　**时长**：${durLabel3}　**风格**：${styleLabels[style3] ?? style3}

确认无误开始生成，或点击修改单项：`,
            metadata: {
              actions: [
                { id: 'confirm', label: '✅ 确认生成', action: 'confirm_generate', params: { topic: topic3, duration: dur3, aspectRatio: ar3, style: style3 }, variant: 'primary' },
                { id: 'chg_ratio', label: `修改方向`, action: 'pick_ratio', params: { topic: topic3 }, variant: 'outline' },
                { id: 'chg_dur', label: `修改时长`, action: 'pick_duration_only', params: { topic: topic3, aspectRatio: ar3, style: style3 }, variant: 'outline' },
                { id: 'chg_style', label: `修改风格`, action: 'pick_style_only', params: { topic: topic3, aspectRatio: ar3, duration: dur3 }, variant: 'outline' },
              ],
            },
          })
          break
        }

        case 'confirm_generate': {
          const t = params?.topic as string
          const d = params?.duration as number
          const a = params?.aspectRatio as string
          const s = params?.style as string
          if (!t) break
          addMessage({ role: 'user', content: '确认，开始生成' })
          generateScripts({ topic: t, duration: d, aspectRatio: a, count: 3, style: s })
          break
        }

        case 'pick_duration_only': {
          // 只修改时长，其他参数保留
          const topicD = params?.topic as string
          const arD = params?.aspectRatio as string
          const styleD = params?.style as string
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '选择新的时长：',
            metadata: {
              actions: [
                { id: 't15', label: '15秒', action: 'pick_style', params: { topic: topicD, aspectRatio: arD, style: styleD, duration: 15 }, variant: 'secondary' },
                { id: 't30', label: '30秒', action: 'pick_style', params: { topic: topicD, aspectRatio: arD, style: styleD, duration: 30 }, variant: 'secondary' },
                { id: 't60', label: '1分钟', action: 'pick_style', params: { topic: topicD, aspectRatio: arD, style: styleD, duration: 60 }, variant: 'secondary' },
                { id: 't180', label: '3分钟', action: 'pick_style', params: { topic: topicD, aspectRatio: arD, style: styleD, duration: 180 }, variant: 'outline' },
                { id: 't300', label: '5分钟', action: 'pick_style', params: { topic: topicD, aspectRatio: arD, style: styleD, duration: 300 }, variant: 'outline' },
              ],
            },
          })
          break
        }

        case 'pick_style_only': {
          // 只修改风格，其他参数保留
          const topicS = params?.topic as string
          const arS = params?.aspectRatio as string
          const durS = params?.duration as number
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '选择新的风格：',
            metadata: {
              actions: [
                { id: 's1', label: '📷 真实写实', action: 'pick_style', params: { topic: topicS, aspectRatio: arS, duration: durS, style: 'realistic' }, variant: 'secondary' },
                { id: 's2', label: '🎬 电影质感', action: 'pick_style', params: { topic: topicS, aspectRatio: arS, duration: durS, style: 'cinematic' }, variant: 'secondary' },
                { id: 's3', label: '🎨 动漫风格', action: 'pick_style', params: { topic: topicS, aspectRatio: arS, duration: durS, style: 'anime' }, variant: 'secondary' },
                { id: 's4', label: '🧊 3D卡通', action: 'pick_style', params: { topic: topicS, aspectRatio: arS, duration: durS, style: 'cartoon' }, variant: 'secondary' },
                { id: 's5', label: '✏️ 扁平插画', action: 'pick_style', params: { topic: topicS, aspectRatio: arS, duration: durS, style: 'commercial' }, variant: 'outline' },
              ],
            },
          })
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

        case 'regenerate_storyboard': {
          // 重新生成分镜图，支持重新上传参考图
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '重新生成分镜图。你可以：',
            metadata: {
              actions: [
                { id: 'regen_direct', label: '🔄 直接重新生成', description: '使用当前参考图', action: 'do_regenerate_storyboard', variant: 'primary' },
                { id: 'regen_upload', label: '📎 上传新参考图后生成', description: '替换参考图片', action: 'start_regen_with_upload', variant: 'secondary' },
                { id: 'regen_clear', label: '🗑️ 清除参考图重新生成', description: '纯文字分镜', action: 'do_regenerate_storyboard_clear', variant: 'outline' },
              ],
            },
          })
          break
        }

        case 'do_regenerate_storyboard': {
          const script = selectedScriptRef.current
          if (!script) break
          addMessage({ role: 'user', content: '重新生成分镜图' })
          generateStoryboardRef.current(script, mode)
          break
        }

        case 'do_regenerate_storyboard_clear': {
          const script2 = selectedScriptRef.current
          if (!script2) break
          setUploadedRefs({ characters: [], products: [], scenes: [], all: [] })
          addMessage({ role: 'user', content: '清除参考图，重新生成' })
          generateStoryboardRef.current(script2, mode)
          break
        }

        case 'start_regen_with_upload':
          addMessage({
            role: 'assistant',
            content: '请上传新的参考图片（人物/产品/场景），上传后我会自动重新生成分镜图。',
          })
          // 上传图片后，handleSend 中会自动触发
          break

        case 'regenerate_frame': {
          const frameIdx = params?.frameIndex as number
          const frame = params?.frame as StoryboardFrame | undefined
          if (!frame) break

          const msgId = addMessage({
            role: 'assistant',
            content: `正在重新生成第 ${frameIdx + 1} 帧…`,
            metadata: { generation: { stage: 'generating_images', current: 0, total: 1, startedAt: Date.now() } },
          })
          setIsLoading(true)

          try {
            const sb = storyboardRef.current
            if (!sb) throw new Error('分镜数据丢失')

            const ratio: '9:16' | '16:9' = sb.frames[0]?.imagePrompt?.includes('16:9') ? '16:9' : '9:16'
            const productImage = uploadedRefs.products[0]?.path
            const referenceImage = uploadedRefs.all.length > 0 ? uploadedRefs.all[Math.min(frameIdx, uploadedRefs.all.length - 1)] : undefined

            const res = await fetch('/api/storyboard/regenerate-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                frame,
                ratio,
                referenceImage,
                productImage,
              }),
            })

            const data = await res.json() as { imageUrl?: string; error?: string }
            if (data.error) throw new Error(data.error)
            if (!data.imageUrl) throw new Error('未返回图片')

            // 更新分镜帧图片
            const updatedStoryboard: Storyboard = {
              ...sb,
              frames: sb.frames.map((f, i) =>
                i === frameIdx ? { ...f, imageUrl: data.imageUrl } : f
              ),
            }
            setStoryboard(updatedStoryboard)

            updateMessage(msgId, {
              metadata: { generation: { stage: 'done' } },
            })
            addMessage({
              role: 'assistant',
              content: `第 ${frameIdx + 1} 帧重新生成完成！`,
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : '重新生成失败'
            updateMessage(msgId, {
              metadata: { generation: { stage: 'error', detail: msg } },
            })
            addMessage({ role: 'assistant', content: `第 ${frameIdx + 1} 帧重新生成失败：${msg}` })
          } finally {
            setIsLoading(false)
          }
          break
        }

        case 'batch_regenerate_frames':
        case 'regenerate_modified_frames': {
          const frameIndices = (params?.frameIndices as number[]) ?? []
          if (frameIndices.length === 0) break

          const sb = storyboardRef.current
          if (!sb) break

          const isBatch = action === 'batch_regenerate_frames'
          addMessage({ role: 'user', content: `重新生成${isBatch ? '选中' : '修改'}的 ${frameIndices.length} 帧` })

          const msgId = addMessage({
            role: 'assistant',
            content: '正在重新生成修改的分镜帧…',
            metadata: {
              generation: {
                stage: 'generating_images',
                current: 0,
                total: frameIndices.length,
                startedAt: Date.now(),
              },
            },
          })
          setIsLoading(true)

          try {
            const ratio: '9:16' | '16:9' = sb.frames[0]?.imagePrompt?.includes('16:9') ? '16:9' : '9:16'
            const productImage = uploadedRefs.products[0]?.path
            const updatedFrames = [...sb.frames]

            // 批量重新生成
            for (let i = 0; i < frameIndices.length; i++) {
              const idx = frameIndices[i]
              const frame = sb.frames[idx]
              if (!frame) continue

              updateMessage(msgId, {
                metadata: {
                  generation: {
                    stage: 'generating_images',
                    current: i + 1,
                    total: frameIndices.length,
                    detail: `正在生成第 ${idx + 1} 帧…`,
                    startedAt: Date.now(),
                  },
                },
              })

              const referenceImage = uploadedRefs.all.length > 0 ? uploadedRefs.all[Math.min(idx, uploadedRefs.all.length - 1)] : undefined

              const res = await fetch('/api/storyboard/regenerate-frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  frame,
                  ratio,
                  referenceImage,
                  productImage,
                }),
              })

              const data = await res.json() as { imageUrl?: string; error?: string }
              if (data.imageUrl) {
                updatedFrames[idx] = { ...frame, imageUrl: data.imageUrl }
              }
            }

            setStoryboard({ ...sb, frames: updatedFrames })

            updateMessage(msgId, {
              metadata: { generation: { stage: 'done' } },
            })
            addMessage({
              role: 'assistant',
              content: `已完成 ${frameIndices.length} 帧的重新生成！`,
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : '批量生成失败'
            updateMessage(msgId, {
              metadata: { generation: { stage: 'error', detail: msg } },
            })
            addMessage({ role: 'assistant', content: `批量生成失败：${msg}` })
          } finally {
            setIsLoading(false)
          }
          break
        }

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

      // 图片上传 → 保存 + Claude 视觉分析分类 → 与用户确认对齐
      const imageFiles = files?.filter(f => f.type.startsWith('image/'))
      if (imageFiles && imageFiles.length > 0) {
        setIsLoading(true)
        const formData = new FormData()
        for (const f of imageFiles) formData.append('files', f)

        try {
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          const uploadData = (await uploadRes.json()) as {
            files?: Array<{ name: string; url: string; absolutePath: string; category: string; description: string }>
            summary?: { characters: number; products: number; scenes: number }
            productAnalysis?: { type: string; brand?: string; model?: string; visualPrompt: string; criticalFeatures: string[]; negativePrompt: string; suggestions: string[]; renderingRules: string }
            multiViewSuggestion?: string | null
          }

          if (uploadData.files?.length) {
            const chars = uploadData.files.filter(f => f.category === 'character')
            const prods = uploadData.files.filter(f => f.category === 'product')
            const scens = uploadData.files.filter(f => f.category === 'scene')

            setUploadedRefs(prev => ({
              characters: [...prev.characters, ...chars.map(f => ({ path: f.absolutePath, description: f.description }))],
              products: [...prev.products, ...prods.map(f => ({
                path: f.absolutePath,
                description: uploadData.productAnalysis?.visualPrompt ?? f.description,
              }))],
              scenes: [...prev.scenes, ...scens.map(f => ({ path: f.absolutePath, description: f.description }))],
              all: [...prev.all, ...uploadData.files!.map(f => f.absolutePath)],
            }))

            // 保存产品深度分析结果（用于分镜生成时注入约束）
            if (uploadData.productAnalysis) {
              setProductAnalysis(uploadData.productAnalysis)
            }

            // 构建识别结果反馈
            const parts: string[] = []
            if (chars.length) parts.push(`🧑 **${chars.length} 张人物图**\n${chars.map((c, i) => `  ${i + 1}. ${c.description}`).join('\n')}`)
            if (prods.length) {
              const prodParts = [`📦 **${prods.length} 张产品图**`]
              prods.forEach((p, i) => {
                prodParts.push(`  ${i + 1}. ${p.description}`)
              })
              if (uploadData.productAnalysis) {
                const pa = uploadData.productAnalysis
                prodParts.push(`  **关键特征**：${pa.criticalFeatures.join('、')}`)
                if (pa.suggestions?.length) {
                  prodParts.push(`  **AI建议**：${pa.suggestions[0]}`)
                }
              }
              parts.push(prodParts.join('\n'))
            }
            if (scens.length) parts.push(`🏞️ **${scens.length} 张场景图**\n${scens.map((s, i) => `  ${i + 1}. ${s.description}`).join('\n')}`)

            // 展示分析结果，并询问用户确认
            const confirmationMessage = `✅ 已分析 ${uploadData.files.length} 张图片：

${parts.join('\n\n')}

📝 **请确认**：
- 这些分析准确吗？
- 你想突出哪些元素？
- 视频的主题是什么？

💬 你可以直接描述视频创意，或者先修正我的理解。`

            addMessage({
              role: 'assistant',
              content: confirmationMessage,
            })

            // 设置上下文状态：等待用户确认/修正
            setContextState({
              type: 'waiting_image_confirmation',
              data: {
                uploadData,
                userMessage: message,
              },
            })

            // 如果用户同时发送了文字消息，继续处理
            if (message) {
              setIsLoading(false)
              // 不要自动生成，等待用户确认
              return
            }
          }
        } catch {
          console.error('图片上传失败')
        }
        setIsLoading(false)
        return
      }

      // ====== 上下文处理（优先级最高）======
      // 检查是否有等待的上下文回复
      if (contextState.type === 'waiting_image_confirmation' && message) {
        // 用户回复了图片分析确认
        setContextState({ type: null }) // 清除上下文

        // 提取关键信息：用户是想继续生成，还是要修正分析
        const lowerMsg = message.toLowerCase()
        const isConfirmation =
          lowerMsg.includes('对') || lowerMsg.includes('是') || lowerMsg.includes('没错') ||
          lowerMsg.includes('正确') || lowerMsg.includes('准确') || lowerMsg.includes('好') ||
          lowerMsg.includes('可以') || lowerMsg.includes('ok') ||
          (!lowerMsg.includes('不对') && !lowerMsg.includes('错') && message.length < 50) // 短回复 + 没有否定词 = 确认

        if (isConfirmation) {
          // 用户确认，开始生成脚本
          addMessage({
            role: 'assistant',
            content: '好的！基于这些图片，我来生成视频方案。先选择视频方向：',
            type: 'action',
            metadata: {
              actions: [
                { id: 'r_916', label: '📱 竖屏 9:16', description: '抖音/快手/小红书', action: 'pick_ratio', params: { topic: message, aspectRatio: '9:16' }, variant: 'primary' as const },
                { id: 'r_169', label: '🖥️ 横屏 16:9', description: 'B站/YouTube', action: 'pick_ratio', params: { topic: message, aspectRatio: '16:9' }, variant: 'secondary' as const },
              ],
            },
          })
          return
        } else {
          // 用户要修正/补充，继续对话
          await streamChat(
            `用户上传了图片，我的分析是：${JSON.stringify(contextState.data)}。用户说："${message}"。请理解用户的修正意图，并继续引导生成视频。`
          )
          return
        }
      }

      // 处理文字效果输入
      if (contextState.type === 'waiting_text_effects' && message) {
        const effectType = contextState.data?.effectType as 'subtitles' | 'titles' | 'bullets'
        const effectName = effectType === 'subtitles' ? '字幕' : effectType === 'titles' ? '标题动画' : '弹幕'
        const sb = storyboardRef.current

        if (!sb) {
          addMessage({
            role: 'assistant',
            content: '需要先生成分镜才能添加文字效果哦',
          })
          setContextState({ type: null })
          return
        }

        setIsLoading(true)
        setContextState({ type: null }) // 清除上下文

        try {
          // 调用文字效果 API
          const res = await fetch('/api/text-effects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storyboard: sb,
              userRequest: message,
              effectType,
            }),
          })

          const data = await res.json() as {
            storyboard?: Storyboard
            summary?: string
            error?: string
          }

          if (data.error) {
            throw new Error(data.error)
          }

          if (data.storyboard) {
            // 更新 storyboard
            setStoryboard(data.storyboard)

            addMessage({
              role: 'assistant',
              content: `✅ ${effectName}已添加成功！\n\n${data.summary}\n\n💡 提示：现在可以使用 Remotion 引擎渲染带文字效果的视频。`,
              metadata: {
                actions: [
                  {
                    id: 'preview_effects',
                    label: '👀 预览效果',
                    description: '在浏览器中预览',
                    action: 'preview_text_effects',
                    variant: 'primary' as const,
                  },
                  {
                    id: 'gen_remotion',
                    label: '🎬 生成视频（Remotion）',
                    description: '渲染带文字效果的视频',
                    action: 'generate_video',
                    params: { engine: 'remotion' },
                    variant: 'primary' as const,
                  },
                  {
                    id: 'add_more',
                    label: '➕ 继续添加文字效果',
                    action: 'add_text_effects',
                    variant: 'secondary' as const,
                  },
                ],
              },
            })
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          addMessage({
            role: 'assistant',
            content: `❌ ${effectName}添加失败：${msg}\n\n请尝试更具体的描述，例如指定时间、位置等信息。`,
          })
        } finally {
          setIsLoading(false)
        }
        return
      }

      // Storyboard modification detection
      // 策略：有分镜时，优先尝试解析修改意图（让 Claude 判断）
      if (storyboard && message.length > 3) {
        // 快速排除明显不是修改的意图
        const nonModificationPatterns = [
          /^(谢谢|好的|明白|知道了|收到)$/,
          /^(什么|为什么|怎么|如何|能不能|可以吗)/,
          /生成视频/,
          /下一步/,
        ]
        const isDefinitelyNotModification = nonModificationPatterns.some(p => p.test(message))

        if (!isDefinitelyNotModification) {
          // 让 Claude 智能判断是否为修改意图
          const isModification = true // 默认尝试解析

          if (isModification) {
            setIsLoading(true)
            try {
              const res = await fetch('/api/storyboard/modify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage: message, storyboard }),
              })
              const data = await res.json() as {
                isModification?: boolean
                intent?: { type: string; frameIndices?: number[]; dimension: string; description: string; modification: string }
                storyboard?: Storyboard
                affectedFrames?: number[]
                message?: string
                error?: string
              }

              if (data.error) throw new Error(data.error)

              if (data.isModification && data.storyboard && data.intent) {
                setStoryboard(data.storyboard)
                const frameInfo = data.intent.type === 'all_frames'
                  ? '所有帧'
                  : `第 ${data.affectedFrames!.map(i => i + 1).join('、')} 帧`

                addMessage({
                  role: 'assistant',
                  content: `✅ 已应用修改：${data.intent.description}（${frameInfo}）\n\n修改内容：${data.intent.modification}\n\n💡 提示词已更新，点击下方按钮重新生成查看效果。`,
                  metadata: {
                    actions: [
                      {
                        id: 'regen_modified',
                        label: '🔄 重新生成修改的帧',
                        description: `重新生成 ${frameInfo}`,
                        action: 'regenerate_modified_frames',
                        params: { frameIndices: data.affectedFrames },
                        variant: 'primary' as const,
                      },
                    ],
                  },
                })
                setIsLoading(false)
                return
              } else if (!data.isModification) {
                // Claude 判断不是修改意图，fallback 到正常对话
                setIsLoading(false)
                // 继续往下走，进入正常聊天流程
              } else if (data.message) {
                addMessage({ role: 'assistant', content: data.message })
                setIsLoading(false)
                return
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : '修改失败'
              addMessage({ role: 'assistant', content: `修改失败：${msg}。请重新描述修改意图。` })
              setIsLoading(false)
              return
            }
          }
        }
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

        // 检查是否有分钟时长
        const minuteMatch = message.match(/(\d+)\s*分钟/)

        // 如果缺少关键信息，分步问询
        if (!durationMatch && !minuteMatch && !hasRatio) {
          // Step 1: 选画面方向
          addMessage({
            role: 'assistant',
            type: 'action',
            content: '好的主题！先选择视频方向：',
            metadata: {
              actions: [
                { id: 'r_916', label: '📱 竖屏 9:16', description: '抖音/快手/TikTok/小红书', action: 'pick_ratio', params: { topic: message, aspectRatio: '9:16' }, variant: 'primary' },
                { id: 'r_169', label: '🖥️ 横屏 16:9', description: 'B站/YouTube/公众号', action: 'pick_ratio', params: { topic: message, aspectRatio: '16:9' }, variant: 'secondary' },
              ],
            },
          })
          return
        }

        const duration = minuteMatch
          ? parseInt(minuteMatch[1]) * 60
          : durationMatch ? parseInt(durationMatch[1]) : 30
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
    [addMessage, streamChat, generateScripts, setIsLoading, storyboard, uploadedRefs, setStoryboard, contextState, setContextState]
  )

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-[#f5f5f7] relative overflow-hidden">
      {/* 背景网格效果 */}
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      {/* Header - 玻璃态设计 */}
      <header className="relative flex-shrink-0 px-6 py-4 glass border-b border-white/10 flex items-center gap-4 z-10">
        {/* Logo */}
        <div className="relative group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-neon animate-neon-pulse">
            ✦
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 opacity-0 group-hover:opacity-50 blur-xl transition-opacity" />
        </div>

        {/* 品牌信息 */}
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-gradient">超级视频Agent</h1>
          <p className="text-xs text-zinc-400">AI视频生产力OS</p>
        </div>

        {/* 状态指示器 */}
        <div className="ml-auto flex items-center gap-3">
          <div className="glass px-3 py-1.5 rounded-full flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isLoading
                  ? 'bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
              }`}
            />
            <span className="text-xs font-medium text-zinc-300">
              {isLoading ? '生成中…' : '就绪'}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="relative flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} onAction={handleAction} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-neon">
              ✦
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-5 py-3 flex gap-1.5 items-center border border-white/10">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full animate-bounce"
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

      {/* Remotion Preview Modal */}
      {showPreview && storyboard && (
        <RemotionPreview
          storyboard={storyboard}
          onClose={() => setShowPreview(false)}
          onSave={(updatedStoryboard) => {
            setStoryboard(updatedStoryboard)
            setShowPreview(false)
            addMessage({
              role: 'assistant',
              content: '✅ 预览已保存，可以继续编辑或渲染完整视频！',
              metadata: {
                actions: [
                  {
                    id: 'preview_effects',
                    label: '👀 继续预览',
                    action: 'preview_text_effects',
                    variant: 'secondary',
                  },
                  {
                    id: 'generate_video',
                    label: '🎬 生成视频（Remotion）',
                    action: 'generate_video',
                    params: { engine: 'remotion' },
                    variant: 'primary',
                  },
                ],
              },
            })
          }}
        />
      )}
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

      // ⚠️ 注意：这只是进度条模拟，不代表真实视频已生成
      // 真实场景下需要等待服务端返回真实的视频URL
      updateMessage(msgId, {
        metadata: {
          videoJob: {
            ...job,
            status: 'running', // 保持 running 状态
            progress: 100,
            // ❌ 不设置 outputUrl，因为视频还没真正生成
            logs: [
              ...job.logs,
              {
                timestamp: new Date(),
                level: 'info' as const,
                message: `分镜处理完成（${totalFrames} 帧），正在合成视频...`,
              },
            ],
          },
        },
      })

      // TODO: 这里应该调用真实的视频生成API，等待完成后再更新为 completed 状态
      // 暂时不显示下载按钮，避免误导用户
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
