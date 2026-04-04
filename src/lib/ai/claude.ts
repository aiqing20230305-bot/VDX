import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db/client'

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
    console.error('[TokenUsage] Failed to record:', err)
  }
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; temperature?: number; source?: string } = {}
): Promise<string> {
  const model = DEFAULT_MODEL
  const message = await anthropic.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
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
  options: { maxTokens?: number; source?: string } = {}
): Promise<T> {
  const text = await generateText(
    systemPrompt + '\n\nYou MUST respond with valid JSON only. No markdown, no explanation.',
    userPrompt,
    options
  )

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
  return JSON.parse(cleaned) as T
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
