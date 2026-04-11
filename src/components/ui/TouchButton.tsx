/**
 * TouchButton - 移动端优化的按钮组件
 * 确保触摸目标≥44x44px，添加触摸反馈
 */
'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  touchFeedback?: boolean
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      touchFeedback = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // 基础样式
      'inline-flex items-center justify-center',
      'font-medium rounded-lg',
      'transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'select-none', // 防止文字选中
      // 触摸反馈
      touchFeedback && 'active:scale-95',
      // 最小触摸目标
      'min-h-[44px] min-w-[44px]'
    )

    const variantStyles = {
      primary: cn(
        'bg-cyan-500 hover:bg-cyan-600 text-white',
        'focus:ring-cyan-500',
        'active:bg-cyan-700'
      ),
      secondary: cn(
        'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
        'border border-zinc-700',
        'focus:ring-zinc-500'
      ),
      ghost: cn(
        'bg-transparent hover:bg-zinc-800 text-zinc-300',
        'focus:ring-zinc-500'
      ),
      danger: cn(
        'bg-red-500 hover:bg-red-600 text-white',
        'focus:ring-red-500',
        'active:bg-red-700'
      ),
    }

    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    )
  }
)

TouchButton.displayName = 'TouchButton'
