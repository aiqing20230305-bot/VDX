import 'server-only'
import { db } from '@/lib/db/client'
import { extractCharacterFeatures, cosineSimilarity } from './character-engine'
import type { Character, CharacterFeatures } from '@/types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('ConsistencyEngine')

/**
 * 生成增强提示词（注入角色特征）
 *
 * 将原始提示词与角色的视觉特征结合，确保生成的图片包含角色的关键特征
 *
 * @param originalPrompt - 原始场景描述
 * @param character - 角色实体
 * @param features - 角色特征
 * @returns 增强后的提示词
 *
 * @example
 * 原始: "一个女孩在公园散步"
 * 增强: "一个女孩在公园散步，长黑发、圆脸、匀称体型、白色连衣裙、白色"
 */
export function enhancePromptWithCharacter(
  originalPrompt: string,
  character: Character,
  features: CharacterFeatures
): string {
  const { face, body, style } = features

  // 提取关键视觉特征词
  const keywords: string[] = [
    face.hair,        // 发型发色
    face.shape,       // 脸型
    body.build,       // 体型
    style.clothing,   // 服装
    ...style.colors,  // 配色
  ].filter(Boolean)

  // 构建增强提示词：原始描述 + 关键特征 + 详细描述
  const keywordsPart = keywords.join('、')
  const enhancedPrompt = `${originalPrompt}，${keywordsPart}`

  log.debug('提示词增强:', {
    original: originalPrompt,
    keywords: keywordsPart,
    enhanced: enhancedPrompt.slice(0, 100) + '...',
  })

  return enhancedPrompt
}

/**
 * 生成参考图参数（用于 image2image）
 *
 * @param character - 角色实体
 * @param strength - 参考强度 (0-1)，默认 0.7
 * @returns 参考图配置
 */
export function getCharacterReferenceParams(
  character: Character,
  strength: number = 0.7
): {
  referenceImageUrl: string
  referenceStrength: number
} {
  return {
    referenceImageUrl: character.referenceImageUrl,
    referenceStrength: Math.max(0, Math.min(1, strength)), // 确保在 [0, 1] 范围内
  }
}

/**
 * 验证生成结果的一致性
 *
 * 提取生成图片的特征，与原始角色特征计算相似度
 *
 * @param generatedImageUrl - 生成的图片 URL
 * @param characterId - 原始角色 ID
 * @param threshold - 一致性阈值 (0-1)，默认 0.85
 * @returns 一致性验证结果
 */
export async function verifyConsistency(
  generatedImageUrl: string,
  characterId: string,
  threshold: number = 0.85
): Promise<{
  consistent: boolean
  similarity: number
  details?: {
    faceSimilarity?: number
    styleSimilarity?: number
  }
}> {
  log.info('开始一致性验证:', {
    characterId,
    threshold,
  })

  try {
    // 1. 提取生成图片的特征
    const generatedFeatures = await extractCharacterFeatures(generatedImageUrl)

    // 2. 查询原始角色特征
    const originalCharacter = await db.character.findUnique({
      where: { id: characterId },
      include: { features: true },
    })

    if (!originalCharacter || !originalCharacter.features) {
      log.warn('未找到原始角色特征:', characterId)
      return { consistent: false, similarity: 0 }
    }

    // 3. 解析原始特征的 embedding
    const originalEmbedding = JSON.parse(originalCharacter.features.embedding) as number[]

    // 4. 计算余弦相似度
    const similarity = cosineSimilarity(
      generatedFeatures.embedding,
      originalEmbedding
    )

    // 5. 判断是否一致
    const consistent = similarity >= threshold

    log.info('一致性验证结果:', {
      similarity: similarity.toFixed(3),
      threshold,
      consistent,
    })

    return {
      consistent,
      similarity,
      details: {
        // 可以在这里添加更细粒度的相似度（面部、风格等）
        // 目前只使用全局 embedding 相似度
      },
    }

  } catch (error) {
    log.error('一致性验证失败:', error)
    return {
      consistent: false,
      similarity: 0,
    }
  }
}

/**
 * 批量增强提示词（用于多帧分镜）
 *
 * @param prompts - 原始提示词数组
 * @param character - 角色实体
 * @param features - 角色特征
 * @returns 增强后的提示词数组
 */
export function enhancePromptsWithCharacter(
  prompts: string[],
  character: Character,
  features: CharacterFeatures
): string[] {
  return prompts.map(prompt => enhancePromptWithCharacter(prompt, character, features))
}

/**
 * 获取角色的简短描述（用于UI展示）
 *
 * @param features - 角色特征
 * @returns 简短描述字符串
 */
export function getCharacterShortDescription(features: CharacterFeatures): string {
  const { face, style } = features
  return `${face.hair}、${style.clothing}`
}
