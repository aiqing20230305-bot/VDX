/**
 * 启动 BullMQ Workers
 * 处理后台任务（视频生成、图片生成等）
 *
 * 使用方法：
 * npm run workers
 * 或
 * bun run scripts/start-workers.ts
 */
import { createVideoGenerationWorker } from '../src/lib/queue/video-generation-worker'
import { createVideoRenderWorker } from '../src/lib/queue/video-render-worker'

console.log('🚀 Starting BullMQ Workers...')

// 启动视频生成 Worker
const videoWorker = createVideoGenerationWorker()
console.log('✅ Video Generation Worker started')

// 启动视频渲染 Worker
const renderWorker = createVideoRenderWorker()
console.log('✅ Video Render Worker started')

// 优雅关闭
const shutdown = async () => {
  console.log('\n⏹️  Shutting down workers...')
  await videoWorker.close()
  await renderWorker.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// 保持进程运行
process.stdin.resume()
