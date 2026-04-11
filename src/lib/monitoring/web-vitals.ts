/**
 * Real User Monitoring (RUM) - Web Vitals追踪
 *
 * 监控真实用户的核心性能指标：
 * - LCP (Largest Contentful Paint): 最大内容渲染时间
 * - CLS (Cumulative Layout Shift): 累积布局偏移
 * - FCP (First Contentful Paint): 首次内容渲染
 * - INP (Interaction to Next Paint): 交互响应时间
 * - TTFB (Time to First Byte): 首字节时间
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/utils/logger'

/**
 * 性能监控配置
 */
const MONITORING_CONFIG = {
  // 仅在生产环境启用
  enabled: process.env.NODE_ENV === 'production',

  // 采样率（10% = 0.1，100% = 1.0）
  // 降低采样率可减少数据量和成本
  sampleRate: 0.1,

  // 性能预算阈值（毫秒）
  budgets: {
    LCP: 2500,  // Good < 2.5s
    CLS: 0.1,   // Good < 0.1
    FCP: 1800,  // Good < 1.8s
    INP: 200,   // Good < 200ms
    TTFB: 800,  // Good < 800ms
  },
}

/**
 * 性能评级
 */
type PerformanceRating = 'good' | 'needs-improvement' | 'poor'

/**
 * 获取性能评级
 */
function getRating(metric: Metric): PerformanceRating {
  const { name, value } = metric
  const budgets = MONITORING_CONFIG.budgets

  switch (name) {
    case 'LCP':
      return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor'
    case 'CLS':
      return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor'
    case 'FCP':
      return value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor'
    case 'INP':
      return value < 200 ? 'good' : value < 500 ? 'needs-improvement' : 'poor'
    case 'TTFB':
      return value < 800 ? 'good' : value < 1800 ? 'needs-improvement' : 'poor'
    default:
      return 'good'
  }
}

/**
 * 判断是否应该采样此次数据
 */
function shouldSample(): boolean {
  return Math.random() < MONITORING_CONFIG.sampleRate
}

/**
 * 发送性能指标到监控系统
 */
function sendToAnalytics(metric: Metric) {
  if (!MONITORING_CONFIG.enabled) {
    // 开发环境仅打印
    logger.debug('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric),
      id: metric.id,
      navigationType: metric.navigationType,
    })
    return
  }

  // 采样检查
  if (!shouldSample()) {
    return
  }

  const rating = getRating(metric)
  const budget = MONITORING_CONFIG.budgets[metric.name as keyof typeof MONITORING_CONFIG.budgets]
  const exceedsBudget = metric.value > budget

  // 发送到 Sentry Performance
  // 使用正确的Sentry API
  Sentry.captureMessage(
    `Web Vitals: ${metric.name}`,
    {
      level: 'info',
      tags: {
        metric: metric.name,
        rating,
        navigation_type: metric.navigationType,
        exceeds_budget: exceedsBudget.toString(),
      },
      contexts: {
        web_vitals: {
          name: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          navigationType: metric.navigationType,
        },
      },
    }
  )

  // 如果超出预算，创建性能事件
  if (exceedsBudget) {
    Sentry.captureMessage(
      `Performance budget exceeded: ${metric.name}`,
      {
        level: rating === 'poor' ? 'warning' : 'info',
        tags: {
          metric: metric.name,
          value: metric.value.toString(),
          budget: budget.toString(),
          rating,
        },
        contexts: {
          performance: {
            metric: metric.name,
            value: metric.value,
            rating,
            budget,
            delta: metric.delta,
            id: metric.id,
            navigationType: metric.navigationType,
          },
        },
      }
    )
  }

  // 也可以发送到自定义端点
  // sendToCustomEndpoint(metric)
}

/**
 * （可选）发送到自定义分析端点
 */
function sendToCustomEndpoint(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: getRating(metric),
    id: metric.id,
    delta: metric.delta,
    navigationType: metric.navigationType,
    timestamp: Date.now(),

    // 附加上下文
    url: window.location.href,
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType || 'unknown',
    deviceMemory: (navigator as any).deviceMemory || 'unknown',
  })

  // 使用 sendBeacon 确保数据发送（即使页面关闭）
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/web-vitals', body)
  } else {
    // 降级到 fetch
    fetch('/api/analytics/web-vitals', {
      body,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(err => logger.error('[Web Vitals] Failed to send to custom endpoint:', err))
  }
}

/**
 * 初始化Web Vitals监控
 */
export function initWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onINP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)

    if (MONITORING_CONFIG.enabled) {
      logger.info('[Web Vitals] Monitoring initialized (sample rate:', MONITORING_CONFIG.sampleRate, ')')
    }
  } catch (error) {
    logger.error('[Web Vitals] Initialization failed:', error)
    Sentry.captureException(error)
  }
}

/**
 * 导出配置供外部修改
 */
export function setMonitoringConfig(config: Partial<typeof MONITORING_CONFIG>) {
  Object.assign(MONITORING_CONFIG, config)
}
