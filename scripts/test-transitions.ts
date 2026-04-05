/**
 * 转场效果测试脚本
 * 测试所有 5 种转场类型的功能和性能
 */
import { config } from 'dotenv'
import path from 'path'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import type { StoryboardFrame } from '../src/types'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

// 测试用分镜数据
const createTestStoryboard = (transitionType: string) => ({
  id: `test-transition-${transitionType}`,
  scriptId: 'test-script',
  totalFrames: 3,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: 'https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Frame+1',
      imagePrompt: 'Red frame',
      duration: 2,
      description: '第一帧（红色）',
      cameraAngle: 'medium',
      transition: 'none',
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: 'https://via.placeholder.com/1920x1080/4ECDC4/FFFFFF?text=Frame+2',
      imagePrompt: 'Cyan frame',
      duration: 2,
      description: '第二帧（青色）',
      cameraAngle: 'medium',
      transition: transitionType,
    },
    {
      index: 2,
      scriptSceneIndex: 2,
      imageUrl: 'https://via.placeholder.com/1920x1080/FFE66D/000000?text=Frame+3',
      imagePrompt: 'Yellow frame',
      duration: 2,
      description: '第三帧（黄色）',
      cameraAngle: 'medium',
      transition: transitionType,
    },
  ] as StoryboardFrame[],
  createdAt: new Date(),
})

// 测试配置
const transitions = [
  { type: 'fade', name: '淡入淡出' },
  { type: 'slide', name: '滑动（从左）', config: { direction: 'left' } },
  { type: 'zoom', name: '缩放进入', config: { zoomType: 'in' } },
  { type: 'rotate', name: '旋转（Y轴）', config: { axis: 'y' } },
  { type: 'wipe', name: '擦除（圆形）', config: { direction: 'circle' } },
]

interface TestResult {
  type: string
  name: string
  success: boolean
  renderTime: number
  outputPath?: string
  error?: string
}

async function testTransition(
  transitionType: string,
  transitionName: string,
  transitionConfig?: any
): Promise<TestResult> {
  const startTime = Date.now()

  try {
    console.log(`\n🧪 测试转场: ${transitionName} (${transitionType})`)

    // 创建测试数据（使用对象配置格式）
    const storyboard = createTestStoryboard(transitionType)

    // 如果有额外配置，更新帧的 transition 字段
    if (transitionConfig) {
      storyboard.frames.forEach((frame, i) => {
        if (i > 0) {
          frame.transition = {
            type: transitionType as any,
            config: transitionConfig,
          }
        }
      })
    }

    // Bundle React 代码
    console.log('  📦 Bundling...')
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
      webpackOverride: (config) => config,
    })

    // 获取 Composition
    console.log('  🎬 Loading composition...')
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'StoryboardVideo',
      inputProps: { storyboard, fps: 30 },
    })

    // 渲染视频
    const outputPath = path.join(
      process.cwd(),
      'public/outputs',
      `test_transition_${transitionType}_${Date.now()}.mp4`
    )

    console.log('  🎥 Rendering...')
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: 3 * 2 * 30, // 3 帧 * 2 秒 * 30fps
        fps: 30,
        width: 1920,
        height: 1080,
      },
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: { storyboard, fps: 30 },
      onProgress: ({ progress }) => {
        const percent = (progress * 100).toFixed(1)
        process.stdout.write(`\r  进度: ${percent}%`)
      },
      chromiumOptions: { headless: true },
      concurrency: 1,
      jpegQuality: 80,
    })

    const renderTime = Date.now() - startTime
    console.log(`\n  ✅ 成功 - 耗时: ${(renderTime / 1000).toFixed(1)}秒`)

    return {
      type: transitionType,
      name: transitionName,
      success: true,
      renderTime,
      outputPath,
    }

  } catch (err) {
    const renderTime = Date.now() - startTime
    const error = err instanceof Error ? err.message : String(err)
    console.log(`\n  ❌ 失败: ${error}`)

    return {
      type: transitionType,
      name: transitionName,
      success: false,
      renderTime,
      error,
    }
  }
}

async function runAllTests() {
  console.log('========================================')
  console.log('🎬 Remotion 转场效果测试')
  console.log('========================================')

  // 检查环境
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未启用')
    process.exit(1)
  }

  const results: TestResult[] = []

  // 按顺序测试每种转场
  for (const transition of transitions) {
    const result = await testTransition(
      transition.type,
      transition.name,
      transition.config
    )
    results.push(result)
  }

  // 输出测试报告
  console.log('\n========================================')
  console.log('📊 测试报告')
  console.log('========================================\n')

  const successful = results.filter(r => r.success).length
  const total = results.length

  console.log(`总计: ${total} 个测试`)
  console.log(`成功: ${successful} 个`)
  console.log(`失败: ${total - successful} 个\n`)

  // 详细结果表格
  console.log('┌─────────────┬──────────────┬────────────┐')
  console.log('│ 转场类型    │ 结果         │ 渲染时间   │')
  console.log('├─────────────┼──────────────┼────────────┤')

  results.forEach(r => {
    const status = r.success ? '✅ 成功' : '❌ 失败'
    const time = r.success ? `${(r.renderTime / 1000).toFixed(1)}秒` : 'N/A'
    const name = r.name.padEnd(10, ' ')
    const statusPad = status.padEnd(12, ' ')
    const timePad = time.padEnd(10, ' ')

    console.log(`│ ${name} │ ${statusPad} │ ${timePad} │`)
  })

  console.log('└─────────────┴──────────────┴────────────┘\n')

  // 性能对比
  if (successful > 0) {
    console.log('⚡ 性能对比:\n')

    const successfulResults = results.filter(r => r.success)
    const avgTime = successfulResults.reduce((sum, r) => sum + r.renderTime, 0) / successful

    successfulResults.forEach(r => {
      const relativeSpeed = r.renderTime / avgTime
      const speedIndicator = relativeSpeed < 0.9 ? '⚡' : relativeSpeed > 1.1 ? '🐢' : '➡️'
      console.log(`${speedIndicator} ${r.name}: ${(r.renderTime / 1000).toFixed(1)}秒 (${(relativeSpeed * 100).toFixed(0)}%)`)
    })

    console.log(`\n平均渲染时间: ${(avgTime / 1000).toFixed(1)}秒`)
  }

  // 输出文件路径
  if (successful > 0) {
    console.log('\n📁 输出文件:')
    results.filter(r => r.success && r.outputPath).forEach(r => {
      console.log(`  ${r.name}: ${r.outputPath}`)
    })
  }

  // 失败详情
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('\n❌ 失败详情:\n')
    failed.forEach(r => {
      console.log(`${r.name} (${r.type}):`)
      console.log(`  ${r.error}\n`)
    })
  }

  console.log('========================================\n')

  process.exit(failed.length > 0 ? 1 : 0)
}

// 运行测试
runAllTests().catch(err => {
  console.error('测试运行失败:', err)
  process.exit(1)
})
