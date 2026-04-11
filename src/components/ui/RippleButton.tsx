/**
 * RippleButton - 带涟漪效果的按钮组件
 * 提供触觉反馈，提升用户体验
 */
'use client'

import { useState, useRef, type MouseEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface RippleProps {
  x: number
  y: number
  size: number
}

interface RippleButtonProps {
  children: ReactNode
  className?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
}

export function RippleButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleProps[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // 计算涟漪位置
    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const size = Math.max(rect.width, rect.height) * 2

      // 添加新涟漪
      const newRipple = { x, y, size }
      setRipples((prev) => [...prev, newRipple])

      // 600ms 后移除涟漪
      setTimeout(() => {
        setRipples((prev) => prev.slice(1))
      }, 600)
    }

    onClick?.(e)
  }

  // 变体样式
  const variantStyles = {
    primary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white border border-transparent',
    secondary: 'bg-white/5 hover:bg-white/10 text-[var(--text-primary)] border border-white/10 hover:border-white/20',
    ghost: 'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] border border-transparent',
    danger: 'bg-red-500 hover:bg-red-600 text-white border border-transparent',
  }

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      className={cn(
        'relative overflow-hidden rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {/* 涟漪效果 */}
      {ripples.map((ripple, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* 按钮内容 */}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

/**
 * IconRippleButton - 仅图标的涟漪按钮
 */
export function IconRippleButton({
  children,
  className,
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
}: {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  'aria-label': string // 必需，因为是图标按钮
}) {
  const [ripples, setRipples] = useState<RippleProps[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    const button = buttonRef.current
    if (button) {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const size = Math.max(rect.width, rect.height) * 2

      const newRipple = { x, y, size }
      setRipples((prev) => [...prev, newRipple])

      setTimeout(() => {
        setRipples((prev) => prev.slice(1))
      }, 600)
    }

    onClick?.(e)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={cn(
        'relative overflow-hidden w-10 h-10 rounded-lg flex items-center justify-center',
        'hover:bg-white/10 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {ripples.map((ripple, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      <span className="relative z-10">{children}</span>
    </button>
  )
}
