/**
 * Remotion 分镜视频主合成组件
 * 将多个分镜帧组合成完整视频，支持转场、字幕和标题
 */
import React from 'react'
import { AbsoluteFill, Sequence } from 'remotion'
import { FrameSequence } from './FrameSequence'
import { SubtitleLayer } from '../subtitles'
import { TitleLayer } from '../titles'
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
      {/* 视频帧 */}
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

      {/* 字幕层 */}
      {storyboard.subtitles && storyboard.subtitles.length > 0 && (
        <SubtitleLayer tracks={storyboard.subtitles} />
      )}

      {/* 标题层 */}
      {storyboard.titles && storyboard.titles.length > 0 && (
        <TitleLayer tracks={storyboard.titles} />
      )}
    </AbsoluteFill>
  )
}
