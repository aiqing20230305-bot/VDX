#!/usr/bin/env tsx
/**
 * 角色一致性端到端测试
 *
 * 测试流程：
 * 1. 创建测试角色
 * 2. 验证角色特征提取
 * 3. 查询角色库
 * 4. （未来）使用角色生成分镜
 */

const API_BASE = 'http://localhost:3000'

// 测试用的 1x1 像素图片（红色）
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  duration: number
  error?: string
  data?: any
}

const results: TestResult[] = []
let createdCharacterId: string | null = null

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

    if (data && typeof data === 'object') {
      console.log('   结果:', JSON.stringify(data, null, 2).split('\n').slice(0, 8).join('\n   '))
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)

    results.push({ name, status: 'FAIL', duration, error: errorMsg })
    console.log(`❌ FAIL (${duration}ms)`)
    console.log(`   错误: ${errorMsg}`)
  }
}

// === 测试用例 ===

async function testCreateCharacter() {
  const response = await fetch(`${API_BASE}/api/character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'E2E测试角色',
      referenceImageUrl: TEST_IMAGE_BASE64,
      description: '端到端测试用角色',
      tags: ['测试', 'E2E'],
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(`API错误 ${response.status}: ${errorData.error || '未知错误'}`)
  }

  const data = await response.json()

  if (!data.success || !data.character) {
    throw new Error('返回数据格式错误')
  }

  // 保存角色ID供后续测试使用
  createdCharacterId = data.character.id

  return {
    id: data.character.id,
    name: data.character.name,
    hasFeatures: !!data.character.features,
    tags: data.character.tags,
  }
}

async function testQueryCharacters() {
  const response = await fetch(`${API_BASE}/api/character?limit=20`)

  if (!response.ok) {
    throw new Error(`API错误 ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.characters)) {
    throw new Error('返回数据格式错误')
  }

  // 验证刚创建的角色是否在列表中
  const foundCreated = data.characters.find((c: any) => c.id === createdCharacterId)

  return {
    total: data.total,
    count: data.characters.length,
    foundCreatedCharacter: !!foundCreated,
    createdCharacterName: foundCreated?.name,
  }
}

async function testSearchCharacter() {
  const response = await fetch(`${API_BASE}/api/character?search=E2E测试&limit=10`)

  if (!response.ok) {
    throw new Error(`API错误 ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.characters)) {
    throw new Error('返回数据格式错误')
  }

  return {
    count: data.characters.length,
    hasSimilarity: data.characters.length > 0 && 'similarity' in data.characters[0],
    matchesCreated: data.characters.some((c: any) => c.id === createdCharacterId),
  }
}

async function testTagFilter() {
  const response = await fetch(`${API_BASE}/api/character?tags=测试`)

  if (!response.ok) {
    throw new Error(`API错误 ${response.status}`)
  }

  const data = await response.json()

  if (!data.success || !Array.isArray(data.characters)) {
    throw new Error('返回数据格式错误')
  }

  return {
    count: data.characters.length,
    allHaveTestTag: data.characters.every((c: any) => c.tags?.includes('测试')),
  }
}

async function testCharacterFeatures() {
  if (!createdCharacterId) {
    throw new Error('未找到创建的角色ID')
  }

  const response = await fetch(`${API_BASE}/api/character?limit=100`)
  const data = await response.json()

  const character = data.characters.find((c: any) => c.id === createdCharacterId)

  if (!character) {
    throw new Error('未找到角色')
  }

  const features = character.features

  if (!features) {
    throw new Error('角色特征未提取（可能是OpenAI API未配置）')
  }

  return {
    hasFeatures: true,
    hasFaceFeatures: !!features.face,
    hasBodyFeatures: !!features.body,
    hasStyleFeatures: !!features.style,
    hasEmbedding: Array.isArray(features.embedding) && features.embedding.length === 1536,
  }
}

// === 主函数 ===

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║      角色一致性 - 端到端测试套件                          ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  console.log('\n📋 测试环境:')
  console.log(`   API Base: ${API_BASE}`)
  console.log(`   Node: ${process.version}`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🧪 端到端测试')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await runTest('1. 创建测试角色', testCreateCharacter)
  await runTest('2. 查询角色列表（验证创建成功）', testQueryCharacters)
  await runTest('3. 语义搜索角色', testSearchCharacter)
  await runTest('4. 标签筛选', testTagFilter)
  await runTest('5. 验证角色特征提取', testCharacterFeatures)

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

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (createdCharacterId) {
    console.log(`\n💡 创建的测试角色ID: ${createdCharacterId}`)
    console.log('   可用于后续测试或手动验证')
  }

  console.log('\n')

  // 退出码
  process.exit(failed > 0 ? 1 : 0)
}

// 检查服务器
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
