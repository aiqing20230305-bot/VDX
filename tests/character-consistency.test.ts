/**
 * 角色一致性系统测试套件
 *
 * 测试范围：
 * 1. API 测试（/api/character）
 * 2. 特征提取引擎测试
 * 3. 一致性约束引擎测试
 * 4. 性能测试
 */

import { describe, it, expect, beforeAll } from 'vitest'

// Test data
const TEST_CHARACTER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // 1x1 pixel test image

// 集成测试：需要运行服务器和数据库
// 使用 npm run dev 启动服务器后运行这些测试
// 注意：当前PPIO代理不支持Claude 4.6模型，需要使用官方API或支持的代理
describe.skip('Character Consistency System', () => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  let testCharacterId: string

  describe('API: /api/character', () => {
    it('POST /api/character - 创建角色（成功）', async () => {
      const response = await fetch(`${apiBase}/api/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试角色A',
          referenceImageUrl: TEST_CHARACTER_IMAGE,
          description: '测试用角色',
          tags: ['测试', '女性'],
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.character).toHaveProperty('id')
      expect(data.character.name).toBe('测试角色A')

      testCharacterId = data.character.id
    }, 30000) // 30秒超时（包含 Claude Vision + OpenAI Embeddings）

    it('POST /api/character - 缺少必需字段（失败）', async () => {
      const response = await fetch(`${apiBase}/api/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试角色B',
          // missing referenceImageUrl
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    it('GET /api/character - 查询所有角色', async () => {
      const response = await fetch(`${apiBase}/api/character?limit=10`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.characters)).toBe(true)
      expect(data.characters.length).toBeGreaterThanOrEqual(1)
    })

    it('GET /api/character - 语义搜索', async () => {
      const response = await fetch(`${apiBase}/api/character?search=测试&limit=5`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.characters)).toBe(true)

      // 如果有结果，应该包含相似度分数
      if (data.characters.length > 0) {
        expect(data.characters[0]).toHaveProperty('similarity')
      }
    })

    it('GET /api/character - 标签筛选', async () => {
      const response = await fetch(`${apiBase}/api/character?tags=测试`)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })
  })

  describe('性能测试', () => {
    it('特征提取应在 3 秒内完成', async () => {
      const startTime = Date.now()

      const { extractCharacterFeatures } = await import('@/lib/ai/character-engine')
      await extractCharacterFeatures(TEST_CHARACTER_IMAGE)

      const duration = Date.now() - startTime
      console.log(`特征提取耗时: ${duration}ms`)

      expect(duration).toBeLessThan(3000)
    }, 10000)

    it('角色库搜索应在 500ms 内完成', async () => {
      const startTime = Date.now()

      await fetch(`${apiBase}/api/character?limit=20`)

      const duration = Date.now() - startTime
      console.log(`角色库搜索耗时: ${duration}ms`)

      expect(duration).toBeLessThan(500)
    })

    it('相似度计算应在 10ms 内完成', () => {
      const { cosineSimilarity } = require('@/lib/ai/character-engine')

      const vec1 = new Array(1536).fill(0.1)
      const vec2 = new Array(1536).fill(0.2)

      const startTime = Date.now()
      const similarity = cosineSimilarity(vec1, vec2)
      const duration = Date.now() - startTime

      console.log(`相似度计算耗时: ${duration}ms`)

      expect(duration).toBeLessThan(10)
      expect(similarity).toBeGreaterThanOrEqual(0)
      expect(similarity).toBeLessThanOrEqual(1)
    })
  })

  describe('一致性约束引擎', () => {
    it('enhancePromptWithCharacter - 提示词增强', async () => {
      const { enhancePromptWithCharacter } = await import('@/lib/ai/consistency-engine')

      const character = {
        id: 'test-id',
        name: '小红',
        referenceImageUrl: TEST_CHARACTER_IMAGE,
        tags: [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const features = {
        face: {
          shape: '圆脸',
          eyes: '大眼睛',
          hair: '长黑发',
          skin: '白皙',
        },
        body: {
          build: '纤瘦',
          height: '高挑',
          pose: '站立',
        },
        style: {
          clothing: '白色连衣裙',
          colors: ['白色', '蓝色'],
          accessories: '项链',
        },
        detailedDescription: '一个穿着白色连衣裙的女孩',
        promptKeywords: ['女孩', '白色', '连衣裙'],
        embedding: new Array(1536).fill(0),
      }

      const originalPrompt = '一个女孩在公园散步'
      const enhanced = enhancePromptWithCharacter(originalPrompt, character, features)

      expect(enhanced).toContain(originalPrompt)
      expect(enhanced).toContain('长黑发')
      expect(enhanced).toContain('圆脸')
      expect(enhanced).toContain('白色连衣裙')
    })

    it('getCharacterReferenceParams - 参考图参数', async () => {
      const { getCharacterReferenceParams } = await import('@/lib/ai/consistency-engine')

      const character = {
        id: 'test-id',
        name: '小红',
        referenceImageUrl: 'https://example.com/image.jpg',
        tags: [],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const params = getCharacterReferenceParams(character)

      expect(params.referenceImageUrl).toBe('https://example.com/image.jpg')
      expect(params.referenceStrength).toBeGreaterThanOrEqual(0)
      expect(params.referenceStrength).toBeLessThanOrEqual(1)
    })
  })

  describe('边界情况测试', () => {
    it('空 embedding 向量的相似度计算', () => {
      const { cosineSimilarity } = require('@/lib/ai/character-engine')

      const vec1 = new Array(1536).fill(0)
      const vec2 = new Array(1536).fill(0)

      const similarity = cosineSimilarity(vec1, vec2)

      // 零向量的相似度应为 0（避免 NaN）
      expect(similarity).toBe(0)
    })

    it('维度不匹配的向量相似度计算应抛出错误', () => {
      const { cosineSimilarity } = require('@/lib/ai/character-engine')

      const vec1 = new Array(100).fill(0.1)
      const vec2 = new Array(200).fill(0.2)

      expect(() => {
        cosineSimilarity(vec1, vec2)
      }).toThrow('Vector dimensions must match')
    })

    it('无效的图片 URL 应返回错误', async () => {
      const response = await fetch(`${apiBase}/api/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '测试角色C',
          referenceImageUrl: 'invalid-url',
        }),
      })

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeTruthy()
    }, 10000)
  })
})

describe.skip('集成测试', () => {
  it('完整流程：创建角色 → 查询 → 生成分镜', async () => {
    // 1. 创建角色
    const createResponse = await fetch(`http://localhost:3000/api/character`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '集成测试角色',
        referenceImageUrl: TEST_CHARACTER_IMAGE,
      }),
    })

    expect(createResponse.status).toBe(200)
    const createData = await createResponse.json()
    const characterId = createData.character.id

    // 2. 查询角色
    const getResponse = await fetch(`http://localhost:3000/api/character?limit=10`)
    expect(getResponse.status).toBe(200)
    const getData = await getResponse.json()
    expect(getData.characters.some((c: any) => c.id === characterId)).toBe(true)

    // 3. 使用角色生成分镜（模拟）
    const { generateStoryboard } = await import('@/lib/ai/storyboard-engine')

    const mockScript = {
      id: 'test-script-id',
      title: '测试脚本',
      logline: '测试',
      theme: '测试主题',
      style: 'realistic',
      duration: 10,
      aspectRatio: '9:16' as const,
      scenes: [
        {
          index: 0,
          duration: 5,
          visual: '一个女孩在公园',
          cameraMove: '固定',
        },
        {
          index: 1,
          duration: 5,
          visual: '女孩微笑',
          cameraMove: '推进',
        },
      ],
      generationPrompt: '',
      createdAt: new Date(),
      projectId: null,
    }

    // 注意：实际生成会调用 Claude API，这里只是验证函数签名
    // 完整测试需要 mock Claude API 或在集成环境中运行
    expect(generateStoryboard).toBeDefined()
    expect(typeof generateStoryboard).toBe('function')
  }, 60000)
})
