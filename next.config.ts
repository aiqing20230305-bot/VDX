import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 开发环境禁用
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gstatic-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
        },
      },
    },
    {
      urlPattern: /\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5分钟
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
})

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* config options here */

  // Empty turbopack config to allow webpack config to work
  // Remotion requires webpack externals configuration
  turbopack: {},

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Remotion packages that contain binary dependencies
      // This prevents webpack from trying to bundle them
      config.externals = [
        ...(config.externals || []),
        '@remotion/bundler',
        '@remotion/renderer',
        '@remotion/compositor-darwin-x64',
        '@remotion/compositor-darwin-arm64',
        '@remotion/compositor-linux-arm64-gnu',
        '@remotion/compositor-linux-arm64-musl',
        '@remotion/compositor-linux-x64-gnu',
        '@remotion/compositor-linux-x64-musl',
        '@remotion/compositor-win32-x64-msvc',
        'esbuild',
      ];
    }
    return config;
  },
};

// Sentry配置选项
const sentryWebpackPluginOptions = {
  // 只在生产构建时上传Source Maps
  silent: process.env.NODE_ENV !== 'production',

  // 禁用自动上传（避免每次开发构建都上传）
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',

  // 隐藏Source Maps（不公开暴露）
  hideSourceMaps: true,

  // 不在日志中显示警告
  widenClientFileUpload: true,
}

// 按顺序包装配置：PWA → Bundle Analyzer → Sentry
export default withSentryConfig(
  withBundleAnalyzer(
    withPWA(nextConfig)
  ),
  sentryWebpackPluginOptions
);
