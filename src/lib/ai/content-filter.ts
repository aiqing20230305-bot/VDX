/**
 * 内容过滤与违禁词智能绕过
 * 为即梦/可灵等 AI 视频生成平台智能处理敏感词和违禁词
 */

export interface FilterRule {
  pattern: RegExp | string
  replacement: string
  category: 'brand' | 'violence' | 'sensitive' | 'negative'
  description: string
}

/**
 * 违禁词规则库
 * 优先级：精确匹配 > 模糊匹配
 */
const FILTER_RULES: FilterRule[] = [
  // ===== 品牌侵权 =====
  { pattern: /\biPhone\b/gi, replacement: 'smartphone', category: 'brand', description: '苹果手机' },
  { pattern: /\bApple\b/gi, replacement: 'tech device', category: 'brand', description: '苹果品牌' },
  { pattern: /\biPad\b/gi, replacement: 'tablet', category: 'brand', description: '苹果平板' },
  { pattern: /\bMacBook\b/gi, replacement: 'laptop', category: 'brand', description: '苹果笔记本' },
  { pattern: /\bNike\b/gi, replacement: 'athletic shoes', category: 'brand', description: '耐克' },
  { pattern: /\bAdidas\b/gi, replacement: 'sports shoes', category: 'brand', description: '阿迪达斯' },
  { pattern: /\bCoca[- ]?Cola\b/gi, replacement: 'soda drink', category: 'brand', description: '可口可乐' },
  { pattern: /\bPepsi\b/gi, replacement: 'cola drink', category: 'brand', description: '百事' },
  { pattern: /\bStarbucks\b/gi, replacement: 'coffee shop', category: 'brand', description: '星巴克' },
  { pattern: /\bMcDonald\'?s\b/gi, replacement: 'fast food restaurant', category: 'brand', description: '麦当劳' },
  { pattern: /\bKFC\b/gi, replacement: 'fried chicken restaurant', category: 'brand', description: '肯德基' },
  { pattern: /\bTesla\b/gi, replacement: 'electric car', category: 'brand', description: '特斯拉' },
  { pattern: /\bBMW\b/gi, replacement: 'luxury car', category: 'brand', description: '宝马' },
  { pattern: /\bMercedes[- ]?Benz\b/gi, replacement: 'luxury sedan', category: 'brand', description: '奔驰' },

  // 中文品牌
  { pattern: /苹果手机/g, replacement: '智能手机', category: 'brand', description: '苹果手机' },
  { pattern: /华为手机/g, replacement: '智能手机', category: 'brand', description: '华为手机' },
  { pattern: /小米手机/g, replacement: '智能手机', category: 'brand', description: '小米手机' },
  { pattern: /耐克鞋/g, replacement: '运动鞋', category: 'brand', description: '耐克鞋' },
  { pattern: /阿迪达斯/g, replacement: '运动品牌', category: 'brand', description: '阿迪达斯' },
  { pattern: /可口可乐/g, replacement: '碳酸饮料', category: 'brand', description: '可口可乐' },
  { pattern: /麦当劳/g, replacement: '快餐店', category: 'brand', description: '麦当劳' },
  { pattern: /肯德基/g, replacement: '炸鸡店', category: 'brand', description: '肯德基' },
  { pattern: /星巴克/g, replacement: '咖啡馆', category: 'brand', description: '星巴克' },

  // ===== 暴力血腥 =====
  { pattern: /\bblood\b/gi, replacement: 'red liquid', category: 'violence', description: '血液' },
  { pattern: /\bgun\b/gi, replacement: 'weapon', category: 'violence', description: '枪支' },
  { pattern: /\bkill(ing|ed)?\b/gi, replacement: 'defeat', category: 'violence', description: '杀' },
  { pattern: /\bmurder\b/gi, replacement: 'crime', category: 'violence', description: '谋杀' },
  { pattern: /\bexplosion\b/gi, replacement: 'blast effect', category: 'violence', description: '爆炸' },
  { pattern: /\bbomb\b/gi, replacement: 'explosive device', category: 'violence', description: '炸弹' },
  { pattern: /\bwar\b/gi, replacement: 'conflict', category: 'violence', description: '战争' },

  // 中文暴力词汇
  { pattern: /血/g, replacement: '受伤', category: 'violence', description: '血' },
  { pattern: /杀/g, replacement: '击败', category: 'violence', description: '杀' },
  { pattern: /死/g, replacement: '倒下', category: 'violence', description: '死' },
  { pattern: /枪/g, replacement: '武器', category: 'violence', description: '枪' },
  { pattern: /刀/g, replacement: '利器', category: 'violence', description: '刀' },
  { pattern: /爆炸/g, replacement: '强烈冲击', category: 'violence', description: '爆炸' },
  { pattern: /战争/g, replacement: '冲突', category: 'violence', description: '战争' },

  // ===== 负面情绪（过度） =====
  { pattern: /\bsuicide\b/gi, replacement: 'sadness', category: 'negative', description: '自杀' },
  { pattern: /\bdepression\b/gi, replacement: 'melancholy', category: 'negative', description: '抑郁' },
  { pattern: /自杀/g, replacement: '悲伤', category: 'negative', description: '自杀' },
  { pattern: /抑郁/g, replacement: '忧郁', category: 'negative', description: '抑郁' },

  // ===== 敏感政治 =====
  // （此处省略具体内容，实际使用时根据平台规则补充）

  // ===== 成人内容 =====
  { pattern: /\bnude\b/gi, replacement: 'figure', category: 'sensitive', description: '裸体' },
  { pattern: /\bsexy\b/gi, replacement: 'attractive', category: 'sensitive', description: '性感' },
  { pattern: /裸体/g, replacement: '人物', category: 'sensitive', description: '裸体' },
  { pattern: /性感/g, replacement: '优雅', category: 'sensitive', description: '性感' },

  // ===== 其他违禁 =====
  { pattern: /\bdrug\b/gi, replacement: 'medicine', category: 'sensitive', description: '药物' },
  { pattern: /\bcigarette\b/gi, replacement: 'item', category: 'sensitive', description: '香烟' },
  { pattern: /毒品/g, replacement: '物品', category: 'sensitive', description: '毒品' },
  { pattern: /香烟/g, replacement: '物品', category: 'sensitive', description: '香烟' },

  // ===== 过度技术化描述（即梦/可灵平台不允许） =====
  // 相机品牌和型号
  { pattern: /shot on (Canon|Nikon|Sony|Fujifilm|Leica|Hasselblad|Pentax)\s+[A-Z0-9]+/gi, replacement: '', category: 'brand', description: '相机型号' },
  { pattern: /\b(Canon|Nikon|Sony|Fujifilm|Leica|Hasselblad|Pentax)\s+[A-Z0-9]+\s+(camera|DSLR|mirrorless)?/gi, replacement: '', category: 'brand', description: '相机品牌型号' },
  { pattern: /\bCanon\s+EOS\s+[A-Z0-9]+/gi, replacement: '', category: 'brand', description: '佳能相机' },
  { pattern: /\bSony\s+A[0-9]+[A-Z]*/gi, replacement: '', category: 'brand', description: '索尼相机' },
  { pattern: /\bNikon\s+D[0-9]+/gi, replacement: '', category: 'brand', description: '尼康相机' },

  // 镜头参数
  { pattern: /with\s+\d+mm\s+f\/[\d.]+\s+lens/gi, replacement: '', category: 'brand', description: '镜头参数' },
  { pattern: /\d+mm\s+f\/[\d.]+\s+lens/gi, replacement: '', category: 'brand', description: '焦距光圈镜头' },
  { pattern: /\d+mm\s+f\/[\d.]+/g, replacement: '', category: 'brand', description: '焦距光圈' },
  { pattern: /\b(prime|zoom|telephoto|wide[-\s]?angle|macro|anamorphic)\s+lens\b/gi, replacement: '', category: 'brand', description: '镜头类型' },
  { pattern: /\b\d+mm\s+lens\b/gi, replacement: '', category: 'brand', description: '镜头焦距' },

  // 分辨率和技术参数
  { pattern: /\b(4K|8K|12K|16K)\s+(resolution|quality|video|footage)/gi, replacement: 'high resolution', category: 'brand', description: '分辨率' },
  { pattern: /\bRAW\s+(photo|image|format|quality)/gi, replacement: 'high quality', category: 'brand', description: 'RAW格式' },
  { pattern: /\b(DSLR|mirrorless)\s+camera\b/gi, replacement: 'camera', category: 'brand', description: '相机类型' },

  // 专业摄影术语
  { pattern: /\bshallow\s+depth\s+of\s+field\b/gi, replacement: 'blurred background', category: 'brand', description: '浅景深' },
  { pattern: /\bdeep\s+depth\s+of\s+field\b/gi, replacement: 'sharp focus', category: 'brand', description: '深景深' },
  { pattern: /\bbokeh\s+(effect|background)/gi, replacement: 'soft background', category: 'brand', description: '焦外虚化' },
  { pattern: /\bfilm\s+grain\b/gi, replacement: 'texture', category: 'brand', description: '胶片颗粒' },
  { pattern: /\bchromatic\s+aberration\b/gi, replacement: '', category: 'brand', description: '色差' },
  { pattern: /\bvignette\s+effect\b/gi, replacement: 'darkened edges', category: 'brand', description: '暗角' },

  // 色彩和后期术语
  { pattern: /\bcolor\s+grading\b/gi, replacement: 'color tone', category: 'brand', description: '调色' },
  { pattern: /\bnatural\s+color\s+grading\b/gi, replacement: 'natural colors', category: 'brand', description: '自然调色' },
  { pattern: /\bcinematic\s+color\s+grading\b/gi, replacement: 'rich colors', category: 'brand', description: '电影调色' },
  { pattern: /\bLUT\s+(applied|preset)/gi, replacement: 'color style', category: 'brand', description: 'LUT' },

  // 光线术语（过度专业化）
  { pattern: /\bgolden\s+hour\s+lighting\b/gi, replacement: 'warm sunset light', category: 'brand', description: '黄金时刻' },
  { pattern: /\bblue\s+hour\s+lighting\b/gi, replacement: 'twilight', category: 'brand', description: '蓝色时刻' },
  { pattern: /\bRembrandt\s+lighting\b/gi, replacement: 'dramatic lighting', category: 'brand', description: '伦勃朗光' },
  { pattern: /\bbutterfly\s+lighting\b/gi, replacement: 'front lighting', category: 'brand', description: '蝴蝶光' },

  // 皮肤和质感术语
  { pattern: /\brealistic\s+skin\s+texture\b/gi, replacement: 'natural skin', category: 'brand', description: '真实皮肤质感' },
  { pattern: /\bphotorealistic\s+skin\b/gi, replacement: 'realistic portrait', category: 'brand', description: '照片级皮肤' },

  // 文件格式
  { pattern: /\b(RAW|DNG|CR2|NEF|ARW)\s+file\b/gi, replacement: 'image', category: 'brand', description: '文件格式' },
]

/**
 * 智能过滤提示词中的违禁内容
 */
export function filterPrompt(prompt: string): {
  filtered: string
  replacements: Array<{ original: string; replaced: string; category: string }>
  hasChanges: boolean
} {
  let filtered = prompt
  const replacements: Array<{ original: string; replaced: string; category: string }> = []

  for (const rule of FILTER_RULES) {
    if (typeof rule.pattern === 'string') {
      if (filtered.includes(rule.pattern)) {
        const original = rule.pattern
        filtered = filtered.replace(new RegExp(rule.pattern, 'g'), rule.replacement)
        replacements.push({
          original,
          replaced: rule.replacement,
          category: rule.category,
        })
      }
    } else {
      const matches = filtered.match(rule.pattern)
      if (matches && matches.length > 0) {
        const original = matches[0]
        filtered = filtered.replace(rule.pattern, rule.replacement)
        replacements.push({
          original,
          replaced: rule.replacement,
          category: rule.category,
        })
      }
    }
  }

  return {
    filtered,
    replacements,
    hasChanges: replacements.length > 0,
  }
}

/**
 * 批量过滤分镜帧的提示词
 */
export function filterStoryboardPrompts(frames: Array<{ imagePrompt: string }>) {
  const results = frames.map(frame => {
    const filtered = filterPrompt(frame.imagePrompt)
    return {
      ...frame,
      imagePrompt: filtered.filtered,
      filterInfo: filtered.hasChanges ? filtered : undefined,
    }
  })

  const totalReplacements = results.reduce((sum, r) => sum + (r.filterInfo?.replacements.length ?? 0), 0)

  return {
    frames: results,
    totalReplacements,
    hasChanges: totalReplacements > 0,
  }
}

/**
 * 检测提示词是否包含违禁内容（不修改，仅检测）
 */
export function detectViolations(prompt: string): {
  hasViolations: boolean
  violations: Array<{ word: string; category: string; description: string }>
} {
  const violations: Array<{ word: string; category: string; description: string }> = []

  for (const rule of FILTER_RULES) {
    let matched = false
    let word = ''

    if (typeof rule.pattern === 'string') {
      if (prompt.includes(rule.pattern)) {
        matched = true
        word = rule.pattern
      }
    } else {
      const matches = prompt.match(rule.pattern)
      if (matches && matches.length > 0) {
        matched = true
        word = matches[0]
      }
    }

    if (matched) {
      violations.push({
        word,
        category: rule.category,
        description: rule.description,
      })
    }
  }

  return {
    hasViolations: violations.length > 0,
    violations,
  }
}

/**
 * 生成违禁词规避建议
 */
export function getSuggestions(prompt: string): string[] {
  const { violations } = detectViolations(prompt)
  if (violations.length === 0) return []

  const suggestions: string[] = []

  const brandCount = violations.filter(v => v.category === 'brand').length
  const violenceCount = violations.filter(v => v.category === 'violence').length

  if (brandCount > 0) {
    suggestions.push(`发现 ${brandCount} 个品牌词，已自动替换为通用描述`)
  }
  if (violenceCount > 0) {
    suggestions.push(`发现 ${violenceCount} 个暴力词汇，已优化为温和表达`)
  }

  return suggestions
}

/**
 * 智能优化：让 Claude 重写提示词以避免违禁词
 * （需要调用 Claude API，这里先提供接口）
 */
export async function rewritePromptWithClaude(
  prompt: string,
  violations: Array<{ word: string; category: string }>
): Promise<string> {
  /**
   * Claude API Integration: 智能提示词重写
   *
   * 功能: 保留用户意图，替换违禁词为合规表达
   *
   * 实现建议:
   * ```typescript
   * import { streamText } from '@/lib/ai/claude'
   * const systemPrompt = `重写以下提示词，移除违禁词但保留创意意图：
   * 违禁词列表: ${violations.map(v => v.word).join(', ')}`
   *
   * let rewritten = ''
   * for await (const chunk of streamText(systemPrompt, prompt, [])) {
   *   rewritten += chunk
   * }
   * return rewritten
   * ```
   *
   * 当前: 使用基础过滤器作为fallback
   */
  return filterPrompt(prompt).filtered
}
