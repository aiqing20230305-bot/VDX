import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const runtime = 'nodejs'

// ─── Claude Max 5x 日限额配置 ───────────────────────────────
// 可通过 .env.local 覆盖
const PLAN = {
  name: process.env.PLAN_NAME ?? 'Max 5x',
  // Max 5x ≈ 5倍基础额度，按 Opus 估算每日约 500 万 token（可根据实际调整）
  dailyTokenBudget: parseInt(process.env.DAILY_TOKEN_BUDGET ?? '5000000', 10),
}

export async function GET() {
  // Today's start (local midnight → UTC)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [rows, total, todayRows] = await Promise.all([
    db.tokenUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.tokenUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
    db.tokenUsage.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Today aggregate
  let todayInput = 0, todayOutput = 0, todayCalls = 0
  const todayBySource: Record<string, { inputTokens: number; outputTokens: number; calls: number }> = {}
  for (const r of todayRows) {
    todayInput += r.inputTokens
    todayOutput += r.outputTokens
    todayCalls += 1
    const s = todayBySource[r.source] ?? { inputTokens: 0, outputTokens: 0, calls: 0 }
    s.inputTokens += r.inputTokens
    s.outputTokens += r.outputTokens
    s.calls += 1
    todayBySource[r.source] = s
  }

  const todayTotal = todayInput + todayOutput
  const pct = PLAN.dailyTokenBudget > 0
    ? Math.min(100, Math.round((todayTotal / PLAN.dailyTokenBudget) * 10000) / 100)
    : 0

  // All-time by source
  const bySource: Record<string, { inputTokens: number; outputTokens: number; calls: number }> = {}
  for (const r of rows) {
    const s = bySource[r.source] ?? { inputTokens: 0, outputTokens: 0, calls: 0 }
    s.inputTokens += r.inputTokens
    s.outputTokens += r.outputTokens
    s.calls += 1
    bySource[r.source] = s
  }

  // Last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentRows = rows.filter(r => r.createdAt >= sevenDaysAgo)
  const byDay: Record<string, { inputTokens: number; outputTokens: number }> = {}
  for (const r of recentRows) {
    const day = r.createdAt.toISOString().slice(0, 10)
    const d = byDay[day] ?? { inputTokens: 0, outputTokens: 0 }
    d.inputTokens += r.inputTokens
    d.outputTokens += r.outputTokens
    byDay[day] = d
  }

  return NextResponse.json({
    plan: {
      name: PLAN.name,
      dailyBudget: PLAN.dailyTokenBudget,
    },
    today: {
      inputTokens: todayInput,
      outputTokens: todayOutput,
      totalTokens: todayTotal,
      calls: todayCalls,
      percent: pct,
      remaining: Math.max(0, PLAN.dailyTokenBudget - todayTotal),
      bySource: todayBySource,
    },
    total: {
      inputTokens: total._sum.inputTokens ?? 0,
      outputTokens: total._sum.outputTokens ?? 0,
      calls: total._count,
    },
    bySource,
    byDay,
    recent: rows.slice(0, 20).map(r => ({
      id: r.id,
      source: r.source,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      createdAt: r.createdAt,
    })),
  })
}
