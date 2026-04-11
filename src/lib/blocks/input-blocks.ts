/**
 * 输入类 Blocks
 */
import type { Block } from './types'

// ─── input.text ───────────────────────────────────────────────

export const InputTextBlock: Block = {
  id: 'input.text',
  type: 'input.text',
  category: 'input',
  name: '文字输入',
  description: '接收用户的文字输入（主题、描述、要求等）',
  icon: 'Type',

  inputs: [
    {
      name: 'prompt',
      type: 'string',
      description: '输入提示文字',
      required: false,
      default: '请输入内容',
    },
    {
      name: 'multiline',
      type: 'boolean',
      description: '是否多行输入',
      required: false,
      default: false,
    },
    {
      name: 'maxLength',
      type: 'number',
      description: '最大字符数',
      required: false,
      default: 1000,
    },
  ],

  outputs: [
    {
      name: 'text',
      type: 'string',
      description: '用户输入的文字',
    },
  ],

  execute: async (inputs, context) => {
    const { prompt, multiline, maxLength } = inputs

    // 优先从 inputs 中获取值（工作流执行时传入）
    // 回退到 context 中的 user_input 或 text（兼容性）
    const text = inputs.text || inputs.value || context.get('user_input') || context.get('text') || inputs.defaultValue || ''

    context.log('info', `InputTextBlock: received text = "${text}"`)
    context.log('info', `InputTextBlock: all inputs = ${JSON.stringify(Object.keys(inputs))}`)

    // 验证长度
    if (text && text.length > maxLength) {
      throw new Error(`输入超过最大长度限制：${maxLength} 字符`)
    }

    const safeText = String(text || '')
    context.log('info', `Text input processed: ${safeText.substring(0, Math.min(50, safeText.length))}...`)
    context.log('info', `Returning: { text: "${safeText.substring(0, 30)}..." }`)

    return { text: safeText }
  },

  estimatedDuration: 0,  // 等待用户输入，时间不确定
  cost: 0,
}

// ─── input.image ──────────────────────────────────────────────

export const InputImageBlock: Block = {
  id: 'input.image',
  type: 'input.image',
  category: 'input',
  name: '图片上传',
  description: '接收用户上传的图片文件',
  icon: 'Image',

  inputs: [
    {
      name: 'accept',
      type: 'string',
      description: '接受的文件类型',
      required: false,
      default: 'image/*',
    },
    {
      name: 'multiple',
      type: 'boolean',
      description: '是否支持多图上传',
      required: false,
      default: false,
    },
    {
      name: 'maxSize',
      type: 'number',
      description: '单个文件最大大小（MB）',
      required: false,
      default: 10,
    },
  ],

  outputs: [
    {
      name: 'imageUrl',
      type: 'string',
      description: '图片 URL 或本地路径',
    },
    {
      name: 'imageUrls',
      type: 'string[]',
      description: '多图模式下的图片列表',
    },
  ],

  execute: async (inputs, context) => {
    const { accept, multiple, maxSize } = inputs

    // 从 context 中获取用户上传的图片
    const uploadedImages = context.get('uploaded_images') || []

    if (uploadedImages.length === 0) {
      throw new Error('未上传图片')
    }

    // 验证文件大小
    for (const img of uploadedImages) {
      if (img.size && img.size > maxSize * 1024 * 1024) {
        throw new Error(`图片大小超过限制：${maxSize}MB`)
      }
    }

    if (multiple) {
      const imageUrls = uploadedImages.map((img: any) => img.url || img.path)
      context.log('info', `Received ${imageUrls.length} images`)
      return { imageUrls }
    } else {
      const imageUrl = uploadedImages[0].url || uploadedImages[0].path
      context.log('info', `Received image: ${imageUrl}`)
      return { imageUrl }
    }
  },

  estimatedDuration: 0,  // 等待用户上传
  cost: 0,
}

// ─── input.product ────────────────────────────────────────────

export const InputProductBlock: Block = {
  id: 'input.product',
  type: 'input.product',
  category: 'input',
  name: '产品信息输入',
  description: '接收产品描述和参考图，用于产品一致性约束',
  icon: 'Package',

  inputs: [
    {
      name: 'productName',
      type: 'string',
      description: '产品名称',
      required: true,
    },
    {
      name: 'productDescription',
      type: 'string',
      description: '产品描述',
      required: true,
    },
    {
      name: 'productImages',
      type: 'string[]',
      description: '产品参考图',
      required: false,
    },
  ],

  outputs: [
    {
      name: 'productAnalysis',
      type: 'ProductAnalysis',
      description: '产品分析结果（含视觉特征、关键特征等）',
    },
  ],

  execute: async (inputs, context) => {
    const { productName, productDescription, productImages } = inputs

    // 调用 Claude 分析产品特征
    const { analyzeProduct } = await import('@/lib/ai/product-consistency')

    // 组合产品描述
    const fullDescription = productName
      ? `${productName}: ${productDescription}`
      : productDescription

    // 图片URL列表（用于描述）
    const imageDescriptions = productImages?.map((url: string, i: number) =>
      `Image ${i + 1}: ${url}`
    )

    const analysis = await analyzeProduct(fullDescription, imageDescriptions)

    context.log('info', `Product analyzed: ${productName}`)
    context.log('info', `Critical features: ${analysis.criticalFeatures.length}`)

    // 保存产品分析结果到资产库
    await context.saveAsset('other', {
      type: 'product_analysis',
      name: productName,
      analysis,
    })

    return { productAnalysis: analysis }
  },

  estimatedDuration: 10,  // Claude 分析约 10 秒
  cost: 0.1,  // Claude API 成本
}

// ─── 导出所有输入 Blocks ───────────────────────────────────────

export const InputBlocks: Block[] = [
  InputTextBlock,
  InputImageBlock,
  InputProductBlock,
]
