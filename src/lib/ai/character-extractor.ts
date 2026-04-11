/**
 * 角色特征提取器
 * 使用Claude Vision API从图像中提取角色视觉特征
 */
import { generateJSON } from './claude'
import { logger } from '../utils/logger'

const log = logger.context('CharacterExtractor')

export interface CharacterFeatures {
  faceFeatures: {
    shape: string
    eyes: string
    hair: string
    skin: string
  }
  bodyFeatures: {
    build: string
    height: string
    pose: string
  }
  styleFeatures: {
    clothing: string
    colors: string[]
    accessories: string
  }
  detailedDescription: string
  promptKeywords: string[]
}

const SYSTEM_PROMPT = `你是专业的角色设计师和视觉分析专家。

任务：
分析图像中的角色，提取关键视觉特征，用于AI视频生成中的角色一致性控制。

重点：
1. **精确描述**：提取客观、可复现的视觉特征
2. **关键词提取**：用于图片生成提示词的简洁关键词
3. **一致性优先**：避免主观形容词，聚焦可识别的特征
4. **英文输出**：所有描述和关键词使用英文（图片生成模型效果更好）

返回纯JSON，无额外文字。`

/**
 * 从参考图像中提取角色特征
 * @param imageUrl - 角色参考图像URL（本地或远程）
 * @returns 结构化的角色特征数据
 */
export async function extractCharacterFeatures(imageUrl: string): Promise<CharacterFeatures> {
  log.info('Extracting character features from image', { imageUrl })

  // 构建Vision API请求
  const prompt = `Analyze this character image and extract key visual features.

Return a JSON object with the following structure:

{
  "faceFeatures": {
    "shape": "face shape (e.g., oval, round, square)",
    "eyes": "eye color and shape (e.g., brown almond eyes)",
    "hair": "hair style and color (e.g., long black hair, wavy)",
    "skin": "skin tone (e.g., fair, medium, tan)"
  },
  "bodyFeatures": {
    "build": "body build (e.g., athletic, slim, average)",
    "height": "relative height (e.g., tall, medium, short)",
    "pose": "typical pose or posture (e.g., standing straight, relaxed)"
  },
  "styleFeatures": {
    "clothing": "main clothing style (e.g., casual t-shirt and jeans, formal suit)",
    "colors": ["dominant", "color", "palette"],
    "accessories": "accessories (e.g., glasses, hat, watch, none)"
  },
  "detailedDescription": "A detailed English description of the character for AI image generation prompts (50-80 words). Focus on objective, reproducible visual features that ensure consistency across multiple generated images.",
  "promptKeywords": ["keyword1", "keyword2", "keyword3", "..."]
}

Important:
- Be specific and objective
- Use simple, clear English
- Focus on visual features that can be consistently reproduced
- Avoid subjective adjectives like "beautiful", "elegant" (unless describing style)
- Extract 10-15 keywords for image generation prompts`

  try {
    // 调用Claude Vision API
    const result = await generateJSON<CharacterFeatures>(
      SYSTEM_PROMPT,
      prompt,
      {
        maxTokens: 2000,
        source: 'character-extractor',
        images: [imageUrl], // Vision API支持
      }
    )

    // 验证返回结构
    if (!result.faceFeatures || !result.bodyFeatures || !result.styleFeatures) {
      throw new Error('提取的特征数据不完整')
    }

    // 确保colors是数组
    if (!Array.isArray(result.styleFeatures.colors)) {
      result.styleFeatures.colors = []
    }

    // 确保promptKeywords是数组
    if (!Array.isArray(result.promptKeywords)) {
      result.promptKeywords = []
    }

    log.info('Character features extracted successfully', {
      hasAllFeatures: !!(result.faceFeatures && result.bodyFeatures && result.styleFeatures),
      keywordsCount: result.promptKeywords.length,
      colorsCount: result.styleFeatures.colors.length,
    })

    return result
  } catch (error: any) {
    log.error('Failed to extract character features', error)
    throw new Error(`角色特征提取失败: ${error.message}`)
  }
}

/**
 * 将特征数据转换为提示词约束
 * @param features - 角色特征数据
 * @returns 用于图片生成的提示词约束字符串
 */
export function featuresToPromptConstraint(features: CharacterFeatures): string {
  const constraints: string[] = []

  // 面部特征
  if (features.faceFeatures.hair) {
    constraints.push(features.faceFeatures.hair)
  }
  if (features.faceFeatures.eyes) {
    constraints.push(features.faceFeatures.eyes)
  }
  if (features.faceFeatures.skin) {
    constraints.push(features.faceFeatures.skin)
  }

  // 体型特征
  if (features.bodyFeatures.build) {
    constraints.push(`${features.bodyFeatures.build} build`)
  }

  // 服装风格
  if (features.styleFeatures.clothing) {
    constraints.push(features.styleFeatures.clothing)
  }

  // 配色
  if (features.styleFeatures.colors.length > 0) {
    constraints.push(`color palette: ${features.styleFeatures.colors.join(', ')}`)
  }

  // 配饰
  if (features.styleFeatures.accessories && features.styleFeatures.accessories !== 'none') {
    constraints.push(features.styleFeatures.accessories)
  }

  return constraints.join(', ')
}

/**
 * 生成简洁的角色描述（用于提示词前缀）
 * @param features - 角色特征数据
 * @returns 10词以内的简洁描述
 */
export function generateCharacterPrefix(features: CharacterFeatures): string {
  const keywords = features.promptKeywords.slice(0, 8) // 取前8个关键词
  return keywords.join(', ')
}
