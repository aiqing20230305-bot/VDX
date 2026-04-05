/**
 * 标题动画系统测试脚本
 * 测试各种标题动画效果
 */
import { config } from 'dotenv'
import path from 'path'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import type { StoryboardFrame, TitleTrack } from '../src/types'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

// 测试场景 1：基础动画（slideIn, fadeIn, zoomIn）
const testBasicAnimations = () => {
  const titles: TitleTrack[] = [
    {
      id: 'basic-animations',
      entries: [
        {
          startTime: 0,
          endTime: 2,
          text: '滑动进入',
          position: 'top',
          animation: {
            type: 'slideIn',
            direction: 'bottom',
            duration: 30,
          },
        },
        {
          startTime: 2,
          endTime: 4,
          text: '淡入效果',
          position: 'center',
          animation: {
            type: 'fadeIn',
            duration: 30,
          },
        },
        {
          startTime: 4,
          endTime: 6,
          text: '缩放进入',
          position: 'bottom',
          animation: {
            type: 'zoomIn',
            duration: 30,
          },
        },
      ],
    },
  ]

  return {
    id: 'test-basic-animations',
    scriptId: 'test-script',
    totalFrames: 3,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/3A86FF/FFFFFF?text=Scene+1',
        imagePrompt: 'Blue scene',
        duration: 2,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'fade',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/8338EC/FFFFFF?text=Scene+2',
        imagePrompt: 'Purple scene',
        duration: 2,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'fade',
      },
      {
        index: 2,
        scriptSceneIndex: 2,
        imageUrl: 'https://via.placeholder.com/1920x1080/FB5607/FFFFFF?text=Scene+3',
        imagePrompt: 'Orange scene',
        duration: 2,
        description: 'Scene 3',
        cameraAngle: 'medium',
        transition: 'fade',
      },
    ] as StoryboardFrame[],
    titles,
    createdAt: new Date(),
  }
}

// 测试场景 2：高级动画（bounceIn, rotateIn, typewriter）
const testAdvancedAnimations = () => {
  const titles: TitleTrack[] = [
    {
      id: 'advanced-animations',
      entries: [
        {
          startTime: 0,
          endTime: 2,
          text: '弹跳进入！',
          position: 'center',
          animation: {
            type: 'bounceIn',
            duration: 30,
          },
          style: {
            fontSize: 60,
            color: '#FFD60A',
          },
        },
        {
          startTime: 2,
          endTime: 4,
          text: '旋转登场',
          position: 'center',
          animation: {
            type: 'rotateIn',
            duration: 40,
          },
          style: {
            fontSize: 56,
            color: '#00F5FF',
          },
        },
        {
          startTime: 4,
          endTime: 7,
          text: '打字机效果：逐字显示文本...',
          position: 'center',
          animation: {
            type: 'typewriter',
            duration: 60,
          },
          style: {
            fontSize: 40,
            color: '#FFFFFF',
          },
        },
      ],
    },
  ]

  return {
    id: 'test-advanced-animations',
    scriptId: 'test-script',
    totalFrames: 3,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/FF006E/FFFFFF?text=Scene+1',
        imagePrompt: 'Pink scene',
        duration: 2,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'slide',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/8338EC/FFFFFF?text=Scene+2',
        imagePrompt: 'Purple scene',
        duration: 2,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'zoom',
      },
      {
        index: 2,
        scriptSceneIndex: 2,
        imageUrl: 'https://via.placeholder.com/1920x1080/3A86FF/FFFFFF?text=Scene+3',
        imagePrompt: 'Blue scene',
        duration: 3,
        description: 'Scene 3',
        cameraAngle: 'medium',
        transition: 'rotate',
      },
    ] as StoryboardFrame[],
    titles,
    createdAt: new Date(),
  }
}

