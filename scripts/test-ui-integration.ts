/**
 * UI 集成测试 - 模拟完整的文字效果添加流程
 */
import type { Storyboard, SubtitleTrack, TitleTrack, BulletTrack } from '../src/types'

// 创建测试用的 storyboard
const testStoryboard: Storyboard = {
  id: 'test-ui-001',
  scriptId: 'script-001',
  totalFrames: 3,
  frames: [
    {
      index: 0,
      scriptSceneIndex: 0,
      imageUrl: '/uploads/frame1.jpg',
      imagePrompt: 'test',
      duration: 5,
      description: '开场：产品展示',
      cameraAngle: 'wide',
    },
    {
      index: 1,
      scriptSceneIndex: 1,
      imageUrl: '/uploads/frame2.jpg',
      imagePrompt: 'test',
      duration: 5,
      description: '中段：功能介绍',
      cameraAngle: 'medium',
    },
    {
      index: 2,
      scriptSceneIndex: 2,
      imageUrl: '/uploads/frame3.jpg',
      imagePrompt: 'test',
      duration: 5,
      description: '结尾：行动号召',
      cameraAngle: 'close',
    },
  ],
  createdAt: new Date(),
}

async function testTextEffectsAPI() {
  console.log('📝 测试文字效果 API...\n')

  // 测试 1: 添加字幕
  console.log('【测试 1】添加字幕')
  const subtitleRequest = {
    storyboard: testStoryboard,
    userRequest: '在视频开始时显示："欢迎来到超级视频"，然后在第7秒显示："体验AI创作的力量"',
    effectType: 'subtitles',
  }

  try {
    const res1 = await fetch('http://localhost:3000/api/text-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subtitleRequest),
    })

    const data1 = await res1.json()
    if (data1.error) {
      console.error(`  ❌ 失败: ${data1.error}`)
    } else {
      console.log(`  ✅ 成功: ${data1.summary}`)
      console.log(`  字幕数量: ${data1.storyboard.subtitles?.[0]?.entries.length ?? 0}`)
    }
  } catch (err) {
    console.error(`  ❌ 请求失败:`, err)
  }

  // 测试 2: 添加标题动画
  console.log('\n【测试 2】添加标题动画')
  const titleRequest = {
    storyboard: testStoryboard,
    userRequest: '在视频开头添加标题"超级视频 v1.3"，使用缩放进入效果，持续2秒',
    effectType: 'titles',
  }

  try {
    const res2 = await fetch('http://localhost:3000/api/text-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(titleRequest),
    })

    const data2 = await res2.json()
    if (data2.error) {
      console.error(`  ❌ 失败: ${data2.error}`)
    } else {
      console.log(`  ✅ 成功: ${data2.summary}`)
      console.log(`  标题数量: ${data2.storyboard.titles?.[0]?.entries.length ?? 0}`)
    }
  } catch (err) {
    console.error(`  ❌ 请求失败:`, err)
  }

  // 测试 3: 添加弹幕
  console.log('\n【测试 3】添加弹幕')
  const bulletRequest = {
    storyboard: testStoryboard,
    userRequest: '在视频中添加弹幕：第1秒显示"666"，第3秒显示"太酷了"，第5秒显示"awesome"',
    effectType: 'bullets',
  }

  try {
    const res3 = await fetch('http://localhost:3000/api/text-effects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bulletRequest),
    })

    const data3 = await res3.json()
    if (data3.error) {
      console.error(`  ❌ 失败: ${data3.error}`)
    } else {
      console.log(`  ✅ 成功: ${data3.summary}`)
      console.log(`  弹幕数量: ${data3.storyboard.bullets?.[0]?.entries.length ?? 0}`)
    }
  } catch (err) {
    console.error(`  ❌ 请求失败:`, err)
  }

  console.log('\n✅ 所有测试完成！')
}

testTextEffectsAPI().catch(console.error)
