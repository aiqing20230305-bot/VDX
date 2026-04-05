# 角色一致性系统设计文档

## 1. 概述

### 1.1 目标

在多帧分镜视频生成中，保持角色（人物、IP形象、产品主体）在所有帧中的视觉一致性。

### 1.2 核心挑战

- **视觉特征保持**：相同角色在不同场景、不同角度、不同动作下保持可识别性
- **风格一致性**：艺术风格、服装、配色在所有帧保持统一
- **提示词控制力**：Text2Image 模型对细节控制的局限性
- **性能要求**：特征提取和匹配不能显著延长生成时间

### 1.3 解决方案策略

```
参考图 → 特征提取 → 角色库存储 → 约束生成 → 增强提示词/参考图 → 一致性生成
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                       用户交互层                              │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ 角色上传   │  │ 角色选择器 │  │ 一致性开关          │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    角色管理层                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 角色库 API (CRUD + 搜索)                              │   │
│  │  - 创建角色 POST /api/character                       │   │
│  │  - 查询角色 GET /api/character?search=xxx            │   │
│  │  - 更新角色 PATCH /api/character/:id                  │   │
│  │  - 删除角色 DELETE /api/character/:id                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                  角色特征引擎                                │
│  ┌───────────────┐  ┌───────────────┐  ┌────────────────┐  │
│  │ 视觉特征提取  │  │ 语义描述生成  │  │ 特征向量化     │  │
│  │ (Face/Pose)   │  │ (Claude Vision)│  │ (Embedding)   │  │
│  └───────────────┘  └───────────────┘  └────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                 一致性约束生成器                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - 提示词增强（注入角色特征描述）                      │   │
│  │ - 参考图管理（character_ref 参数）                    │   │
│  │ - 负向提示词（排除不一致元素）                        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│               分镜生成引擎（集成点）                          │
│  storyboard-engine.ts                                       │
│  - 检测是否启用角色一致性                                    │
│  - 应用角色约束到每帧                                        │
│  - 调用即梦/可灵生成图片                                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

#### 2.2.1 角色创建流程

```
1. 用户上传参考图 → /api/upload
2. 调用角色特征引擎
   ├─ 视觉特征提取（面部、姿态、服装）
   ├─ Claude Vision 生成详细描述
   └─ 特征向量化（用于相似度搜索）
3. 存储到数据库
   ├─ characters 表（基本信息）
   ├─ character_features 表（特征向量）
   └─ 参考图保存到 public/uploads/characters/
4. 返回角色 ID
```

#### 2.2.2 一致性生成流程

```
1. 用户选择/锁定角色 → 前端传递 characterId
2. 分镜生成时
   ├─ 查询角色特征数据
   ├─ 生成增强提示词
   │   原始: "一个女孩在公园散步"
   │   增强: "一个女孩在公园散步，她有长黑发、穿白色连衣裙、圆脸、大眼睛"
   ├─ 附加参考图 URL
   └─ 调用图片生成 API
3. 生成后（可选）
   ├─ 验证一致性（特征向量相似度）
   └─ 不一致则重新生成
