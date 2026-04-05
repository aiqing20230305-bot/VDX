/**
 * 对话式提示词修改引擎
 * 允许用户通过自然语言修改分镜帧的提示词
 */
import { generateJSON } from './claude'
import type { StoryboardFrame, Storyboard } from '@/types'

const SYSTEM_PROMPT = `你是一个专业的分镜提示词编辑器，擅长：
- 理解用户的自然语言修改意图
- 精确修改图片生成提示词（保持专业术语和英文格式）
- 保持提示词的结构和风格一致性

修改规则：
1. 用户可能修改：光线、色调、镜头角度、情绪、构图、细节
2. 保留原提示词的基础风格和设备信息
3. 只修改用户明确提到的部分
4. 如果用户说"所有帧"，则返回全局修改规则`

interface ModificationIntent {
  /** 修改类型：single_frame（单帧）、multiple_frames（多帧）、all_frames（全局） */
  type: 'single_frame' | 'multiple_frames' | 'all_frames'
  /** 目标帧索引（如果是单帧或多帧） */
  frameIndices?: number[]
  /** 修改维度：lighting（光线）、tone（色调）、angle（镜头）、mood（情绪）、detail（细节）、other */
  dimension: 'lighting' | 'tone' | 'angle' | 'mood' | 'detail' | 'composition' | 'other'
  /** 修改描述（中文） */
  description: string
  /** 修改指令（英文，追加到提示词） */
  modification: string
}

/**
 * 解析用户的修改意图
 *
 * **智能识别策略**：
 * - 不依赖显式命令词（如"修改"、"改成"）
 * - 理解自然对话意图（"太暗了" = 修改光线）
 * - 保护底层能力，只返回标准化的修改意图
 */
export async function parseModificationIntent(
  userMessage: string,
  storyboard: Storyboard
): Promise<ModificationIntent | null> {
  const prompt = `你是一个智能对话理解系统，能从自然对话中识别修改意图。

当前状态：用户已生成 ${storyboard.totalFrames} 帧分镜图（索引 0-${storyboard.totalFrames - 1}）

用户说：${userMessage}

**任务**：判断用户是否想修改分镜，如果是，返回标准化的修改意图。

**识别规则**：
1. 显式修改：包含"修改"、"改"、"换"、"调整" → 直接识别
2. 隐式表达：
   - "太暗了" → 修改光线（增加亮度）
   - "不够电影感" → 修改风格（增加电影质感）
   - "能近一点吗" → 修改镜头（改为特写）
   - "感觉不对" → 需要追问具体哪里不对
3. 非修改意图：闲聊、提问、下一步操作 → 返回 null

返回 JSON：
{
  "type": "single_frame 或 multiple_frames 或 all_frames",
  "frameIndices": [0, 1, 2],  // 如果是 all_frames 则省略
  "dimension": "lighting 或 tone 或 angle 或 mood 或 detail 或 composition 或 other",
  "description": "修改描述（中文）",
  "modification": "英文修改指令，直接追加到提示词。如：dramatic lighting with strong shadows, warm golden hour tone, close-up shot"
}

如果用户不是在修改提示词（比如闲聊、问问题），返回 null。

示例：
- "让第3帧更亮一些" → {"type":"single_frame","frameIndices":[2],"dimension":"lighting","description":"增加亮度","modification":"brighter lighting, increased exposure"}
- "把第1帧和第5帧改成特写" → {"type":"multiple_frames","frameIndices":[0,4],"dimension":"angle","description":"改为特写镜头","modification":"extreme close-up shot, macro photography"}
- "所有帧都加上电影感" → {"type":"all_frames","dimension":"tone","description":"增加电影质感","modification":"cinematic color grading, film noir lighting, dramatic contrast"}`

  try {
    const result = await generateJSON<ModificationIntent | null>(
      SYSTEM_PROMPT,
      prompt,
      { maxTokens: 500, source: 'prompt-modifier' }
    )
    return result
  } catch {
    return null
  }
}

/**
 * 应用修改到指定帧
 */
export function applyModification(
  frame: StoryboardFrame,
  modification: string
): StoryboardFrame {
  // 在提示词末尾追加修改指令（用逗号分隔）
  const newPrompt = `${frame.imagePrompt}, ${modification}`

  return {
    ...frame,
    imagePrompt: newPrompt,
  }
}

/**
 * 应用全局修改到所有帧
 */
export function applyGlobalModification(
  storyboard: Storyboard,
  modification: string
): Storyboard {
  return {
    ...storyboard,
    frames: storyboard.frames.map(f => applyModification(f, modification)),
  }
}

/**
 * 智能修改：让 Claude 重新优化提示词（而不是简单追加）
 */
export async function intelligentModify(
  frame: StoryboardFrame,
  userIntent: string
): Promise<string> {
  const prompt = `优化以下分镜帧的提示词，根据用户意图修改：

当前提示词：${frame.imagePrompt}

用户意图：${userIntent}

返回优化后的完整提示词（英文），保持专业格式和风格一致性。只返回提示词，不要解释。`

  const result = await generateJSON<{ prompt: string }>(
    '你是专业的图片生成提示词工程师',
    prompt,
    { maxTokens: 500, source: 'prompt-modifier' }
  )
  return result.prompt
}
