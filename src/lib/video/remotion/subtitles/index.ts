/**
 * 字幕系统
 * 导出所有字幕相关的组件和工具
 */
export { Subtitle } from './Subtitle'
export { SubtitleLayer } from './SubtitleLayer'
export {
  findActiveSubtitle,
  calculateSubtitleOpacity,
  getPositionStyles,
  mergeSubtitleStyle,
  generateTextStyle,
  parseSRT,
  generateSRT,
} from './utils'

export type { SubtitleProps } from './Subtitle'
export type { SubtitleLayerProps } from './SubtitleLayer'