```

---

## 3. 技术实现

### 3.1 数据库 Schema

```sql
-- 角色表
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,  -- 角色描述（用户输入 + AI 生成）
  reference_image_url TEXT NOT NULL,  -- 参考图 URL
  thumbnail_url TEXT,  -- 缩略图 URL
  tags TEXT[],  -- 标签（风格、类型）
  usage_count INTEGER DEFAULT 0,  -- 使用次数
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色特征表
CREATE TABLE character_features (
  id TEXT PRIMARY KEY,
  character_id TEXT REFERENCES characters(id) ON DELETE CASCADE,
  
  -- 视觉特征
  face_features JSONB,  -- 面部特征（face-api.js 或 Claude Vision）
  body_features JSONB,  -- 身体特征（姿态、比例）
  style_features JSONB,  -- 风格特征（服装、配色）
  
  -- 语义特征
  detailed_description TEXT,  -- Claude Vision 生成的详细描述
  prompt_keywords TEXT[],  -- 关键词列表
  
  -- 特征向量（用于相似度搜索）
  embedding VECTOR(1536),  -- OpenAI/Claude embedding
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_character_tags ON characters USING GIN(tags);
CREATE INDEX idx_character_usage ON characters(usage_count DESC);
CREATE INDEX idx_character_features_embedding ON character_features USING ivfflat(embedding);
```

### 3.2 核心模块

#### 3.2.1 特征提取引擎 (`src/lib/ai/character-engine.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk'
import sharp from 'sharp'

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
 */
export async function extractCharacterFeatures(
  imageUrl: string
): Promise<CharacterFeatures> {
  // 1. 使用 Claude Vision 分析图片
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  
  const visionAnalysis = await claude.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'url',
            url: imageUrl,
          },
        },
        {
          type: 'text',
          text: `分析这个角色的视觉特征，输出 JSON 格式：
{
  "face": { "shape": "脸型", "eyes": "眼睛", "hair": "发型" },
  "body": { "build": "体型", "height": "高度", "pose": "姿态" },
  "style": { "clothing": "服装", "colors": ["颜色"], "accessories": "配饰" },
  "detailedDescription": "详细描述（50-100字）",
  "promptKeywords": ["关键词1", "关键词2"]
}`
        }
      ]
    }]
  })
  
  const analysisText = visionAnalysis.content[0].type === 'text'
    ? visionAnalysis.content[0].text
    : ''
  
  // 2. 解析 JSON
  const features = JSON.parse(analysisText.match(/\{[\s\S]*\}/)?.[0] || '{}')
  
  // 3. 生成 embedding（用于相似度搜索）
  const embedding = await generateEmbedding(features.detailedDescription)
  
  return {
    ...features,
    embedding,
  }
}

/**
 * 生成文本 embedding
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // 使用 OpenAI embedding API 或 Claude 的 prompt caching 生成向量
  // 这里简化处理，实际可用 OpenAI text-embedding-3-small
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })
  
  const data = await response.json()
  return data.data[0].embedding
}
```

#### 3.2.2 角色库 API (`src/app/api/character/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db/client'
import { extractCharacterFeatures } from '@/lib/ai/character-engine'
import { v4 as uuid } from 'uuid'

/**
 * POST /api/character
 * 创建新角色
 */
