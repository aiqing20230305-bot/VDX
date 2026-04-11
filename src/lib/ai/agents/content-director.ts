/**
 * ContentDirector Agent - 内容架构师
 *
 * 角色：导演 + 编剧
 * 职责：理解创意意图、规划叙事结构、定义视觉语言
 */

import { streamText } from '../claude'
import type { ChatMessage } from '@/types'

// Agent定义
export const CONTENT_DIRECTOR_AGENT = {
  id: 'content-director',
  name: '内容架构师',
  role: '导演 + 编剧',
  avatar: '🎬',
  description: '我负责理解你的创意意图，规划视频的叙事结构和视觉风格',

  capabilities: [
    '创意解读与深化',
    '叙事结构设计',
    '视觉风格定义',
    '分镜节奏规划',
    '情绪氛围塑造',
    '角色设定与演绎',
  ],

  systemPrompt: `你是「内容架构师」，一位世界级的视频导演和编剧。

🎯 核心能力：
1. **创意洞察** - 深刻理解用户意图，挖掘创意深度
2. **叙事设计** - 构建引人入胜的故事线，控制节奏和张力
3. **视觉语言** - 定义每个场景的视觉风格和情绪氛围
4. **场景编排** - 规划分镜大纲，平衡视觉冲击与叙事流畅

🎬 工作方式：
- 我会先理解你的创意核心是什么
- 提出3-5个不同方向的创意变体供你选择
- 深入挖掘选定方向，完善叙事细节
- 为每个场景定义"要传达什么情绪"
- 与技术专家协作，确保创意可执行

💡 我的专长：
- **故事类视频** - 短剧、vlog、纪录片的叙事设计
- **产品营销** - 挖掘产品故事，设计情感连接点
- **创意表达** - 艺术短片、实验视频的概念设计
- **音乐视频** - 节奏与画面的深度融合

🤝 协作模式：
- 当你有**选题想法**时，我帮你深化和具象化
- 当你有**参考素材**时，我分析其叙事手法和视觉语言
- 当你不确定方向时，我提供多个创意路径
- 我会主动询问关键细节，确保创意完整

⚠️ 我不做的事：
- 技术实现细节（交给技术专家）
- 具体参数调整（交给技术专家）
- 工具链路选择（交给技术专家）

回复风格：
- 用创作者的语言，不用技术术语
- 关注"为什么这样做"，而非"怎么做"
- 用具体场景举例，而非抽象描述
- 保持热情和启发性`,
}

// Agent输入输出类型
export interface ContentDirectorInput {
  type: 'topic' | 'reference' | 'feedback'

  // 选题输入
  topic?: {
    title: string
    description?: string
    targetEmotion?: string // 想传达的情绪
    duration?: number // 预期时长
    references?: string[] // 参考作品
  }

  // 参考素材输入
  reference?: {
    type: 'image' | 'video' | 'audio'
    url: string
    analysis?: string // 已有的分析结果
  }

  // 用户反馈
  feedback?: {
    previousOutput: string
    userComment: string
    adjustmentRequest: string
  }

  // 用户偏好
  userPreferences?: {
    stylePreference?: string[] // 偏好的风格
    avoidPatterns?: string[] // 避免的模式
    pastProjects?: any[] // 历史项目
  }
}

export interface ContentDirectorOutput {
  // 创意方案
  creativeProposal: {
    coreIdea: string // 核心创意（一句话）
    narrative: {
      opening: string // 开场设计
      development: string // 发展部分
      climax: string // 高潮
      ending: string // 结尾
    }
    visualStyle: {
      overallTone: string // 整体调性（如：温暖、冷峻、梦幻）
      colorPalette: string // 色彩基调
      composition: string // 构图风格
      motion: string // 运动风格（静态/动态）
    }
    emotionalArc: string[] // 情绪曲线（按场景）
  }

  // 分镜大纲
  storyboardOutline: {
    sceneNumber: number
    duration: number
    description: string
    emotion: string // 本场景要传达的情绪
    visualFocus: string // 视觉重点
    transition?: string // 转场建议
  }[]

  // 变体方案（如果是初次创意）
  variants?: {
    id: string
    name: string
    description: string
    advantage: string // 这个方案的优势
  }[]

  // 给技术专家的指令
  technicalRequirements: {
    complexity: 'simple' | 'medium' | 'complex'
    priorityElements: string[] // 必须实现的要素
    flexibleElements: string[] // 可以灵活调整的要素
    suggestedTechniques: string[] // 建议的技术手段
  }
}

/**
 * 调用ContentDirector Agent
 */
export async function* invokeContentDirector(
  input: ContentDirectorInput,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<string> {
  // 构建上下文
  let context = ''

  if (input.type === 'topic' && input.topic) {
    context = `# 用户选题
标题：${input.topic.title}
${input.topic.description ? `描述：${input.topic.description}` : ''}
${input.topic.targetEmotion ? `目标情绪：${input.topic.targetEmotion}` : ''}
${input.topic.duration ? `时长：${input.topic.duration}秒` : ''}
${input.topic.references?.length ? `参考作品：${input.topic.references.join(', ')}` : ''}
`
  } else if (input.type === 'reference' && input.reference) {
    context = `# 参考素材
类型：${input.reference.type}
${input.reference.analysis ? `分析结果：${input.reference.analysis}` : ''}

请基于这个参考素材，提出创意方案。`
  } else if (input.type === 'feedback' && input.feedback) {
    context = `# 上一次输出
${input.feedback.previousOutput}

# 用户反馈
${input.feedback.userComment}

# 调整需求
${input.feedback.adjustmentRequest}

请基于反馈调整方案。`
  }

  // 添加用户偏好
  if (input.userPreferences) {
    context += `\n\n# 用户偏好`
    if (input.userPreferences.stylePreference?.length) {
      context += `\n偏好风格：${input.userPreferences.stylePreference.join(', ')}`
    }
    if (input.userPreferences.avoidPatterns?.length) {
      context += `\n避免：${input.userPreferences.avoidPatterns.join(', ')}`
    }
  }

  // 构建对话历史（过滤掉system角色）
  const history = conversationHistory
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

  // 调用Claude生成
  yield* streamText(
    CONTENT_DIRECTOR_AGENT.systemPrompt,
    context,
    history,
    { source: 'content-director' }
  )
}

/**
 * 解析ContentDirector输出为结构化数据
 */
export function parseContentDirectorOutput(text: string): ContentDirectorOutput | null {
  try {
    // 尝试直接解析JSON
    let parsed: any

    // 1. 尝试解析纯JSON
    try {
      parsed = JSON.parse(text)
    } catch {
      // 2. 尝试提取代码块中的JSON
      const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (codeBlockMatch) {
        parsed = JSON.parse(codeBlockMatch[1])
      } else {
        // 3. 尝试提取任意JSON对象
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          return null
        }
      }
    }

    // 验证必需字段
    if (!parsed.creativeProposal || !parsed.storyboardOutline || !parsed.technicalRequirements) {
      return null
    }

    return parsed as ContentDirectorOutput
  } catch (error) {
    return null
  }
}
