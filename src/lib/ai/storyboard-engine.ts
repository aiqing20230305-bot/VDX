/**
 * 分镜图生成引擎
 * 将脚本转换为精准的分镜图提示词，并调度图片生成
 * 15秒 → 12帧；每多5秒 → 多4帧
 */
import { generateJSON } from './claude'
import type { Script, Storyboard, StoryboardFrame } from '@/types'
import { calculateFrameCount } from './script-engine'
import { text2Image, convertCharacterStyle, type CharacterStyle } from '../video/dreamina-image'
import { v4 as uuid } from 'uuid'

const SYSTEM_PROMPT = `你是一位专业的分镜师和提示词工程师，精通：
- 将视频脚本转化为精确的分镜画面
- 编写高质量的图片生成提示词（适用于 Flux、SDXL、Midjourney 等模型）
- 保持视觉一致性（角色、场景、光线、风格）
- 理解电影级构图、色调、景深

提示词要求：
1. 每帧提示词需包含：主体描述、场景/背景、光线、构图/镜头角度、风格
2. 所有帧共享同一视觉风格基础词（放在 style_base 字段）
3. 确保角色外观在所有帧中保持一致
4. 提示词使用英文（图片生成模型效果更好）`

interface RawFrame {
  index: number
  scene_index: number
  duration: number
  description: string
  camera_angle: string
  image_prompt: string
  transition?: string
}

interface StoryboardResult {
  style_base: string
  character_description?: string
  frames: RawFrame[]
}

export async function generateStoryboard(script: Script): Promise<Storyboard> {
  const totalFrames = calculateFrameCount(script.duration)

  const prompt = `请将以下视频脚本转化为 ${totalFrames} 帧分镜图：

脚本信息：
- 标题：${script.title}
- 风格：${script.style}
- 总时长：${script.duration} 秒
- 画面比例：${script.aspectRatio}
- 主题：${script.theme}

场景列表：
${script.scenes.map(s => `
场景 ${s.index}（${s.duration}秒）：
  画面：${s.visual}
  运镜：${s.cameraMove || '固定'}
  情绪：${s.emotion || ''}
  解说：${s.narration || ''}
`).join('\n')}

请将场景合理分配到 ${totalFrames} 帧（按时长比例分配）。

返回 JSON 格式：
{
  "style_base": "统一风格基础词（英文）",
  "character_description": "主角外观描述（英文，如有）",
  "frames": [
    {
      "index": 0,
      "scene_index": 0,
      "duration": 1.5,
      "description": "画面描述（中文）",
      "camera_angle": "镜头角度",
      "image_prompt": "详细的英文图片生成提示词",
      "transition": "转场方式（可选）"
    }
  ]
}`

  const result = await generateJSON<StoryboardResult>(SYSTEM_PROMPT, prompt, {
    maxTokens: 6000,
    source: 'storyboard-engine',
  })

  const frames: StoryboardFrame[] = result.frames.map((f): StoryboardFrame => ({
    index: f.index,
    scriptSceneIndex: f.scene_index,
    duration: f.duration,
    description: f.description,
    cameraAngle: f.camera_angle,
    imagePrompt: `${result.style_base}, ${result.character_description ? result.character_description + ', ' : ''}${f.image_prompt}`,
    transition: f.transition,
  }))

  return {
    id: uuid(),
    scriptId: script.id,
    totalFrames,
    frames,
    coverPrompt: frames[0]?.imagePrompt,
    createdAt: new Date(),
  }
}

export async function enhanceFramePrompt(
  frame: StoryboardFrame,
  styleBase: string,
  referenceDescription?: string
): Promise<string> {
  const prompt = `优化以下分镜帧的图片生成提示词，使其更加精准、有表现力：

当前提示词：${frame.imagePrompt}
统一风格：${styleBase}
${referenceDescription ? `参考描述：${referenceDescription}` : ''}
画面描述：${frame.description}
镜头角度：${frame.cameraAngle}

返回优化后的英文提示词（仅返回提示词，不含解释）`

  const result = await generateJSON<{ prompt: string }>(
    '你是专业的图片生成提示词工程师，只返回优化后的提示词。',
    prompt,
    { source: 'storyboard-engine' }
  )
  return result.prompt
}

// ─── 分镜图片填充（dreamina text2image）──────────────────────

export interface FillStoryboardOptions {
  /** 要填充的分镜 */
  storyboard: Storyboard
  /** 画面比例 */
  ratio?: '16:9' | '9:16' | '1:1'
  /** 人物参考图路径（真人照片，会自动转风格） */
  characterImagePath?: string
  /** 人物风格转换类型 */
  characterStyle?: CharacterStyle
  /** 逐帧回调 */
  onFrameFilled?: (frameIndex: number, imageUrl: string) => void
}

/**
 * 用即梦生成分镜图片，填充到每一帧
 * 如果提供了人物参考图，会先转为线稿/动漫风格，
 * 然后在每帧提示词中加入角色描述以保持一致性
 */
export async function fillStoryboardImages(
  options: FillStoryboardOptions
): Promise<Storyboard> {
  const { storyboard, ratio, characterImagePath, characterStyle, onFrameFilled } = options

  // 1. 如果有人物参考图，先做风格转换
  let characterRefUrl: string | undefined
  if (characterImagePath) {
    const style = characterStyle ?? 'lineart'
    const urls = await convertCharacterStyle({
      imagePath: characterImagePath,
      style,
      additionalPrompt: 'full body character reference sheet, front view, clear features',
    })
    characterRefUrl = urls[0]
  }

  // 2. 逐帧生成图片
  const filledFrames: StoryboardFrame[] = []

  for (const frame of storyboard.frames) {
    const prompt = characterRefUrl
      ? `${frame.imagePrompt}, consistent character from reference`
      : frame.imagePrompt

    try {
      const imageUrls = await text2Image({
        prompt,
        ratio: (ratio as '16:9' | '9:16' | '1:1') ?? '16:9',
        model: '5.0',
        resolution: '2k',
      })

      const imageUrl = imageUrls[0] ?? undefined
      filledFrames.push({ ...frame, imageUrl })
      if (imageUrl) onFrameFilled?.(frame.index, imageUrl)
    } catch (err) {
      console.error(`Frame ${frame.index} image generation failed:`, err)
      filledFrames.push(frame) // 保留无图版本
    }
  }

  return { ...storyboard, frames: filledFrames }
}

// ─── 人物形象处理 Pipeline ───────────────────────────────────

/**
 * 人物视频生成 Pipeline：
 * 真人照片 → 风格转换（保留特征）→ 作为视频生成参考图
 *
 * 为什么需要这一步：
 * 目前 Seedance/Kling 等平台不支持直接用真人照片做参考生成视频。
 * 但如果把真人转为线稿/动漫/CG 风格，保留五官和体态特征，
 * 再用这个风格化图片作为首帧参考，就可以生成包含该人物特征的视频。
 */
export async function prepareCharacterForVideo(
  imagePath: string,
  style: CharacterStyle = 'cg_realistic'
): Promise<{
  originalPath: string
  stylizedUrls: string[]
  style: CharacterStyle
  hint: string
}> {
  const urls = await convertCharacterStyle({ imagePath, style })

  return {
    originalPath: imagePath,
    stylizedUrls: urls,
    style,
    hint: '使用 stylizedUrls[0] 作为视频生成的 imageUrl/referenceImagePath 参数',
  }
}
