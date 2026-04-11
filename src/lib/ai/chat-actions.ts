/**
 * 聊天 UI 辅助函数 — 纯数据，无 SDK 依赖，可安全在客户端使用
 */
import type { ChatMessage, QuickAction, GenerationMode } from '@/types'
import { v4 as uuid } from 'uuid'

export function buildWelcomeMessage(): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    type: 'action',
    content: `💡 提示：欢迎使用**超级视频Agent**

我可以帮你完成以下创作：
• 🎯 **选题生成视频** — 告诉我想法，自动生成脚本、分镜、视频
• 🖼️ **图片生成视频** — 上传产品图/场景图，自动创作
• 🎬 **视频二创改造** — 上传视频，AI分析并重新创作

**👇 请选择一个起点**，或直接描述你的需求：`,
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
      id: 'select_frames',
      label: '🎯 选择帧生成',
      description: '选择想用的分镜帧',
      action: 'select_frames_for_video',
      variant: 'primary',
    },
    {
      id: 'gen_seedance',
      label: '🚀 全部帧 - Seedance',
      description: '用全部分镜生成（即梦）',
      action: 'generate_video',
      params: { engine: 'seedance' },
      variant: 'secondary',
    },
    {
      id: 'gen_kling',
      label: '⚡ 全部帧 - 可灵',
      description: '用全部分镜生成（可灵）',
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
      params: { mode: 'auto' as GenerationMode },
      variant: 'primary',
    },
    {
      id: 'step_mode',
      label: '🔍 步骤审核',
      description: '每步我来确认',
      action: 'set_mode',
      params: { mode: 'step-by-step' as GenerationMode },
      variant: 'secondary',
    },
  ]
}

export function makeMessage(
  msg: Partial<ChatMessage> & { role: ChatMessage['role'] }
): ChatMessage {
  return {
    id: uuid(),
    type: 'text',
    content: '',
    createdAt: new Date(),
    ...msg,
  }
}
