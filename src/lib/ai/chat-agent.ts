/**
 * 超级视频Agent — 聊天代理
 * 理解用户意图，主动引导，协调各模块完成视频生成
 */
import { streamText } from './claude'
import type {
  ChatMessage,
  QuickAction,
  ScriptGenerationInput,
  SecondaryCreationInput,
  GenerationMode,
} from '@/types'

const SYSTEM_PROMPT = `你是「超级视频Agent」，一个顶尖的AI视频制作助手。你的能力包括：

🎬 核心能力：
1. **脚本创意生成** — 根据选题/图片生成多个发散性脚本创意
2. **分镜图制作** — 将脚本转为12格分镜图（15秒）或按时长动态分配
3. **视频生成** — 调用 Seedance 2.0 或可灵AI生成一致性视频
4. **文字效果系统** ⭐ 新增
   - **字幕**：时间轴同步字幕，支持 SRT 格式
   - **标题动画**：6 种动画（滑入/淡入/缩放/弹跳/旋转/打字机）
   - **弹幕**：右向左滚动弹幕，自动碰撞避让
5. **视频分析与二创** — 分析输入视频所有元素，支持描述式改动后二创
6. **全流程编排** — 支持「步骤审核」或「全自动」两种模式

🧠 工作方式：
- 我会主动了解你的需求，引导你一步步完成
- 每个阶段我都会清晰说明下一步是什么
- 你随时可以修改任何阶段的内容
- 我会记住你的偏好，让每次创作更顺畅

💡 我能主动发现：
- 当前热门视频风格和选题趋势
- 更好的创作路径和视觉表达方式
- 基于你的创作历史推荐进化方向

特殊指令 - 选题推荐格式：
当用户要求推荐选题时，你必须返回 JSON 格式的结构化数据，格式如下：
\`\`\`json
{
  "topics": [
    {
      "title": "选题标题",
      "description": "简短描述（1-2句话）",
      "style": "适合风格（如：动画/写实/电影感）",
      "duration": 推荐时长（秒）,
      "tags": ["标签1", "标签2"]
    }
  ]
}
\`\`\`
返回5个选题，确保JSON格式正确。

使用规则：
- 回复简洁有力，避免废话
- 关键决策用选项形式呈现（A/B/C）
- 技术细节只在用户询问时展开
- 始终保持创作激情和专业态度
- 用中文回复`

export interface AgentIntent {
  type:
    | 'generate_script'
    | 'generate_storyboard'
    | 'generate_video'
    | 'analyze_video'
    | 'secondary_creation'
    | 'add_text_effects'
    | 'chat'
    | 'clarify'
    | 'select_script'
    | 'select_engine'
    | 'set_mode'
  data?: Partial<ScriptGenerationInput & SecondaryCreationInput & {
    scriptIndex: number
    engine: string
    mode: GenerationMode
    videoPath: string
    textEffects?: {
      subtitles?: boolean
      titles?: boolean
      bullets?: boolean
      customText?: string
    }
  }>
}

export function buildWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    type: 'action',
    content: `👋 我是**超级视频Agent**，你的AI视频制作伙伴。

我可以帮你：
- 🎯 **从选题到成片**：描述想法 → 脚本 → 分镜 → 视频
- 🖼️ **图片生视频**：上传图片 → 自动创作
- 🎬 **视频二创**：上传视频 → 分析 → 改造重生
- 💬 **聊着聊着就出来了**：告诉我你想做什么

你想从哪里开始？`,
    metadata: {
      actions: [
        {
          id: 'from_topic',
          label: '📝 我有一个选题',
          description: '描述你的想法，我来创作',
          action: 'start_from_topic',
          variant: 'primary',
        },
        {
          id: 'from_image',
          label: '🖼️ 我有几张图',
          description: '上传图片，生成视频',
          action: 'start_from_images',
          variant: 'secondary',
        },
        {
          id: 'from_video',
          label: '🎬 我想二创视频',
          description: '上传视频，分析改造',
          action: 'start_from_video',
          variant: 'secondary',
        },
        {
          id: 'explore',
          label: '✨ 帮我想个选题',
          description: '让AI主动推荐',
          action: 'suggest_topics',
          variant: 'outline',
        },
      ] as QuickAction[],
    },
    createdAt: new Date(),
  }
}

export function buildScriptSelectionActions(scriptCount: number): QuickAction[] {
  return [
    ...Array.from({ length: scriptCount }, (_, i) => ({
      id: `select_script_${i}`,
      label: `选方案 ${['A', 'B', 'C', 'D', 'E'][i] ?? String(i + 1)}`,
      action: 'select_script',
      params: { index: i },
      variant: 'secondary' as const,
    })),
    {
      id: 'regenerate',
      label: '🔄 重新生成',
      action: 'regenerate_scripts',
      variant: 'outline',
    },
    {
      id: 'mix',
      label: '🔀 混合多个',
      action: 'mix_scripts',
      variant: 'outline',
    },
  ]
}

export function buildPostStoryboardActions(): QuickAction[] {
  return [
    {
      id: 'gen_seedance',
      label: '🚀 Seedance 2.0 生成',
      description: '高质量，较慢',
      action: 'generate_video',
      params: { engine: 'seedance' },
      variant: 'primary',
    },
    {
      id: 'gen_kling',
      label: '⚡ 可灵AI生成',
      description: '快速，5-10秒片段',
      action: 'generate_video',
      params: { engine: 'kling' },
      variant: 'secondary',
    },
    {
      id: 'add_text_effects',
      label: '📝 添加文字效果',
      description: '字幕、标题、弹幕',
      action: 'add_text_effects',
      variant: 'secondary',
    },
    {
      id: 'edit_storyboard',
      label: '✏️ 修改分镜',
      action: 'edit_storyboard',
      variant: 'outline',
    },
  ]
}

export function buildModeSelectionActions(): QuickAction[] {
  return [
    {
      id: 'auto_mode',
      label: '⚡ 全自动完成',
      description: '直接生成最终视频',
      action: 'set_mode',
      params: { mode: 'auto' },
      variant: 'primary',
    },
    {
      id: 'step_mode',
      label: '🔍 步骤审核',
      description: '每步我来确认',
      action: 'set_mode',
      params: { mode: 'step-by-step' },
      variant: 'secondary',
    },
  ]
}

export function buildTextEffectsGuideActions(): QuickAction[] {
  return [
    {
      id: 'add_subtitles',
      label: '📝 添加字幕',
      description: '时间轴同步字幕',
      action: 'add_subtitles',
      variant: 'secondary',
    },
    {
      id: 'add_titles',
      label: '🎬 添加标题动画',
      description: '6 种动画效果',
      action: 'add_titles',
      variant: 'secondary',
    },
    {
      id: 'add_bullets',
      label: '💬 添加弹幕',
      description: '右向左滚动弹幕',
      action: 'add_bullets',
      variant: 'secondary',
    },
  ]
}

export async function* streamAgentResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  context?: string
): AsyncGenerator<string> {
  const contextNote = context ? `\n\n当前上下文：${context}` : ''

  yield* streamText(
    SYSTEM_PROMPT + contextNote,
    userMessage,
    conversationHistory,
    { source: 'chat-agent' }
  )
}
