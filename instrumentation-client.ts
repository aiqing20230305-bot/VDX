/**
 * Client-side Instrumentation - Sentry Initialization
 *
 * This file is automatically executed by Next.js on the client side.
 * Used to initialize Sentry for browser-side error tracking and performance monitoring.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#create-initialization-config-files
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

export async function register() {
  // Check if running in browser
  if (typeof window === 'undefined') {
    return
  }

  // Check if Sentry DSN is configured
  if (!SENTRY_DSN) {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured, skipping Sentry client initialization')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // 环境标识
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 生产环境10%采样，开发环境100%

    // Session Replay - 记录用户会话，帮助重现错误
    replaysSessionSampleRate: 0.1, // 10%的正常会话
    replaysOnErrorSampleRate: 1.0, // 100%的错误会话

    // 集成配置
    integrations: [
      // 浏览器追踪（自动追踪页面加载、导航）
      Sentry.browserTracingIntegration({
        // 追踪路由变化
        enableLongTask: true,
        enableInp: true,
      }),

      // Session Replay（录制用户操作）
      Sentry.replayIntegration({
        maskAllText: true, // 隐藏所有文本（隐私保护）
        blockAllMedia: true, // 屏蔽所有媒体
      }),

      // Web Vitals追踪
      Sentry.browserProfilingIntegration(),
    ],

    // 忽略特定错误
    ignoreErrors: [
      // 浏览器扩展错误
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // 网络错误
      'NetworkError',
      'Failed to fetch',
      // 广告拦截器
      'adsbygoogle',
    ],

    // 自定义错误过滤
    beforeSend(event, hint) {
      // 开发环境也打印到控制台
      if (process.env.NODE_ENV === 'development') {
        console.error('[Sentry] Error captured:', event, hint)
      }

      return event
    },

    // 自定义性能追踪过滤
    beforeSendTransaction(transaction) {
      // 忽略healthcheck等不重要的事务
      if (transaction.transaction?.includes('healthcheck')) {
        return null
      }
      return transaction
    },
  })

  console.log('[Sentry] Client-side instrumentation initialized')
}

/**
 * Router Transition Tracking
 *
 * This hook is called when the user navigates to a new route.
 * It helps track performance of client-side navigations.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/features/instrumentation/
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
