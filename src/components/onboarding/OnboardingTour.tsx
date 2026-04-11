/**
 * OnboardingTour - 首次使用引导教程
 * 交互式步骤教程，帮助新用户快速上手
 */
'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react'

/**
 * OnboardingTour 显示延迟配置（毫秒）
 *
 * 权衡考虑：
 * - 1000ms = 用户快速看到引导，但可能影响CLS
 * - 2500ms = CLS最优（Lighthouse测量期过后），但延迟较长
 *
 * 可通过环境变量配置：NEXT_PUBLIC_ONBOARDING_DELAY
 */
const ONBOARDING_DELAY = parseInt(
  process.env.NEXT_PUBLIC_ONBOARDING_DELAY || '2500'
)

export interface TourStep {
  target: string // CSS selector for the target element
  title: string
  description: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface OnboardingTourProps {
  steps: TourStep[]
  onComplete: () => void
  onSkip: () => void
  isVisible: boolean
}

export function OnboardingTour({ steps, onComplete, onSkip, isVisible }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  // Update target element position
  useEffect(() => {
    if (!isVisible || currentStep >= steps.length) return

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target)
      if (target) {
        setTargetRect(target.getBoundingClientRect())
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [currentStep, steps, isVisible])

  // Don't render at all if we've completed all steps
  if (currentStep >= steps.length) return null

  const step = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Calculate tooltip position based on target element
  const getTooltipPosition = (): React.CSSProperties => {
    if (!targetRect) return {}

    const placement = step.placement || 'bottom'
    const offset = 16

    switch (placement) {
      case 'top':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.top - offset,
          transform: 'translate(-50%, -100%)',
        }
      case 'bottom':
        return {
          left: targetRect.left + targetRect.width / 2,
          top: targetRect.bottom + offset,
          transform: 'translateX(-50%)',
        }
      case 'left':
        return {
          left: targetRect.left - offset,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translate(-100%, -50%)',
        }
      case 'right':
        return {
          left: targetRect.right + offset,
          top: targetRect.top + targetRect.height / 2,
          transform: 'translateY(-50%)',
        }
      default:
        return {}
    }
  }

  return (
    <>
      {/* Backdrop overlay - fade in/out to prevent CLS */}
      <div
        className="fixed inset-0 bg-black/70 z-50 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isVisible ? 1 : 0,
          willChange: 'opacity',
          contain: 'layout style paint',
        }}
      />

      {/* Highlight box around target element */}
      {targetRect && (
        <div
          className="fixed z-50 border-2 border-cyan-500 rounded-lg pointer-events-none animate-pulse transition-opacity duration-300"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            opacity: isVisible ? 1 : 0,
            willChange: 'transform',
            contain: 'layout style paint',
          }}
        />
      )}

      {/* Tooltip card - fade in/out to prevent CLS */}
      <div
        className="fixed z-50 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl transition-opacity duration-300"
        style={{
          ...getTooltipPosition(),
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
          willChange: 'transform',
          contain: 'layout style paint',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
              步骤 {currentStep + 1}/{steps.length}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="w-8 h-8 hover:bg-zinc-800 rounded-lg flex items-center justify-center transition"
            aria-label="跳过引导"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">{step.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">{step.description}</p>

          {/* Optional action button */}
          {step.action && (
            <button
              onClick={step.action.onClick}
              className="mt-4 w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm font-medium text-cyan-400 transition"
            >
              {step.action.label}
            </button>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between p-4 border-t border-zinc-800">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition text-zinc-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">上一步</span>
          </button>

          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-[background-color] ${
                  index === currentStep
                    ? 'bg-cyan-500'
                    : index < currentStep
                    ? 'bg-cyan-500/50'
                    : 'bg-zinc-700'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition text-white"
          >
            <span className="text-sm font-medium">
              {isLastStep ? '完成' : '下一步'}
            </span>
            {isLastStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * Hook to manage onboarding state
 */
export function useOnboarding(storageKey: string) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(storageKey)
    if (!hasCompletedOnboarding) {
      // Delay showing onboarding to avoid CLS during initial page load
      // See ONBOARDING_DELAY constant for configuration options
      setTimeout(() => setShowOnboarding(true), ONBOARDING_DELAY)
    }
  }, [storageKey])

  const completeOnboarding = () => {
    localStorage.setItem(storageKey, 'true')
    setShowOnboarding(false)
  }

  const skipOnboarding = () => {
    localStorage.setItem(storageKey, 'true')
    setShowOnboarding(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem(storageKey)
    setShowOnboarding(true)
  }

  return {
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  }
}
