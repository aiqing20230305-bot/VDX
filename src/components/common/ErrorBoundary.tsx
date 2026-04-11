/**
 * ErrorBoundary - 全局错误边界
 * 捕获并优雅地处理React组件树中的错误
 * 集成Sentry错误追踪
 */
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

// Sentry类型定义（避免TypeScript错误）
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: Record<string, any>) => void
    }
  }
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 更新状态
    this.setState({
      error,
      errorInfo,
    })

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo)

    // 发送错误到Sentry
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
          <div className="max-w-2xl w-full">
            {/* 错误图标 */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-3xl font-bold text-center mb-4 text-zinc-100">
              糟糕，出错了
            </h1>

            {/* 错误描述 */}
            <p className="text-center text-zinc-400 mb-8">
              应用遇到了一个意外错误。您可以尝试刷新页面，或返回首页重新开始。
            </p>

            {/* 错误详情（开发模式） */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                <h3 className="text-sm font-semibold text-red-400 mb-3">错误详情（仅开发环境可见）</h3>

                {/* 错误消息 */}
                <div className="mb-4">
                  <div className="text-xs text-zinc-500 mb-1">错误消息：</div>
                  <div className="text-sm text-zinc-300 font-mono bg-zinc-800 p-3 rounded overflow-x-auto">
                    {this.state.error.message}
                  </div>
                </div>

                {/* 错误堆栈 */}
                {this.state.error.stack && (
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">堆栈跟踪：</div>
                    <div className="text-xs text-zinc-400 font-mono bg-zinc-800 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {this.state.error.stack}
                    </div>
                  </div>
                )}

                {/* 组件堆栈 */}
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-4">
                    <div className="text-xs text-zinc-500 mb-1">组件堆栈：</div>
                    <div className="text-xs text-zinc-400 font-mono bg-zinc-800 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                      {this.state.errorInfo.componentStack}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-medium transition shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition border border-zinc-700"
              >
                <Home className="w-4 h-4" />
                返回首页
              </button>
            </div>

            {/* 帮助文字 */}
            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-500">
                如果问题持续存在，请{' '}
                <a
                  href="https://github.com/anthropics/claude-code/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  报告此问题
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 异步边界 - 用于捕获异步操作中的错误
 * 配合 React Suspense 使用
 */
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ErrorBoundary
      fallback={
        fallback || (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-sm text-zinc-400">加载失败，请重试</p>
            </div>
          </div>
        )
      }
    >
      {children}
    </ErrorBoundary>
  )
}
