/**
 * 产品一致性引擎
 *
 * 问题：AI 生成产品画面时容易出错：
 *   - 手机摄像头数量/排列错误
 *   - Logo 位置/样式变形
 *   - 产品颜色/材质偏差
 *   - 外观细节丢失
 *
 * 解决方案：
 *   1. Claude 深度分析产品图 → 提取精确的视觉特征描述
 *   2. 生成"负面提示词"（不要做什么）
 *   3. 在分镜提示词中注入产品约束
 *   4. 建议用户提供三视图提高一致性
 */
import { generateJSON } from './claude'

export interface ProductAnalysis {
  /** 产品类型 */
  type: string
  /** 品牌 */
  brand?: string
  /** 型号 */
  model?: string
  /** 精确外观描述（英文，用于生图提示词） */
  visualPrompt: string
  /** 关键特征（不可出错的部分） */
  criticalFeatures: string[]
  /** 负面提示词（容易出错的内容） */
  negativePrompt: string
  /** 建议（是否需要三视图等） */
  suggestions: string[]
  /** 产品在画面中的呈现规则 */
  renderingRules: string
}

const SYSTEM_PROMPT = `你是一个产品视觉分析专家，擅长分析产品的外观特征并生成精确的AI生图提示词。

你的任务是：
1. 精确描述产品的结构特征（英文），**不要描述颜色**（颜色由参考图决定）
2. 特别关注容易出错的细节（摄像头数量/排列、Logo、按钮位置、材质）
3. 生成负面提示词，明确告诉AI不要做什么
4. 给出提高一致性的建议

**重要**：不要在 visualPrompt 中描述颜色（如 "black", "white", "red" 等），因为生成时会使用 image2image，颜色完全由参考图决定。`

/**
 * 深度分析产品图片，提取精确视觉特征
 */
export async function analyzeProduct(
  productDescription: string,
  imageDescriptions?: string[]
): Promise<ProductAnalysis> {
  const imageContext = imageDescriptions?.length
    ? `\n用户上传的产品图片描述：${imageDescriptions.join('；')}`
    : ''

  const prompt = `分析以下产品，生成精确的视觉描述：

产品信息：${productDescription}${imageContext}

返回 JSON：
{
  "type": "产品类型（如：智能手机、笔记本电脑、化妆品等）",
  "brand": "品牌名",
  "model": "型号",
  "visualPrompt": "精确的英文结构描述，用于AI生图。包括：外形、材质（matte/glossy/metallic等）、关键部件位置和数量。**不要描述颜色**（颜色由参考图决定）。",
  "criticalFeatures": [
    "绝不能出错的特征1（如：后置三摄排列为三角形）",
    "绝不能出错的特征2（注意：不要描述颜色特征）"
  ],
  "negativePrompt": "英文负面提示词，防止AI生错。如：extra camera lens, wrong logo position, distorted screen, wrong camera arrangement",
  "suggestions": [
    "提高一致性的建议1",
    "提高一致性的建议2"
  ],
  "renderingRules": "产品在视频画面中的呈现规则，如：手机应始终显示正确的摄像头数量和排列，保持材质一致"
}`

  return generateJSON<ProductAnalysis>(SYSTEM_PROMPT, prompt, {
    maxTokens: 2000,
    source: 'product-consistency',
  })
}

/**
 * 生成产品约束提示词
 * 注入到分镜的每一帧中，确保产品外观一致
 */
export function buildProductConstraint(analysis: ProductAnalysis): {
  /** 正面约束（追加到分镜提示词末尾） */
  positiveConstraint: string
  /** 负面提示词（追加到 negative_prompt） */
  negativeConstraint: string
} {
  const features = analysis.criticalFeatures.join(', ')

  return {
    positiveConstraint: `[PRODUCT CONSISTENCY: ${analysis.visualPrompt}. Critical details: ${features}. ${analysis.renderingRules}]`,
    negativeConstraint: analysis.negativePrompt,
  }
}

/**
 * 检测产品类型是否为"高风险"（容易生成错误的）
 */
export function isHighRiskProduct(type: string): boolean {
  const highRisk = [
    'smartphone', 'phone', '手机',
    'laptop', '笔记本',
    'watch', '手表',
    'camera', '相机',
    'car', '汽车',
    'shoe', '鞋',
  ]
  const lower = type.toLowerCase()
  return highRisk.some(r => lower.includes(r))
}

/**
 * 为高风险产品生成三视图建议
 */
export function getMultiViewSuggestion(productType: string): string | null {
  if (!isHighRiskProduct(productType)) return null

  const suggestions: Record<string, string> = {
    '手机': '建议上传手机的正面、背面、侧面三张图。重点：背面摄像头的数量和排列方式、Logo位置、边框颜色和材质。',
    'phone': '建议上传手机的正面、背面、侧面三张图。重点：背面摄像头的数量和排列方式、Logo位置、边框颜色和材质。',
    'smartphone': '建议上传手机的正面、背面、侧面三张图。重点：背面摄像头的数量和排列方式、Logo位置、边框颜色和材质。',
    '笔记本': '建议上传笔记本的打开状态和合盖状态各一张。重点：Logo位置、键盘布局、屏幕边框宽度。',
    '手表': '建议上传手表的正面和侧面各一张。重点：表盘设计、表冠位置、表带颜色材质。',
  }

  const lower = productType.toLowerCase()
  for (const [key, value] of Object.entries(suggestions)) {
    if (lower.includes(key)) return value
  }

  return '建议上传产品的多角度图片（正面、背面、侧面），有助于AI保持产品外观一致性。'
}
