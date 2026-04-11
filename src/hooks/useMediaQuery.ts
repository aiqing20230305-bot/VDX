/**
 * useMediaQuery - 媒体查询 Hook
 * 检测设备类型和屏幕尺寸
 */
'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Tailwind 断点配置
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/**
 * 使用媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // 现代浏览器
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } else {
      // 兼容旧浏览器
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [query])

  return matches
}

/**
 * 检测是否为移动设备
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`)
}

/**
 * 检测是否为平板设备
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`
  )
}

/**
 * 检测是否为桌面设备
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}

/**
 * 检测是否为触摸设备
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    )
  }, [])

  return isTouch
}

/**
 * 获取当前断点
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xl')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < BREAKPOINTS.sm) {
        setBreakpoint('xs')
      } else if (width < BREAKPOINTS.md) {
        setBreakpoint('sm')
      } else if (width < BREAKPOINTS.lg) {
        setBreakpoint('md')
      } else if (width < BREAKPOINTS.xl) {
        setBreakpoint('lg')
      } else if (width < BREAKPOINTS['2xl']) {
        setBreakpoint('xl')
      } else {
        setBreakpoint('2xl')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

/**
 * 获取设备信息
 */
export function useDeviceInfo() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()
  const isTouch = useIsTouchDevice()
  const breakpoint = useBreakpoint()

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    breakpoint,
    // 便捷判断
    isSmallScreen: isMobile,
    isMediumScreen: isTablet,
    isLargeScreen: isDesktop,
  }
}
