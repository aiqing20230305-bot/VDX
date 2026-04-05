/**
 * Remotion 转场效果类型定义
 */

// 转场类型枚举
export type TransitionType =
  | 'none'       // 无转场
  | 'fade'       // 淡入淡出
  | 'slide'      // 滑动
  | 'zoom'       // 缩放
  | 'rotate'     // 旋转
  | 'wipe'       // 擦除

// 缓动函数类型
export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'

// 滑动方向
export type SlideDirection = 'left' | 'right' | 'up' | 'down'

// 缩放类型
export type ZoomType = 'in' | 'out'

// 旋转轴
export type RotateAxis = 'x' | 'y' | 'z'

// 擦除方向
export type WipeDirection = 'left' | 'right' | 'up' | 'down' | 'circle'

// 基础转场配置
export interface BaseTransitionConfig {
  duration?: number           // 转场时长（帧数，默认 15 帧 = 0.5秒）
  easing?: EasingFunction    // 缓动函数
}

// 淡入淡出配置
export interface FadeTransitionConfig extends BaseTransitionConfig {
  type: 'fade'
}

// 滑动转场配置
export interface SlideTransitionConfig extends BaseTransitionConfig {
  type: 'slide'
  direction: SlideDirection   // 滑动方向
}

// 缩放转场配置
export interface ZoomTransitionConfig extends BaseTransitionConfig {
  type: 'zoom'
  zoomType: ZoomType          // 缩放类型
  scale?: number              // 缩放倍数（默认 1.5）
  origin?: {                  // 缩放中心点（0-1）
    x: number
    y: number
  }
}

// 旋转转场配置
export interface RotateTransitionConfig extends BaseTransitionConfig {
  type: 'rotate'
  axis: RotateAxis            // 旋转轴
  angle?: number              // 旋转角度（度，默认 90）
  perspective?: number        // 透视距离（默认 1000）
}

// 擦除转场配置
export interface WipeTransitionConfig extends BaseTransitionConfig {
  type: 'wipe'
  direction: WipeDirection    // 擦除方向
}

// 联合转场配置类型
export type TransitionConfig =
  | { type: 'none' }
  | FadeTransitionConfig
  | SlideTransitionConfig
  | ZoomTransitionConfig
  | RotateTransitionConfig
  | WipeTransitionConfig

// 转场组件 Props
export interface TransitionProps {
  children: React.ReactNode
  progress: number            // 转场进度（0-1）
  config: TransitionConfig
}

// 缓动函数映射
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
}

// 获取缓动值
export function applyEasing(t: number, easing: EasingFunction = 'ease-in-out'): number {
  const easingFn = EASING_FUNCTIONS[easing]
  return easingFn(Math.max(0, Math.min(1, t)))
}
