/**
 * Remotion 分镜视频主合成组件
 * 将多个分镜帧组合成完整视频
 */
import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { FrameSequence } from './FrameSequence'
import { framesToSequences } from '../utils'
import type { Storyboard } from '@/types'

export interface StoryboardVideoProps {
  storyboard: Storyboard
  fps?: number
}

export const StoryboardVideo: React.FC<StoryboardVideoProps> = ({
  storyboard,
  fps = 30,
}) => {
  const sequences = framesToSequences(storyboard.frames, fps)

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {sequences.map((seq, i) => (
        <Sequence
          key={i}
          from={seq.startFrame}
          durationInFrames={seq.durationInFrames}
        >
          <FrameSequence
            frame={seq.frame}
            totalFrames={seq.durationInFrames}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
