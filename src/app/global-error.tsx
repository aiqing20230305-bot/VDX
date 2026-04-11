'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

/**
 * Global Error Boundary
 *
 * Catches unhandled errors in the React component tree and reports them to Sentry.
 * This is a Next.js App Router feature that wraps the entire application.
 *
 * Must be a Client Component ('use client') and placed at app/global-error.tsx
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/routing/error-handling#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="zh-CN">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0f',
            color: '#f4f4f5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              border: '2px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginBottom: '24px',
            }}
          >
            ⚠️
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              marginBottom: '12px',
              textAlign: 'center',
            }}
          >
            应用出现错误
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: '16px',
              color: '#a1a1aa',
              marginBottom: '32px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            抱歉，应用遇到了意外错误。我们已记录此问题并会尽快修复。
          </p>

          {/* Error digest (if available) */}
          {error.digest && (
            <p
              style={{
                fontSize: '14px',
                color: '#71717a',
                marginBottom: '24px',
                fontFamily: 'monospace',
              }}
            >
              错误ID: {error.digest}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#06b6d4',
                color: '#0a0a0f',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              重试
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                backgroundColor: 'transparent',
                color: '#06b6d4',
                border: '1px solid #06b6d4',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              返回首页
            </button>
          </div>

          {/* Development mode: show error details */}
          {process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '32px',
                maxWidth: '600px',
                width: '100%',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#ef4444',
                  marginBottom: '12px',
                }}
              >
                错误详情（仅开发环境可见）
              </summary>
              <pre
                style={{
                  fontSize: '12px',
                  color: '#a1a1aa',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {error.stack || error.message || '未知错误'}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  )
}
