/**
 * 角色特征提取器测试
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  extractCharacterFeatures,
  featuresToPromptConstraint,
  generateCharacterPrefix,
  type CharacterFeatures,
} from '../character-extractor'
import * as claude from '../claude'

vi.mock('../claude')

describe('Character Extractor', () => {
  const mockFeatures: CharacterFeatures = {
    faceFeatures: {
      shape: 'oval',
      eyes: 'brown almond eyes',
      hair: 'long black hair, wavy',
      skin: 'fair',
    },
    bodyFeatures: {
      build: 'slim',
      height: 'medium',
      pose: 'standing straight',
    },
    styleFeatures: {
      clothing: 'casual t-shirt and jeans',
      colors: ['white', 'blue', 'denim'],
      accessories: 'none',
    },
    detailedDescription:
      'A young woman with an oval face, brown almond eyes, long wavy black hair, and fair skin. She has a slim build of medium height, standing straight. She wears a casual white t-shirt and blue denim jeans.',
    promptKeywords: [
      'young woman',
      'oval face',
      'brown almond eyes',
      'long wavy black hair',
      'fair skin',
      'slim build',
      'casual clothing',
      'white t-shirt',
      'blue jeans',
      'standing straight',
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractCharacterFeatures', () => {
    it('应该成功提取角色特征', async () => {
      vi.spyOn(claude, 'generateJSON').mockResolvedValue(mockFeatures)

      const result = await extractCharacterFeatures('https://example.com/character.jpg')

      expect(result).toEqual(mockFeatures)
      expect(result.faceFeatures).toBeDefined()
      expect(result.bodyFeatures).toBeDefined()
      expect(result.styleFeatures).toBeDefined()
      expect(result.detailedDescription).toBeTruthy()
      expect(result.promptKeywords.length).toBeGreaterThan(0)
    })

    it('应该验证返回结构的完整性', async () => {
      const incompleteFeatures = {
        faceFeatures: { shape: 'oval' },
        // 缺少bodyFeatures和styleFeatures
      }

      vi.spyOn(claude, 'generateJSON').mockResolvedValue(incompleteFeatures)

      await expect(extractCharacterFeatures('https://example.com/character.jpg'))
        .rejects.toThrow('提取的特征数据不完整')
    })

    it('应该确保colors和promptKeywords是数组', async () => {
      const featuresWithNonArrays = {
        ...mockFeatures,
        styleFeatures: {
          ...mockFeatures.styleFeatures,
          colors: 'blue, white' as any, // 错误的类型
        },
        promptKeywords: 'keyword1, keyword2' as any, // 错误的类型
      }

      vi.spyOn(claude, 'generateJSON').mockResolvedValue(featuresWithNonArrays)

      const result = await extractCharacterFeatures('https://example.com/character.jpg')

      expect(Array.isArray(result.styleFeatures.colors)).toBe(true)
      expect(Array.isArray(result.promptKeywords)).toBe(true)
    })

    it('应该调用Claude Vision API并传递图片URL', async () => {
      const generateJSONSpy = vi.spyOn(claude, 'generateJSON').mockResolvedValue(mockFeatures)

      await extractCharacterFeatures('https://example.com/character.jpg')

      expect(generateJSONSpy).toHaveBeenCalledWith(
        expect.any(String), // systemPrompt
        expect.any(String), // userPrompt
        expect.objectContaining({
          images: ['https://example.com/character.jpg'],
          source: 'character-extractor',
        })
      )
    })
  })

  describe('featuresToPromptConstraint', () => {
    it('应该将特征转换为提示词约束字符串', () => {
      const constraint = featuresToPromptConstraint(mockFeatures)

      expect(constraint).toContain('long black hair, wavy')
      expect(constraint).toContain('brown almond eyes')
      expect(constraint).toContain('fair')
      expect(constraint).toContain('slim build')
      expect(constraint).toContain('casual t-shirt and jeans')
      expect(constraint).toContain('color palette: white, blue, denim')
    })

    it('应该跳过accessories为none的情况', () => {
      const constraint = featuresToPromptConstraint(mockFeatures)

      expect(constraint).not.toContain('none')
    })

    it('应该包含accessories不为none的情况', () => {
      const featuresWithAccessories = {
        ...mockFeatures,
        styleFeatures: {
          ...mockFeatures.styleFeatures,
          accessories: 'glasses, watch',
        },
      }

      const constraint = featuresToPromptConstraint(featuresWithAccessories)

      expect(constraint).toContain('glasses, watch')
    })
  })

  describe('generateCharacterPrefix', () => {
    it('应该生成简洁的角色描述前缀', () => {
      const prefix = generateCharacterPrefix(mockFeatures)

      expect(prefix).toContain('young woman')
      expect(prefix).toContain('oval face')
      expect(prefix).toContain('brown almond eyes')

      // 应该限制在前8个关键词
      const keywords = prefix.split(', ')
      expect(keywords.length).toBeLessThanOrEqual(8)
    })

    it('应该处理关键词少于8个的情况', () => {
      const featuresWithFewKeywords = {
        ...mockFeatures,
        promptKeywords: ['woman', 'black hair', 'slim'],
      }

      const prefix = generateCharacterPrefix(featuresWithFewKeywords)

      expect(prefix).toBe('woman, black hair, slim')
    })
  })
})
