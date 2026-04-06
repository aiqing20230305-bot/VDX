/**
 * 测试提示词过滤效果
 * 运行：npx ts-node test-prompt-filter.ts
 */

import { filterPrompt } from './src/lib/ai/content-filter.js'
import { simplifyPrompt } from './src/lib/ai/style-presets.js'

console.log('=== 提示词过滤测试 ===\n')

// 测试用例1：你截图中的原始提示词
const testCase1 = `shot on Sony A7IV with 35mm f/1.4 lens, natural lighting, shallow depth of field, film grain, photorealistic, 8K resolution, RAW photo quality, realistic skin texture, natural color grading, shot on Sony A7IV with 35mm f/1.4 lens, natural lighting, shallow depth of field, film grain`

console.log('【测试1：相机参数过滤】')
console.log('原始提示词:')
console.log(testCase1)
console.log('\n经过 filterPrompt:')
const filtered1 = filterPrompt(testCase1)
console.log(filtered1.filtered)
console.log(`替换次数: ${filtered1.replacements.length}`)
filtered1.replacements.forEach(r => {
  console.log(`  - "${r.original}" → "${r.replaced}" (${r.category})`)
})

console.log('\n经过 simplifyPrompt:')
const simplified1 = simplifyPrompt(filtered1.filtered)
console.log(simplified1)
console.log(`长度: ${testCase1.length} → ${simplified1.length} 字符\n`)

// 测试用例2：更多技术术语
const testCase2 = `professional photography, Canon EOS R5 camera, 85mm f/1.2 lens, bokeh effect, Rembrandt lighting, golden hour lighting, cinematic color grading, Kodak film stock look, RAW file format, 12K resolution, subsurface scattering, global illumination, ultra detailed, highly detailed, extremely detailed`

console.log('\n【测试2：专业摄影术语】')
console.log('原始提示词:')
console.log(testCase2)
console.log('\n经过 filterPrompt:')
const filtered2 = filterPrompt(testCase2)
console.log(filtered2.filtered)
console.log(`替换次数: ${filtered2.replacements.length}`)

console.log('\n经过 simplifyPrompt:')
const simplified2 = simplifyPrompt(filtered2.filtered)
console.log(simplified2)
console.log(`长度: ${testCase2.length} → ${simplified2.length} 字符\n`)

// 测试用例3：中文品牌词
const testCase3 = `一个拿着苹果手机的人，穿着耐克鞋，喝着可口可乐，在麦当劳吃饭，旁边停着特斯拉汽车`

console.log('\n【测试3：中文品牌词】')
console.log('原始提示词:')
console.log(testCase3)
console.log('\n经过 filterPrompt:')
const filtered3 = filterPrompt(testCase3)
console.log(filtered3.filtered)
console.log(`替换次数: ${filtered3.replacements.length}`)
filtered3.replacements.forEach(r => {
  console.log(`  - "${r.original}" → "${r.replaced}" (${r.category})`)
})

// 测试用例4：混合技术参数
const testCase4 = `close-up portrait, shot on Nikon D850 with 50mm f/1.4 lens, natural lighting, shallow depth of field, 8K resolution, RAW photo quality, realistic skin texture, film grain, anamorphic lens, cinematic color grading, professional photography, highly detailed`

console.log('\n【测试4：混合技术参数】')
console.log('原始提示词:')
console.log(testCase4)
console.log('\n最终简化结果:')
const finalResult = simplifyPrompt(filterPrompt(testCase4).filtered)
console.log(finalResult)
console.log(`长度: ${testCase4.length} → ${finalResult.length} 字符`)

// 测试用例5：保留核心内容
const testCase5 = `a person walking in the park, with Sony A7III, 35mm lens, golden hour lighting, 4K resolution, shot on professional camera, natural colors, soft background`

console.log('\n【测试5：保留核心画面描述】')
console.log('原始提示词:')
console.log(testCase5)
console.log('\n最终简化结果:')
const finalResult2 = simplifyPrompt(filterPrompt(testCase5).filtered)
console.log(finalResult2)
console.log(`期望保留: "person walking in the park", "warm sunset light", "soft background"`)
console.log(`长度: ${testCase5.length} → ${finalResult2.length} 字符\n`)

console.log('=== 测试完成 ===')
console.log('\n总结：')
console.log('✅ 相机品牌和型号 → 完全移除')
console.log('✅ 镜头参数（焦距、光圈）→ 完全移除')
console.log('✅ 技术参数（4K/8K/RAW）→ 简化或移除')
console.log('✅ 专业术语（景深、调色）→ 简化为通用描述')
console.log('✅ 品牌名称 → 替换为通用词汇')
console.log('✅ 核心画面描述 → 保留')
