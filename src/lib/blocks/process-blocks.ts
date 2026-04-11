/**
 * 处理类 Blocks
 */
import type { Block } from './types'

// ─── process.analyze ──────────────────────────────────────────

export const ProcessAnalyzeBlock: Block = {
  id: 'process.analyze',
  type: 'process.analyze',
  category: 'process',
  name: '内容分析',
  description: '使用 Claude Vision 分析图片或视频内容',
  icon: 'ScanEye',

  inputs: [
    {
      name: 'mediaUrl',
      type: 'string',
      description: '图片或视频 URL',
      required: true,
    },
    {
      name: 'analysisType',
      type: 'string',
      description: '分析类型',
      required: false,
      default: 'general',
      validation: (value) => ['general', 'product', 'scene', 'character'].includes(value) || '无效的分析类型',
    },
  ],

  outputs: [
    {
      name: 'analysis',
      type: 'string',
      description: '分析结果描述',
    },
    {
      name: 'tags',
      type: 'string[]',
      description: '提取的标签',
    },
  ],

  execute: async (inputs, context) => {
    const { mediaUrl, analysisType } = inputs

    context.log('info', `Analyzing media: ${mediaUrl}`)

    const { generateText } = await import('@/lib/ai/claude')

    const prompt = analysisType === 'product'
      ? '分析这个产品的外观特征、颜色、形状、材质、品牌元素等，用于后续视频生成中保持产品一致性。'
      : analysisType === 'scene'
      ? '分析这个场景的构图、光线、色调、环境氛围、镜头角度等。'
      : analysisType === 'character'
      ? '分析这个人物的外貌特征、服装、表情、姿态等。'
      : '详细描述这张图片的内容、风格、情绪、色调等。'

    // 使用 Claude Vision API 分析图片
    const analysis = await generateText(
      '你是一个视觉分析专家。',
      `${prompt}\n\n图片URL: ${mediaUrl}`,
      { maxTokens: 1024 }
    )

    // 简单的标签提取（可以改用更复杂的 NLP）
    const tags = analysis
      .match(/[\u4e00-\u9fa5]{2,6}|[a-zA-Z]{3,12}/g)
      ?.slice(0, 10) || []

    context.log('info', `Analysis complete: ${tags.length} tags extracted`)

    return { analysis, tags }
  },

  estimatedDuration: 5,  // Claude Vision 分析约 5 秒
  cost: 0.05,
}

// ─── process.transform ────────────────────────────────────────

export const ProcessTransformBlock: Block = {
  id: 'process.transform',
  type: 'process.transform',
  category: 'process',
  name: '图生图',
  description: '基于参考图生成新图片（保留构图和风格）',
  icon: 'ImagePlus',

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
      description: '编辑提示词',
      required: true,
    },
    {
      name: 'ratio',
      type: 'string',
      description: '输出比例',
      required: false,
      default: '1:1',
    },
    {
      name: 'model',
      type: 'string',
      description: '模型版本',
      required: false,
      default: '5.0',
    },
  ],

  outputs: [
    {
      name: 'imageUrl',
      type: 'string',
      description: '生成的新图片 URL',
    },
  ],

  execute: async (inputs, context) => {
    const { imageUrl, prompt, ratio, model } = inputs

    context.log('info', `Transforming image: ${imageUrl}`)

    // 下载并确保格式支持
    const { downloadImage, ensureSupportedFormat, image2Image } = await import('@/lib/video/dreamina-image')

    const localPath = imageUrl.startsWith('http')
      ? await downloadImage(imageUrl)
      : await ensureSupportedFormat(imageUrl)

    const urls = await image2Image({
      imagePath: localPath,
      prompt,
      ratio: ratio as any,
      model: model as any,
    })

    const newImageUrl = urls[0]
    if (!newImageUrl) {
      throw new Error('图生图失败：未返回 URL')
    }

    // 本地化
    const { localizeImageUrl } = await import('@/lib/video/dreamina-image')
    const localUrl = await localizeImageUrl(newImageUrl)

    context.log('info', `Image transformed: ${localUrl}`)

    return { imageUrl: localUrl }
  },

  estimatedDuration: 35,  // 图生图约 35 秒
  cost: 1.5,
}

// ─── process.filter ───────────────────────────────────────────

export const ProcessFilterBlock: Block = {
  id: 'process.filter',
  type: 'process.filter',
  category: 'process',
  name: '内容过滤',
  description: '过滤提示词中的违禁内容（相机参数、品牌名等）',
  icon: 'Shield',

  inputs: [
    {
      name: 'prompt',
      type: 'string',
      description: '原始提示词',
      required: true,
    },
    {
      name: 'filterType',
      type: 'string',
      description: '过滤类型',
      required: false,
      default: 'all',
      validation: (value) => ['all', 'camera', 'brand', 'violence'].includes(value) || '无效的过滤类型',
    },
  ],

  outputs: [
    {
      name: 'filteredPrompt',
      type: 'string',
      description: '过滤后的提示词',
    },
    {
      name: 'hasChanges',
      type: 'boolean',
      description: '是否有修改',
    },
    {
      name: 'replacements',
      type: 'any',
      description: '替换详情',
    },
  ],

  execute: async (inputs, context) => {
    const { prompt, filterType } = inputs

    if (!prompt) {
      throw new Error(`ProcessFilterBlock: Missing required input 'prompt'. Received inputs: ${JSON.stringify(Object.keys(inputs))}`)
    }

    context.log('info', `Filtering prompt: ${prompt.substring(0, 50)}...`)

    const { filterPrompt } = await import('@/lib/ai/content-filter')

    const result = filterPrompt(prompt)

    context.log('info', `Content filtered: ${result.replacements.length} replacements`)
    context.log('info', `Filtered result: ${result.filtered.substring(0, 50)}...`)

    return {
      filteredPrompt: result.filtered,
      hasChanges: result.hasChanges,
      replacements: result.replacements,
    }
  },

  estimatedDuration: 0.1,  // 本地过滤，极快
  cost: 0,
}

// ─── 导出所有处理 Blocks ───────────────────────────────────────

export const ProcessBlocks: Block[] = [
  ProcessAnalyzeBlock,
  ProcessTransformBlock,
  ProcessFilterBlock,
]
