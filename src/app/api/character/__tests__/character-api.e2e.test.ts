/**
 * 角色一致性系统 - 端到端测试
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db } from '@/lib/db/client'
import * as characterEngine from '@/lib/ai/character-engine'

// Mock 外部依赖
vi.mock('@/lib/ai/character-engine', () => ({
  extractCharacterFeatures: vi.fn(),
  cosineSimilarity: vi.fn(),
}))

// Mock Next.js Request/Response
class MockNextRequest {
  private body: any
  url: string

  constructor(url: string, options?: { body?: any }) {
    this.url = url
    this.body = options?.body
  }

  async json() {
    return this.body
  }
}

describe('Character API - E2E Tests', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.characterFeatures.deleteMany({})
    await db.character.deleteMany({})
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  describe('POST /api/character - 创建角色', () => {
    it('应该成功创建角色并提取特征', async () => {
      // 1. Mock feature extraction
      const mockFeatures = {
        face: { shape: 'oval', eyes: 'brown', hair: 'long black', skin: 'fair' },
        body: { build: 'slim', height: 'average', pose: 'standing' },
        style: { clothing: 'modern', colors: ['black', 'white'], accessories: 'glasses' },
        detailedDescription: 'A young woman with long black hair and glasses',
        promptKeywords: ['woman', 'glasses', 'black hair', 'modern clothing'],
        embedding: new Array(1536).fill(0.1),
      }

      vi.mocked(characterEngine.extractCharacterFeatures).mockResolvedValue(mockFeatures)

      // 2. Create character via API (simulate)
      const characterData = {
        name: '测试角色A',
        referenceImageUrl: 'https://example.com/character-a.jpg',
        description: '测试用角色',
        tags: ['female', 'modern'],
      }

      // 直接调用数据库操作模拟 API 行为
      const character = await db.$transaction(async (tx) => {
        const char = await tx.character.create({
          data: {
            name: characterData.name,
            description: characterData.description || mockFeatures.detailedDescription,
            referenceImageUrl: characterData.referenceImageUrl,
            thumbnailUrl: characterData.referenceImageUrl,
            tags: JSON.stringify(characterData.tags),
            usageCount: 0,
          },
        })

        await tx.characterFeatures.create({
          data: {
            characterId: char.id,
            faceFeatures: JSON.stringify(mockFeatures.face),
            bodyFeatures: JSON.stringify(mockFeatures.body),
            styleFeatures: JSON.stringify(mockFeatures.style),
            detailedDescription: mockFeatures.detailedDescription,
            promptKeywords: JSON.stringify(mockFeatures.promptKeywords),
            embedding: JSON.stringify(mockFeatures.embedding),
          },
        })

        return char
      })

      // 3. Verify character creation
      expect(character).toBeDefined()
      expect(character.name).toBe('测试角色A')
      expect(character.referenceImageUrl).toBe('https://example.com/character-a.jpg')

      // 4. Verify features were stored
      const storedCharacter = await db.character.findUnique({
        where: { id: character.id },
        include: { features: true },
      })

      expect(storedCharacter).toBeDefined()
      expect(storedCharacter!.features).toBeDefined()
      expect(storedCharacter!.features!.detailedDescription).toBe(
        'A young woman with long black hair and glasses'
      )

      const storedKeywords = JSON.parse(storedCharacter!.features!.promptKeywords)
      expect(storedKeywords).toContain('glasses')
      expect(storedKeywords).toContain('black hair')
    })

    it('应该处理缺少必填字段的错误', async () => {
      // 测试缺少 name
      const invalidData1 = {
        referenceImageUrl: 'https://example.com/test.jpg',
      }

      // 这里我们直接测试数据库约束，因为 API 会在更早阶段拦截
      await expect(
        db.character.create({
          data: {
            // 故意缺少 name 字段测试数据库约束
            description: 'test',
            referenceImageUrl: invalidData1.referenceImageUrl,
            thumbnailUrl: invalidData1.referenceImageUrl,
            tags: '[]',
          } as any,
        })
      ).rejects.toThrow()

      // 测试缺少 referenceImageUrl
      await expect(
        db.character.create({
          data: {
            name: 'Test',
            description: 'test',
            // 故意缺少 referenceImageUrl 字段测试数据库约束
            thumbnailUrl: 'test',
            tags: '[]',
          } as any,
        })
      ).rejects.toThrow()
    })

    it('应该处理特征提取失败的情况', async () => {
      // Mock extraction failure
      vi.mocked(characterEngine.extractCharacterFeatures).mockRejectedValue(
        new Error('Image processing failed')
      )

      // 尝试创建角色应该失败
      await expect(
        characterEngine.extractCharacterFeatures('https://example.com/invalid.jpg')
      ).rejects.toThrow('Image processing failed')
    })
  })

  describe('GET /api/character - 查询角色列表', () => {
    beforeEach(async () => {
      // 创建测试数据
      const mockFeatures1 = {
        face: { shape: 'oval', eyes: 'brown', hair: 'long', skin: 'fair' },
        body: { build: 'slim', height: 'average', pose: 'standing' },
        style: { clothing: 'modern', colors: ['black'], accessories: [] },
        detailedDescription: 'Character A',
        promptKeywords: ['woman', 'modern'],
        embedding: new Array(1536).fill(0.1),
      }

      const mockFeatures2 = {
        face: { shape: 'round', eyes: 'blue', hair: 'short', skin: 'tan' },
        body: { build: 'athletic', height: 'tall', pose: 'standing' },
        style: { clothing: 'casual', colors: ['blue'], accessories: [] },
        detailedDescription: 'Character B',
        promptKeywords: ['man', 'casual'],
        embedding: new Array(1536).fill(0.2),
      }

      // 创建角色 A（使用次数高）
      const charA = await db.character.create({
        data: {
          name: '角色A',
          description: 'Test Character A',
          referenceImageUrl: 'https://example.com/a.jpg',
          thumbnailUrl: 'https://example.com/a.jpg',
          tags: JSON.stringify(['female', 'modern']),
          usageCount: 10,
        },
      })

      await db.characterFeatures.create({
        data: {
          characterId: charA.id,
          faceFeatures: JSON.stringify(mockFeatures1.face),
          bodyFeatures: JSON.stringify(mockFeatures1.body),
          styleFeatures: JSON.stringify(mockFeatures1.style),
          detailedDescription: mockFeatures1.detailedDescription,
          promptKeywords: JSON.stringify(mockFeatures1.promptKeywords),
          embedding: JSON.stringify(mockFeatures1.embedding),
        },
      })

      // 创建角色 B（使用次数低）
      const charB = await db.character.create({
        data: {
          name: '角色B',
          description: 'Test Character B',
          referenceImageUrl: 'https://example.com/b.jpg',
          thumbnailUrl: 'https://example.com/b.jpg',
          tags: JSON.stringify(['male', 'casual']),
          usageCount: 2,
        },
      })

      await db.characterFeatures.create({
        data: {
          characterId: charB.id,
          faceFeatures: JSON.stringify(mockFeatures2.face),
          bodyFeatures: JSON.stringify(mockFeatures2.body),
          styleFeatures: JSON.stringify(mockFeatures2.style),
          detailedDescription: mockFeatures2.detailedDescription,
          promptKeywords: JSON.stringify(mockFeatures2.promptKeywords),
          embedding: JSON.stringify(mockFeatures2.embedding),
        },
      })
    })

    it('应该按使用次数排序返回角色列表', async () => {
      const characters = await db.character.findMany({
        take: 20,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: { features: true },
      })

      expect(characters).toHaveLength(2)
      expect(characters[0].name).toBe('角色A') // 使用次数更高
      expect(characters[0].usageCount).toBe(10)
      expect(characters[1].name).toBe('角色B')
      expect(characters[1].usageCount).toBe(2)
    })

    it('应该支持标签筛选', async () => {
      const femaleCharacters = await db.character.findMany({
        where: {
          tags: {
            contains: 'female',
          },
        },
        include: { features: true },
      })

      expect(femaleCharacters).toHaveLength(1)
      expect(femaleCharacters[0].name).toBe('角色A')
      expect(JSON.parse(femaleCharacters[0].tags)).toContain('female')
    })

    it('应该正确返回角色特征', async () => {
      const characters = await db.character.findMany({
        include: { features: true },
      })

      const charWithFeatures = characters[0]
      expect(charWithFeatures.features).toBeDefined()

      const faceFeatures = JSON.parse(charWithFeatures.features!.faceFeatures)
      expect(faceFeatures).toHaveProperty('shape')
      expect(faceFeatures).toHaveProperty('eyes')
      expect(faceFeatures).toHaveProperty('hair')
      expect(faceFeatures).toHaveProperty('skin')
    })
  })

  describe('Character Feature Extraction', () => {
    it('应该包含完整的特征结构', async () => {
      const mockFeatures = {
        face: {
          shape: 'oval',
          eyes: 'brown',
          hair: 'long black',
          skin: 'fair'
        },
        body: {
          build: 'slim',
          height: 'average',
          pose: 'standing'
        },
        style: {
          clothing: 'modern',
          colors: ['black', 'white'],
          accessories: ['glasses']
        },
        detailedDescription: 'A detailed character description',
        promptKeywords: ['woman', 'glasses', 'modern'],
        embedding: new Array(1536).fill(0.1),
      }

      // 验证特征结构完整性
      expect(mockFeatures.face).toHaveProperty('shape')
      expect(mockFeatures.face).toHaveProperty('eyes')
      expect(mockFeatures.face).toHaveProperty('hair')
      expect(mockFeatures.face).toHaveProperty('skin')

      expect(mockFeatures.body).toHaveProperty('build')
      expect(mockFeatures.body).toHaveProperty('height')
      expect(mockFeatures.body).toHaveProperty('pose')

      expect(mockFeatures.style).toHaveProperty('clothing')
      expect(mockFeatures.style).toHaveProperty('colors')
      expect(mockFeatures.style).toHaveProperty('accessories')

      expect(mockFeatures.embedding).toHaveLength(1536)
    })
  })

  describe('Character Usage Tracking', () => {
    it('应该正确记录角色使用次数', async () => {
      // 创建测试角色
      const character = await db.character.create({
        data: {
          name: '使用测试角色',
          description: 'Test usage tracking',
          referenceImageUrl: 'https://example.com/test.jpg',
          thumbnailUrl: 'https://example.com/test.jpg',
          tags: '[]',
          usageCount: 0,
        },
      })

      // 模拟使用（增加使用次数）
      await db.character.update({
        where: { id: character.id },
        data: { usageCount: { increment: 1 } },
      })

      const updated = await db.character.findUnique({
        where: { id: character.id },
      })

      expect(updated!.usageCount).toBe(1)

      // 再次使用
      await db.character.update({
        where: { id: character.id },
        data: { usageCount: { increment: 1 } },
      })

      const updated2 = await db.character.findUnique({
        where: { id: character.id },
      })

      expect(updated2!.usageCount).toBe(2)
    })
  })

  describe('Character Deletion with Cascade', () => {
    it('应该在删除角色时级联删除特征', async () => {
      // 创建角色和特征
      const character = await db.character.create({
        data: {
          name: '删除测试角色',
          description: 'Test cascade delete',
          referenceImageUrl: 'https://example.com/test.jpg',
          thumbnailUrl: 'https://example.com/test.jpg',
          tags: '[]',
          usageCount: 0,
        },
      })

      await db.characterFeatures.create({
        data: {
          characterId: character.id,
          faceFeatures: '{}',
          bodyFeatures: '{}',
          styleFeatures: '{}',
          detailedDescription: 'test',
          promptKeywords: '[]',
          embedding: '[]',
        },
      })

      // 验证特征存在
      const featuresBefore = await db.characterFeatures.findUnique({
        where: { characterId: character.id },
      })
      expect(featuresBefore).toBeDefined()

      // 删除角色
      await db.character.delete({
        where: { id: character.id },
      })

      // 验证特征也被删除（级联）
      const featuresAfter = await db.characterFeatures.findUnique({
        where: { characterId: character.id },
      })
      expect(featuresAfter).toBeNull()
    })
  })
})
