/**
 * Toast通知组件
 * 显示错误、警告、信息和成功消息
 */
'use client'

import { useEffect, useState } from 'react'
import { X, AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'

export type ToastType = 'error' | 'warning' | 'info' | 'success'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  duration?: number // ms, 0表示不自动消失
  onClose: (id: string) => void
}

export function Toast({
  id,
  type,
  title,
  message,
  action,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 淡入动画
    setIsVisible(true)

    // 自动消失（error类型默认不消失）
    if (duration > 0 && type !== 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(id), 300) // 等待淡出动画
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, type, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(id), 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
      case 'success':
        return <CheckCircle className="w-5 h-5" />
    }
  }

  const getColors = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-500/10 border-red-500/30',
          icon: 'text-red-400',
          title: 'text-red-200',
          message: 'text-red-300/80',
          button: 'bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-300',
        }
      case 'warning':
        return {
          bg: 'bg-yellow-500/10 border-yellow-500/30',
          icon: 'text-yellow-400',
          title: 'text-yellow-200',
          message: 'text-yellow-300/80',
          button: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-500/50 text-yellow-300',
        }
      case 'info':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30',
          icon: 'text-cyan-400',
          title: 'text-cyan-200',
          message: 'text-cyan-300/80',
          button: 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 text-cyan-300',
        }
      case 'success':
        return {
          bg: 'bg-green-500/10 border-green-500/30',
          icon: 'text-green-400',
          title: 'text-green-200',
          message: 'text-green-300/80',
          button: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-300',
        }
    }
  }

  const colors = getColors()

  return (
    <div
      className={`
        min-w-[320px] max-w-md p-4 rounded-xl border shadow-2xl
        transition-all duration-300 ease-out
        ${colors.bg}
        ${
          isVisible
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
          {getIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm mb-1 ${colors.title}`}>
            {title}
          </div>
          <div className={`text-xs leading-relaxed ${colors.message}`}>
            {message}
          </div>

          {/* 操作按钮 */}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${colors.button}`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition text-zinc-400 hover:text-zinc-200"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/**
 * Toast容器组件
 */
export function ToastContainer({ toasts, onClose }: {
  toasts: ToastProps[]
  onClose: (id: string) => void
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>
  )
}
