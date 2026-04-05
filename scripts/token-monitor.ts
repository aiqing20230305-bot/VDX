/**
 * Token Monitor — CLI dashboard
 * Usage: npx tsx scripts/token-monitor.ts
 * Auto-refreshes every 5 seconds.
 */

const API = process.env.USAGE_API ?? 'http://localhost:3000/api/usage'
const REFRESH_MS = 5_000
const BAR_W = 40

// ─── Types ──────────────────────────────────────────────────

interface UsageRow {
  id: string; source: string; model: string
  inputTokens: number; outputTokens: number; createdAt: string
}

interface SourceBucket { inputTokens: number; outputTokens: number; calls: number }

interface UsageData {
  plan: { name: string; dailyBudget: number }
  today: {
    inputTokens: number; outputTokens: number; totalTokens: number
    calls: number; percent: number; remaining: number
    bySource: Record<string, SourceBucket>
  }
  total: { inputTokens: number; outputTokens: number; calls: number }
  bySource: Record<string, SourceBucket>
  byDay: Record<string, { inputTokens: number; outputTokens: number }>
  recent: UsageRow[]
}

// ─── Helpers ────────────────────────────────────────────────

const DIM  = '\x1b[2m'
const RST  = '\x1b[0m'
const BOLD = '\x1b[1m'
const RED  = '\x1b[31m'
const YEL  = '\x1b[33m'
const GRN  = '\x1b[32m'
const VIO  = '\x1b[35m'
const CYN  = '\x1b[36m'
const WHT  = '\x1b[37m'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
function fmtN(n: number, w: number): string { return n.toLocaleString().padStart(w) }
function pad(s: string, w: number): string { return s.padEnd(w).slice(0, w) }
function rpad(s: string, w: number): string { return s.padStart(w).slice(-w) }

function progressBar(pct: number, width: number): string {
  const filled = Math.round((Math.min(pct, 100) / 100) * width)
  const empty  = width - filled
  const color  = pct >= 90 ? RED : pct >= 70 ? YEL : GRN
  return `${color}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RST}`
}

function sparkBar(pct: number, width: number): string {
  const filled = Math.round((Math.min(pct, 100) / 100) * width)
  return '▇'.repeat(filled) + ' '.repeat(width - filled)
}

// ─── Render ─────────────────────────────────────────────────

function render(d: UsageData): string {
  const W = 64
  const HR  = `${DIM}${'─'.repeat(W)}${RST}`
  const now = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  const pctColor = d.today.percent >= 90 ? RED : d.today.percent >= 70 ? YEL : GRN

  const lines: string[] = []

  // Header
  lines.push('')
  lines.push(`  ${VIO}◈${RST}  ${BOLD}超级视频Agent · Token Monitor${RST}  ${DIM}${now}${RST}`)
  lines.push(HR)

  // ── Plan + Daily Progress ──
  lines.push('')
  lines.push(`  ${BOLD}${CYN}📊 今日用量${RST}  ${DIM}${d.plan.name}${RST}`)
  lines.push('')
  lines.push(`  ${progressBar(d.today.percent, BAR_W)}  ${pctColor}${d.today.percent.toFixed(1)}%${RST}`)
  lines.push(`  ${DIM}已用 ${WHT}${fmt(d.today.totalTokens)}${DIM} / 额度 ${WHT}${fmt(d.plan.dailyBudget)}${DIM} · 剩余 ${pctColor}${fmt(d.today.remaining)}${RST}`)
  lines.push('')

  // Today stats grid
  lines.push(`  输入  ${CYN}${fmtN(d.today.inputTokens, 10)}${RST}    输出  ${VIO}${fmtN(d.today.outputTokens, 10)}${RST}    调用  ${WHT}${fmtN(d.today.calls, 4)}${RST}`)

  // Today by source
  const todaySources = Object.entries(d.today.bySource)
    .sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens))
  if (todaySources.length > 0) {
    lines.push('')
    lines.push(`  ${DIM}今日各模块：${RST}`)
    for (const [src, s] of todaySources) {
      const st = s.inputTokens + s.outputTokens
      const pct = d.today.totalTokens > 0 ? Math.round((st / d.today.totalTokens) * 100) : 0
      lines.push(`  ${pad(src, 22)} ${progressBar(pct, 16)}  ${rpad(String(pct) + '%', 4)}  ${rpad(fmt(st), 6)}`)
    }
  }

  lines.push('')
  lines.push(HR)

  // ── 7-day trend ──
  const days = Object.entries(d.byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-7)
  if (days.length > 0) {
    const maxDay = Math.max(...days.map(([, v]) => v.inputTokens + v.outputTokens), 1)
    lines.push('')
    lines.push(`  ${BOLD}📈 近 7 天${RST}`)
    lines.push('')
    for (const [day, v] of days) {
      const dt = v.inputTokens + v.outputTokens
      const w = Math.max(1, Math.round((dt / maxDay) * 28))
      const isToday = day === new Date().toISOString().slice(0, 10)
      const label = isToday ? `${GRN}${day.slice(5)} 今天${RST}` : `${DIM}${day.slice(5)}${RST}      `
      lines.push(`  ${label}  ${VIO}${sparkBar(Math.round((dt / maxDay) * 100), 28)}${RST}  ${rpad(fmt(dt), 6)}`)
    }
    lines.push('')
    lines.push(HR)
  }

  // ── Recent calls ──
  if (d.recent.length > 0) {
    lines.push('')
    lines.push(`  ${BOLD}🕐 最近调用${RST}`)
    lines.push(`  ${DIM}${pad('时间', 10)} ${pad('来源', 22)} ${rpad('输入', 7)} ${rpad('输出', 7)} ${rpad('合计', 7)}${RST}`)
    for (const r of d.recent.slice(0, 6)) {
      const t = new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour12: false })
      lines.push(`  ${pad(t, 10)} ${pad(r.source, 22)} ${fmtN(r.inputTokens, 7)} ${fmtN(r.outputTokens, 7)} ${fmtN(r.inputTokens + r.outputTokens, 7)}`)
    }
  }

  // ── All-time footer ──
  lines.push('')
  lines.push(HR)
  const allTok = d.total.inputTokens + d.total.outputTokens
  lines.push(`  ${DIM}累计 ${fmt(allTok)} tok / ${d.total.calls} 次调用${RST}`)

  if (d.today.totalTokens === 0) {
    lines.push('')
    lines.push(`  ${DIM}(暂无今日调用，使用后自动统计)${RST}`)
  }

  lines.push('')
  return lines.join('\n')
}

// ─── Main loop ──────────────────────────────────────────────

async function tick() {
  try {
    const res = await fetch(API)
    const data: UsageData = await res.json()
    console.clear()
    console.log(render(data))
    console.log(`  ${DIM}自动刷新 (${REFRESH_MS / 1000}s) · Ctrl+C 退出${RST}\n`)
  } catch {
    console.clear()
    console.log(`${RED}连接失败: ${API}${RST}`)
    console.log('请确认 dev server 已启动: npm run dev')
  }
}

tick()
setInterval(tick, REFRESH_MS)
