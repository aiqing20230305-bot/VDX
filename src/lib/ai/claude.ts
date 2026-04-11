import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db/client'
import { logger } from '../utils/logger'

const log = logger.context('Claude')

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || undefined,
})

const DEFAULT_MODEL = process.env.ANTHROPIC_BASE_URL?.includes('ppio')
  ? 'pa/claude-sonnet-4-5-20250929'
  : 'claude-sonnet-4-5-20250929'

async function recordUsage(
  source: string,
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  try {
    await db.tokenUsage.create({
      data: { source, model, inputTokens, outputTokens },
    })
  } catch (err) {
    log.error('Token usage recording failed', err, { source, model })
  }
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number
    temperature?: number
    source?: string
    images?: string[] // Vision API支持
  } = {}
): Promise<string> {
  const model = DEFAULT_MODEL

  // 构建消息内容（支持Vision API）
  let userContent: Anthropic.MessageParam['content']

  if (options.images && options.images.length > 0) {
    // Vision API格式：包含文字和图片
    userContent = [
      ...options.images.map((imageUrl) => ({
        type: 'image' as const,
        source: {
          type: 'url' as const,
          url: imageUrl,
        },
      })),
      {
        type: 'text' as const,
        text: userPrompt,
      },
    ]
  } else {
    // 纯文本格式
    userContent = userPrompt
  }

  const message = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  })

  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')

  recordUsage(
    options.source ?? 'generateText',
    model,
    message.usage.input_tokens,
    message.usage.output_tokens
  ).catch(() => {})

  return block.text
}

export async function generateJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  options: {
    maxTokens?: number
    source?: string
    images?: string[] // Vision API支持
  } = {}
): Promise<T> {
  const text = await generateText(
    systemPrompt + '\n\n**CRITICAL**: Return ONLY valid JSON. No markdown, no code fences, no explanation. Properly escape all strings. Ensure complete JSON structure (no truncation).',
    userPrompt,
    options
  )

  try {
    return parseJSONRobust<T>(text)
  } catch (err) {
    log.error('JSON parsing failed', err, {
      source: options.source,
      textLength: text.length,
      textStart: text.substring(0, 200),
      textEnd: text.substring(Math.max(0, text.length - 200))
    })
    throw err
  }
}

/**
 * 鲁棒 JSON 解析器
 * 处理 LLM 常见的 JSON 格式问题：
 * - markdown code fences
 * - 字符串值中的未转义换行/引号/制表符
 * - 尾部多余逗号
 * - 前后缀的非 JSON 文本
 * - 截断的 JSON（缺少右括号/右花括号）
 */
function parseJSONRobust<T>(raw: string): T {
  // 1. 去掉 code fences
  let text = raw.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '').trim()

  // 2. 提取 JSON 主体（第一个 { 到最后一个 }）
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) {
    throw new Error(`无法找到 JSON 对象: ${text.substring(0, 200)}`)
  }
  text = text.substring(start, end + 1)

  // 3. 直接尝试
  try { return JSON.parse(text) as T } catch { /* continue */ }

  // 4. 预处理：替换中文标点为英文
  let fixed = text
    .replace(/：/g, ':')
    .replace(/，/g, ',')
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")

  // 5. 修复常见问题
  fixed = fixed
    // 去掉尾部多余逗号
    .replace(/,\s*([}\]])/g, '$1')
    // 去掉多个连续逗号
    .replace(/,\s*,+/g, ',')

  try { return JSON.parse(fixed) as T } catch { /* continue */ }

  // 6. 修复字符串值中的未转义字符（逐字符状态机）
  fixed = fixUnescapedStrings(fixed)

  try { return JSON.parse(fixed) as T } catch { /* continue */ }

  // 7. 检测并修复截断（缺少闭合符号）
  fixed = fixTruncatedJSON(fixed)
  try { return JSON.parse(fixed) as T } catch { /* continue */ }

  // 8. 移除不完整的最后一个元素
  const lastValidComma = fixed.lastIndexOf(',')
  const lastCloseBrace = fixed.lastIndexOf('}')
  if (lastValidComma > lastCloseBrace) {
    // 最后一个逗号在最后一个 } 之后，说明后面可能有不完整的元素
    fixed = fixed.substring(0, lastValidComma) + fixed.substring(lastValidComma).replace(/,\s*$/, '')
  }

  try { return JSON.parse(fixed) as T } catch { /* continue */ }

  // 9. 最后手段：逐行修复
  const lines = fixed.split('\n')
  const fixedLines: string[] = []
  for (const line of lines) {
    // 跳过空行
    if (!line.trim()) continue
    fixedLines.push(line)
  }
  fixed = fixedLines.join('\n')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/,\s*,+/g, ',')

  try {
    return JSON.parse(fixed) as T
  } catch (finalErr) {
    const debugInfo: any = {
      rawStart: raw.substring(0, 1000),
      rawEnd: raw.substring(Math.max(0, raw.length - 500))
    }
    if (finalErr instanceof SyntaxError) {
      const pos = extractPosition(finalErr.message)
      debugInfo.errorPosition = pos
      debugInfo.errorContext = fixed.substring(Math.max(0, pos - 100), Math.min(fixed.length, pos + 100))
    }
    log.error('All JSON repair attempts failed', finalErr, debugInfo)
    throw new Error(`JSON解析失败: ${finalErr instanceof Error ? finalErr.message : String(finalErr)}`)
  }
}