// 测试场景 3：样式配置（描边、阴影、背景）
const testStyledTitles = () => {
  const titles: TitleTrack[] = [
    {
      id: 'styled-titles',
      defaultStyle: {
        fontSize: 54,
        fontWeight: 'bold',
        stroke: {
          color: '#000000',
          width: 3,
        },
        shadow: {
          offsetX: 3,
          offsetY: 3,
          blur: 6,
          color: 'rgba(0, 0, 0, 0.5)',
        },
      },
      entries: [
        {
          startTime: 0,
          endTime: 3,
          text: '描边标题',
          position: 'top',
          animation: {
            type: 'slideIn',
            direction: 'left',
            duration: 30,
          },
          style: {
            color: '#FFD60A',
          },
        },
        {
          startTime: 3,
          endTime: 6,
          text: '带背景的标题',
          position: 'center',
          animation: {
            type: 'zoomIn',
            duration: 30,
          },
          style: {
            color: '#FFFFFF',
            backgroundColor: 'rgba(139, 0, 139, 0.8)',
            padding: 32,
          },
        },
      ],
    },
  ]

  return {
    id: 'test-styled-titles',
    scriptId: 'test-script',
    totalFrames: 2,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/06FFA5/FFFFFF?text=Scene+1',
        imagePrompt: 'Green scene',
        duration: 3,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'wipe',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/FF006E/FFFFFF?text=Scene+2',
        imagePrompt: 'Pink scene',
        duration: 3,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'fade',
      },
    ] as StoryboardFrame[],
    titles,
    createdAt: new Date(),
  }
}

// 测试场景 4：退出动画
const testExitAnimations = () => {
  const titles: TitleTrack[] = [
    {
      id: 'exit-animations',
      entries: [
        {
          startTime: 0,
          endTime: 3,
          text: '进入与退出',
          position: 'center',
          animation: {
            type: 'slideIn',
            direction: 'bottom',
            duration: 20,
            exitAnimation: true,
            exitDuration: 20,
          },
          style: {
            fontSize: 64,
            color: '#00F5FF',
          },
        },
        {
          startTime: 3,
          endTime: 6,
          text: '缩放退出',
          position: 'center',
          animation: {
            type: 'zoomIn',
            duration: 20,
            exitAnimation: true,
            exitDuration: 20,
          },
          style: {
            fontSize: 64,
            color: '#FFD60A',
          },
        },
      ],
    },
  ]

  return {
    id: 'test-exit-animations',
    scriptId: 'test-script',
    totalFrames: 2,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/8338EC/FFFFFF?text=Scene+1',
        imagePrompt: 'Purple scene',
        duration: 3,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'fade',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/FB5607/FFFFFF?text=Scene+2',
        imagePrompt: 'Orange scene',
        duration: 3,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'fade',
      },
    ] as StoryboardFrame[],
    titles,
    createdAt: new Date(),
  }
}

async function testTitles(
  name: string,
  storyboard: any
): Promise<{ success: boolean; renderTime: number; error?: string }> {
  const startTime = Date.now()

  try {
    console.log(`\n🧪 测试: ${name}`)
    console.log(`   帧数: ${storyboard.frames.length}`)
    console.log(`   标题轨道: ${storyboard.titles?.length || 0}`)

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
      `test_title_${name.replace(/\s+/g, '_')}_${Date.now()}.mp4`
    )

    console.log('  🎥 Rendering...')
    await renderMedia({
      composition: {
        ...composition,
        durationInFrames: storyboard.frames.reduce(
          (sum: number, f: any) => sum + f.duration * 30,
          0
        ),
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
  console.log('🎬 标题动画系统测试')
  console.log('========================================')

  // 检查环境
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未启用')
    process.exit(1)
  }

  const tests = [
    { name: '基础动画', storyboard: testBasicAnimations() },
    { name: '高级动画', storyboard: testAdvancedAnimations() },
    { name: '样式配置', storyboard: testStyledTitles() },
    { name: '退出动画', storyboard: testExitAnimations() },
  ]

  const results = []

  for (const test of tests) {
    const result = await testTitles(test.name, test.storyboard)
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
