/**
 * Pretext 文字动画测试脚本
 * 测试 3 种文字动画效果（流体、粒子、ASCII）
 *
 * 运行：
 *   npx tsx scripts/test-pretext.ts --type fluid
 *   npx tsx scripts/test-pretext.ts --type particle
 *   npx tsx scripts/test-pretext.ts --type ascii
 *   npx tsx scripts/test-pretext.ts --all
 */
import { config } from 'dotenv'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'path'
import fs from 'fs'

// 加载环境变量
config({ path: path.join(process.cwd(), '.env.local') })

type TestType = 'fluid' | 'particle' | 'ascii' | 'all'

// 测试配置
const testConfigs = {
  fluid: {
    compositionId: 'FluidText',
    name: '流体文字',
    duration: 3,
  },
  particle: {
    compositionId: 'ParticleText',
    name: '粒子文字',
    duration: 4,
  },
  ascii: {
    compositionId: 'ASCIIArt',
    name: 'ASCII 艺术',
    duration: 3,
  },
}

async function runTest(type: keyof typeof testConfigs) {
  const config = testConfigs[type]

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`🧪 测试 ${config.name}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  const startTime = Date.now()

  try {
    console.log('1️⃣ Bundle React 代码...')
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'remotion/index.ts'),
      webpackOverride: (config) => config,
    })
    console.log(`✅ Bundle 完成: ${bundleLocation}\n`)

    console.log('2️⃣ 选择 Composition...')
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: config.compositionId,
    })
    console.log(`✅ Composition: ${composition.id}\n`)

    console.log('3️⃣ 渲染视频...')
    const outputPath = path.join(
      process.cwd(),
      'public/outputs',
      `pretext_${type}_${Date.now()}.mp4`
    )

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      onProgress: ({ progress }) => {
        const percent = (progress * 100).toFixed(1)
        process.stdout.write(`\r   渲染进度: ${percent}%`)
      },
      chromiumOptions: {
        headless: true,
      },
      concurrency: parseInt(process.env.REMOTION_CONCURRENCY ?? '2'),
      jpegQuality: parseInt(process.env.REMOTION_QUALITY ?? '80'),
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n')
    console.log(`✅ 渲染成功!`)
    console.log(`   输出: ${outputPath}`)
    console.log(`   耗时: ${duration} 秒`)

    // 验证文件
    const stats = fs.statSync(outputPath)
    const sizeInMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`   大小: ${sizeInMB} MB\n`)

    return {
      type,
      success: true,
      duration: parseFloat(duration),
      size: parseFloat(sizeInMB),
      outputPath,
    }
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n')
    console.error(`❌ 渲染失败!`)
    console.error(`   耗时: ${duration} 秒`)
    console.error(`   错误: ${err instanceof Error ? err.message : String(err)}\n`)

    return {
      type,
      success: false,
      duration: parseFloat(duration),
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2)
  const typeArg = args.find((arg) => arg.startsWith('--type='))?.split('=')[1]
  const testAll = args.includes('--all')

  // 检查环境变量
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 Pretext 文字动画测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('✅ 检查环境变量...')
  if (process.env.REMOTION_ENABLE !== 'true') {
    console.error('❌ REMOTION_ENABLE 未设置为 true')
    process.exit(1)
  }
  console.log(`   REMOTION_ENABLE: true`)
  console.log(`   REMOTION_CONCURRENCY: ${process.env.REMOTION_CONCURRENCY ?? '2'}`)
  console.log(`   REMOTION_QUALITY: ${process.env.REMOTION_QUALITY ?? '80'}\n`)

  // 确定测试类型
  let testTypes: Array<keyof typeof testConfigs>

  if (testAll) {
    testTypes = Object.keys(testConfigs) as Array<keyof typeof testConfigs>
  } else if (typeArg && typeArg in testConfigs) {
    testTypes = [typeArg as keyof typeof testConfigs]
  } else {
    console.log('用法:')
    console.log('  npx tsx scripts/test-pretext.ts --type=fluid')
    console.log('  npx tsx scripts/test-pretext.ts --type=particle')
    console.log('  npx tsx scripts/test-pretext.ts --type=ascii')
    console.log('  npx tsx scripts/test-pretext.ts --all\n')
    process.exit(1)
  }

  // 运行测试
  const results = []
  for (const type of testTypes) {
    const result = await runTest(type)
    results.push(result)
  }

  // 汇总结果
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 测试汇总')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`✅ 成功: ${successCount}`)
  console.log(`❌ 失败: ${failCount}`)
  console.log(`⏱️  总耗时: ${totalDuration.toFixed(1)} 秒\n`)

  if (successCount > 0) {
    console.log('成功渲染:')
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`  - ${testConfigs[r.type].name}: ${r.size} MB (${r.duration}s)`)
      })
    console.log()
  }

  if (failCount > 0) {
    console.log('失败测试:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${testConfigs[r.type].name}: ${r.error}`)
      })
    console.log()
  }

  process.exit(failCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