/**
 * 修复截断的 JSON（补全缺失的闭合符号）
 */
function fixTruncatedJSON(json: string): string {
  let fixed = json
  let braceStack = 0  // { }
  let bracketStack = 0  // [ ]
  let inString = false
  let escaped = false

  // 统计未闭合的括号/花括号
  for (let i = 0; i < json.length; i++) {
    const ch = json[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      escaped = true
      continue
    }

    if (ch === '"' && !inString) {
      inString = true
    } else if (ch === '"' && inString) {
      inString = false
    }

    if (!inString) {
      if (ch === '{') braceStack++
      if (ch === '}') braceStack--
      if (ch === '[') bracketStack++
      if (ch === ']') bracketStack--
    }
  }

  // 如果有未闭合的符号，补全它们
  if (inString) {
    fixed += '"'  // 闭合未闭合的字符串
  }

  // 移除最后一个不完整的属性/元素（可能被截断了）
  // 找到最后一个逗号，删除它之后的内容
  const lastComma = fixed.lastIndexOf(',')
  if (lastComma > 0 && braceStack > 0) {
    fixed = fixed.substring(0, lastComma)
  }

  // 补全缺失的闭合符号
  while (bracketStack > 0) {
    fixed += ']'
    bracketStack--
  }
  while (braceStack > 0) {
    fixed += '}'
    braceStack--
  }

  return fixed
}

/** 修复 JSON 字符串值中的未转义字符 */
function fixUnescapedStrings(json: string): string {
  const result: string[] = []
  let inString = false
  let escaped = false

  for (let i = 0; i < json.length; i++) {
    const ch = json[i]

    if (escaped) {
      result.push(ch)
      escaped = false
      continue
    }

    if (ch === '\\' && inString) {
      escaped = true
      result.push(ch)
      continue
    }

    if (ch === '"') {
      if (!inString) {
        inString = true
        result.push(ch)
      } else {
        // 判断这个引号是否是字符串结束符
        // 向后看：如果后面是 , : } ] 或空白+这些，则是结束符
        const rest = json.substring(i + 1).trimStart()
        if (rest.length === 0 || /^[,:\}\]\n\r]/.test(rest)) {
          inString = false
          result.push(ch)
        } else {
          // 字符串值中的未转义引号，转义它
          result.push('\\"')
        }
      }
      continue
    }

    if (inString) {
      // 转义字符串值中的控制字符
      if (ch === '\n') { result.push('\\n'); continue }
      if (ch === '\r') { result.push('\\r'); continue }
      if (ch === '\t') { result.push('\\t'); continue }
    }

    result.push(ch)
  }

  return result.join('')
}

function extractPosition(msg: string): number {
  const match = msg.match(/position\s+(\d+)/i)
  return match ? parseInt(match[1]) : 0
}

export async function* streamText(
  systemPrompt: string,
  userPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  options: { source?: string } = {}
): AsyncGenerator<string> {
  const model = DEFAULT_MODEL
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: 'user', content: userPrompt },
  ]

  const stream = anthropic.messages.stream({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text
    }
  }

  // Capture usage after stream completes
  stream.finalMessage().then((msg) => {
    recordUsage(
      options.source ?? 'streamText',
      model,
      msg.usage.input_tokens,
      msg.usage.output_tokens
    ).catch(() => {})
  }).catch(() => {})
}
