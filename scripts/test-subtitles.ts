/**
 * 字幕系统测试脚本
 * 测试字幕渲染、样式配置、多轨道等功能
 */
import { config } from 'dotenv'
import path from 'path'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import type { StoryboardFrame, SubtitleTrack } from '../src/types'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

// 测试场景 1：基础字幕
const testBasicSubtitles = () => {
  const subtitles: SubtitleTrack[] = [
    {
      id: 'basic',
      entries: [
        {
          startTime: 0,
          endTime: 2,
          text: '欢迎来到超级视频',
        },
        {
          startTime: 2,
          endTime: 4,
          text: '这是一个字幕测试',
        },
        {
          startTime: 4,
          endTime: 6,
          text: '字幕会自动淡入淡出',
        },
      ],
    },
  ]

  return {
    id: 'test-basic-subtitles',
    scriptId: 'test-script',
    totalFrames: 3,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Scene+1',
        imagePrompt: 'Red scene',
        duration: 2,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'fade',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/4ECDC4/FFFFFF?text=Scene+2',
        imagePrompt: 'Cyan scene',
        duration: 2,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'fade',
      },
      {
        index: 2,
        scriptSceneIndex: 2,
        imageUrl: 'https://via.placeholder.com/1920x1080/FFE66D/000000?text=Scene+3',
        imagePrompt: 'Yellow scene',
        duration: 2,
        description: 'Scene 3',
        cameraAngle: 'medium',
        transition: 'fade',
      },
    ] as StoryboardFrame[],
    subtitles,
    createdAt: new Date(),
  }
}

// 测试场景 2：样式配置
const testStyledSubtitles = () => {
  const subtitles: SubtitleTrack[] = [
    {
      id: 'styled',
      defaultStyle: {
        fontSize: 32,
        fontFamily: 'Arial',
        color: '#FFFF00',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        stroke: {
          color: '#000000',
          width: 2,
        },
        shadow: {
          offsetX: 2,
          offsetY: 2,
          blur: 4,
          color: 'rgba(0, 0, 0, 0.5)',
        },
      },
      entries: [
        {
          startTime: 0,
          endTime: 2,
          text: '黄色字幕，黑色描边',
          position: 'bottom',
        },
        {
          startTime: 2,
          endTime: 4,
          text: '红色字幕在顶部',
          position: 'top',
          style: {
            color: '#FF0000',
            fontSize: 40,
          },
        },
        {
          startTime: 4,
          endTime: 6,
          text: '绿色字幕在中间',
          position: 'middle',
          style: {
            color: '#00FF00',
            fontSize: 36,
          },
        },
      ],
    },
  ]

  return {
    id: 'test-styled-subtitles',
    scriptId: 'test-script',
    totalFrames: 3,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/E63946/FFFFFF?text=Scene+1',
        imagePrompt: 'Red',
        duration: 2,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'slide',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/F1FAEE/000000?text=Scene+2',
        imagePrompt: 'White',
        duration: 2,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'zoom',
      },
      {
        index: 2,
        scriptSceneIndex: 2,
        imageUrl: 'https://via.placeholder.com/1920x1080/A8DADC/000000?text=Scene+3',
        imagePrompt: 'Cyan',
        duration: 2,
        description: 'Scene 3',
        cameraAngle: 'medium',
        transition: 'rotate',
      },
    ] as StoryboardFrame[],
    subtitles,
    createdAt: new Date(),
  }
}

// 测试场景 3：多轨道字幕
const testMultiTrackSubtitles = () => {
  const subtitles: SubtitleTrack[] = [
    {
      id: 'chinese',
      entries: [
        {
          startTime: 0,
          endTime: 3,
          text: '中文字幕在底部',
          position: 'bottom',
        },
        {
          startTime: 3,
          endTime: 6,
          text: '第二句中文',
          position: 'bottom',
        },
      ],
    },
    {
      id: 'english',
      defaultStyle: {
        color: '#FFFF00',
        fontSize: 20,
        backgroundColor: 'rgba(0, 0, 100, 0.7)',
      },
      entries: [
        {
          startTime: 0,
          endTime: 3,
          text: 'English subtitle at the top',
          position: 'top',
        },
        {
          startTime: 3,
          endTime: 6,
          text: 'Second English subtitle',
          position: 'top',
        },
      ],
    },
  ]

  return {
    id: 'test-multitrack-subtitles',
    scriptId: 'test-script',
    totalFrames: 3,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imageUrl: 'https://via.placeholder.com/1920x1080/457B9D/FFFFFF?text=Scene+1',
        imagePrompt: 'Blue',
        duration: 3,
        description: 'Scene 1',
        cameraAngle: 'medium',
        transition: 'wipe',
      },
      {
        index: 1,
        scriptSceneIndex: 1,
        imageUrl: 'https://via.placeholder.com/1920x1080/1D3557/FFFFFF?text=Scene+2',
        imagePrompt: 'Dark Blue',
        duration: 3,
        description: 'Scene 2',
        cameraAngle: 'medium',
        transition: 'fade',
      },
    ] as StoryboardFrame[],
    subtitles,
    createdAt: new Date(),
  }
}

async function testSubtitles(
  name: string,
  storyboard: any
): Promise<{ success: boolean; renderTime: number; error?: string }> {
  const startTime = Date.now()

  try {
    console.log(`\n🧪 测试: ${name}`)
    console.log(`   帧数: ${storyboard.frames.length}`)
    console.log(`   字幕轨道: ${storyboard.subtitles?.length || 0}`)

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
      `test_subtitle_${name.replace(/\s+/g, '_')}_${Date.now()}.mp4`
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
  console.log('📝 字幕系统测试')
  console.log('========================================')

  // 检查环境
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未启用')
    process.exit(1)
  }

  const tests = [
    { name: '基础字幕', storyboard: testBasicSubtitles() },
    { name: '样式配置', storyboard: testStyledSubtitles() },
    { name: '多轨道字幕', storyboard: testMultiTrackSubtitles() },
  ]

  const results = []

  for (const test of tests) {
    const result = await testSubtitles(test.name, test.storyboard)
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
