/**
 * Remotion 单帧组件
 * 渲染单个分镜帧，支持可配置的转场效果
 */
import React from 'react'
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { TransitionFactory } from '../transitions/TransitionFactory'
import type { StoryboardFrame } from '@/types'

export interface FrameSequenceProps {
  frame: StoryboardFrame
  totalFrames: number
}

export const FrameSequence: React.FC<FrameSequenceProps> = ({
  frame,
  totalFrames,
}) => {
  const currentFrame = useCurrentFrame()

  // 计算转场进度（0-1）
  // 用于转场动画的进度计算
  const progress = totalFrames > 0 ? Math.min(currentFrame / totalFrames, 1) : 1

  // 渲染内容（图片或文字占位符）
  const content = (
    <AbsoluteFill>
      {frame.imageUrl ? (
        <Img
          src={frame.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            fontSize: 24,
            fontFamily: 'sans-serif',
            textAlign: 'center',
            padding: 40,
          }}
        >
          {frame.description}
        </div>
      )}
    </AbsoluteFill>
  )

  // 使用 TransitionFactory 应用转场效果
  // frame.transition 支持字符串（'fade'/'none'）或对象配置
  return (
    <TransitionFactory progress={progress} config={frame.transition as any}>
      {content}
    </TransitionFactory>
  )
}
