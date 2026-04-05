/**
 * 脚本生成引擎
 * 根据选题/图片/时长/比例/数量，生成发散性、创意性的视频脚本
 */
import { generateJSON } from './claude'
import type {
  Script,
  ScriptGenerationInput,
  ScriptScene,
  VideoStyle,
} from '@/types'
import { v4 as uuid } from 'uuid'

const SYSTEM_PROMPT = `你是视频脚本策划师。

规则：
1. 返回纯JSON，无额外文字
2. 所有文字简短（标题≤15字，描述≤40字）
3. 严格转义所有特殊字符
4. 确保JSON完整且有效`

interface RawScript {
  title: string
  logline: string
  theme: string
  style: VideoStyle
  scenes: Array<{
    index: number
    duration: number
    visual: string
    camera_move?: string
  }>
}

export async function generateScripts(input: ScriptGenerationInput): Promise<Script[]> {
  const { topic, images, duration, aspectRatio, count, style, additionalPrompt } = input

  const imageContext = images && images.length > 0
    ? `\n参考图片 ${images.length} 张`
    : ''

  const sceneCount = Math.max(3, Math.round(duration / 3.5))
  // 限制生成数量，避免输出过长
  const safeCount = Math.min(count, 2)  // 最多2个脚本

  const prompt = `生成${safeCount}个${duration}秒视频脚本。

主题：${topic || '创意'}${imageContext}
风格：${style || 'cinematic'}
比例：${aspectRatio}
场景：${sceneCount}个，每个3-5秒

JSON格式（保持简短）：
{"scripts":[{"title":"标题≤15字","logline":"概括≤20字","theme":"主题≤10字","style":"${style || 'cinematic'}","scenes":[{"index":0,"duration":3,"visual":"画面≤40字","camera_move":"推/拉/摇/固定"}]}]}`

  // 🔄 重试机制：如果 JSON 解析失败，用更简短的提示词重试
  let result: { scripts: RawScript[] }
  try {
    result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, prompt, {
      maxTokens: 3000,  // 降低 token 上限，减少截断风险
      source: 'script-engine',
    })
  } catch (err) {
    console.warn('[script-engine] 首次生成失败，用极简提示词重试:', err)

    // 极简版提示词（只保留核心信息，单脚本）
    const simplePrompt = `生成1个${duration}秒脚本（${sceneCount}场景）。
主题：${topic || '创意'}

JSON：{"scripts":[{"title":"标题","logline":"概括","theme":"主题","style":"${style || 'cinematic'}","scenes":[{"index":0,"duration":3,"visual":"画面","camera_move":"固定"}]}]}`

    result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, simplePrompt, {
      maxTokens: 2000,
      source: 'script-engine-retry',
    })
  }

  // ✅ 验证和清理脚本数据
  const scripts = result.scripts || []
  if (scripts.length === 0) {
    throw new Error('生成的脚本数量为0，请重试')
  }

  return scripts.map((raw): Script => {
    // 验证场景数据
    const scenes = (raw.scenes || []).filter(s => s && s.visual)
    if (scenes.length === 0) {
      throw new Error(`脚本"${raw.title}"没有有效场景`)
    }

    // 确保场景总时长接近目标时长（允许±3秒误差）
    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 3), 0)
    if (Math.abs(totalDuration - duration) > 3) {
      console.warn(`[script-engine] 脚本"${raw.title}"时长不匹配: ${totalDuration}秒 vs ${duration}秒`)
    }

    return {
      id: uuid(),
      title: raw.title || '未命名脚本',
      logline: raw.logline || '',
      theme: raw.theme || '',
      style: raw.style || style || 'cinematic',
      duration,
      aspectRatio,
      scenes: scenes.map((s, i): ScriptScene => ({
        index: i,
        duration: s.duration || 3,
        visual: s.visual,
        narration: undefined,  // 简化：不再生成解说词
        emotion: undefined,     // 简化：不再生成情绪
        cameraMove: s.camera_move || '固定',
        soundDesign: undefined, // 简化：不再生成音效
      })),
      generationPrompt: topic,
      createdAt: new Date(),
    }
  })
}

export function calculateFrameCount(durationSeconds: number): number {
  // 每个场景平均 3~4 秒，合理的帧数
  return Math.max(3, Math.round(durationSeconds / 3.5))
}
