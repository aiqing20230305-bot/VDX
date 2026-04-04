/**
 * Token Monitor — CLI dashboard
 * Usage: npx tsx scripts/token-monitor.ts
 * Auto-refreshes every 5 seconds.
 */

const API = process.env.USAGE_API ?? 'http://localhost:3000/api/usage'
const REFRESH_MS = 5_000
const BAR_WIDTH = 24

interface UsageRow {
  id: string
  source: string
  model: string
  inputTokens: number
  outputTokens: number
  createdAt: string
}

interface UsageData {
  total: { inputTokens: number; outputTokens: number; calls: number }
  bySource: Record<string, { inputTokens: number; outputTokens: number; calls: number }>
  byDay: Record<string, { inputTokens: number; outputTokens: number }>
  recent: UsageRow[]
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtN(n: number, w: number): string {
  return n.toLocaleString().padStart(w)
}

function bar(pct: number, width: number): string {
  const filled = Math.round((pct / 100) * width)
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled)
}

function cost(input: number, output: number): number {
  return (input * 15 + output * 75) / 1_000_000
}

function pad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length)
}

function rpad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s
}

function render(data: UsageData): string {
  const W = 62
  const line = (s: string) => `\u2502  ${pad(s, W - 4)}  \u2502`
  const empty = line('')
  const sep = `\u251c${'─'.repeat(W)}\u2524`
  const top = `\u250c${'─'.repeat(W)}\u2510`
  const bot = `\u2514${'─'.repeat(W)}\u2518`

  const { total, bySource, byDay, recent } = data
  const totalTok = total.inputTokens + total.outputTokens
  const c = cost(total.inputTokens, total.outputTokens)
  const now = new Date().toLocaleTimeString('zh-CN', { hour12: false })

  const lines: string[] = [
    top,
    `\u2502${' '.repeat(Math.floor((W - 38) / 2))}\u25c8  超级视频Agent \u00b7 Token Monitor  ${now}${' '.repeat(Math.ceil((W - 38) / 2))}\u2502`,
    sep,
    empty,
    line(`\u256d─ 总计 ${'─'.repeat(49)}\u256e`),
    line(`\u2502  输入 Tokens  ${fmtN(total.inputTokens, 10)}      调用次数  ${fmtN(total.calls, 6)}       \u2502`),
    line(`\u2502  输出 Tokens  ${fmtN(total.outputTokens, 10)}      预估费用  $${c.toFixed(4).padStart(6)}       \u2502`),
    line(`\u2502  合计         ${fmtN(totalTok, 10)} tok                         \u2502`),
    line(`\u2570${'─'.repeat(55)}\u256f`),
    empty,
  ]

  // By source
  const sources = Object.entries(bySource).sort(
    (a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens)
  )
  if (sources.length > 0) {
    lines.push(line(`\u256d─ 来源分布 ${'─'.repeat(45)}\u256e`))
    for (const [src, s] of sources) {
      const st = s.inputTokens + s.outputTokens
      const pct = totalTok > 0 ? Math.round((st / totalTok) * 100) : 0
      lines.push(
        line(`\u2502  ${pad(src, 20)} ${bar(pct, BAR_WIDTH)} ${rpad(String(pct) + '%', 4)} ${rpad(fmt(st), 6)}\u2502`)
      )
    }
    lines.push(line(`\u2570${'─'.repeat(55)}\u256f`))
    lines.push(empty)
  }

  // By day
  const days = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  if (days.length > 0) {
    const maxDay = Math.max(...days.map(([, d]) => d.inputTokens + d.outputTokens), 1)
    lines.push(line(`\u256d─ 近 7 天 ${'─'.repeat(46)}\u256e`))
    for (const [day, d] of days.slice(-7)) {
      const dt = d.inputTokens + d.outputTokens
      const w = Math.max(1, Math.round((dt / maxDay) * 30))
      lines.push(
        line(`\u2502  ${day.slice(5)}  ${'▇'.repeat(w)}${' '.repeat(30 - w)} ${rpad(fmt(dt), 7)}\u2502`)
      )
    }
    lines.push(line(`\u2570${'─'.repeat(55)}\u256f`))
    lines.push(empty)
  }

  // Recent calls
  if (recent.length > 0) {
    lines.push(line(`\u256d─ 最近调用 ${'─'.repeat(45)}\u256e`))
    lines.push(
      line(`\u2502  ${pad('时间', 10)} ${pad('来源', 20)} ${rpad('输入', 6)} ${rpad('输出', 6)} ${rpad('合计', 6)}\u2502`)
    )
    for (const r of recent.slice(0, 6)) {
      const t = new Date(r.createdAt).toLocaleTimeString('zh-CN', { hour12: false })
      lines.push(
        line(
          `\u2502  ${pad(t, 10)} ${pad(r.source, 20)} ${fmtN(r.inputTokens, 6)} ${fmtN(r.outputTokens, 6)} ${fmtN(r.inputTokens + r.outputTokens, 6)}\u2502`
        )
      )
    }
    lines.push(line(`\u2570${'─'.repeat(55)}\u256f`))
  }

  if (totalTok === 0) {
    lines.push(line('  (暂无调用记录，发送消息后将自动记录 token 用量)'))
  }

  lines.push(empty, bot)
  return lines.join('\n')
}

async function tick() {
  try {
    const res = await fetch(API)
    const data: UsageData = await res.json()
    console.clear()
    console.log(render(data))
    console.log(`  ${'\x1b[2m'}自动刷新中 (${REFRESH_MS / 1000}s) · Ctrl+C 退出${'\x1b[0m'}`)
  } catch (err) {
    console.clear()
    console.log(`\x1b[31m连接失败: ${API}\x1b[0m`)
    console.log('请确认 dev server 已启动: npm run dev')
  }
}

tick()
setInterval(tick, REFRESH_MS)
