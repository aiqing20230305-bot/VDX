/**
 * 分镜图生成引擎
 * 将脚本转换为精准的分镜图提示词，并调度图片生成
 * 15秒 → 12帧；每多5秒 → 多4帧
 */
import { generateJSON } from './claude'
import type { Script, Storyboard, StoryboardFrame } from '@/types'
import { calculateFrameCount } from './script-engine'
import {
  text2Image,
  image2Image,
  convertCharacterStyle,
  ensureSupportedFormat,
  downloadImage,
  localizeImageUrl,
  type CharacterStyle,
} from '../video/dreamina-image'
import { getStylePreset, applyStyleToPrompt, simplifyPrompt } from './style-presets'
import { buildProductConstraint, type ProductAnalysis } from './product-consistency'
import { filterPrompt } from './content-filter'
import { v4 as uuid } from 'uuid'

const SYSTEM_PROMPT = `你是一位专业的分镜师和提示词工程师，精通：
- 将视频脚本转化为精确的分镜画面
- 编写简洁高效的图片生成提示词（符合即梦/Flux 等平台规范）
- 保持视觉一致性（角色、场景、光线、风格）
- 理解电影级构图、色调、景深

提示词要求：
1. **保持简洁**：每帧提示词控制在80词以内，核心要素包含：主体、场景、光线、风格
2. **避免冗余**：不要重复描述相同的风格词，不要添加过多技术细节
3. 所有帧共享同一视觉风格基础词（放在 style_base 字段，保持简短）
4. 确保角色外观在所有帧中保持一致（如有角色）
5. 提示词使用英文（图片生成模型效果更好）
6. **禁止**：品牌名称、暴力血腥词汇、过度技术化的相机参数
7. **优先**：主体动作、情绪、场景氛围、基础光线描述`

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

