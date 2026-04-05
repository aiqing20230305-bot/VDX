/**
 * Remotion 单帧组件
 * 渲染单个分镜帧，支持淡入淡出效果
 */
import React from 'react'
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion'
import type { StoryboardFrame } from '@/types'

export interface FrameSequenceProps {
  frame: StoryboardFrame
  shouldFadeIn?: boolean
  totalFrames: number
}

export const FrameSequence: React.FC<FrameSequenceProps> = ({
  frame,
  shouldFadeIn = false,
  totalFrames,
}) => {
  const currentFrame = useCurrentFrame()

  // 淡入效果：前 15 帧（0.5秒 @ 30fps）从 0 → 1
  const fadeInDuration = 15
  const fadeInOpacity = shouldFadeIn
    ? interpolate(currentFrame, [0, fadeInDuration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1

  // 淡出效果：最后 15 帧从 1 → 0
  const fadeOutStart = totalFrames - fadeInDuration
  const fadeOutOpacity = interpolate(
    currentFrame,
    [fadeOutStart, totalFrames],
    [1, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  )

  // 取两者最小值（交叉淡化）
  const finalOpacity = Math.min(fadeInOpacity, fadeOutOpacity)

  return (
    <AbsoluteFill style={{ opacity: finalOpacity }}>
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
}
