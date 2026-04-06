import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { extractCharacterFeatures, cosineSimilarity } from '@/lib/ai/character-engine'
import type { Character, CharacterFeatures } from '@/types'

/**
 * POST /api/character
 * 创建新角色
 *
 * Body: {
 *   name: string
 *   referenceImageUrl: string (HTTP URL or base64 data URL)
 *   description?: string
 *   tags?: string[]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, referenceImageUrl, description, tags = [] } = body

    if (!name || !referenceImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, referenceImageUrl' },
        { status: 400 }
      )
    }

    console.log('[Character API] 创建角色:', { name, tags })

    // 1. 提取特征
    const features = await extractCharacterFeatures(referenceImageUrl)

    // 2. 存储到数据库（使用 transaction）
    const character = await db.$transaction(async (tx) => {
      // 创建角色记录
      const char = await tx.character.create({
        data: {
          name,
          description: description || features.detailedDescription,
          referenceImageUrl,
          thumbnailUrl: referenceImageUrl, // 暂时使用原图作为缩略图
          tags: JSON.stringify(tags),
          usageCount: 0,
        },
      })

      // 创建特征记录
      await tx.characterFeatures.create({
        data: {
          characterId: char.id,
          faceFeatures: JSON.stringify(features.face),
          bodyFeatures: JSON.stringify(features.body),
          styleFeatures: JSON.stringify(features.style),
          detailedDescription: features.detailedDescription,
          promptKeywords: JSON.stringify(features.promptKeywords),
          embedding: JSON.stringify(features.embedding),
        },
      })

      return char
    })

    console.log('[Character API] 角色创建成功:', character.id)

    // 3. 返回完整角色信息（包含特征）
    const fullCharacter = await db.character.findUnique({
      where: { id: character.id },
      include: { features: true },
    })

    return NextResponse.json({
      success: true,
      character: serializeCharacter(fullCharacter!),
    })

  } catch (error) {
    console.error('[Character API] 创建失败:', error)
    return NextResponse.json(
      {
        error: '角色创建失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/character
 * 查询角色列表
 *
 * Query params:
 *   search?: string   - 语义搜索（基于 embedding 相似度）
 *   limit?: number    - 返回数量限制（默认 20）
 *   tags?: string     - 逗号分隔的标签列表
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const searchQuery = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tagsFilter = searchParams.get('tags')

    console.log('[Character API] 查询角色:', { searchQuery, limit, tagsFilter })

    if (searchQuery) {
      // 语义搜索（基于 embedding 相似度）
      return await handleSemanticSearch(searchQuery, limit)
    } else {
      // 普通查询（按使用次数或创建时间排序）
      const characters = await db.character.findMany({
        take: limit,
        orderBy: [
          { usageCount: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          features: true,
        },
        where: tagsFilter ? {
          tags: {
            contains: tagsFilter, // 简单的标签包含搜索
          },
        } : undefined,
      })

      return NextResponse.json({
        success: true,
        characters: characters.map(serializeCharacter),
        total: characters.length,
      })
    }

  } catch (error) {
    console.error('[Character API] 查询失败:', error)
    return NextResponse.json(
      {
        error: '角色查询失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * 语义搜索（基于 embedding 相似度）
 * 由于 SQLite 不支持向量搜索，在应用层计算相似度
 */
async function handleSemanticSearch(query: string, limit: number) {
  // 1. 获取所有角色和特征
  const allCharacters = await db.character.findMany({
    include: { features: true },
  })

  if (allCharacters.length === 0) {
    return NextResponse.json({
      success: true,
      characters: [],
      total: 0,
    })
  }

  // 2. 生成查询的 embedding
  const { extractCharacterFeatures } = await import('@/lib/ai/character-engine')
  // 这里我们没有图片，只能基于文本生成 embedding
  // 简化处理：使用 OpenAI embedding API
  let queryEmbedding: number[]

  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    queryEmbedding = data.data[0].embedding
  } catch (error) {
    console.error('[Character API] Embedding 生成失败:', error)
    // 降级：返回按使用次数排序的结果
    return NextResponse.json({
      success: true,
      characters: allCharacters
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, limit)
        .map(serializeCharacter),
      total: allCharacters.length,
      warning: 'Semantic search unavailable, fallback to usage ranking',
    })
  }

  // 3. 计算相似度并排序
  const charactersWithSimilarity = allCharacters.map(char => {
    if (!char.features) {
      return { character: char, similarity: 0 }
    }

    const embedding = JSON.parse(char.features.embedding) as number[]
    const similarity = cosineSimilarity(queryEmbedding, embedding)

    return { character: char, similarity }
  })

  charactersWithSimilarity.sort((a, b) => b.similarity - a.similarity)

  // 4. 返回前 N 个结果
  const topResults = charactersWithSimilarity
    .slice(0, limit)
    .map(({ character, similarity }) => ({
      ...serializeCharacter(character),
      similarity,
    }))

  return NextResponse.json({
    success: true,
    characters: topResults,
    total: allCharacters.length,
  })
}

/**
 * 序列化角色对象（解析 JSON 字段）
 */
function serializeCharacter(char: any): Omit<Character, 'features'> & { features?: CharacterFeatures } {
  const features = char.features ? {
    face: JSON.parse(char.features.faceFeatures),
    body: JSON.parse(char.features.bodyFeatures),
    style: JSON.parse(char.features.styleFeatures),
    detailedDescription: char.features.detailedDescription,
    promptKeywords: JSON.parse(char.features.promptKeywords),
    embedding: JSON.parse(char.features.embedding),
  } as CharacterFeatures : undefined

  return {
    id: char.id,
    name: char.name,
    description: char.description,
    referenceImageUrl: char.referenceImageUrl,
    thumbnailUrl: char.thumbnailUrl,
    tags: JSON.parse(char.tags),
    usageCount: char.usageCount,
    createdAt: char.createdAt,
    updatedAt: char.updatedAt,
    features,
  }
}
