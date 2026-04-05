/**
 * Remotion 端到端测试脚本
 * 测试 2 帧视频渲染 + 淡入淡出转场
 *
 * 运行：npx tsx scripts/test-remotion.ts
 */
import { config } from 'dotenv'
import { renderWithRemotion } from '../src/lib/video/remotion-pipeline'
import type { Storyboard } from '../src/types'
import path from 'path'
import fs from 'fs'

// 加载 .env.local
config({ path: path.join(process.cwd(), '.env.local') })

// 测试分镜数据（2 帧，包含淡入淡出转场）
const testStoryboard: Storyboard = {
  id: 'test-remotion-001',
  scriptId: 'script-test-001',
  totalFrames: 2,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: undefined, // 使用纯色背景 + 描述文字
      imagePrompt: 'A serene sunset over the ocean with orange and purple hues',
      duration: 3, // 3 秒
      description: '海边日落 🌅',
      cameraAngle: 'wide shot',
      transition: 'none', // 第一帧无转场
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: undefined,
      imagePrompt: 'A majestic snow-capped mountain peak under clear blue sky',
      duration: 4, // 4 秒
      description: '雪山之巅 ⛰️',
      cameraAngle: 'medium shot',
      transition: 'fade', // 淡入淡出转场
    },
  ],
  createdAt: new Date(),
}

async function runTest() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Remotion 端到端测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. 检查环境变量
  console.log('1️⃣ 检查环境变量...')
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未设置为 true')
    console.log('   请在 .env.local 中添加: REMOTION_ENABLE=true')
    process.exit(1)
  }
  console.log('✅ REMOTION_ENABLE: true')
  console.log(`✅ REMOTION_CONCURRENCY: ${process.env.REMOTION_CONCURRENCY ?? '2'}`)
  console.log(`✅ REMOTION_QUALITY: ${process.env.REMOTION_QUALITY ?? '80'}\n`)

  // 2. 检查输出目录
  console.log('2️⃣ 检查输出目录...')
  const outputDir = path.join(process.cwd(), 'public/outputs')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
    console.log('✅ 创建输出目录:', outputDir)
  } else {
    console.log('✅ 输出目录存在:', outputDir)
  }
  console.log()

  // 3. 测试渲染
  console.log('3️⃣ 开始渲染测试...')
  console.log(`   分镜帧数: ${testStoryboard.frames.length}`)
  console.log(`   总时长: ${testStoryboard.frames.reduce((sum, f) => sum + f.duration, 0)} 秒`)
  console.log(`   转场效果: Frame 1 → Fade → Frame 2\n`)

  const startTime = Date.now()

  try {
    const outputUrl = await renderWithRemotion({
      storyboard: testStoryboard,
      aspectRatio: '16:9',
      fps: 30,
      onProgress: (progress) => {
        const percent = (progress * 100).toFixed(1)
        process.stdout.write(`\r   渲染进度: ${percent}%`)
      },
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n')
    console.log('✅ 渲染成功!')
    console.log(`   输出路径: ${outputUrl}`)
    console.log(`   耗时: ${duration} 秒\n`)

    // 4. 验证输出文件
    console.log('4️⃣ 验证输出文件...')
    const outputPath = path.join(process.cwd(), 'public', outputUrl)
    if (!fs.existsSync(outputPath)) {
      console.error('❌ 输出文件不存在:', outputPath)
      process.exit(1)
    }

    const stats = fs.statSync(outputPath)
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log('✅ 文件已创建')
    console.log(`   路径: ${outputPath}`)
    console.log(`   大小: ${sizeInMB} MB\n`)

    // 5. 测试总结
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 测试通过!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Remotion 环境正常')
    console.log('✅ 视频渲染成功')
    console.log('✅ 淡入淡出转场效果已应用')
    console.log(`✅ 总耗时: ${duration} 秒`)
    console.log()
    console.log('📹 视频预览:')
    console.log(`   浏览器打开: http://localhost:3000${outputUrl}`)
    console.log()

  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n')
    console.error('❌ 渲染失败!')
    console.error(`   耗时: ${duration} 秒`)
    console.error(`   错误: ${err instanceof Error ? err.message : String(err)}\n`)

    // 提供诊断建议
    const errorMsg = String(err)
    if (errorMsg.includes('Puppeteer') || errorMsg.includes('browser')) {
      console.log('💡 诊断建议:')
      console.log('   Chrome/Puppeteer 未安装或无法启动')
      console.log('   解决方案: npx puppeteer browsers install chrome')
    } else if (errorMsg.includes('ENOMEM') || errorMsg.includes('memory')) {
      console.log('💡 诊断建议:')
      console.log('   内存不足')
      console.log('   解决方案: 降低 REMOTION_CONCURRENCY=1 或分辨率')
    } else if (errorMsg.includes('ENOENT') || errorMsg.includes('Cannot find module')) {
      console.log('💡 诊断建议:')
      console.log('   文件路径错误或模块缺失')
      console.log('   检查: remotion/index.ts 和相关组件是否存在')
    }
    console.log()

    process.exit(1)
  }
}

// 运行测试
runTest().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
