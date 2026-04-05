/**
 * 转场集成测试脚本
 * 测试 TransitionFactory 集成到 FrameSequence 后的实际效果
 */
import { config } from 'dotenv'
import path from 'path'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import type { StoryboardFrame } from '../src/types'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

// 测试场景 1：向后兼容 - 字符串配置
const testBackwardCompatibility = () => ({
  id: 'test-backward-compat',
  scriptId: 'test-script',
  totalFrames: 3,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: 'https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Frame+1',
      imagePrompt: 'Red frame',
      duration: 2,
      description: 'Frame 1 - No transition',
      cameraAngle: 'medium',
      transition: 'none', // 字符串配置（向后兼容）
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: 'https://via.placeholder.com/1920x1080/4ECDC4/FFFFFF?text=Frame+2',
      imagePrompt: 'Cyan frame',
      duration: 2,
      description: 'Frame 2 - Fade transition',
      cameraAngle: 'medium',
      transition: 'fade', // 字符串配置（向后兼容）
    },
    {
      index: 2,
      scriptSceneIndex: 2,
      imageUrl: 'https://via.placeholder.com/1920x1080/FFE66D/000000?text=Frame+3',
      imagePrompt: 'Yellow frame',
      duration: 2,
      description: 'Frame 3 - Fade transition',
      cameraAngle: 'medium',
      transition: 'fade', // 字符串配置（向后兼容）
    },
  ] as StoryboardFrame[],
  createdAt: new Date(),
})

// 测试场景 2：混合转场 - 对象配置
const testMixedTransitions = () => ({
  id: 'test-mixed-transitions',
  scriptId: 'test-script',
  totalFrames: 5,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: 'https://via.placeholder.com/1920x1080/E63946/FFFFFF?text=Slide',
      imagePrompt: 'Red',
      duration: 2,
      description: 'Slide from left',
      cameraAngle: 'medium',
      transition: {
        type: 'slide',
        config: { direction: 'left', easing: 'ease-out' },
      },
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: 'https://via.placeholder.com/1920x1080/F1FAEE/000000?text=Zoom',
      imagePrompt: 'White',
      duration: 2,
      description: 'Zoom in',
      cameraAngle: 'medium',
      transition: {
        type: 'zoom',
        config: { zoomType: 'in', scale: 1.5, easing: 'ease-in-out' },
      },
    },
    {
      index: 2,
      scriptSceneIndex: 2,
      imageUrl: 'https://via.placeholder.com/1920x1080/A8DADC/000000?text=Rotate',
      imagePrompt: 'Cyan',
      duration: 2,
      description: 'Rotate Y',
      cameraAngle: 'medium',
      transition: {
        type: 'rotate',
        config: { axis: 'y', angle: 90, easing: 'ease-in-out-cubic' },
      },
    },
    {
      index: 3,
      scriptSceneIndex: 3,
      imageUrl: 'https://via.placeholder.com/1920x1080/457B9D/FFFFFF?text=Wipe',
      imagePrompt: 'Blue',
      duration: 2,
      description: 'Wipe circle',
      cameraAngle: 'medium',
      transition: {
        type: 'wipe',
        config: { direction: 'circle', easing: 'ease-out' },
      },
    },
    {
      index: 4,
      scriptSceneIndex: 4,
      imageUrl: 'https://via.placeholder.com/1920x1080/1D3557/FFFFFF?text=Fade',
      imagePrompt: 'Dark Blue',
      duration: 2,
      description: 'Fade',
      cameraAngle: 'medium',
      transition: 'fade', // 混合使用字符串配置
    },
  ] as StoryboardFrame[],
  createdAt: new Date(),
})

async function testIntegration(
  name: string,
  storyboard: any
): Promise<{ success: boolean; renderTime: number; error?: string }> {
  const startTime = Date.now()

  try {
    console.log(`\n🧪 测试: ${name}`)
    console.log(`   帧数: ${storyboard.frames.length}`)

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
      `test_integration_${name.replace(/\s+/g, '_')}_${Date.now()}.mp4`
    )

    console.log('  🎥 Rendering...')
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: storyboard.frames.length * 2 * 30, // N帧 * 2秒 * 30fps
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
    console.log(`  📁 输出: ${outputPath}`)

    return { success: true, renderTime }
  } catch (err) {
    const renderTime = Date.now() - startTime
    const error = err instanceof Error ? err.message : String(err)
    console.log(`\n  ❌ 失败: ${error}`)

    return { success: false, renderTime, error }
  }
}

async function runTests() {
  console.log('========================================')
  console.log('🎬 转场集成测试')
  console.log('========================================')

  // 检查环境
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未启用')
    process.exit(1)
  }

  const tests = [
    { name: '向后兼容（字符串配置）', storyboard: testBackwardCompatibility() },
    { name: '混合转场（对象配置）', storyboard: testMixedTransitions() },
  ]

  const results = []

  for (const test of tests) {
    const result = await testIntegration(test.name, test.storyboard)
    results.push({ name: test.name, ...result })
  }

  // 输出测试报告
  console.log('\n========================================')
  console.log('📊 测试报告')
  console.log('========================================\n')

  const successful = results.filter((r) => r.success).length
  const total = results.length

  console.log(`总计: ${total} 个测试`)
  console.log(`成功: ${successful} 个`)
  console.log(`失败: ${total - successful} 个\n`)

  // 详细结果
  results.forEach((r) => {
    const status = r.success ? '✅' : '❌'
    const time = r.success ? `${(r.renderTime / 1000).toFixed(1)}秒` : 'N/A'
    console.log(`${status} ${r.name}: ${time}`)
    if (r.error) {
      console.log(`   错误: ${r.error}`)
    }
  })

  console.log('\n========================================\n')

  process.exit(results.every((r) => r.success) ? 0 : 1)
}

// 运行测试
runTests().catch((err) => {
  console.error('测试运行失败:', err)
  process.exit(1)
})
