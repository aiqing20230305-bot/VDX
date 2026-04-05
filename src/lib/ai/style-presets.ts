/**
 * 视频风格预设
 * 每种风格包含：
 *   - 正面提示词前缀（style_base 注入）
 *   - 设备/镜头信息（真实风格特有）
 *   - 负面提示词
 */

export interface StylePreset {
  id: string
  label: string
  emoji: string
  /** 注入到每帧提示词前面的风格基础词 */
  styleBase: string
  /** 负面提示词 */
  negativePrompt: string
  /** 给 Claude 的风格引导（中文） */
  claudeGuidance: string
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  realistic: {
    id: 'realistic',
    label: '真实写实',
    emoji: '📷',
    styleBase: 'photorealistic, natural lighting, high quality photo',
    negativePrompt: 'cartoon, anime, illustration, painting, drawing',
    claudeGuidance: '真实写实风格，模拟专业相机实拍。运镜要像真人手持或稳定器拍摄。场景要有真实感的光影和环境细节。',
  },

  cinematic: {
    id: 'cinematic',
    label: '电影质感',
    emoji: '🎬',
    styleBase: 'cinematic shot, dramatic lighting, film look, bokeh',
    negativePrompt: 'amateur, flat lighting, cartoon, anime',
    claudeGuidance: '电影级画面，模拟好莱坞大片质感。要有戏剧性光影、景深和调色。运镜模拟电影摄影机。',
  },

  anime: {
    id: 'anime',
    label: '动漫风格',
    emoji: '🎨',
    styleBase: 'anime style, vibrant colors, clean lines, detailed illustration',
    negativePrompt: 'photorealistic, 3D render, blurry',
    claudeGuidance: '日系动漫风格，画面精致有表现力。人物要有动漫特征（大眼睛、精致发型）。场景色彩丰富。',
  },

  cartoon: {
    id: 'cartoon',
    label: '3D卡通',
    emoji: '🧊',
    styleBase: '3D render, smooth surfaces, vibrant colors, stylized character',
    negativePrompt: 'photorealistic, anime, 2D, flat',
    claudeGuidance: 'Pixar/皮克斯级3D卡通风格，角色可爱有表现力。场景精致有细节。',
  },

  commercial: {
    id: 'commercial',
    label: '扁平插画',
    emoji: '✏️',
    styleBase: 'flat illustration, clean design, bold colors, minimal style',
    negativePrompt: 'photorealistic, 3D, complex shadows, anime',
    claudeGuidance: '商业扁平插画风格，简洁干净有设计感。适合品牌宣传和产品介绍。',
  },
}

/**
 * 获取风格预设，不存在则返回默认（realistic）
 */
export function getStylePreset(styleId?: string): StylePreset {
  return STYLE_PRESETS[styleId ?? 'realistic'] ?? STYLE_PRESETS.realistic
}

/**
 * 将风格注入到帧提示词中
 */
export function applyStyleToPrompt(framePrompt: string, style: StylePreset): string {
  return `${style.styleBase}, ${framePrompt}`
}

/**
 * 简化提示词以符合平台规范
 * 用于生成失败后的重试或主动简化
 */
export function simplifyPrompt(prompt: string): string {
  // 移除冗余词汇和过长描述
  let simplified = prompt

  // 移除相机技术参数
  simplified = simplified.replace(/shot on [^,]+,\s*/gi, '')
  simplified = simplified.replace(/\d+mm\s+f\/[\d.]+\s+lens,?\s*/gi, '')
  simplified = simplified.replace(/ISO\s+\d+,?\s*/gi, '')
  simplified = simplified.replace(/\d+K resolution,?\s*/gi, '')
  simplified = simplified.replace(/RAW photo quality,?\s*/gi, '')

  // 移除过度具体的技术术语
  simplified = simplified.replace(/subsurface scattering,?\s*/gi, '')
  simplified = simplified.replace(/global illumination,?\s*/gi, '')
  simplified = simplified.replace(/Blender Cycles render,?\s*/gi, '')
  simplified = simplified.replace(/Kodak film stock look,?\s*/gi, '')
  simplified = simplified.replace(/anamorphic lens,?\s*/gi, '')

  // 移除多余的形容词
  simplified = simplified.replace(/professional\s+/gi, '')
  simplified = simplified.replace(/high quality\s+/gi, '')
  simplified = simplified.replace(/detailed\s+/gi, '')

  // 合并多个逗号和空格
  simplified = simplified.replace(/,\s*,/g, ',')
  simplified = simplified.replace(/,\s+/g, ', ')
  simplified = simplified.replace(/\s+/g, ' ')
  simplified = simplified.trim()

  // 如果仍然过长（超过200字符），截断保留核心部分
  if (simplified.length > 200) {
    const parts = simplified.split(',').map(p => p.trim())
    // 保留前8个最重要的部分
    simplified = parts.slice(0, 8).join(', ')
  }

  return simplified
}

/**
 * 检查提示词是否过长
 */
export function isPromptTooLong(prompt: string): boolean {
  return prompt.length > 250 || prompt.split(',').length > 15
}
