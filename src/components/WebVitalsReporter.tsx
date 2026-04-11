'use client'

/**
 * Web Vitals Reporter - 客户端性能监控组件
 *
 * 在客户端初始化Web Vitals追踪，监控真实用户性能指标。
 * 仅在production环境发送数据到Sentry。
 */

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/monitoring/web-vitals'

export function WebVitalsReporter() {
  useEffect(() => {
    // 延迟初始化，避免阻塞首屏渲染
    if (typeof window !== 'undefined') {
      // 使用 requestIdleCallback 在浏览器空闲时初始化
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          initWebVitals()
        })
      } else {
        // 降级到 setTimeout
        setTimeout(() => {
          initWebVitals()
        }, 1000)
      }
    }
  }, [])

  // 不渲染任何内容
  return null
}
