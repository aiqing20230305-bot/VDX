/**
 * 端到端测试：文字效果完整流程
 * 模拟用户在 UI 中添加文字效果的完整流程
 */
import type { Storyboard } from '../src/types'

// 创建测试分镜
const testStoryboard: Storyboard = {
  id: 'test-e2e-001',
  scriptId: 'script-001',
  totalFrames: 3,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: '/uploads/frame1.jpg',
      imagePrompt: 'Product showcase scene',
      duration: 5,
      description: '产品展示',
      cameraAngle: 'wide',
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: '/uploads/frame2.jpg',
      imagePrompt: 'Feature introduction',
      duration: 5,
      description: '功能介绍',
      cameraAngle: 'medium',
    },
    {
      index: 2,
      scriptSceneIndex: 2,
      imageUrl: '/uploads/frame3.jpg',
      imagePrompt: 'Call to action',
      duration: 5,
      description: '行动号召',
      cameraAngle: 'close',
    },
  ],
  createdAt: new Date(),
}

async function testE2E() {
  console.log('🧪 端到端测试：文字效果完整流程\n')

  const testCases = [
    {
      name: '场景 1：添加字幕',
      effectType: 'subtitles',
      userRequest: '在视频开始时显示"欢迎来到超级视频"，然后在第7秒显示"体验AI创作的力量"',
      expectedFields: ['subtitles'],
    },
    {
      name: '场景 2：添加标题动画',
      effectType: 'titles',
      userRequest: '在视频开头添加大标题"超级视频 v1.3"，使用缩放进入效果，持续2秒',
      expectedFields: ['titles'],
    },
    {
      name: '场景 3：添加弹幕',
      effectType: 'bullets',
      userRequest: '在视频中添加弹幕：第1秒显示"666"，第3秒显示"太酷了"，第5秒显示"amazing"',
      expectedFields: ['bullets'],
    },
  ]

  let passCount = 0
  let failCount = 0

  for (const testCase of testCases) {
    console.log(`\n【${testCase.name}】`)
    console.log(`效果类型: ${testCase.effectType}`)
    console.log(`用户输入: ${testCase.userRequest}`)

    try {
      const res = await fetch('http://localhost:3000/api/text-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboard: testStoryboard,
          userRequest: testCase.userRequest,
          effectType: testCase.effectType,
        }),
      })

      const data = await res.json()

      if (data.error) {
        console.log(`  ❌ 失败: ${data.error}`)
        failCount++
        continue
      }

      // 验证响应
      let isValid = true
      for (const field of testCase.expectedFields) {
        if (!data.storyboard[field] || data.storyboard[field].length === 0) {
          console.log(`  ❌ 缺少字段: ${field}`)
          isValid = false
        }
      }

      if (isValid) {
        console.log(`  ✅ 成功: ${data.summary}`)
        console.log(`  数据: ${JSON.stringify(data.storyboard[testCase.expectedFields[0]][0].entries.length)} 条配置`)
        passCount++
      } else {
        failCount++
      }
    } catch (err) {
      console.log(`  ❌ 请求失败: ${err}`)
      failCount++
    }
  }

  console.log(`\n\n📊 测试结果`)
  console.log(`总计: ${passCount + failCount} 个测试`)
  console.log(`✅ 通过: ${passCount}`)
  console.log(`❌ 失败: ${failCount}`)
  console.log(`通过率: ${((passCount / (passCount + failCount)) * 100).toFixed(0)}%`)

  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！')
  } else {
    console.log('\n⚠️  部分测试失败，请检查日志')
  }
}

testE2E().catch(console.error)
