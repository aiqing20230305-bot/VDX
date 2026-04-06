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
 *
 * ⚠️ 激进模式：移除所有可能违反平台规则的技术化描述
 */
export function simplifyPrompt(prompt: string): string {
  let simplified = prompt

  // ===== 第1步：移除相机品牌和型号 =====
  simplified = simplified.replace(/shot on (Canon|Nikon|Sony|Fujifilm|Leica|Hasselblad|Pentax|Panasonic)\s+[A-Za-z0-9\-]+/gi, '')
  simplified = simplified.replace(/\b(Canon|Nikon|Sony|Fujifilm|Leica|Hasselblad)\s+[A-Za-z]*\d+[A-Za-z]*/gi, '')

  // ===== 第2步：移除镜头参数 =====
  simplified = simplified.replace(/with\s+\d+mm\s+f\/[\d.]+\s+lens/gi, '')
  simplified = simplified.replace(/\d+mm\s+f\/[\d.]+\s*(lens)?/gi, '')
  simplified = simplified.replace(/\b(prime|zoom|telephoto|wide[-\s]?angle|macro|fisheye)\s+lens\b/gi, '')

  // ===== 第3步：移除技术参数 =====
  simplified = simplified.replace(/\b(4K|8K|12K|16K)\s+(resolution|quality|video|footage)/gi, 'high quality')
  simplified = simplified.replace(/\bRAW\s+(photo|image|format|quality)/gi, 'photo')
  simplified = simplified.replace(/ISO\s+\d+/gi, '')
  simplified = simplified.replace(/\bDSLR\s+camera\b/gi, 'camera')
  simplified = simplified.replace(/\bmirrorless\s+camera\b/gi, 'camera')

  // ===== 第4步：移除专业摄影术语 =====
  simplified = simplified.replace(/\bshallow\s+depth\s+of\s+field\b/gi, 'blurred background')
  simplified = simplified.replace(/\bdeep\s+depth\s+of\s+field\b/gi, '')
  simplified = simplified.replace(/\bbokeh\s+(effect|background)/gi, 'soft background')
  simplified = simplified.replace(/\bfilm\s+grain\b/gi, '')
  simplified = simplified.replace(/\bchromatic\s+aberration\b/gi, '')
  simplified = simplified.replace(/\bvignette\s+effect\b/gi, '')
  simplified = simplified.replace(/\banamorphic\s+lens\b/gi, '')

  // ===== 第5步：移除后期和调色术语 =====
  simplified = simplified.replace(/\b(natural|cinematic)\s+color\s+grading\b/gi, '')
  simplified = simplified.replace(/\bcolor\s+grading\b/gi, '')
  simplified = simplified.replace(/\bLUT\s+(applied|preset)/gi, '')
  simplified = simplified.replace(/\bKodak\s+film\s+stock/gi, '')

  // ===== 第6步：移除光线专业术语 =====
  simplified = simplified.replace(/\bgolden\s+hour\s+lighting\b/gi, 'warm light')
  simplified = simplified.replace(/\bblue\s+hour\s+lighting\b/gi, 'twilight')
  simplified = simplified.replace(/\b(Rembrandt|butterfly|loop|split)\s+lighting\b/gi, '')

  // ===== 第7步：移除质感和渲染术语 =====
  simplified = simplified.replace(/\brealistic\s+skin\s+texture\b/gi, '')
  simplified = simplified.replace(/\bphotorealistic\s+skin\b/gi, '')
  simplified = simplified.replace(/\bsubsurface\s+scattering\b/gi, '')
  simplified = simplified.replace(/\bglobal\s+illumination\b/gi, '')
  simplified = simplified.replace(/\bBlender\s+Cycles\s+render\b/gi, '')

  // ===== 第8步：移除文件格式 =====
  simplified = simplified.replace(/\b(RAW|DNG|CR2|NEF|ARW)\s+file\b/gi, '')

  // ===== 第9步：移除冗余形容词和残留相机名称 =====
  simplified = simplified.replace(/\bprofessional\s+/gi, '')
  simplified = simplified.replace(/\bhigh\s+quality\s+/gi, '')
  simplified = simplified.replace(/\bhighly\s+detailed\s+/gi, '')
  simplified = simplified.replace(/\bextremely\s+detailed\s+/gi, '')
  simplified = simplified.replace(/\bultra\s+(detailed|realistic|high\s+quality)/gi, '')

  // 移除残留的相机型号片段（如 "R5 camera", "D850 camera"）
  simplified = simplified.replace(/\b[A-Z][0-9]+[A-Z]?\s+camera\b/gi, '')
  simplified = simplified.replace(/\b[A-Z]{2,}\s+camera\b/gi, '')  // EOS camera 等
  simplified = simplified.replace(/\blook\b/gi, '')  // 移除无意义的 "look"

  // ===== 第10步：清理格式 =====
  // 移除多余的逗号、空格和连续标点
  simplified = simplified.replace(/,\s*,+/g, ',')
  simplified = simplified.replace(/,\s+,/g, ',')
  simplified = simplified.replace(/\s*,\s*/g, ', ')
  simplified = simplified.replace(/\s{2,}/g, ' ')
  simplified = simplified.replace(/^,\s*/, '') // 开头逗号
  simplified = simplified.replace(/,\s*$/, '') // 结尾逗号
  simplified = simplified.trim()

  // ===== 第10.5步：去重（移除重复的词组） =====
  const parts = simplified.split(',').map(p => p.trim()).filter(p => p.length > 0)
  const uniqueParts = [...new Set(parts)]
  simplified = uniqueParts.join(', ')

  // ===== 第11步：长度控制 =====
  // 如果仍然过长（超过180字符），智能截断
  if (simplified.length > 180) {
    const parts = simplified.split(',').map(p => p.trim()).filter(p => p.length > 0)

    // 优先保留：主体、动作、场景、光线、基础风格
    // 去除：重复的风格词、冗余形容词
    const priorityWords = ['character', 'person', 'object', 'scene', 'background', 'light', 'color']
    const important = parts.filter(p => priorityWords.some(w => p.toLowerCase().includes(w)))
    const others = parts.filter(p => !important.includes(p))

    // 重组：重要部分 + 其他部分（总共不超过10个）
    const final = [...important, ...others].slice(0, 10)
    simplified = final.join(', ')
  }

  return simplified
}

/**
 * 检查提示词是否过长
 */
export function isPromptTooLong(prompt: string): boolean {
  return prompt.length > 250 || prompt.split(',').length > 15
}
