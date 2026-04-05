/**
 * 标题动画系统
 * 导出所有标题相关的组件和工具
 */
export { Title } from './Title'
export { TitleLayer } from './TitleLayer'
export {
  slideInAnimation,
  fadeInAnimation,
  zoomInAnimation,
  bounceInAnimation,
  rotateInAnimation,
  typewriterAnimation,
  exitAnimation,
  getAnimationStyle,
  applyEasing,
} from './animations'

export type { TitleProps } from './Title'
export type { TitleLayerProps } from './TitleLayer'
export type { AnimationProps } from './animations'
