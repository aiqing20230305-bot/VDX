'use client'

import { useEffect, useRef, useState } from 'react'

interface UsageData {
  total: { inputTokens: number; outputTokens: number; calls: number }
  bySource: Record<string, { inputTokens: number; outputTokens: number; calls: number }>
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// claude-opus-4 pricing: $15/MTok input, $75/MTok output
function estimateCost(input: number, output: number) {
  return (input * 15 + output * 75) / 1_000_000
}

export function TokenStats() {
  const [data, setData] = useState<UsageData | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/usage')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!data) return null

  const { total, bySource } = data
  const totalAll = total.inputTokens + total.outputTokens
  const cost = estimateCost(total.inputTokens, total.outputTokens)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-xs text-zinc-400"
      >
        <span className="text-violet-400">◈</span>
        <span>{fmt(totalAll)} tok</span>
        {cost >= 0.001 && <span className="text-zinc-500">${cost.toFixed(3)}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 p-3 space-y-3">
          <div className="text-xs font-medium text-zinc-300">Token 用量</div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-800 rounded-lg p-2">
              <div className="text-xs text-zinc-500">输入</div>
              <div className="text-sm font-mono text-blue-400">{fmt(total.inputTokens)}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <div className="text-xs text-zinc-500">输出</div>
              <div className="text-sm font-mono text-violet-400">{fmt(total.outputTokens)}</div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-2">
              <div className="text-xs text-zinc-500">调用</div>
              <div className="text-sm font-mono text-zinc-300">{total.calls}</div>
            </div>
          </div>

          {Object.keys(bySource).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">来源分布</div>
              {Object.entries(bySource)
                .sort((a, b) => (b[1].inputTokens + b[1].outputTokens) - (a[1].inputTokens + a[1].outputTokens))
                .map(([src, s]) => {
                  const total2 = s.inputTokens + s.outputTokens
                  const pct = totalAll > 0 ? Math.round((total2 / totalAll) * 100) : 0
                  return (
                    <div key={src} className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400 w-28 truncate">{src}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="bg-violet-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-zinc-500 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
            </div>
          )}

          <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-2">
            预估费用（Opus 4）：<span className="text-zinc-400">${cost.toFixed(4)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
