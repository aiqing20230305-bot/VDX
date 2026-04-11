/**
 * 生成类 Blocks
 */
import type { Block } from './types'
import type { Script, Storyboard } from '@/types'

// ─── generate.script ──────────────────────────────────────────

export const GenerateScriptBlock: Block = {
  id: 'generate.script',
  type: 'generate.script',
  category: 'generate',
  name: '脚本生成',
  description: '根据主题生成视频脚本（场景、解说词、运镜等）',
  icon: 'FileText',

  inputs: [
    {
      name: 'topic',
      type: 'string',
      description: '视频主题或选题',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      description: '视频时长（秒）',
      required: true,
      validation: (value) => value > 0 && value <= 300 || '时长必须在 1-300 秒之间',
    },
    {
      name: 'aspectRatio',
      type: 'string',
      description: '画面比例',
      required: true,
    },
    {
      name: 'style',
      type: 'string',
      description: '视频风格',
      required: false,
      default: '现代简约',
    },
    {
      name: 'theme',
      type: 'string',
      description: '主题描述',
      required: false,
    },
  ],

  outputs: [
    {
      name: 'script',
      type: 'Script',
      description: '生成的视频脚本',
    },
  ],

  execute: async (inputs, context) => {
    const { topic, duration, aspectRatio, style, theme } = inputs

    context.log('info', `Generating script: ${topic} (${duration}s, ${aspectRatio})`)

    // 调用脚本生成引擎
    const { generateScripts } = await import('@/lib/ai/script-engine')

    const scripts = await generateScripts({
      topic,
      duration,
      aspectRatio,
      count: 1, // Building Blocks 模式下只生成一个脚本
      style,
    })

    const script = scripts[0]

    context.log('info', `Script generated: ${script.scenes.length} scenes`)

    // 保存脚本到资产库
    await context.saveAsset('script', script)

    return { script }
  },

  estimatedDuration: 15,  // Claude 生成脚本约 15 秒
  cost: 0.2,
}

// ─── generate.prompts ─────────────────────────────────────────

export const GeneratePromptsBlock: Block = {
  id: 'generate.prompts',
  type: 'generate.prompts',
  category: 'generate',
  name: '分镜提示词生成',
  description: '将脚本转换为分镜帧和图片生成提示词',
  icon: 'Sparkles',

  inputs: [
    {
      name: 'script',
      type: 'Script',
      description: '视频脚本',
      required: true,
    },
    {
      name: 'productAnalysis',
      type: 'ProductAnalysis',
      description: '产品一致性约束（可选）',
      required: false,
    },
    {
      name: 'variantMode',
      type: 'boolean',
      description: '是否生成 3 种镜头语言变体',
      required: false,
      default: false,
    },
  ],

  outputs: [
    {
      name: 'storyboard',
      type: 'Storyboard',
      description: '分镜（不含图片）',
    },
    {
      name: 'variants',
      type: 'any',
      description: '分镜变体（如果启用 variantMode）',
    },
  ],

  execute: async (inputs, context) => {
    const { script, productAnalysis, variantMode } = inputs

    context.log('info', `Generating prompts for ${script.scenes.length} scenes`)

    const { generateStoryboard, generateStoryboardVariants } = await import('@/lib/ai/storyboard-engine')

    if (variantMode) {
      // 生成 3 种镜头语言变体
      const variants = await generateStoryboardVariants(script, productAnalysis)
      context.log('info', `Generated ${variants.length} storyboard variants`)
      return { variants }
    } else {
      // 标准单一分镜
      const storyboard = await generateStoryboard(script, productAnalysis)
      context.log('info', `Generated ${storyboard.frames.length} frames`)
      await context.saveAsset('storyboard', storyboard)
      return { storyboard }
    }
  },

  estimatedDuration: 20,  // Claude 生成提示词约 20 秒
  cost: 0.3,
}

// ─── generate.image ───────────────────────────────────────────

