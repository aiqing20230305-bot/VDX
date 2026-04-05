/**
 * 弹幕层组件
 * 管理多条弹幕的渲染和位置避让
 */
import React, { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { Bullet } from './Bullet'
import type { BulletTrack, BulletEntry } from '@/types'

interface ActiveBullet {
  entry: BulletEntry
  relativeFrame: number
  lane: number
}

/**
 * 简单的位置避让算法
 * 为每条弹幕分配一个轨道，避免重叠
 */
function allocateLane(
  entry: BulletEntry,
  currentFrame: number,
  fps: number,
  existingBullets: ActiveBullet[],
  maxLanes: number,
  speed: number,
  width: number
): number {
  // 如果弹幕指定了轨道，直接使用
  if (entry.lane !== undefined && entry.lane >= 0 && entry.lane < maxLanes) {
    return entry.lane
  }

  // 文本宽度估算
  const textWidth = entry.text.length * 24 * 0.6

  // 弹幕完全通过屏幕所需时间（秒）
  const duration = (width + textWidth) / speed

  // 检查每个轨道是否可用
  const usedLanes = new Set(existingBullets.map((b) => b.lane))

  // 找到第一个空闲轨道
  for (let lane = 0; lane < maxLanes; lane++) {
    if (!usedLanes.has(lane)) {
      return lane
    }

    // 检查该轨道是否有足够的空间
    const bulletsInLane = existingBullets.filter((b) => b.lane === lane)
    const hasSpace = bulletsInLane.every((b) => {
      // 如果该轨道上的弹幕已经滚动足够远，就有空间
      const bulletTime = b.relativeFrame / fps
      return bulletTime > duration * 0.5 // 至少滚动了一半才能放新弹幕
    })

    if (hasSpace) {
      return lane
    }
  }

  // 如果所有轨道都满了，随机选择一个
  return Math.floor(Math.random() * maxLanes)
}

export interface BulletLayerProps {
  tracks: BulletTrack[]
}

export const BulletLayer: React.FC<BulletLayerProps> = ({ tracks }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  // 计算当前时间（秒）
  const currentTime = frame / fps

  // 过滤启用的轨道
  const activeTracks = tracks.filter((track) => track.enabled !== false)

  // 收集所有应该显示的弹幕
  const activeBullets = useMemo(() => {
    const bullets: ActiveBullet[] = []

    activeTracks.forEach((track) => {
      const laneHeight = track.laneHeight || 40
      const maxLanes = track.maxLanes || 10
      const speed = track.defaultSpeed || 200

      track.entries.forEach((entry) => {
        // 弹幕出现时间
        const appearTime = entry.time

        // 如果还没到出现时间，跳过
        if (currentTime < appearTime) {
          return
        }

        // 相对帧数（从出现时间开始计算）
        const relativeFrame = Math.floor((currentTime - appearTime) * fps)

        // 弹幕完全通过屏幕所需时间
        const textWidth = entry.text.length * 24 * 0.6
        const duration = (width + textWidth) / (entry.speed || speed)
        const totalFrames = Math.ceil(duration * fps)

        // 如果已经滚动完成，跳过
        if (relativeFrame > totalFrames) {
          return
        }

        // 分配轨道
        const lane = allocateLane(
          entry,
          frame,
          fps,
          bullets,
          maxLanes,
          entry.speed || speed,
          width
        )

        bullets.push({
          entry,
          relativeFrame,
          lane,
        })
      })
    })

    return bullets
  }, [frame, activeTracks, fps, width])

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none', // 弹幕层不阻挡交互
      }}
    >
      {activeBullets.map((bullet, index) => {
        // 找到对应的轨道配置
        const track = activeTracks.find((t) =>
          t.entries.some((e) => e.id === bullet.entry.id)
        )

        if (!track) return null

        const laneHeight = track.laneHeight || 40

        return (
          <Bullet
            key={`${bullet.entry.id}-${index}`}
            entry={bullet.entry}
            relativeFrame={bullet.relativeFrame}
            style={track.defaultStyle}
            laneIndex={bullet.lane}
            laneHeight={laneHeight}
          />
        )
      })}
    </AbsoluteFill>
  )
}
