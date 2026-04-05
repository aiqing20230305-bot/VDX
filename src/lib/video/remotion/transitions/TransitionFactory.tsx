/**
 * 转场工厂组件
 * 根据配置动态选择转场组件
 */
import React from 'react'
import { FadeTransition } from './FadeTransition'
import { SlideTransition } from './SlideTransition'
import { ZoomTransition } from './ZoomTransition'
import { RotateTransition } from './RotateTransition'
import { WipeTransition } from './WipeTransition'
import type { TransitionConfig } from './types'

export interface TransitionFactoryProps {
  children: React.ReactNode
  progress: number              // 转场进度（0-1）
  config: TransitionConfig | string | undefined  // 转场配置（支持向后兼容）
}

/**
 * 转场工厂组件
 * 根据配置选择对应的转场组件
 */
export const TransitionFactory: React.FC<TransitionFactoryProps> = ({
  children,
  progress,
  config,
}) => {
  // 解析配置
  const parsedConfig = parseConfig(config)

  // 无转场或配置为空
  if (!parsedConfig || parsedConfig.type === 'none') {
    return <>{children}</>
  }

  // 根据类型选择组件
  switch (parsedConfig.type) {
    case 'fade':
      return (
        <FadeTransition progress={progress} config={parsedConfig}>
          {children}
        </FadeTransition>
      )

    case 'slide':
      return (
        <SlideTransition progress={progress} config={parsedConfig}>
          {children}
        </SlideTransition>
      )

    case 'zoom':
      return (
        <ZoomTransition progress={progress} config={parsedConfig}>
          {children}
        </ZoomTransition>
      )

    case 'rotate':
      return (
        <RotateTransition progress={progress} config={parsedConfig}>
          {children}
        </RotateTransition>
      )

    case 'wipe':
      return (
        <WipeTransition progress={progress} config={parsedConfig}>
          {children}
        </WipeTransition>
      )

    default:
      // 未知类型，不应用转场
      console.warn(`Unknown transition type: ${(parsedConfig as any).type}`)
      return <>{children}</>
  }
}

/**
 * 解析转场配置
 * 支持向后兼容：string | object
 */
function parseConfig(
  config: TransitionConfig | string | undefined
): TransitionConfig | null {
  // 未定义
  if (!config) {
    return null
  }

  // 字符串（向后兼容）
  if (typeof config === 'string') {
    return parseStringConfig(config)
  }

  // 对象
  return config as TransitionConfig
}

/**
 * 解析字符串配置（向后兼容）
 */
function parseStringConfig(config: string): TransitionConfig | null {
  const type = config.toLowerCase()

  switch (type) {
    case 'fade':
      return {
        type: 'fade',
        duration: 15,
        easing: 'ease-in-out',
      }

    case 'none':
      return { type: 'none' }

    default:
      // 默认淡入淡出
      return {
        type: 'fade',
        duration: 15,
        easing: 'ease-in-out',
      }
  }
}
