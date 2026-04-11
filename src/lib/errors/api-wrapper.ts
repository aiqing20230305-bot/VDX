/**
 * API调用包装器
 * 统一处理API错误并显示Toast通知
 */
import { parseError, withRetry, logError, type RetryConfig } from './error-handler'
import type { ToastContextValue } from '@/contexts/ToastContext'

/**
 * 包装API调用，自动处理错误和重试
 *
 * @example
 * const result = await wrapApiCall(
 *   () => fetch('/api/storyboard', { method: 'POST', body: ... }),
 *   toast,
 *   'generate_storyboard'
 * )
 */
export async function wrapApiCall<T>(
  apiCall: () => Promise<T>,
  toast: ToastContextValue,
  context: string,
  options?: {
    retry?: Partial<RetryConfig>
    showSuccessToast?: boolean
    successMessage?: string
    onRetry?: (attempt: number) => void
  }
): Promise<T> {
  try {
    const result = await withRetry(
      apiCall,
      options?.retry,
      (attempt, errorInfo) => {
        // 显示重试提示
        toast.showInfo(
          `正在重试 (${attempt}/${options?.retry?.maxRetries || 3})`,
          errorInfo.message
        )

        // 通知回调
        if (options?.onRetry) {
          options.onRetry(attempt)
        }
      }
    )

    // 显示成功提示
    if (options?.showSuccessToast) {
      toast.showSuccess(
        '操作成功',
        options.successMessage || '请求已完成'
      )
    }

    return result
  } catch (error: any) {
    // 记录错误日志
    logError(error, context)

    // 解析错误
    const errorInfo = parseError(error)

    // 显示错误Toast
    const toastId = toast.showError(
      errorInfo.title,
      errorInfo.message,
      errorInfo.retryable
        ? {
            label: '重试',
            onClick: () => {
              toast.hideToast(toastId)
              wrapApiCall(apiCall, toast, context, options)
            },
          }
        : undefined
    )

    // 重新抛出错误（让调用者可以继续处理）
    throw error
  }
}

/**
 * Fetch包装器，自动处理HTTP错误
 */
export async function fetchWithError(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(url, init)

  if (!response.ok) {
    // 尝试解析错误消息
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // 无法解析JSON，使用状态码
    }

    // 创建增强的错误对象
    const error = new Error(errorMessage) as any
    error.status = response.status
    error.statusText = response.statusText

    // 如果是429（限流），尝试获取Retry-After头
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      if (retryAfter) {
        error.retryAfter = parseInt(retryAfter, 10)
      }
    }

    throw error
  }

  return response
}
