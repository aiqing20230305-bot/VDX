/**
 * 标题层组件
 * 管理和渲染多个标题轨道
 */
import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { Title } from './Title'
import type { TitleTrack } from '@/types'

export interface TitleLayerProps {
  tracks: TitleTrack[]
}

export const TitleLayer: React.FC<TitleLayerProps> = ({ tracks }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 计算当前时间（秒）
  const currentTime = frame / fps

  // 过滤启用的轨道
  const activeTracks = tracks.filter((track) => track.enabled !== false)

  // 查找所有应该显示的标题
  const visibleTitles = activeTracks.flatMap((track) =>
    track.entries
      .filter((entry) => currentTime >= entry.startTime && currentTime <= entry.endTime)
      .map((entry) => ({
        trackId: track.id,
        entry,
        defaultStyle: track.defaultStyle,
        defaultAnimation: track.defaultAnimation,
      }))
  )

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none', // 标题层不阻挡交互
      }}
    >
      {visibleTitles.map(({ trackId, entry, defaultStyle, defaultAnimation }) => {
        // 合并默认动画配置
        const finalAnimation = {
          ...defaultAnimation,
          ...entry.animation,
        }

        return (
          <Title
            key={`${trackId}-${entry.startTime}`}
            entry={{
              ...entry,
              animation: finalAnimation,
            }}
            currentTime={currentTime}
            style={defaultStyle}
            fps={fps}
          />
        )
      })}
    </AbsoluteFill>
  )
}
