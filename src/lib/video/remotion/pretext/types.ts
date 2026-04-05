/**
 * Pretext 文字动画类型定义
 */

// 动画类型
export type PretextAnimationType = 'fluid' | 'particle' | 'ascii'

// 通用配置
export interface PretextBaseConfig {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  color?: string
  position?: { x: number; y: number } // 0-1 归一化坐标
}

// 流体文字配置
export interface FluidTextConfig extends PretextBaseConfig {
  fluidSpeed?: number    // 流动速度（0.1-5，默认 1）
  fluidDensity?: number  // 密度（0.1-2，默认 1）
}

// 粒子文字配置
export interface ParticleTextConfig extends PretextBaseConfig {
  particleCount?: number    // 粒子数量（默认等于文字长度）
  explosionForce?: number   // 爆炸力度（0.1-5，默认 1）
  springForce?: number      // 弹簧力（0.01-0.2，默认 0.05）
  damping?: number          // 阻尼（0.5-0.99，默认 0.9）
}

// ASCII 艺术配置
export interface ASCIIArtConfig extends PretextBaseConfig {
  imageUrl?: string              // 源图片路径
  charset?: string               // ASCII 字符集
  asciiDensity?: number          // 密度映射范围（0.1-2，默认 1）
  charSpacing?: number           // 字符间距（默认 0.6）
}

// 联合配置类型
export type PretextConfig = FluidTextConfig | ParticleTextConfig | ASCIIArtConfig

// Pretext 动画定义
export interface PretextAnimation {
  type: PretextAnimationType
  text: string
  config: PretextConfig
}

// 粒子数据结构
export interface Particle {
  char: string
  x: number
  y: number
  vx: number        // x 方向速度
  vy: number        // y 方向速度
  life: number      // 生命周期（0-1）
  targetX: number   // 目标 x 坐标
  targetY: number   // 目标 y 坐标
  width: number     // 字符宽度（从 pretext 获取）
}

// 流体场数据结构（简化版）
export interface FluidField {
  width: number
  height: number
  cellSize: number
  velocityX: Float32Array
  velocityY: Float32Array
}
