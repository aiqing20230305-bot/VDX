/**
 * 标题组件
 * 支持各种动画效果的标题渲染
 */
import React, { useMemo } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import type { TitleEntry, TitleStyle, TitleAnimationConfig } from '@/types'
import { getAnimationStyle, exitAnimation, typewriterAnimation } from './animations'

export interface TitleProps {
  entry: TitleEntry
  currentTime: number
  style?: TitleStyle
  fps?: number
}

export const Title: React.FC<TitleProps> = ({
  entry,
  currentTime,
  style,
  fps = 30,
}) => {
  const frame = useCurrentFrame()
  const { startTime, endTime, text, position = 'center', animation } = entry

  // 合并样式
  const finalStyle: TitleStyle = {
    fontSize: 48,
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 24,
    textAlign: 'center',
    letterSpacing: 0,
    ...style,
    ...entry.style,
  }

  // 动画配置
  const animConfig: TitleAnimationConfig = {
    type: 'fadeIn',
    duration: 30,
    delay: 0,
    easing: 'ease-out',
    exitAnimation: false,
    exitDuration: 20,
    ...animation,
  }

  // 不在显示时间范围内
  if (currentTime < startTime || currentTime > endTime) {
    return null
  }

  // 计算相对时间（相对于标题开始时间）
  const relativeTime = currentTime - startTime
  const relativeFrame = Math.round(relativeTime * fps)
  const duration = endTime - startTime
  const totalFrames = Math.round(duration * fps)

  // 计算进入动画进度
  const enterProgress = animConfig.delay
    ? interpolate(
        relativeFrame,
        [animConfig.delay, animConfig.delay + animConfig.duration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : interpolate(relativeFrame, [0, animConfig.duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })

  // 计算退出动画进度
  const exitProgress = animConfig.exitAnimation
    ? interpolate(
        relativeFrame,
        [totalFrames - animConfig.exitDuration, totalFrames],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0

  // 如果正在退出，使用退出动画
  let animationStyle: React.CSSProperties = {}
  if (exitProgress > 0 && animConfig.exitAnimation) {
    animationStyle = exitAnimation(animConfig.type, exitProgress, animConfig.direction)
  } else {
    // 进入动画
    animationStyle = getAnimationStyle(animConfig.type, {
      progress: enterProgress,
      direction: animConfig.direction,
      easing: animConfig.easing,
    })
  }

  // 打字机效果特殊处理
  let displayText = text
  if (animConfig.type === 'typewriter') {
    const { characterProgress } = typewriterAnimation({ progress: enterProgress })
    const visibleChars = Math.floor(text.length * characterProgress)
    displayText = text.substring(0, visibleChars)
  }

  // 位置样式
  const positionStyle: React.CSSProperties = useMemo(() => {
    switch (position) {
      case 'top':
        return {
          top: finalStyle.padding,
          justifyContent: 'center',
          alignItems: 'flex-start',
        }
      case 'center':
        return {
          top: '50%',
          transform: 'translateY(-50%)',
          justifyContent: 'center',
          alignItems: 'center',
        }
      case 'bottom':
        return {
          bottom: finalStyle.padding,
          justifyContent: 'center',
          alignItems: 'flex-end',
        }
      default:
        return {}
    }
  }, [position, finalStyle.padding])

  // 文本样式
  const textStyle: React.CSSProperties = {
    fontSize: finalStyle.fontSize,
    fontFamily: finalStyle.fontFamily,
    fontWeight: finalStyle.fontWeight,
    color: finalStyle.color,
    textAlign: finalStyle.textAlign,
    letterSpacing: finalStyle.letterSpacing,
    margin: 0,
    padding: finalStyle.padding,
  }

  // 背景色
  if (finalStyle.backgroundColor) {
    textStyle.backgroundColor = finalStyle.backgroundColor
  }

  // 描边
  if (finalStyle.stroke) {
    textStyle.WebkitTextStroke = `${finalStyle.stroke.width}px ${finalStyle.stroke.color}`
    textStyle.textStroke = `${finalStyle.stroke.width}px ${finalStyle.stroke.color}`
  }

  // 阴影
  if (finalStyle.shadow) {
    const { offsetX, offsetY, blur, color } = finalStyle.shadow
    textStyle.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        display: 'flex',
        pointerEvents: 'none',
        ...positionStyle,
        ...animationStyle,
        willChange: 'transform, opacity',
      }}
    >
      <h1
        style={{
          ...textStyle,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          maxWidth: '90%',
          borderRadius: 8,
        }}
      >
        {displayText}
      </h1>
    </div>
  )
}
