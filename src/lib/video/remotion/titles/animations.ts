/**
 * 标题动画效果集合
 * 各种预设动画的实现函数
 */
import type { TitleAnimationType, TitleAnimationDirection } from '@/types'

export interface AnimationProps {
  progress: number            // 动画进度（0-1）
  direction?: TitleAnimationDirection
  easing?: string
}

/**
 * 应用缓动函数
 */
export function applyEasing(progress: number, easing: string = 'ease-out'): number {
  switch (easing) {
    case 'linear':
      return progress
    case 'ease-in':
      return progress * progress
    case 'ease-out':
      return progress * (2 - progress)
    case 'ease-in-out':
      return progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress
    case 'ease-in-cubic':
      return progress * progress * progress
    case 'ease-out-cubic':
      return 1 - Math.pow(1 - progress, 3)
    case 'ease-in-out-cubic':
      return progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
    default:
      return progress * (2 - progress) // 默认 ease-out
  }
}

/**
 * 滑动进入动画
 */
export function slideInAnimation(props: AnimationProps): React.CSSProperties {
  const { progress, direction = 'bottom', easing = 'ease-out' } = props
  const easedProgress = applyEasing(progress, easing)

  // 计算偏移量（100% → 0%）
  const offset = (1 - easedProgress) * 100

  switch (direction) {
    case 'left':
      return {
        transform: `translateX(-${offset}%)`,
        opacity: easedProgress,
      }
    case 'right':
      return {
        transform: `translateX(${offset}%)`,
        opacity: easedProgress,
      }
    case 'top':
      return {
        transform: `translateY(-${offset}%)`,
        opacity: easedProgress,
      }
    case 'bottom':
      return {
        transform: `translateY(${offset}%)`,
        opacity: easedProgress,
      }
    default:
      return {}
  }
}

/**
 * 淡入动画
 */
export function fadeInAnimation(props: AnimationProps): React.CSSProperties {
  const { progress, easing = 'ease-out' } = props
  const easedProgress = applyEasing(progress, easing)

  return {
    opacity: easedProgress,
  }
}

/**
 * 缩放进入动画
 */
export function zoomInAnimation(props: AnimationProps): React.CSSProperties {
  const { progress, easing = 'ease-out' } = props
  const easedProgress = applyEasing(progress, easing)

  // 从 0.5 → 1
  const scale = 0.5 + easedProgress * 0.5

  return {
    transform: `scale(${scale})`,
    opacity: easedProgress,
  }
}

/**
 * 弹跳进入动画
 */
export function bounceInAnimation(props: AnimationProps): React.CSSProperties {
  const { progress, easing = 'ease-out' } = props

  // 弹跳效果：使用自定义曲线
  let bounceProgress: number
  if (progress < 0.6) {
    bounceProgress = progress / 0.6
  } else if (progress < 0.8) {
    // 回弹
    const t = (progress - 0.6) / 0.2
    bounceProgress = 1 - t * 0.3
  } else {
    // 最终定位
    const t = (progress - 0.8) / 0.2
    bounceProgress = 0.7 + t * 0.3
  }

  const scale = 0.3 + bounceProgress * 0.7

  return {
    transform: `scale(${scale})`,
    opacity: Math.min(progress * 2, 1),
  }
}

/**
 * 旋转进入动画
 */
export function rotateInAnimation(props: AnimationProps): React.CSSProperties {
  const { progress, easing = 'ease-out' } = props
  const easedProgress = applyEasing(progress, easing)

  // 从 -180deg → 0deg
  const rotation = -180 * (1 - easedProgress)
  const scale = 0.5 + easedProgress * 0.5

  return {
    transform: `rotate(${rotation}deg) scale(${scale})`,
    opacity: easedProgress,
  }
}

/**
 * 打字机效果（逐字显示）
 * 注意：这个效果需要在组件中特殊处理文本截断
 */
export function typewriterAnimation(props: AnimationProps): {
  characterProgress: number
  cursorVisible: boolean
} {
  const { progress } = props

  return {
    characterProgress: progress,
    cursorVisible: progress < 1, // 完成后隐藏光标
  }
}

/**
 * 退出动画（通用）
 */
export function exitAnimation(
  type: TitleAnimationType,
  progress: number, // 0-1，0 是完全显示，1 是完全消失
  direction?: TitleAnimationDirection
): React.CSSProperties {
  // 退出动画通常是进入动画的反向
  const reverseProgress = 1 - progress

  switch (type) {
    case 'slideIn':
      return slideInAnimation({ progress: reverseProgress, direction })
    case 'fadeIn':
      return fadeInAnimation({ progress: reverseProgress })
    case 'zoomIn':
      return zoomInAnimation({ progress: reverseProgress })
    case 'bounceIn':
      return fadeInAnimation({ progress: reverseProgress }) // 弹跳退出简化为淡出
    case 'rotateIn':
      return rotateInAnimation({ progress: reverseProgress })
    default:
      return fadeInAnimation({ progress: reverseProgress })
  }
}

/**
 * 获取动画样式（统一入口）
 */
export function getAnimationStyle(
  type: TitleAnimationType,
  props: AnimationProps
): React.CSSProperties {
  switch (type) {
    case 'slideIn':
      return slideInAnimation(props)
    case 'fadeIn':
      return fadeInAnimation(props)
    case 'zoomIn':
      return zoomInAnimation(props)
    case 'bounceIn':
      return bounceInAnimation(props)
    case 'rotateIn':
      return rotateInAnimation(props)
    case 'none':
      return {}
    default:
      return {}
  }
}
