/**
 * Remotion 配置文件
 * 优化渲染性能和资源使用
 */
import { Config } from '@remotion/cli/config'

// 并发数：M1/M2 芯片建议 2，避免内存不足
Config.setConcurrency(2)

// JPEG 质量：80 是质量和文件大小的平衡点
Config.setJpegQuality(80)

// 浏览器路径：null 表示自动检测
Config.setBrowserExecutable(null)

export default Config
