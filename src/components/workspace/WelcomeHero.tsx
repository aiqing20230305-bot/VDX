/**
 * Welcome Hero - 视觉冲击的首屏入口
 * 参考 SEKO 11.png
 */
'use client'

import { useState } from 'react'
import { Sparkles, Search, Zap } from './icons'
import Image from 'next/image'
import { TemplateGallery } from './TemplateGallery'
import { OnboardingTour, useOnboarding } from '@/components/onboarding/OnboardingTour'
import { welcomeTourSteps, featureHighlights } from '@/components/onboarding/WelcomeOnboarding'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { useTranslation } from '@/lib/i18n/context'
import type { VideoTemplate } from '@/lib/templates'

interface WelcomeHeroProps {
  onStartProject: (query: string) => void
  onStartFromTemplate: (template: VideoTemplate) => void
  inspirationGallery?: Array<{
    id: string
    titleKey: string // i18n translation key
    thumbnail: string
    duration: number
  }>
}

export function WelcomeHero({ onStartProject, onStartFromTemplate, inspirationGallery = [] }: WelcomeHeroProps) {
  const [query, setQuery] = useState('')
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const { t } = useTranslation()

  // Onboarding tour
  const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding('welcome-onboarding-completed')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onStartProject(query.trim())
    }
  }

  const handleTemplateSelect = (template: VideoTemplate) => {
    setShowTemplateGallery(false)
    onStartFromTemplate(template)
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* 背景：渐变 + 网格 - 优化渲染性能 */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-cyan-950/20"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
            contain: 'strict',
            willChange: 'opacity',
          }}
        />
      </div>

      {/* 主内容 */}
      <div className="relative z-10 flex flex-col items-center h-full px-4 sm:px-6 md:px-8 pt-16 md:pt-24 overflow-y-auto">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/20">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
        </div>

        {/* 语言切换器 */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <LanguageSwitcher />
        </div>

        {/* 标题 */}
        <h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-white px-4"
          style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
        >
          {t('welcome.title')}
        </h1>

        {/* 副标题 */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-400 mb-8 md:mb-12 text-center max-w-2xl px-4">
          {t('welcome.subtitle')}
          <br />
          {t('welcome.subtitleLine2')}
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mb-8 md:mb-16 px-4">
          <div className="relative" data-tour="search-input">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('welcome.searchPlaceholder')}
              className="w-full h-14 md:h-16 bg-zinc-900 border-2 border-zinc-800 focus:border-cyan-500 rounded-2xl pl-12 md:pl-14 pr-28 md:pr-32 text-base md:text-lg placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition"
            />
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-zinc-500" />
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 md:px-6 py-2 md:py-2.5 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 rounded-xl text-sm md:text-base font-medium transition shadow-lg shadow-cyan-500/20 disabled:shadow-none whitespace-nowrap"
            >
              {t('welcome.startButton')}
            </button>
          </div>
        </form>

        {/* 快速开始：模板 */}
        <div className="mb-12 md:mb-24 px-4">
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="group flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/50 rounded-xl transition text-sm sm:text-base"
            data-tour="template-button"
          >
            <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="font-medium text-zinc-300 group-hover:text-cyan-400 transition">
              {t('welcome.templateButton')}
            </span>
            <span className="text-xs text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-full whitespace-nowrap">
              {t('welcome.templateBadge')}
            </span>
          </button>
        </div>

        {/* 功能亮点 - 固定高度避免CLS */}
        <div className="w-full max-w-5xl mb-12 md:mb-24 px-4">
          <h2 className="sr-only">核心功能</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featureHighlights.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
                blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
              }[feature.color]

              return (
                <div
                  key={index}
                  className="group p-6 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl transition min-h-[180px] flex flex-col"
                  style={{ contain: 'layout' }}
                >
                  <div className={`w-12 h-12 ${colorClasses} border rounded-lg flex items-center justify-center mb-4 flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-100 mb-2" role="heading" aria-level={3}>{feature.title}</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 灵感画廊 */}
        {inspirationGallery.length > 0 && (
          <div className="w-full max-w-6xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-zinc-400">{t('welcome.inspirationGallery')}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {inspirationGallery.map((item, index) => {
                const translatedTitle = t(item.titleKey)
                return (
                  <button
                    key={item.id}
                    onClick={() => onStartProject(translatedTitle)}
                    className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-900 hover:ring-2 hover:ring-cyan-500/50 transition"
                  >
                    {/* 支持CSS渐变或图片URL */}
                    {item.thumbnail.startsWith('linear-gradient') || item.thumbnail.startsWith('radial-gradient') ? (
                      <div
                        className="absolute inset-0 group-hover:scale-105 transition-transform duration-300"
                        style={{ background: item.thumbnail }}
                      />
                    ) : (
                      <Image
                        src={item.thumbnail}
                        alt={translatedTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        priority={index < 4}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="text-sm font-medium line-clamp-2">{translatedTitle}</div>
                        <div className="text-xs text-zinc-400 mt-1">{item.duration}{t('common.seconds')}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 模板选择器（弹窗） */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}

      {/* 首次使用引导 */}
      <OnboardingTour
        steps={welcomeTourSteps}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        isVisible={showOnboarding}
      />
    </div>
  )
}
