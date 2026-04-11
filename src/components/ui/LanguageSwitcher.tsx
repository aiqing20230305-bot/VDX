'use client'

import { Globe } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/context'

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition text-sm text-zinc-400 hover:text-zinc-200"
        aria-label={`${locale === 'zh' ? '中文' : 'English'}`}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{locale === 'zh' ? '中文' : 'English'}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <button
          onClick={() => setLocale('zh')}
          className={`w-full px-3 py-2 text-left text-sm rounded-t-lg transition ${
            locale === 'zh'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          中文
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`w-full px-3 py-2 text-left text-sm rounded-b-lg transition ${
            locale === 'en'
              ? 'bg-cyan-500/20 text-cyan-400'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          English
        </button>
      </div>
    </div>
  )
}
