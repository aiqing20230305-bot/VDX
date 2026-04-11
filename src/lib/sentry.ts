/**
 * Sentry Utilities
 * 用于在应用中手动报告错误和追踪事件
 */

import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/utils/logger'

/**
 * 捕获错误并发送到Sentry
 */
export function captureError(error: Error, context?: Record<string, any>) {
  // 开发环境打印到控制台
  if (process.env.NODE_ENV === 'development') {
    logger.error('Sentry captureError:', error, context)
  }

  // 发送到Sentry
  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * 捕获消息（非错误的日志）
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'development') {
    logger.info('Sentry captureMessage:', message, level)
  }

  Sentry.captureMessage(message, level)
}

/**
 * 添加面包屑（用于追踪用户操作路径）
 */
export function addBreadcrumb(breadcrumb: {
  message: string
  category?: string
  level?: 'info' | 'warning' | 'error'
  data?: Record<string, any>
}) {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  })
}

/**
 * 设置用户上下文
 */
export function setUser(user: {
  id?: string
  email?: string
  username?: string
  [key: string]: any
}) {
  Sentry.setUser(user)
}

/**
 * 清除用户上下文（退出登录时）
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * 设置自定义标签
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

/**
 * 设置自定义上下文
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context)
}

/**
 * 开始性能追踪（使用Sentry v8的startSpan API）
 */
export function startSpan<T>(
  name: string,
  op: string = 'function',
  callback: () => T
): T {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  )
}

/**
 * 追踪API请求性能
 * Sentry v8会自动根据Promise的成功/失败状态设置span status
 */
export async function traceApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: 'http.client',
    },
    async () => {
      try {
        const result = await apiCall()
        return result
      } catch (error) {
        captureError(error as Error, { api: name })
        throw error
      }
    }
  )
}
