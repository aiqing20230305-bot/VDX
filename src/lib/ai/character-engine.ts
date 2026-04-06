import 'server-only'
import { anthropic } from './claude'

export interface CharacterFeatures {
  // 视觉特征
  face: {
    shape: string  // 脸型
    eyes: string   // 眼睛特征
    hair: string   // 发型发色
    skin: string   // 肤色
  }
  body: {
    build: string  // 体型
    height: string // 相对高度
    pose: string   // 典型姿态
  }
  style: {
    clothing: string     // 服装风格
    colors: string[]     // 主要配色
    accessories: string  // 配饰
  }

  // 语义特征
  detailedDescription: string
  promptKeywords: string[]

  // 特征向量
  embedding: number[]
}

/**
 * 提取角色特征
 * 使用 Claude Vision 分析图片，提取面部、体型、服装等特征
 *
 * @param imageUrl - 图片 URL（支持 http/https 或 base64 data URL）
 * @returns 角色特征对象
 */
export async function extractCharacterFeatures(
  imageUrl: string
): Promise<CharacterFeatures> {
  console.log('[CharacterEngine] 开始提取角色特征:', imageUrl)

  try {
    // 1. 判断是 URL 还是 base64
    let imageSource: { type: 'url' | 'base64'; url?: string; media_type?: string; data?: string }

    if (imageUrl.startsWith('data:')) {
      // Base64 格式: data:image/png;base64,xxxxx
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) {
        throw new Error('Invalid base64 image format')
      }
      imageSource = {
        type: 'base64',
        media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: match[2],
      }
    } else {
      // HTTP(S) URL
      imageSource = {
        type: 'url',
        url: imageUrl,
      }
    }

    // 2. 使用 Claude Vision 分析图片
    const visionAnalysis = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: imageSource as any,
          },
          {
            type: 'text',
            text: `请仔细分析这个角色的视觉特征，输出标准 JSON 格式（不要 markdown 代码块）：

{
  "face": {
    "shape": "脸型描述（如：圆脸、瓜子脸、方脸）",
    "eyes": "眼睛特征（如：大眼睛、单眼皮、深邃）",
    "hair": "发型发色（如：长黑发、短金发、卷发）",
    "skin": "肤色（如：白皙、小麦色、古铜色）"
  },
  "body": {
    "build": "体型（如：纤瘦、匀称、壮实）",
    "height": "相对高度（如：高挑、中等、娇小）",
    "pose": "典型姿态（如：站立、坐姿、动态）"
  },
  "style": {
    "clothing": "服装风格描述（如：白色连衣裙、商务西装、休闲T恤）",
    "colors": ["主要颜色1", "主要颜色2"],
    "accessories": "配饰（如：项链、眼镜、帽子，无则填'无'）"
  },
  "detailedDescription": "整体详细描述（80-150字，包含角色的整体印象、风格特点、独特之处）",
  "promptKeywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]
}

要求：
1. 输出纯 JSON，不要任何 markdown 格式
2. 详细描述要具体、生动，包含足够细节用于后续图片生成
3. 关键词要精准，用于提示词增强
4. 如果图片中没有人物角色，请分析主要物体或场景元素`,
          }
        ]
      }]
    })

    const analysisText = visionAnalysis.content[0].type === 'text'
      ? visionAnalysis.content[0].text
      : ''

    console.log('[CharacterEngine] Claude Vision 分析结果:', analysisText)

    // 3. 解析 JSON（兼容 markdown 代码块）
    let jsonText = analysisText.trim()

    // 移除可能的 markdown 代码块标记
    jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/\s*```$/, '')

    // 提取 JSON 对象
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const features = JSON.parse(jsonMatch[0]) as Omit<CharacterFeatures, 'embedding'>

    // 4. 生成 embedding（用于相似度搜索）
    console.log('[CharacterEngine] 生成文本 embedding...')
    const embedding = await generateEmbedding(features.detailedDescription)

    const result: CharacterFeatures = {
      ...features,
      embedding,
    }

    console.log('[CharacterEngine] 特征提取完成:', {
      faceShape: result.face.shape,
      hair: result.face.hair,
      clothing: result.style.clothing,
      embeddingDim: result.embedding.length,
    })

    return result

  } catch (error) {
    console.error('[CharacterEngine] 特征提取失败:', error)
    throw new Error(`角色特征提取失败: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 生成文本 embedding（使用 OpenAI text-embedding-3-small）
 * 用于角色特征的相似度搜索
 *
 * @param text - 输入文本（角色详细描述）
 * @returns 1536 维特征向量
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('[CharacterEngine] OPENAI_API_KEY 未配置，返回零向量')
    // 返回 1536 维零向量（text-embedding-3-small 的维度）
    return new Array(1536).fill(0)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data.data[0].embedding as number[]

  } catch (error) {
    console.error('[CharacterEngine] Embedding 生成失败:', error)
    console.warn('[CharacterEngine] 返回零向量作为降级方案')
    return new Array(1536).fill(0)
  }
}

/**
 * 计算两个特征向量的余弦相似度
 *
 * @param a - 特征向量 A
 * @param b - 特征向量 B
 * @returns 相似度 [0, 1]，越接近 1 越相似
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match')
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dotProduct / (magnitudeA * magnitudeB)
}
