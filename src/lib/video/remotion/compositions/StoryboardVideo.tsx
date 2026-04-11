/**
 * Remotion 分镜视频主合成组件
 * 将多个分镜帧组合成完整视频，支持转场、字幕、标题和弹幕
 */
import React from 'react'
import { AbsoluteFill, Sequence, Audio } from 'remotion'
import { FrameSequence } from './FrameSequence'
import { SubtitleLayer } from '../subtitles'
import { TitleLayer } from '../titles'
import { BulletLayer } from '../bullets'
import { WatermarkOverlay, type WatermarkConfig } from '../WatermarkOverlay'
import { framesToSequences } from '../utils'
import type { Storyboard, SubtitleTrack } from '@/types'
import type { FilterId } from '@/lib/video/filters'
import { getFilter, applyCSSFilterIntensity } from '@/lib/video/filters'
import path from 'path'

export interface StoryboardVideoProps {
  storyboard: Storyboard
  fps?: number
  audioPath?: string
  audioVolume?: number // 0-1
  subtitleTracks?: SubtitleTrack[]
  watermark?: WatermarkConfig
  filterId?: FilterId
  filterIntensity?: number // 0-100
}

export const StoryboardVideo: React.FC<StoryboardVideoProps> = ({
  storyboard,
  fps = 30,
  audioPath,
  audioVolume = 0.8,
  subtitleTracks = [],
  watermark,
  filterId = 'none',
  filterIntensity = 100,
}) => {
  const sequences = framesToSequences(storyboard.frames, fps)

  // 如果audioPath以/开头（public路径），需要转换为绝对路径
  const resolvedAudioPath = audioPath
    ? audioPath.startsWith('/')
      ? path.join(process.cwd(), 'public', audioPath)
      : audioPath
    : undefined

  // 获取滤镜CSS
  const filter = getFilter(filterId)
  const filterStyle = applyCSSFilterIntensity(filter, filterIntensity)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#000',
        filter: filterStyle !== 'none' ? filterStyle : undefined,
      }}
    >
      {/* 背景音乐 */}
      {resolvedAudioPath && (
        <Audio
          src={resolvedAudioPath}
          volume={audioVolume}
          startFrom={0}
        />
      )}

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
      {(subtitleTracks.length > 0 || (storyboard.subtitles && storyboard.subtitles.length > 0)) && (
        <SubtitleLayer tracks={subtitleTracks.length > 0 ? subtitleTracks : storyboard.subtitles || []} />
      )}

      {/* 标题层 */}
      {storyboard.titles && storyboard.titles.length > 0 && (
        <TitleLayer tracks={storyboard.titles} />
      )}

      {/* 弹幕层 */}
      {storyboard.bullets && storyboard.bullets.length > 0 && (
        <BulletLayer tracks={storyboard.bullets} />
      )}

      {/* 水印层（最上层） */}
      <WatermarkOverlay config={watermark} />
    </AbsoluteFill>
  )
}