export async function generateStoryboard(
  script: Script,
  productAnalysis?: ProductAnalysis
): Promise<Storyboard> {
  const totalFrames = calculateFrameCount(script.duration)
  const stylePreset = getStylePreset(script.style)

  // 产品一致性约束
  const productConstraint = productAnalysis
    ? buildProductConstraint(productAnalysis)
    : undefined

  const prompt = `请将以下视频脚本转化为 ${totalFrames} 帧分镜图：

脚本信息：
- 标题：${script.title}
- 风格：${script.style}（${stylePreset.claudeGuidance}）
- 总时长：${script.duration} 秒
- 画面比例：${script.aspectRatio}
- 主题：${script.theme}

风格要求：
- 风格基础提示词参考：${stylePreset.styleBase}
- 请在每帧的 image_prompt 中融入上述风格特征
- 避免出现：${stylePreset.negativePrompt}${productConstraint ? `

**重要：产品一致性约束**
视频中出现的产品必须严格符合以下描述：
${productAnalysis!.visualPrompt}

关键特征（绝不能出错）：
${productAnalysis!.criticalFeatures.map((f, i) => `${i + 1}. ${f}`).join('\n')}

禁止出现：${productConstraint.negativeConstraint}` : ''}

场景列表：
${script.scenes.map(s => `
场景 ${s.index}（${s.duration}秒）：
  画面：${s.visual}
  运镜：${s.cameraMove || '固定'}
  情绪：${s.emotion || ''}
  解说：${s.narration || ''}
`).join('\n')}

请将场景合理分配到 ${totalFrames} 帧（按时长比例分配）。

**重要提示**：
- image_prompt 要简洁精准，控制在50-80词
- 只包含核心要素：主体、动作、场景、光线、基础风格
- 避免冗余的技术细节和重复描述

返回 JSON 格式：
{
  "style_base": "统一风格基础词（英文，5-8词即可）",
  "character_description": "主角核心外观（英文，如有，10词内）",
  "frames": [
    {
      "index": 0,
      "scene_index": 0,
      "duration": 1.5,
      "description": "画面描述（中文）",
      "camera_angle": "镜头角度",
      "image_prompt": "简洁精准的英文提示词（50-80词，主体+场景+光线+动作）",
      "transition": "转场方式（可选）"
    }
  ]
}`

  const result = await generateJSON<StoryboardResult>(SYSTEM_PROMPT, prompt, {
    maxTokens: 6000,
    source: 'storyboard-engine',
  })

  const frames: StoryboardFrame[] = result.frames.map((f): StoryboardFrame => {
    // 组合提示词：风格 + 帧描述（不重复添加 style_base）
    let fullPrompt = f.image_prompt

    // 添加角色一致性描述（如果有）
    if (result.character_description) {
      fullPrompt = `${result.character_description}, ${fullPrompt}`
    }

    // 注入产品约束（正面约束追加到提示词末尾）
    if (productConstraint) {
      fullPrompt = `${fullPrompt}, ${productConstraint.positiveConstraint}`
    }

    // 应用风格（风格词在最前面）
    fullPrompt = applyStyleToPrompt(fullPrompt, stylePreset)

    // 🛡️ 智能过滤违禁词
    const filtered = filterPrompt(fullPrompt)
    if (filtered.hasChanges) {
      console.log(`[Frame ${f.index}] 违禁词过滤: ${filtered.replacements.length} 处替换`)
    }

    // ✂️ 简化提示词，确保符合平台规范
    const finalPrompt = simplifyPrompt(filtered.filtered)

    return {
      index: f.index,
      scriptSceneIndex: f.scene_index,
      duration: f.duration,
      description: f.description,
      cameraAngle: f.camera_angle,
      imagePrompt: finalPrompt,
      transition: f.transition,
    }
  })

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

// ─── 合成分镜提示词 ─────────────────────────────────────────

/**
 * 将所有分镜帧合成为一条提示词，生成一张包含所有分镜的概览图
 * 优点：只调一次即梦，速度快
 */
export function buildCompositeStoryboardPrompt(storyboard: Storyboard): string {
  const frameDescs = storyboard.frames.map((f, i) =>
    `Panel ${i + 1}: ${f.imagePrompt}`
  ).join('. ')

  return `Professional storyboard layout with ${storyboard.totalFrames} panels arranged in a grid. Each panel is numbered. Clean cinematic style, consistent color palette. ${frameDescs}`
}

// ─── 分镜图片填充（text2image + image2image）────────────────

export interface FillStoryboardOptions {
  /** 要填充的分镜 */
  storyboard: Storyboard
  /** 画面比例 */
  ratio?: '16:9' | '9:16'
  /** 用户上传的参考图片列表（本地路径或 URL） */
  referenceImages?: string[]
  /** 产品图片路径列表（每帧生成时都会上传，保证产品一致性） */
  productImages?: string[]
  /** 人物参考图路径（真人照片，会自动转风格） */
  characterImagePath?: string
  /** 人物风格转换类型 */
  characterStyle?: CharacterStyle
  /** 逐帧回调 */
  onFrameFilled?: (frameIndex: number, imageUrl: string) => void
  /** 生成模式：'per_frame' 逐帧生成，'composite' 一张合成图 */
  mode?: 'per_frame' | 'composite'
}

/**
 * 用即梦生成分镜图片，填充到每一帧
 *
 * 三种模式自动选择：
 * 1. 有参考图 → image2image（保留参考图的构图/内容，叠加分镜提示词）
 * 2. 有人物参考 → 先转风格 → text2image + 人物描述一致性
 * 3. 纯文字 → text2image
 *
 * 任何格式的图片都会自动转换为支持的格式（JPG/PNG/WebP）
 */
export async function fillStoryboardImages(
  options: FillStoryboardOptions
): Promise<Storyboard> {
  const { storyboard, ratio, referenceImages, productImages, characterImagePath, characterStyle, onFrameFilled, mode } = options

  // 合成模式：每 12 帧合成 1 张提示词，一次生图
  // 规则：总帧数 ÷ 12 向上取整 = 要生成几张合成图
  const MAX_FRAMES_PER_SHEET = 12
  // 有产品图时必须逐帧走 image2image，不能用合成模式
  const useComposite = mode === 'composite' || (!referenceImages?.length && !characterImagePath && !productImages?.length)

  if (useComposite) {
    try {
      const sheetCount = Math.ceil(storyboard.frames.length / MAX_FRAMES_PER_SHEET)
      const compositeUrls: string[] = []

      for (let s = 0; s < sheetCount; s++) {
        const startIdx = s * MAX_FRAMES_PER_SHEET
        const endIdx = Math.min(startIdx + MAX_FRAMES_PER_SHEET, storyboard.frames.length)
        const sheetFrames = storyboard.frames.slice(startIdx, endIdx)

        const frameDescs = sheetFrames.map((f, i) =>
          `Panel ${startIdx + i + 1}: ${f.imagePrompt}`
        ).join('. ')

        const prompt = `Professional cinematic storyboard sheet with ${sheetFrames.length} panels arranged in a ${Math.min(4, sheetFrames.length)} column grid. Each panel is clearly numbered in the top-left corner. Consistent cinematic style and color grading throughout. ${frameDescs}`

        const urls = await text2Image({
          prompt,
          ratio: ratio ?? '9:16',
          model: '5.0',
          resolution: '2k',
        })

        if (urls[0]) {
          const localUrl = await localizeImageUrl(urls[0])
          compositeUrls.push(localUrl)
        }
      }

      if (compositeUrls.length > 0) {
        // 把合成图分配给对应帧段
        const frames = storyboard.frames.map((f, i) => {
          const sheetIdx = Math.floor(i / MAX_FRAMES_PER_SHEET)
          // 每组第一帧放合成图，其余帧不单独放图
          if (i % MAX_FRAMES_PER_SHEET === 0 && compositeUrls[sheetIdx]) {
            return { ...f, imageUrl: compositeUrls[sheetIdx] }
          }
          return f
        })
        return { ...storyboard, frames }
      }
    } catch (err) {
      console.error('Composite storyboard failed, falling back to per-frame:', err)
    }
  }

  // 1. 准备参考图（下载远程图 + 格式转换）
  const localRefImages: string[] = []
  if (referenceImages?.length) {
    for (const img of referenceImages) {
      try {
        const localPath = img.startsWith('http') ? await downloadImage(img) : await ensureSupportedFormat(img)
        localRefImages.push(localPath)
      } catch (err) {
        console.error(`参考图处理失败: ${img}`, err)
      }
    }
  }

  // 2. 人物参考图风格转换
  let characterRefUrl: string | undefined
  if (characterImagePath) {
    try {
      const safePath = await ensureSupportedFormat(characterImagePath)
      const style = characterStyle ?? 'cg_realistic'
      const urls = await convertCharacterStyle({
        imagePath: safePath,
        style,
        additionalPrompt: 'full body character reference sheet, front view, clear features',
      })
      characterRefUrl = urls[0]
    } catch (err) {
      console.error('人物风格转换失败:', err)
    }
  }

  // 3. 并行生成图片（每批 3 帧，避免限流）
  const frameRatio = (ratio ?? '9:16') as '16:9' | '9:16'
  const BATCH_SIZE = 3
  const filledFrames: (StoryboardFrame | null)[] = new Array(storyboard.frames.length).fill(null)

  // 3.1 准备产品参考图（格式转换）
  const safeProductImages: string[] = []
  if (productImages?.length) {
    for (const img of productImages) {
      try {
        const safePath = await ensureSupportedFormat(img)
        safeProductImages.push(safePath)
      } catch (err) {
        console.error(`产品图处理失败: ${img}`, err)
      }
    }
  }

  async function generateOneFrame(i: number): Promise<void> {
    const frame = storyboard.frames[i]
    const refImage = localRefImages.length > 0
      ? localRefImages[Math.min(i, localRefImages.length - 1)]
      : undefined

    const prompt = characterRefUrl
      ? `${frame.imagePrompt}, consistent character from reference`
      : frame.imagePrompt

    // 优先级：产品图 > 参考图 > 纯文生图
    // 有产品图时：用第一张产品图做 image2image，确保产品外观一致
    const productRef = safeProductImages.length > 0 ? safeProductImages[0] : undefined

    try {
      let imageUrls: string[]

      if (productRef) {
        // 产品模式：每帧都以产品图为参考做 image2image，保证产品一致性
        imageUrls = await image2Image({
          imagePath: productRef,
          prompt: `${prompt}, product must match reference exactly, maintain exact product appearance`,
          ratio: frameRatio,
          model: '5.0',
        })
      } else if (refImage) {
        imageUrls = await image2Image({
          imagePath: refImage,
          prompt: `${prompt}, maintain composition reference`,
          ratio: frameRatio,
          model: '5.0',
        })
      } else {
        imageUrls = await text2Image({
          prompt,
          ratio: frameRatio,
          model: '5.0',
          resolution: '2k',
        })
      }

      const remoteUrl = imageUrls[0]
      const imageUrl = remoteUrl ? await localizeImageUrl(remoteUrl) : undefined
      filledFrames[i] = { ...frame, imageUrl }
      if (imageUrl) onFrameFilled?.(frame.index, imageUrl)
    } catch (err) {
      console.error(`Frame ${frame.index} image generation failed:`, err)
      filledFrames[i] = frame
    }
  }

  // 分批并行
  for (let batch = 0; batch < storyboard.frames.length; batch += BATCH_SIZE) {
    const tasks = []
    for (let i = batch; i < Math.min(batch + BATCH_SIZE, storyboard.frames.length); i++) {
      tasks.push(generateOneFrame(i))
    }
    await Promise.all(tasks)
  }

  return {
    ...storyboard,
    frames: filledFrames.map((f, i) => f ?? storyboard.frames[i]),
  }
}

// ─── 人物形象处理 Pipeline ───────────────────────────────────

/**
 * 人物视频生成 Pipeline：
 * 真人照片 → 格式转换 → 风格化（保留特征）→ 视频生成参考
 */
export async function prepareCharacterForVideo(
  imagePath: string,
  style: CharacterStyle = 'cg_realistic'
): Promise<{
  originalPath: string
  stylizedUrls: string[]
  style: CharacterStyle
}> {
  const safePath = await ensureSupportedFormat(imagePath)
  const urls = await convertCharacterStyle({ imagePath: safePath, style })
  return { originalPath: imagePath, stylizedUrls: urls, style }
}
