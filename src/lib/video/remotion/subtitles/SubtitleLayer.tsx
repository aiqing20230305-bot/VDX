/**
 * 字幕层组件
 * 管理和渲染字幕轨道，支持多条字幕同时显示
 */
import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { Subtitle } from './Subtitle'
import { findActiveSubtitle, mergeSubtitleStyle } from './utils'
import type { SubtitleTrack } from '@/types'

export interface SubtitleLayerProps {
  tracks: SubtitleTrack[]
  fadeInDuration?: number   // 淡入时间（秒，默认 0.2）
  fadeOutDuration?: number  // 淡出时间（秒，默认 0.2）
}

export const SubtitleLayer: React.FC<SubtitleLayerProps> = ({
  tracks,
  fadeInDuration = 0.2,
  fadeOutDuration = 0.2,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 计算当前时间（秒）
  const currentTime = frame / fps

  // 过滤启用的轨道
  const activeTracks = tracks.filter((track) => track.enabled !== false)

  // 渲染所有轨道的当前字幕
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none', // 字幕层不阻挡交互
      }}
    >
      {activeTracks.map((track) => {
        // 查找当前时间应显示的字幕
        const activeEntry = findActiveSubtitle(track.entries, currentTime)

        if (!activeEntry) {
          return null
        }

        // 合并样式（轨道默认样式 + 条目样式）
        const mergedStyle = mergeSubtitleStyle(
          track.defaultStyle,
          activeEntry.style
        )

        return (
          <Subtitle
            key={`${track.id}-${activeEntry.startTime}`}
            entry={activeEntry}
            currentTime={currentTime}
            style={mergedStyle}
            fadeInDuration={fadeInDuration}
            fadeOutDuration={fadeOutDuration}
          />
        )
      })}
    </AbsoluteFill>
  )
}
