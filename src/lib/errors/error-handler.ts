/**
 * 统一错误处理系统
 * 提供友好的错误提示和自动重试机制
 */
import { logger } from '@/lib/utils/logger'

const log = logger.context('ErrorHandler')

export enum ErrorType {
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  API_ERROR = 'api_error',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

export interface ErrorInfo {
  type: ErrorType
  title: string
  message: string
  retryable: boolean
  retryAfter?: number // 秒
  action?: {
    label: string
    handler: () => void | Promise<void>
  }
}

/**
 * 解析错误并返回友好的错误信息
 */
export function parseError(error: any): ErrorInfo {
  // 网络错误
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return {
      type: ErrorType.NETWORK,
      title: '网络连接失败',
      message: '请检查网络连接后重试',
      retryable: true,
    }
  }

  // 超时错误
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return {
      type: ErrorType.TIMEOUT,
      title: '请求超时',
      message: '服务器响应时间过长，请稍后重试',
      retryable: true,
    }
  }

  // API限流
  if (error.status === 429 || error.message?.includes('rate limit')) {
    const retryAfter = error.retryAfter || 30
    return {
      type: ErrorType.RATE_LIMIT,
      title: '请求过于频繁',
      message: `请稍后再试（剩余时间：${retryAfter}秒）`,
      retryable: true,
      retryAfter,
    }
  }

  // 验证错误
  if (error.status === 400 || error.type === 'validation') {
    return {
      type: ErrorType.VALIDATION,
      title: '输入错误',
      message: error.message || '请检查输入内容后重试',
      retryable: false,
    }
  }

  // 认证错误
  if (error.status === 401 || error.status === 403) {
    return {
      type: ErrorType.API_ERROR,
      title: '认证失败',
      message: '请检查API密钥配置',
      retryable: false,
    }
  }

  // 服务器错误
  if (error.status >= 500) {
    return {
      type: ErrorType.API_ERROR,
      title: '服务器错误',
      message: '服务暂时不可用，请稍后重试',
      retryable: true,
    }
  }

  // 通用API错误
  if (error.status) {
    return {
      type: ErrorType.API_ERROR,
      title: 'API错误',
      message: error.message || `请求失败 (${error.status})`,
      retryable: error.status >= 500,
    }
  }

  // 未知错误
  return {
    type: ErrorType.UNKNOWN,
    title: '操作失败',
    message: error.message || '发生未知错误，请重试',
    retryable: true,
  }
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  maxDelay: number // ms
  backoffFactor: number
  retryableErrors?: ErrorType[]
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.API_ERROR,
  ],
}

/**
 * 带重试的异步函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (attempt: number, error: ErrorInfo) => void
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: any

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const errorInfo = parseError(error)

      // 检查是否可重试
      const isRetryable =
        errorInfo.retryable &&
        (!fullConfig.retryableErrors ||
          fullConfig.retryableErrors.includes(errorInfo.type))

      // 如果是最后一次尝试或不可重试，直接抛出
      if (attempt === fullConfig.maxRetries || !isRetryable) {
        throw error
      }

      // 计算延迟（指数退避）
      const delay = Math.min(
        fullConfig.initialDelay * Math.pow(fullConfig.backoffFactor, attempt),
        fullConfig.maxDelay
      )

      // 如果有 retryAfter，使用它
      const finalDelay = errorInfo.retryAfter
        ? errorInfo.retryAfter * 1000
        : delay

      log.info(
        `Attempt ${attempt + 1}/${fullConfig.maxRetries} failed, retrying in ${finalDelay}ms...`,
        errorInfo
      )

      // 通知回调
      if (onRetry) {
        onRetry(attempt + 1, errorInfo)
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, finalDelay))
    }
  }

  throw lastError
}

/**
 * 错误日志记录（用于调试）
 */
export function logError(error: any, context?: string): void {
  const errorInfo = parseError(error)
  const logEntry = {
    timestamp: new Date().toISOString(),
    context: context || 'unknown',
    type: errorInfo.type,
    title: errorInfo.title,
    message: errorInfo.message,
    originalError: error.message || String(error),
    stack: error.stack,
  }

  // 记录到 localStorage（最多保留50条）
  try {
    const logs = JSON.parse(localStorage.getItem('error_logs') || '[]')
    logs.push(logEntry)

    // 只保留最近50条
    const recentLogs = logs.slice(-50)
    localStorage.setItem('error_logs', JSON.stringify(recentLogs))

    log.error(`${context}:`, errorInfo)
  } catch (e) {
    log.error('Failed to save error log:', e)
  }
}

/**
 * 获取错误日志
 */
export function getErrorLogs(): any[] {
  try {
    return JSON.parse(localStorage.getItem('error_logs') || '[]')
  } catch {
    return []
  }
}

/**
 * 清空错误日志
 */
export function clearErrorLogs(): void {
  localStorage.removeItem('error_logs')
}