export const GenerateImageBlock: Block = {
  id: 'generate.image',
  type: 'generate.image',
  category: 'generate',
  name: '文生图',
  description: '使用即梦根据提示词生成图片',
  icon: 'Image',

  inputs: [
    {
      name: 'prompt',
      type: 'string',
      description: '图片生成提示词',
      required: true,
    },
    {
      name: 'ratio',
      type: 'string',
      description: '图片比例',
      required: false,
      default: '16:9',
    },
    {
      name: 'model',
      type: 'string',
      description: '模型版本',
      required: false,
      default: '5.0',
    },
    {
      name: 'resolution',
      type: 'string',
      description: '分辨率',
      required: false,
      default: '2k',
    },
  ],

  outputs: [
    {
      name: 'imageUrl',
      type: 'string',
      description: '生成的图片 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { prompt, ratio, model, resolution } = inputs

    if (!prompt) {
      throw new Error('Missing required input: prompt')
    }

    context.log('info', `Generating image: ${prompt.substring(0, 50)}...`)

    const { text2Image } = await import('@/lib/video/dreamina-image')

    const urls = await text2Image({
      prompt,
      ratio: ratio as any,
      model: model as any,
      resolution: resolution as any,
    })

    const imageUrl = urls[0]
    if (!imageUrl) {
      throw new Error('图片生成失败：未返回 URL')
    }

    // 本地化图片
    const { localizeImageUrl } = await import('@/lib/video/dreamina-image')
    const localUrl = await localizeImageUrl(imageUrl)

    context.log('info', `Image generated: ${localUrl}`)

    return { imageUrl: localUrl }
  },

  estimatedDuration: 30,  // 即梦生成约 30 秒
  cost: 1,  // 即梦 1 积分/张
}

// ─── generate.video ───────────────────────────────────────────

export const GenerateVideoBlock: Block = {
  id: 'generate.video',
  type: 'generate.video',
  category: 'generate',
  name: '视频生成',
  description: '使用 Seedance 或 Kling 生成视频片段',
  icon: 'Film',

  inputs: [
    {
      name: 'imageUrl',
      type: 'string',
      description: '参考图片 URL',
      required: true,
    },
    {
      name: 'prompt',
      type: 'string',
      description: '视频生成提示词',
      required: true,
    },
    {
      name: 'duration',
      type: 'number',
      description: '视频时长（秒）',
      required: true,
      validation: (value) => [5, 10].includes(value) || '时长必须是 5 或 10 秒',
    },
    {
      name: 'engine',
      type: 'string',
      description: '生成引擎',
      required: false,
      default: 'seedance',
      validation: (value) => ['seedance', 'kling'].includes(value) || '引擎必须是 seedance 或 kling',
    },
  ],

  outputs: [
    {
      name: 'videoUrl',
      type: 'string',
      description: '生成的视频 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { imageUrl, prompt, duration, engine } = inputs

    context.log('info', `Generating video: ${engine} (${duration}s)`)

    let videoUrl: string

    if (engine === 'seedance') {
      const { generateVideo } = await import('@/lib/video/seedance')
      videoUrl = await generateVideo({ imageUrl, prompt, duration })
    } else {
      const { generateVideo, pollUntilDone } = await import('@/lib/video/kling')
      const job = await generateVideo({
        imageUrl,
        prompt,
        duration: String(duration) as '5' | '10',
        mode: 'std',
      })

      context.log('info', `Kling job submitted: ${job.taskId}`)

      // 轮询直到视频生成完成
      videoUrl = await pollUntilDone(
        job.taskId,
        (progress) => context.log('info', `Video generation progress: ${progress}%`),
        300_000, // 5分钟超时
        'image2video' // 图生视频
      )
    }

    // 本地化视频
    const { localizeVideoUrl } = await import('@/lib/video/dreamina-image')
    const localUrl = await localizeVideoUrl(videoUrl)

    context.log('info', `Video generated: ${localUrl}`)

    return { videoUrl: localUrl }
  },

  estimatedDuration: 60,  // 视频生成约 60 秒
  cost: 10,  // 视频生成成本较高
}

// ─── 导出所有生成 Blocks ───────────────────────────────────────

export const GenerateBlocks: Block[] = [
  GenerateScriptBlock,
  GeneratePromptsBlock,
  GenerateImageBlock,
  GenerateVideoBlock,
]
