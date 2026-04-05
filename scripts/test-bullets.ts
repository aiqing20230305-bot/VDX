/**
 * 弹幕系统测试脚本
 * 测试基础弹幕、样式弹幕、多轨道弹幕、碰撞避让
 */
import { renderMedia, selectComposition } from '@remotion/renderer'
import { bundle } from '@remotion/bundler'
import path from 'path'
import type { Storyboard } from '../src/types'

const REMOTION_ENTRY = path.join(process.cwd(), 'remotion/index.ts')
const OUTPUT_DIR = path.join(process.cwd(), 'public/outputs/tests')

async function testBullets() {
  console.log('🎯 开始测试弹幕系统...\n')

  // Bundle Remotion
  console.log('📦 Bundling Remotion...')
  const bundleLocation = await bundle({
    entryPoint: REMOTION_ENTRY,
    webpackOverride: (config) => config,
  })
  console.log('✅ Bundle 完成\n')

  // ============================================================
  // 测试 1: 基础弹幕（单轨道）
  // ============================================================
  console.log('【测试 1】基础弹幕 - 3条弹幕，不同时间出现')
  const basicStoryboard: Storyboard = {
    id: 'test-bullets-basic',
    scriptId: 'test',
    totalFrames: 10,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imagePrompt: 'test',
        duration: 6,
        description: '弹幕测试背景',
        cameraAngle: 'wide',
      },
    ],
    bullets: [
      {
        id: 'track1',
        entries: [
          { id: 'b1', time: 1, text: '第一条弹幕！' },
          { id: 'b2', time: 2, text: '这是第二条弹幕，稍微长一点～' },
          { id: 'b3', time: 3, text: 'AwA 表情包' },
        ],
      },
    ],
    createdAt: new Date(),
  }

  await renderTest(bundleLocation, basicStoryboard, 'bullets-basic.mp4')

  // ============================================================
  // 测试 2: 样式弹幕（颜色、大小、速度）
  // ============================================================
  console.log('\n【测试 2】样式弹幕 - 不同颜色、大小、速度')
  const styledStoryboard: Storyboard = {
    id: 'test-bullets-styled',
    scriptId: 'test',
    totalFrames: 10,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imagePrompt: 'test',
        duration: 6,
        description: '样式测试背景',
        cameraAngle: 'wide',
      },
    ],
    bullets: [
      {
        id: 'track1',
        entries: [
          {
            id: 'b1',
            time: 1,
            text: '默认样式弹幕',
          },
          {
            id: 'b2',
            time: 1.5,
            text: '红色大字弹幕！',
            style: {
              fontSize: 32,
              color: '#FF0000',
              fontWeight: 'bold',
            },
            speed: 150, // 较慢
          },
          {
            id: 'b3',
            time: 2,
            text: '蓝色描边弹幕',
            style: {
              color: '#00FFFF',
              stroke: {
                color: '#0000FF',
                width: 2,
              },
            },
            speed: 300, // 较快
          },
          {
            id: 'b4',
            time: 2.5,
            text: '带背景和阴影',
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              shadow: {
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                color: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      },
    ],
    createdAt: new Date(),
  }

  await renderTest(bundleLocation, styledStoryboard, 'bullets-styled.mp4')

  // ============================================================
  // 测试 3: 多轨道弹幕（测试碰撞避让）
  // ============================================================
  console.log('\n【测试 3】多轨道弹幕 - 碰撞避让算法')
  const multiTrackStoryboard: Storyboard = {
    id: 'test-bullets-multi',
    scriptId: 'test',
    totalFrames: 10,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imagePrompt: 'test',
        duration: 6,
        description: '多轨道测试背景',
        cameraAngle: 'wide',
      },
    ],
    bullets: [
      {
        id: 'track1',
        entries: [
          { id: 'b1', time: 1, text: '弹幕1' },
          { id: 'b2', time: 1.1, text: '弹幕2' },
          { id: 'b3', time: 1.2, text: '弹幕3' },
          { id: 'b4', time: 1.3, text: '弹幕4' },
          { id: 'b5', time: 1.4, text: '弹幕5' },
          { id: 'b6', time: 2, text: '弹幕6' },
          { id: 'b7', time: 2.1, text: '弹幕7' },
          { id: 'b8', time: 2.2, text: '弹幕8' },
          { id: 'b9', time: 2.3, text: '弹幕9' },
          { id: 'b10', time: 2.4, text: '弹幕10' },
        ],
        laneHeight: 35,
        maxLanes: 5,
      },
    ],
    createdAt: new Date(),
  }

  await renderTest(bundleLocation, multiTrackStoryboard, 'bullets-multi.mp4')

  // ============================================================
  // 测试 4: 固定轨道弹幕（手动指定 lane）
  // ============================================================
  console.log('\n【测试 4】固定轨道弹幕 - 手动指定位置')
  const fixedLaneStoryboard: Storyboard = {
    id: 'test-bullets-fixed',
    scriptId: 'test',
    totalFrames: 10,
    frames: [
      {
        index: 0,
        scriptSceneIndex: 0,
        imagePrompt: 'test',
        duration: 6,
        description: '固定轨道测试背景',
        cameraAngle: 'wide',
      },
    ],
    bullets: [
      {
        id: 'track1',
        entries: [
          { id: 'b1', time: 1, text: '顶部弹幕（lane 0）', lane: 0 },
          { id: 'b2', time: 1.5, text: '中部弹幕（lane 2）', lane: 2 },
          { id: 'b3', time: 2, text: '底部弹幕（lane 4）', lane: 4 },
          { id: 'b4', time: 2.5, text: '又是顶部（lane 0）', lane: 0 },
        ],
        laneHeight: 40,
        maxLanes: 5,
      },
    ],
    createdAt: new Date(),
  }

  await renderTest(bundleLocation, fixedLaneStoryboard, 'bullets-fixed.mp4')

  console.log('\n✅ 所有测试完成！')
  console.log(`\n📂 输出目录: ${OUTPUT_DIR}`)
  console.log('  - bullets-basic.mp4')
  console.log('  - bullets-styled.mp4')
  console.log('  - bullets-multi.mp4')
  console.log('  - bullets-fixed.mp4')
}

async function renderTest(
  bundleLocation: string,
  storyboard: Storyboard,
  filename: string
) {
  const startTime = Date.now()

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'StoryboardVideo',
    inputProps: { storyboard, fps: 30 },
  })

  const totalFrames = Math.ceil(storyboard.frames[0].duration * 30)

  await renderMedia({
    composition: {
      ...composition,
      durationInFrames: totalFrames,
      fps: 30,
      width: 1920,
      height: 1080,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: path.join(OUTPUT_DIR, filename),
    inputProps: { storyboard, fps: 30 },
    chromiumOptions: {
      headless: true,
    },
    concurrency: 2,
    jpegQuality: 80,
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`✅ 渲染完成: ${filename} (${elapsed}s)`)
}

testBullets().catch((err) => {
  console.error('❌ 测试失败:', err)
  process.exit(1)
})