export async function POST(req: NextRequest) {
  try {
    const { name, referenceImageUrl, tags } = await req.json()
    
    // 1. 提取特征
    const features = await extractCharacterFeatures(referenceImageUrl)
    
    // 2. 生成缩略图
    const thumbnailUrl = await generateThumbnail(referenceImageUrl)
    
    // 3. 存储到数据库
    const character = await prisma.character.create({
      data: {
        id: uuid(),
        name,
        description: features.detailedDescription,
        referenceImageUrl,
        thumbnailUrl,
        tags: tags || [],
      },
    })
    
    await prisma.characterFeatures.create({
      data: {
        id: uuid(),
        characterId: character.id,
        faceFeatures: features.face,
        bodyFeatures: features.body,
        styleFeatures: features.style,
        detailedDescription: features.detailedDescription,
        promptKeywords: features.promptKeywords,
        embedding: features.embedding,  // pgvector 支持
      },
    })
    
    return NextResponse.json({ character })
  } catch (error) {
    console.error('[Character API] 创建失败:', error)
    return NextResponse.json(
      { error: '角色创建失败' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/character
 * 查询角色（支持相似度搜索）
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    if (query) {
      // 相似度搜索
      const queryEmbedding = await generateEmbedding(query)
      
      // 使用 pgvector 的余弦相似度搜索
      const characters = await prisma.$queryRaw`
        SELECT c.*, cf.detailed_description,
               1 - (cf.embedding <=> ${queryEmbedding}::vector) AS similarity
        FROM characters c
        JOIN character_features cf ON cf.character_id = c.id
        ORDER BY similarity DESC
        LIMIT ${limit}
      `
      
      return NextResponse.json({ characters })
    } else {
      // 普通查询（按使用次数排序）
      const characters = await prisma.character.findMany({
        take: limit,
        orderBy: { usageCount: 'desc' },
        include: {
          features: {
            select: {
              detailedDescription: true,
              promptKeywords: true,
            },
          },
        },
      })
      
      return NextResponse.json({ characters })
    }
  } catch (error) {
    console.error('[Character API] 查询失败:', error)
    return NextResponse.json(
      { error: '角色查询失败' },
      { status: 500 }
    )
  }
}
```

#### 3.2.3 一致性约束生成 (`src/lib/ai/consistency-engine.ts`)

```typescript
import type { Character, CharacterFeatures } from '@/types'

/**
 * 生成增强提示词（注入角色特征）
 */
export function enhancePromptWithCharacter(
  originalPrompt: string,
  character: Character,
  features: CharacterFeatures
): string {
  const { face, body, style } = features
  
  // 提取关键词
  const keywords = [
    face.hair,
    face.shape,
    body.build,
    style.clothing,
    ...style.colors.map(c => `${c}色`),
  ].filter(Boolean).join('、')
  
  // 增强提示词
  return `${originalPrompt}，${keywords}，${features.detailedDescription}`
}

/**
 * 生成参考图参数（用于 image2image）
 */
export function getCharacterReferenceParams(
  character: Character
): {
  referenceImageUrl: string
  referenceStrength: number  // 0-1，参考强度
} {
  return {
    referenceImageUrl: character.referenceImageUrl,
    referenceStrength: 0.7,  // 中等强度，既保持一致性又允许场景变化
  }
}

/**
 * 验证生成结果的一致性
 */
export async function verifyConsistency(
  generatedImageUrl: string,
  characterId: string
): Promise<{ consistent: boolean; similarity: number }> {
  // 1. 提取生成图片的特征
  const generatedFeatures = await extractCharacterFeatures(generatedImageUrl)
  
  // 2. 查询原始角色特征
  const originalFeatures = await prisma.characterFeatures.findFirst({
    where: { characterId },
  })
  
  if (!originalFeatures) {
    return { consistent: false, similarity: 0 }
  }
  
  // 3. 计算余弦相似度
  const similarity = cosineSimilarity(
    generatedFeatures.embedding,
    originalFeatures.embedding
  )
  
  // 4. 判断是否一致（阈值 0.85）
  return {
    consistent: similarity >= 0.85,
    similarity,
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
```

#### 3.2.4 集成到分镜生成 (`src/lib/ai/storyboard-engine.ts` 修改)

```typescript
// 在 generateStoryboard 函数中添加角色一致性支持

export async function generateStoryboard(
  script: Script,
  options?: {
    aspectRatio?: AspectRatio
    characterId?: string  // 新增：角色 ID
    enableConsistency?: boolean  // 新增：是否启用一致性检查
  }
): Promise<Storyboard> {
  // ... 现有逻辑
  
  // 如果启用角色一致性
  let character: Character | null = null
  let characterFeatures: CharacterFeatures | null = null
  
  if (options?.characterId) {
    character = await prisma.character.findUnique({
      where: { id: options.characterId },
      include: { features: true },
    })
    
    if (character) {
      characterFeatures = character.features
    }
  }
  
  // 生成每帧
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]
    
    // 增强提示词
    let prompt = frame.description
    if (character && characterFeatures) {
      prompt = enhancePromptWithCharacter(prompt, character, characterFeatures)
    }
    
    // 生成图片
    const imageUrl = await generateFrameImage({
      prompt,
      aspectRatio: options?.aspectRatio ?? '9:16',
      // 添加角色参考图
      ...(character && getCharacterReferenceParams(character)),
    })
    
    frame.imageUrl = imageUrl
    
    // 验证一致性（如果启用）
    if (options?.enableConsistency && character) {
      const { consistent, similarity } = await verifyConsistency(
        imageUrl,
        character.id
      )
      
      // 如果不一致，重新生成（最多重试 2 次）
      if (!consistent) {
        console.warn(`[一致性] 第 ${i} 帧不一致 (相似度: ${similarity})，重新生成...`)
        // 实现重试逻辑...
      }
    }
  }
  
  // ... 后续逻辑
}
```

---

## 4. UI/UX 设计

### 4.1 角色库面板

```tsx
// src/components/character/CharacterLibrary.tsx

export function CharacterLibrary({
  onSelect,
}: {
  onSelect: (character: Character) => void
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">角色库</h3>
      
      {/* 搜索栏 */}
      <input
        type="text"
        placeholder="搜索角色..."
        className="input-field mb-4"
      />
      
      {/* 角色网格 */}
      <div className="grid grid-cols-3 gap-4">
        {characters.map(char => (
          <div
            key={char.id}
            onClick={() => onSelect(char)}
            className="card cursor-pointer hover:border-purple-500"
          >
            <img src={char.thumbnailUrl} alt={char.name} />
            <p className="text-sm mt-2">{char.name}</p>
          </div>
        ))}
      </div>
      
      {/* 创建新角色按钮 */}
      <button className="btn-primary mt-4">+ 创建新角色</button>
    </div>
  )
}
```

### 4.2 角色选择器

```tsx
// 在分镜生成前选择角色

<div className="flex items-center gap-2">
  <span className="text-sm text-zinc-400">锁定角色:</span>
  <select
    value={selectedCharacterId}
    onChange={(e) => setSelectedCharacterId(e.target.value)}
    className="input-field"
  >
    <option value="">不锁定</option>
    {characters.map(char => (
      <option key={char.id} value={char.id}>{char.name}</option>
    ))}
  </select>
  
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={enableConsistency}
      onChange={(e) => setEnableConsistency(e.target.checked)}
    />
    <span className="text-sm">启用一致性验证</span>
  </label>
</div>
```

---

## 5. 技术栈选择

| 模块 | 技术方案 | 理由 |
|------|---------|------|
| **面部特征提取** | Claude Vision API | 高质量语义理解，无需额外训练 |
| **特征向量** | OpenAI Embeddings | 成熟稳定，与现有 API 兼容 |
| **向量存储** | pgvector (PostgreSQL) | 原生支持向量搜索，无需额外服务 |
| **图片生成约束** | 提示词增强 + 参考图 | 即梦/可灵 API 原生支持 |
| **缩略图生成** | sharp | 高性能 Node.js 图片处理库 |

---

## 6. 实施计划

### Phase 1: 基础架构（3天）
- [x] 数据库 Schema 设计
- [ ] 角色库 API (CRUD)
- [ ] 特征提取引擎 (Claude Vision)
- [ ] UI 组件：角色上传、角色列表

### Phase 2: 一致性集成（2天）
- [ ] 提示词增强逻辑
- [ ] 集成到分镜生成流程
- [ ] UI：角色选择器、一致性开关

### Phase 3: 优化和测试（2天）
- [ ] 相似度搜索优化
- [ ] 一致性验证和重试
- [ ] 端到端测试
- [ ] 文档和示例

---

## 7. 成功指标

- **一致性准确率**: 90%+ 的生成帧通过人工审核
- **相似度分数**: 平均 0.85+ 的余弦相似度
- **性能开销**: 特征提取 <3秒，一致性验证 <2秒
- **用户体验**: 角色库搜索 <500ms，角色应用无感知

---

## 8. 风险和应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| **提示词控制力不足** | 无法保证 100% 一致性 | 结合 image2image 参考图增强 |
| **特征提取不准确** | 错误的角色描述导致偏差 | 人工审核 + 用户可编辑特征 |
| **性能开销** | 生成时间增加 | 特征提取异步化，结果缓存 |
| **向量存储成本** | pgvector 性能瓶颈 | 限制角色库规模，定期清理 |

---

## 9. 未来扩展

- **风格迁移**: 保持角色特征，改变艺术风格（写实 → 动漫）
- **角色动态库**: 记录角色在不同场景的表现，智能推荐最佳生成参数
- **多角色管理**: 一个场景中同时保持多个角色一致性
- **角色社区**: 用户分享和交易角色库

---

**文档版本**: v1.0  
**作者**: 超级视频Agent 开发团队  
**最后更新**: 2026-04-06
