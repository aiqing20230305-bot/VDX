/**
 * Sentry Server Configuration
 * 服务端错误追踪和性能监控
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN || '',

  // 环境标识
  environment: process.env.NODE_ENV,

  // Performance Monitoring - 服务端更低采样率
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0, // 生产5%，开发100%

  // 集成配置
  integrations: [
    // Node.js性能追踪
    Sentry.nativeNodeFetchIntegration(),
  ],

  // 忽略特定错误
  ignoreErrors: [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
  ],

  // 自定义错误过滤
  beforeSend(event, hint) {
    // 开发环境打印到控制台
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Server Error:', event, hint)
    }

    // 如果没有配置DSN，不发送
    if (!SENTRY_DSN) {
      return null
    }

    return event
  },

  // 自定义性能追踪过滤
  beforeSendTransaction(transaction) {
    // 忽略healthcheck
    if (transaction.transaction?.includes('healthcheck')) {
      return null
    }
    return transaction
  },
})
