/**
 * Next.js Instrumentation - Server-side Sentry Initialization
 *
 * This file is automatically executed by Next.js on both server and client.
 * Used to initialize Sentry for server-side error tracking.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#create-initialization-config-files
 */

export async function register() {
  // Only initialize Sentry on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')

    // Check if Sentry DSN is configured
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

    if (!sentryDsn) {
      console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not configured, skipping Sentry initialization')
      return
    }

    Sentry.init({
      dsn: sentryDsn,

      // Server-side tracing
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Server-side errors
      enabled: process.env.NODE_ENV === 'production',

      // Environment
      environment: process.env.NODE_ENV,

      // Release tracking
      release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

      // Disable debug logging in production
      debug: process.env.NODE_ENV === 'development',

      // Integrations
      integrations: [
        // Add Node.js integrations
        Sentry.httpIntegration(),
      ],

      // Before send hook - filter sensitive data
      beforeSend(event, hint) {
        // Don't send certain types of errors in production
        if (process.env.NODE_ENV === 'production') {
          // Filter out common non-critical errors
          const errorMessage = hint.originalException?.toString() || ''
          if (
            errorMessage.includes('ResizeObserver loop') ||
            errorMessage.includes('Non-Error promise rejection')
          ) {
            return null
          }
        }
        return event
      },
    })

    console.log('[Sentry] Server-side instrumentation initialized')
  }

  // Edge runtime initialization (if needed)
  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')

    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!sentryDsn) return

    Sentry.init({
      dsn: sentryDsn,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === 'production',
      environment: process.env.NODE_ENV,
    })

    console.log('[Sentry] Edge runtime instrumentation initialized')
  }
}

/**
 * onRequestError Hook - Capture errors from nested React Server Components
 *
 * This hook is called when an error occurs during request handling in the App Router.
 * It catches errors from nested Server Components that would otherwise be missed.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation#onrequesterror-optional
 */
export async function onRequestError(
  err: Error & { digest?: string },
  request: Request,
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
    renderSource: 'react-server-components' | 'react-server-components-payload' | 'server-rendering'
  }
) {
  // Only capture in production or when Sentry DSN is configured
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  if (!sentryDsn || process.env.NODE_ENV !== 'production') {
    console.error('[Sentry] Request error captured:', {
      error: err.message,
      digest: err.digest,
      route: context.routePath,
      type: context.routeType,
    })
    return
  }

  // Dynamically import Sentry to avoid initialization in development
  const Sentry = await import('@sentry/nextjs')

  Sentry.captureException(err, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
    },
    extra: {
      digest: err.digest,
      url: request.url,
      method: request.method,
    },
  })
}
