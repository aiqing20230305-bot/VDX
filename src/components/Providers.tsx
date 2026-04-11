/**
 * Providers - 客户端全局Provider包装组件
 */
'use client'

import { ToastProvider } from '@/contexts/ToastContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { I18nProvider } from '@/lib/i18n/context'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { logger } from '@/lib/utils/logger'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 记录错误到控制台（生产环境可以发送到监控服务）
        logger.error('Global error caught:', error, errorInfo)
      }}
    >
      <I18nProvider>
        <ToastProvider>
          {children}
          <PWAInstallPrompt />
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
