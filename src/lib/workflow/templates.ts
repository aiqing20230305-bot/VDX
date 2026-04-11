/**
 * 预设工作流模板
 */
import type { Workflow } from '../blocks/types'
import { v4 as uuid } from 'uuid'

/**
 * 模板 1: 产品宣传片生成（完整流程）
 * 输入：产品描述 + 产品图
 * 输出：30秒宣传视频
 */
export const ProductPromoTemplate: Workflow = {
  id: 'template.product-promo',
  name: '产品宣传片生成',
  description: '输入产品描述和图片，自动生成专业宣传视频',
  category: 'product_promo',

  nodes: [
    // 输入层
    { id: 'n1', blockId: 'input.text', position: { x: 0, y: 0 }, ui: { label: '产品描述' } },
    { id: 'n2', blockId: 'input.image', position: { x: 0, y: 100 }, ui: { label: '产品图片' } },

    // 产品分析
    { id: 'n3', blockId: 'input.product', position: { x: 200, y: 50 }, ui: { label: '产品分析' } },

    // 脚本生成
    {
      id: 'n4',
      blockId: 'generate.script',
      position: { x: 400, y: 0 },
      config: { duration: 30, aspectRatio: '16:9', style: '商业宣传片' },
      ui: { label: '脚本生成' },
    },

    // 分镜生成
    { id: 'n5', blockId: 'generate.prompts', position: { x: 600, y: 0 }, ui: { label: '分镜提示词' } },

    // 图生图（产品一致性）
    { id: 'n6', blockId: 'process.transform', position: { x: 800, y: 0 }, ui: { label: '分镜图生成' } },

    // 视频生成（批量）
    { id: 'n7', blockId: 'generate.video', position: { x: 1000, y: 0 }, ui: { label: '视频生成' } },

    // 视频合并
    { id: 'n8', blockId: 'compose.merge', position: { x: 1200, y: 0 }, ui: { label: '视频合并' } },

    // 最终输出
    { id: 'n9', blockId: 'output.video', position: { x: 1400, y: 0 }, ui: { label: '输出' } },
  ],

  edges: [
    // n1(产品描述) → n3(产品分析).productDescription
    { id: 'e1', source: 'n1', sourceOutput: 'text', target: 'n3', targetInput: 'productDescription' },

    // n1(产品描述) → n4(脚本生成).topic
    { id: 'e2', source: 'n1', sourceOutput: 'text', target: 'n4', targetInput: 'topic' },

    // n2(产品图) → n3(产品分析).productImages
    { id: 'e3', source: 'n2', sourceOutput: 'imageUrls', target: 'n3', targetInput: 'productImages' },

    // n3(产品分析) → n5(分镜生成).productAnalysis
    { id: 'e4', source: 'n3', sourceOutput: 'productAnalysis', target: 'n5', targetInput: 'productAnalysis' },

    // n4(脚本) → n5(分镜生成).script
    { id: 'e5', source: 'n4', sourceOutput: 'script', target: 'n5', targetInput: 'script' },

    // n2(产品图) → n6(图生图).imageUrl
    { id: 'e6', source: 'n2', sourceOutput: 'imageUrl', target: 'n6', targetInput: 'imageUrl' },

    // n5(分镜) → n6(图生图).prompt
    {
      id: 'e7',
      source: 'n5',
      sourceOutput: 'storyboard',
      target: 'n6',
      targetInput: 'prompt',
      transform: 'value.frames[0].imagePrompt',
    },

    // n6(分镜图) → n7(视频生成).imageUrl
    { id: 'e8', source: 'n6', sourceOutput: 'imageUrl', target: 'n7', targetInput: 'imageUrl' },

    // n5(分镜) → n7(视频生成).prompt
    {
      id: 'e9',
      source: 'n5',
      sourceOutput: 'storyboard',
      target: 'n7',
      targetInput: 'prompt',
      transform: 'value.frames[0].imagePrompt',
    },

    // n7(视频) → n8(合并).videoUrls
    { id: 'e10', source: 'n7', sourceOutput: 'videoUrl', target: 'n8', targetInput: 'videoUrls', transform: '[value]' },

    // n8(合并) → n9(输出).videoUrl
    { id: 'e11', source: 'n8', sourceOutput: 'videoUrl', target: 'n9', targetInput: 'videoUrl' },
  ],

  metadata: {
    author: '超级视频',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['产品宣传', '商业视频', '自动化'],
  },
}

/**
 * 模板 2: 简单文生图流程
 * 输入：文字描述
 * 输出：图片
 */
export const SimpleText2ImageTemplate: Workflow = {
  id: 'template.simple-text2image',
  name: '简单文生图',
  description: '输入文字描述，生成图片',
  category: 'custom',

  nodes: [
    { id: 'n1', blockId: 'input.text', position: { x: 0, y: 0 }, ui: { label: '描述' } },
    { id: 'n2', blockId: 'process.filter', position: { x: 200, y: 0 }, ui: { label: '内容过滤' } },
    { id: 'n3', blockId: 'generate.image', position: { x: 400, y: 0 }, ui: { label: '生成图片' } },
  ],

  edges: [
    { id: 'e1', source: 'n1', sourceOutput: 'text', target: 'n2', targetInput: 'prompt' },
    { id: 'e2', source: 'n2', sourceOutput: 'filteredPrompt', target: 'n3', targetInput: 'prompt' },
  ],

  metadata: {
    author: '超级视频',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['图片生成', '简单'],
  },
}

/**
 * 模板 3: 图片分析流程
 * 输入：图片
 * 输出：分析报告
 */
export const ImageAnalysisTemplate: Workflow = {
  id: 'template.image-analysis',
  name: '图片分析',
  description: '上传图片，智能分析内容',
  category: 'custom',

  nodes: [
    { id: 'n1', blockId: 'input.image', position: { x: 0, y: 0 }, ui: { label: '上传图片' } },
    { id: 'n2', blockId: 'process.analyze', position: { x: 200, y: 0 }, ui: { label: '内容分析' } },
    { id: 'n3', blockId: 'output.export', position: { x: 400, y: 0 }, config: { format: 'txt' }, ui: { label: '导出报告' } },
  ],

  edges: [
    { id: 'e1', source: 'n1', sourceOutput: 'imageUrl', target: 'n2', targetInput: 'mediaUrl' },
    { id: 'e2', source: 'n2', sourceOutput: 'analysis', target: 'n3', targetInput: 'asset' },
  ],

  metadata: {
    author: '超级视频',
    version: '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['图片分析', 'AI分析'],
  },
}

// 所有模板列表
export const ALL_TEMPLATES = [
  ProductPromoTemplate,
  SimpleText2ImageTemplate,
  ImageAnalysisTemplate,
]

/**
 * 创建工作流实例（从模板）
 */
export function createWorkflowFromTemplate(templateId: string): Workflow {
  const template = ALL_TEMPLATES.find(t => t.id === templateId)
  if (!template) {
    throw new Error(`Template not found: ${templateId}`)
  }

  // 深拷贝并生成新 ID
  return {
    ...JSON.parse(JSON.stringify(template)),
    id: uuid(),
    metadata: {
      ...template.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
}
