/**
 * Smart Suggestions - 智能操作建议生成器
 * 根据AI回复内容自动生成下一步操作按钮
 */

import type { QuickAction } from '@/types'

interface SuggestionContext {
  messageContent: string
  hasScript?: boolean
  hasStoryboard?: boolean
  hasVideo?: boolean
  currentStage?: string
}

/**
 * 关键词 → 操作映射规则
 */
const SUGGESTION_RULES: Array<{
  keywords: string[]
  action: QuickAction
  condition?: (ctx: SuggestionContext) => boolean
}> = [
  // 脚本相关
  {
    keywords: ['脚本', '剧本', '故事', '叙事'],
    action: {
      id: 'view_script',
      label: '查看脚本',
      description: '查看完整脚本内容',
      action: 'view_script',
      variant: 'outline',
    },
    condition: (ctx) => !!ctx.hasScript,
  },
  {
    keywords: ['修改脚本', '调整脚本', '改写'],
    action: {
      id: 'modify_script',
      label: '修改脚本',
      description: '调整脚本内容',
      action: 'modify_script',
      variant: 'outline',
    },
    condition: (ctx) => !!ctx.hasScript,
  },

  // 分镜相关
  {
    keywords: ['分镜', '画面', '镜头', '构图'],
    action: {
      id: 'view_storyboard',
      label: '查看分镜',
      description: '查看完整分镜图',
      action: 'view_storyboard',
      variant: 'outline',
    },
    condition: (ctx) => !!ctx.hasStoryboard,
  },
  {
    keywords: ['重新生成', '换一个', '不满意'],
    action: {
      id: 'regenerate',
      label: '重新生成',
      description: '生成新的方案',
      action: 'regenerate',
      variant: 'outline',
    },
  },

  // 视频生成
  {
    keywords: ['生成视频', '开始制作', '渲染', '合成'],
    action: {
      id: 'generate_video',
      label: '生成视频',
      description: '开始视频渲染',
      action: 'generate_video',
      variant: 'primary',
    },
    condition: (ctx) => !!ctx.hasStoryboard && !ctx.hasVideo,
  },

  // 导出和分享
  {
    keywords: ['导出', '下载', '保存', '完成'],
    action: {
      id: 'export',
      label: '导出视频',
      description: '下载或分享',
      action: 'export',
      variant: 'primary',
    },
    condition: (ctx) => !!ctx.hasVideo,
  },

  // 继续流程
  {
    keywords: ['下一步', '继续', '接下来'],
    action: {
      id: 'continue',
      label: '继续',
      description: '进入下一步',
      action: 'continue',
      variant: 'primary',
    },
  },

  // 帮助和说明
  {
    keywords: ['帮助', '如何', '怎么', '教程'],
    action: {
      id: 'show_help',
      label: '查看帮助',
      description: '了解使用方法',
      action: 'show_help',
      variant: 'outline',
    },
  },
]

/**
 * 基于阶段的默认建议
 */
const STAGE_DEFAULTS: Record<string, QuickAction[]> = {
  understanding: [
    {
      id: 'select_topic',
      label: '选择选题方向',
      action: 'select_topic',
      variant: 'primary',
    },
  ],
  scripting: [
    {
      id: 'select_script',
      label: '选择脚本',
      action: 'select_script',
      variant: 'primary',
    },
    {
      id: 'modify_script',
      label: '调整脚本',
      action: 'modify_script',
      variant: 'outline',
    },
  ],
  storyboarding: [
    {
      id: 'generate_video',
      label: '生成视频',
      action: 'generate_video',
      variant: 'primary',
    },
    {
      id: 'modify_storyboard',
      label: '调整分镜',
      action: 'modify_storyboard',
      variant: 'outline',
    },
  ],
  completing: [
    {
      id: 'export',
      label: '导出视频',
      action: 'export',
      variant: 'primary',
    },
    {
      id: 'start_new',
      label: '创建新项目',
      action: 'start_new',
      variant: 'outline',
    },
  ],
}

/**
 * 生成智能建议
 */
export function generateSmartSuggestions(context: SuggestionContext): QuickAction[] {
  const suggestions: QuickAction[] = []
  const { messageContent, currentStage } = context

  // 1. 基于关键词的建议
  for (const rule of SUGGESTION_RULES) {
    // 检查是否匹配关键词
    const hasKeyword = rule.keywords.some((keyword) =>
      messageContent.includes(keyword)
    )

    // 检查条件
    const meetsCondition = !rule.condition || rule.condition(context)

    if (hasKeyword && meetsCondition) {
      // 避免重复
      if (!suggestions.find((s) => s.id === rule.action.id)) {
        suggestions.push(rule.action)
      }
    }
  }

  // 2. 如果基于关键词没有找到建议，使用阶段默认值
  if (suggestions.length === 0 && currentStage) {
    const defaults = STAGE_DEFAULTS[currentStage]
    if (defaults) {
      suggestions.push(...defaults)
    }
  }

  // 3. 限制建议数量（最多3个）
  return suggestions.slice(0, 3)
}

/**
 * 判断消息是否应该显示建议
 */
export function shouldShowSuggestions(context: SuggestionContext): boolean {
  const { messageContent } = context

  // 错误消息不显示建议
  if (messageContent.includes('错误') || messageContent.includes('失败')) {
    return false
  }

  // 问题消息不显示建议（已有选项）
  if (messageContent.includes('？') || messageContent.includes('请选择')) {
    return false
  }

  return true
}
