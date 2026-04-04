import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

export const runtime = 'nodejs'

export async function GET() {
  const [rows, total] = await Promise.all([
    db.tokenUsage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.tokenUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
  ])

  // Aggregate by source
  const bySource: Record<string, { inputTokens: number; outputTokens: number; calls: number }> = {}
  for (const r of rows) {
    const s = bySource[r.source] ?? { inputTokens: 0, outputTokens: 0, calls: 0 }
    s.inputTokens += r.inputTokens
    s.outputTokens += r.outputTokens
    s.calls += 1
    bySource[r.source] = s
  }

  // Last 7 days daily breakdown
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
