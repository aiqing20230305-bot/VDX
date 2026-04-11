/**
 * Sentry Edge Runtime Configuration
 * Edge Runtime（如Middleware）的错误追踪
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || '',

  // 环境标识
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

  // 自定义错误过滤
  beforeSend(event) {
    // 如果没有配置DSN，不发送
    if (!SENTRY_DSN) {
      return null
    }
    return event
  },
})
