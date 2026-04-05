/**
 * Remotion 工具函数
 * 数据转换和辅助功能
 */
import type { StoryboardFrame, AspectRatio } from '@/types'

export interface FrameSequence {
  frame: StoryboardFrame
  startFrame: number
  durationInFrames: number
  shouldFade: boolean
}

/**
 * 将 Storyboard 帧数组转换为 Remotion Sequence 配置
 * @param frames 分镜帧数组
 * @param fps 帧率（默认 30）
 * @returns Sequence 配置数组
 */
export function framesToSequences(
  frames: StoryboardFrame[],
  fps: number = 30
): FrameSequence[] {
  let cumulativeFrames = 0

  return frames.map((frame, i) => {
    const durationInFrames = Math.round(frame.duration * fps)
    const startFrame = cumulativeFrames
    cumulativeFrames += durationInFrames

    return {
      frame,
      startFrame,
      durationInFrames,
      shouldFade: i > 0 && frame.transition === 'fade',
    }
  })
}

/**
 * 根据比例计算视频尺寸
 * @param aspectRatio 比例字符串
 * @returns { width, height }
 */
export function getVideoDimensions(aspectRatio: AspectRatio): {
  width: number
  height: number
} {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1920, height: 1080 }
    case '9:16':
      return { width: 1080, height: 1920 }
    case '1:1':
      return { width: 1080, height: 1080 }
    case '4:3':
      return { width: 1440, height: 1080 }
    default:
      return { width: 1920, height: 1080 }
  }
}

/**
 * 计算总帧数
 * @param frames 分镜帧数组
 * @param fps 帧率
 * @returns 总帧数
 */
export function calculateTotalFrames(
  frames: StoryboardFrame[],
  fps: number = 30
): number {
  return frames.reduce((total, frame) => {
    return total + Math.round(frame.duration * fps)
  }, 0)
}
