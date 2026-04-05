/**
 * Remotion Root 组件
 * 注册所有可用的 Composition
 */
import React from 'react'
import { Composition } from 'remotion'
import { StoryboardVideo } from '../src/lib/video/remotion/compositions/StoryboardVideo'
import { PretextFluidText } from '../src/lib/video/remotion/pretext/components/PretextFluidText'
import { PretextParticleText } from '../src/lib/video/remotion/pretext/components/PretextParticleText'
import { PretextASCIIArt } from '../src/lib/video/remotion/pretext/components/PretextASCIIArt'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 分镜视频组件 */}
      <Composition
        id="StoryboardVideo"
        component={StoryboardVideo}
        durationInFrames={300}  // 默认10秒（30fps），运行时会覆盖
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          storyboard: {
            id: 'placeholder',
            scriptId: '',
            totalFrames: 0,
            frames: [],
            createdAt: new Date(),
          },
          fps: 30,
        }}
      />

      {/* Pretext 文字动画组件 */}
      <Composition
        id="FluidText"
        component={PretextFluidText}
        durationInFrames={90}  // 3 秒
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: '超级视频',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: 100,
          fontWeight: 900,
          color: '#ffffff',
          fluidSpeed: 1,
          fluidDensity: 1,
        }}
      />

      <Composition
        id="ParticleText"
        component={PretextParticleText}
        durationInFrames={120}  // 4 秒
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: 'AI生成',
          fontFamily: 'Inter, Arial, sans-serif',
          fontSize: 80,
          fontWeight: 700,
          color: '#00ffff',
          explosionForce: 1,
          springForce: 0.05,
          damping: 0.9,
        }}
      />

      <Composition
        id="ASCIIArt"
        component={PretextASCIIArt}
        durationInFrames={90}  // 3 秒
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          imageUrl: '/uploads/test.jpg',
          fontFamily: 'monospace',
          fontSize: 12,
          fontWeight: 400,
          color: '#00ff00',
          charset: ' .:-=+*#%@',
          charSpacing: 0.6,
        }}
      />
    </>
  )
}
