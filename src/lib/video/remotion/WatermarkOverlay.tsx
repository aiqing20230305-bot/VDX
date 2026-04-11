/**
 * Watermark Overlay - 水印叠加层
 * 支持文字和图片水印
 */
import React from 'react'
import { AbsoluteFill, Img, useVideoConfig } from 'remotion'

export interface WatermarkConfig {
  enabled: boolean
  type: 'text' | 'image'
  // 文字水印
  text?: string
  fontSize?: number
  fontColor?: string
  // 图片水印
  imageUrl?: string
  opacity?: number
  // 通用
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  margin?: { x: number; y: number }
}

interface WatermarkOverlayProps {
  config?: WatermarkConfig
}

/**
 * 计算水印位置样式
 */
function getPositionStyle(
  position: WatermarkConfig['position'],
  margin: { x: number; y: number } = { x: 20, y: 20 }
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
  }

  switch (position) {
    case 'top-left':
      return {
        ...baseStyle,
        top: `${margin.y}px`,
        left: `${margin.x}px`,
      }
    case 'top-right':
      return {
        ...baseStyle,
        top: `${margin.y}px`,
        right: `${margin.x}px`,
      }
    case 'bottom-left':
      return {
        ...baseStyle,
        bottom: `${margin.y}px`,
        left: `${margin.x}px`,
      }
    case 'bottom-right':
      return {
        ...baseStyle,
        bottom: `${margin.y}px`,
        right: `${margin.x}px`,
      }
    case 'center':
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }
    default:
      return baseStyle
  }
}

/**
 * 水印叠加层组件
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ config }) => {
  const { width, height } = useVideoConfig()

  // 如果未启用或配置为空，不渲染
  if (!config || !config.enabled) {
    return null
  }

  const opacity = config.opacity ?? 0.8
  const margin = config.margin || { x: 20, y: 20 }
  const positionStyle = getPositionStyle(config.position, margin)

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', zIndex: 1000 }}>
      {config.type === 'text' && config.text && (
        <div
          style={{
            ...positionStyle,
            fontSize: `${config.fontSize || 24}px`,
            color: config.fontColor || '#FFFFFF',
            opacity,
            fontWeight: 600,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {config.text}
        </div>
      )}

      {config.type === 'image' && config.imageUrl && (
        <div
          style={{
            ...positionStyle,
            opacity,
          }}
        >
          <Img
            src={config.imageUrl}
            style={{
              maxWidth: `${width * 0.2}px`, // 最大宽度为视频宽度的20%
              maxHeight: `${height * 0.15}px`, // 最大高度为视频高度的15%
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  )
}
