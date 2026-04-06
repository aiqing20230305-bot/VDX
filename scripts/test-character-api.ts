#!/usr/bin/env tsx
/**
 * 角色一致性 API 手动测试脚本
 *
 * 用法：
 * 1. 启动开发服务器：npm run dev
 * 2. 运行测试：npx tsx scripts/test-character-api.ts
 */

import fs from 'fs'
import path from 'path'

const API_BASE = 'http://localhost:3000'

// 测试用的 base64 图片（1x1 像素红色）
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
  data?: any
}

const results: TestResult[] = []

async function runTest(
  name: string,
  fn: () => Promise<any>
): Promise<void> {
  const startTime = Date.now()
  console.log(`\n▶ ${name}`)

  try {
    const data = await fn()
    const duration = Date.now() - startTime

    results.push({ name, status: 'PASS', duration, data })
    console.log(`✅ PASS (${duration}ms)`)

    if (data) {
      console.log('   结果:', JSON.stringify(data, null, 2).split('\n').slice(0, 10).join('\n   '))
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)

    results.push({ name, status: 'FAIL', duration, error: errorMsg })
    console.log(`❌ FAIL (${duration}ms)`)
    console.log(`   错误: ${errorMsg}`)
  }
}

async function testCreateCharacter() {
  const response = await fetch(`${API_BASE}/api/character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '测试角色Alice',
      referenceImageUrl: TEST_IMAGE_BASE64,
      description: '一个测试用的角色',
      tags: ['测试', '女性', '学生'],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`API 错误 ${response.status}: ${errorData.error}`)
  }

  const data = await response.json()

  if (!data.success || !data.character) {
    throw new Error('返回数据格式错误')
  }

  // 保存 character ID 供后续测试使用
  ;(global as any).testCharacterId = data.character.id

  return {
    id: data.character.id,
    name: data.character.name,
    hasFeatures: !!data.character.features,
  }
}

async function testQueryCharacters() {
  const response = await fetch(`${API_BASE}/api/character?limit=10`)

  if (!response.ok) {
    throw new Error(`API 错误 ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.characters)) {
    throw new Error('返回数据格式错误')
  }

  return {
    count: data.characters.length,
    total: data.total,
    firstCharacter: data.characters[0]?.name,
  }
}

async function testSemanticSearch() {
  const response = await fetch(`${API_BASE}/api/character?search=测试角色&limit=5`)

  if (!response.ok) {
    throw new Error(`API 错误 ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.characters)) {
    throw new Error('返回数据格式错误')
  }

  return {
    count: data.characters.length,
    hasSimilarity: data.characters.length > 0 && 'similarity' in data.characters[0],
    topSimilarity: data.characters[0]?.similarity,
  }
}

async function testInvalidRequest() {
  const response = await fetch(`${API_BASE}/api/character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '无效角色',
      // 缺少 referenceImageUrl
    }),
  })

  if (response.status !== 400) {
    throw new Error(`期望状态码 400，实际: ${response.status}`)
  }

  const data = await response.json()

  if (!data.error) {
    throw new Error('应该返回错误信息')
  }

  return { error: data.error }
}

async function testPerformance() {
  const iterations = 5
  const durations: number[] = []

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now()
    await fetch(`${API_BASE}/api/character?limit=20`)
    durations.push(Date.now() - startTime)
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations
  const maxDuration = Math.max(...durations)
  const minDuration = Math.min(...durations)

  if (avgDuration > 500) {
    throw new Error(`平均响应时间 ${avgDuration}ms 超过 500ms 阈值`)
  }

  return {
    avg: Math.round(avgDuration),
    min: minDuration,
    max: maxDuration,
  }
}

async function testCosineSimilarity() {
  // 动态导入（仅服务端模块）
  const { cosineSimilarity } = await import('../src/lib/ai/character-engine')

  const vec1 = new Array(1536).fill(0.5)
  const vec2 = new Array(1536).fill(0.6)

  const startTime = Date.now()
  const similarity = cosineSimilarity(vec1, vec2)
  const duration = Date.now() - startTime

  if (duration > 10) {
    throw new Error(`相似度计算耗时 ${duration}ms 超过 10ms 阈值`)
  }

  if (similarity < 0 || similarity > 1) {
    throw new Error(`相似度 ${similarity} 超出 [0, 1] 范围`)
  }

  return {
    similarity: similarity.toFixed(4),
    duration,
  }
}

async function testEnhancePrompt() {
  const { enhancePromptWithCharacter } = await import('../src/lib/ai/consistency-engine')

  const character = {
    id: 'test-id',
    name: '小红',
    referenceImageUrl: TEST_IMAGE_BASE64,
    tags: [],
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const features = {
    face: { shape: '圆脸', eyes: '大眼睛', hair: '长黑发', skin: '白皙' },
    body: { build: '纤瘦', height: '高挑', pose: '站立' },
    style: { clothing: '白色连衣裙', colors: ['白色', '蓝色'], accessories: '项链' },
    detailedDescription: '一个穿白色连衣裙的女孩',
    promptKeywords: ['女孩', '白色'],
    embedding: [],
  }

  const originalPrompt = '一个女孩在公园散步'
  const enhanced = enhancePromptWithCharacter(originalPrompt, character, features)

  if (!enhanced.includes(originalPrompt)) {
    throw new Error('增强后的提示词未包含原始提示词')
  }

  if (!enhanced.includes('长黑发')) {
    throw new Error('增强后的提示词未包含角色特征')
  }

  return {
    original: originalPrompt,
    enhanced: enhanced.slice(0, 100) + '...',
    length: enhanced.length,
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║      角色一致性系统 - API 测试套件                        ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  console.log('\n📋 测试环境:')
  console.log(`   API Base: ${API_BASE}`)
  console.log(`   Node: ${process.version}`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📦 API 功能测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await runTest('POST /api/character - 创建角色', testCreateCharacter)
  await runTest('GET /api/character - 查询角色列表', testQueryCharacters)
  await runTest('GET /api/character?search - 语义搜索', testSemanticSearch)
  await runTest('POST /api/character - 无效请求处理', testInvalidRequest)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚡ 性能测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await runTest('角色库查询性能（<500ms）', testPerformance)
  await runTest('相似度计算性能（<10ms）', testCosineSimilarity)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 单元测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await runTest('提示词增强功能', testEnhancePrompt)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 测试结果汇总')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\n✅ 通过: ${passed}`)
  console.log(`❌ 失败: ${failed}`)
  console.log(`⏱️  总耗时: ${totalDuration}ms`)

  if (failed > 0) {
    console.log('\n失败的测试:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}`)
      console.log(`    ${r.error}`)
    })
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 退出码
  process.exit(failed > 0 ? 1 : 0)
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await fetch(`${API_BASE}/api/character?limit=1`)
    return true
  } catch {
    return false
  }
}

;(async () => {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.error('❌ 错误: 开发服务器未运行')
    console.error('   请先运行: npm run dev')
    process.exit(1)
  }

  await main()
})()
