import { NextRequest, NextResponse } from 'next/server'
import { anthropic } from '@/lib/ai/claude'
import { analyzeProduct, getMultiViewSuggestion, type ProductAnalysis } from '@/lib/ai/product-consistency'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

export const runtime = 'nodejs'
export const maxDuration = 60

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export type ImageCategory = 'character' | 'product' | 'scene' | 'reference'

interface UploadedFile {
  name: string
  url: string
  absolutePath: string
  category: ImageCategory
  description: string
}

/**
 * POST /api/upload
 * 上传图片 → 保存 → Claude 视觉分析（人物/产品/场景）
 */
export async function POST(req: NextRequest) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const form = await req.formData()
    const files = form.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }

    const results: UploadedFile[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filename = `${uuid()}.${ext}`
      const absolutePath = path.join(UPLOAD_DIR, filename)

      const buffer = Buffer.from(await file.arrayBuffer())
      await fs.writeFile(absolutePath, buffer)

      // Claude 视觉分析图片类型
      let category: ImageCategory = 'reference'
      let description = ''

      try {
        const base64 = buffer.toString('base64')
        const mediaType = ext === 'png' ? 'image/png'
          : ext === 'webp' ? 'image/webp'
          : ext === 'gif' ? 'image/gif'
          : 'image/jpeg'

        const msg = await anthropic.messages.create({
          model: process.env.ANTHROPIC_BASE_URL?.includes('ppio')
            ? 'pa/claude-sonnet-4-5-20250929'
            : 'claude-sonnet-4-5-20250929',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `分析这张图片，返回JSON：
{
  "category": "character 或 product 或 scene",
  "description": "简短描述（30字内）"
}

分类规则：
- character：图片主体是人物（真人照片、人物画像、角色设定图）
- product：图片主体是产品（手机、化妆品、食品、电子设备等商品）
- scene：图片主体是场景/风景/背景

只返回JSON，不要解释。`,
              },
            ],
          }],
        })

        const text = msg.content[0]
        if (text.type === 'text') {
          try {
            const jsonStart = text.text.indexOf('{')
            const jsonEnd = text.text.lastIndexOf('}')
            if (jsonStart !== -1 && jsonEnd > jsonStart) {
              const parsed = JSON.parse(text.text.substring(jsonStart, jsonEnd + 1)) as {
                category?: string
                description?: string
              }
              if (parsed.category === 'character' || parsed.category === 'product' || parsed.category === 'scene') {
                category = parsed.category
              }
              description = parsed.description ?? ''
            }
          } catch { /* ignore parse error */ }
        }
      } catch (err) {
        console.error(`[Upload] 图片分析失败: ${file.name}`, err)
      }

      results.push({ name: file.name, url: `/uploads/${filename}`, absolutePath, category, description })
    }

    // 汇总
    const characters = results.filter(f => f.category === 'character')
    const products = results.filter(f => f.category === 'product')
    const scenes = results.filter(f => f.category === 'scene')

    // 产品深度分析（提取精确特征 + 一致性约束）
    let productAnalysis: ProductAnalysis | undefined
    let multiViewSuggestion: string | null = null

    if (products.length > 0) {
      try {
        productAnalysis = await analyzeProduct(
          products.map(p => p.description).join('；'),
          products.map(p => p.description)
        )
        multiViewSuggestion = getMultiViewSuggestion(productAnalysis.type)
      } catch (err) {
        console.error('[Upload] 产品深度分析失败:', err)
      }
    }

    return NextResponse.json({
      files: results,
      summary: {
        total: results.length,
        characters: characters.length,
        products: products.length,
        scenes: scenes.length,
      },
      productAnalysis,
      multiViewSuggestion,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
