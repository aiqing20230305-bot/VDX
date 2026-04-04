import { NextRequest, NextResponse } from 'next/server'
import {
  convertCharacterStyle,
  downloadImage,
  CHARACTER_STYLE_PROMPTS,
  type CharacterStyle,
} from '@/lib/video/dreamina-image'
import path from 'path'
import fs from 'fs/promises'
import { v4 as uuid } from 'uuid'

export const runtime = 'nodejs'
export const maxDuration = 120

/**
 * POST /api/character-style
 *
 * 将人物照片转为风格化图片（线稿/动漫/3D等），保留人物特征
 * 转换后的图片可作为视频生成的角色参考
 *
 * Body (JSON):   { imageUrl: string, style: CharacterStyle, additionalPrompt?: string }
 * Body (FormData): image file + style field
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''
    let imagePath: string
    let style: CharacterStyle = 'lineart'
    let additionalPrompt: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('image') as File | null
      if (!file) return NextResponse.json({ error: '请上传人物图片' }, { status: 400 })

      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadDir, { recursive: true })
      const ext = file.name.split('.').pop() ?? 'jpg'
      imagePath = path.join(uploadDir, `${uuid()}.${ext}`)
      await fs.writeFile(imagePath, Buffer.from(await file.arrayBuffer()))

      style = (form.get('style') as CharacterStyle) ?? 'lineart'
      additionalPrompt = form.get('additionalPrompt') as string | undefined
    } else {
      const body = await req.json() as {
        imageUrl: string
        style?: CharacterStyle
        additionalPrompt?: string
      }
      if (!body.imageUrl) return NextResponse.json({ error: '请提供图片URL' }, { status: 400 })

      imagePath = await downloadImage(body.imageUrl)
      style = body.style ?? 'lineart'
      additionalPrompt = body.additionalPrompt
    }

    if (!CHARACTER_STYLE_PROMPTS[style]) {
      return NextResponse.json({
        error: `不支持的风格: ${style}`,
        availableStyles: Object.keys(CHARACTER_STYLE_PROMPTS),
      }, { status: 400 })
    }

    const imageUrls = await convertCharacterStyle({
      imagePath,
      style,
      additionalPrompt,
    })

    return NextResponse.json({
      style,
      imageUrls,
      hint: '转换后的图片可用于视频生成的角色参考，绕过真人参考限制',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Character style conversion failed'
    console.error('[CharacterStyle API]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    styles: Object.entries(CHARACTER_STYLE_PROMPTS).map(([key, prompt]) => ({
      id: key,
      prompt,
    })),
    usage: 'POST /api/character-style with { imageUrl, style }',
  })
}
