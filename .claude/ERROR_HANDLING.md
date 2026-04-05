# 超级视频Agent - 错误处理与优化

## JSON 生成失败问题（已解决）

### 问题描述
用户在生成脚本时遇到 JSON 解析错误：
```
Expected ',' or ']' after array element in JSON at position 13580 (line 423 column 10)
```

### 根本原因
1. **提示词过长**：系统提示词和用户提示词包含大量说明文字，导致 Claude 生成的 JSON 超长
2. **maxTokens 过高**：设置为 8000，可能导致输出被截断，JSON 不完整
3. **缺少重试机制**：一次失败就直接抛出错误，没有降级策略
4. **数据验证不足**：没有检查生成的数据完整性

### 解决方案

#### 1. 简化提示词 ✅

**优化前（系统提示）**：
```typescript
const SYSTEM_PROMPT = `你是一个顶尖的视频内容策划师和编剧，拥有以下能力：
- 深度理解各种视频风格：电影级、动漫、纪录片、广告、短剧、音乐MV等
- 能够基于简单选题发散出多个独特的创意方向
- 每个脚本都有独特的叙事结构、镜头语言和情感节奏
- 善于将视觉美学与叙事深度结合

创作原则：
1. 每个脚本创意必须有明显的差异化，不能互相雷同
2. 优先考虑视觉冲击力和情绪共鸣
3. 镜头描述要精准、具体，可直接用于分镜创作
4. 充分考虑时长限制，合理分配场景节奏`
```

**优化后**：
```typescript
const SYSTEM_PROMPT = `你是视频脚本策划师，生成创意脚本。

要求：
1. 每个脚本必须差异化，不雷同
2. 镜头描述精准简洁（50-80字）
3. 合理分配场景节奏
4. 返回纯 JSON，无任何额外文字`
```

**效果**：减少 70% 的提示词长度

#### 2. 降低 maxTokens ✅

```typescript
// 优化前
maxTokens: 8000

// 优化后
maxTokens: 5000  // 首次尝试
maxTokens: 4000  // 重试时
```

#### 3. 添加自动重试机制 ✅

```typescript
try {
  result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, prompt, {
    maxTokens: 5000,
    source: 'script-engine',
  })
} catch (err) {
  console.warn('[script-engine] 首次生成失败，用简化提示词重试:', err)

  // 简化版提示词（只保留核心信息）
  const simplePrompt = `生成 ${count} 个${duration}秒脚本...`

  result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, simplePrompt, {
    maxTokens: 4000,
    source: 'script-engine-retry',
  })
}
```

#### 4. 添加 JSON 数据验证 ✅

```typescript
// 验证和清理脚本数据
const scripts = result.scripts || []
if (scripts.length === 0) {
  throw new Error('生成的脚本数量为0，请重试')
}

return scripts.map((raw): Script => {
  // 验证场景数据
  const scenes = (raw.scenes || []).filter(s => s && s.visual)
  if (scenes.length === 0) {
    throw new Error(`脚本"${raw.title}"没有有效场景`)
  }

  // 确保场景总时长接近目标时长（允许±3秒误差）
  const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 3), 0)
  if (Math.abs(totalDuration - duration) > 3) {
    console.warn(`时长不匹配: ${totalDuration}秒 vs ${duration}秒`)
  }

  return { /* 清理后的数据 */ }
})
```

#### 5. 添加截断修复机制 ✅

```typescript
/**
 * 修复截断的 JSON（补全缺失的闭合符号）
 */
function fixTruncatedJSON(json: string): string {
  let fixed = json
  let braceStack = 0  // { }
  let bracketStack = 0  // [ ]
  
  // 统计未闭合的括号/花括号
  for (let i = 0; i < json.length; i++) {
    // ... 状态机逻辑
  }

  // 移除最后一个不完整的属性/元素
  const lastComma = fixed.lastIndexOf(',')
  if (lastComma > 0 && braceStack > 0) {
    fixed = fixed.substring(0, lastComma)
  }

  // 补全缺失的闭合符号
  while (bracketStack > 0) { fixed += ']'; bracketStack-- }
  while (braceStack > 0) { fixed += '}'; braceStack-- }

  return fixed
}
```

#### 6. 改进错误日志 ✅

```typescript
try {
  return parseJSONRobust<T>(text)
} catch (err) {
  console.error(`[generateJSON] 解析失败 (source: ${options.source})`)
  console.error('错误信息:', err instanceof Error ? err.message : String(err))
  console.error('响应文本长度:', text.length)
  console.error('响应文本开头:', text.substring(0, 200))
  console.error('响应文本结尾:', text.substring(Math.max(0, text.length - 200)))
  throw err
}
```

### 修改文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/lib/ai/script-engine.ts` | 简化提示词、降低 maxTokens、添加重试和验证 |
| `src/lib/ai/claude.ts` | 添加截断修复、改进错误日志 |
| `.claude/skills/script-generation/SKILL.md` | 更新迭代记录 |

### 效果评估

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 系统提示词长度 | ~300字符 | ~90字符 | -70% |
| 用户提示词长度 | ~800字符 | ~400字符 | -50% |
| maxTokens | 8000 | 5000 | -37.5% |
| 成功率（预估） | 70% | 95%+ | +25% |
| 重试机制 | ❌ | ✅ 自动重试 | - |
| 截断修复 | ❌ | ✅ 自动修复 | - |
| 数据验证 | ❌ | ✅ 完整验证 | - |

## 通用错误处理原则

### 1. 提示词设计
- ✅ 保持简洁：只包含核心指令
- ✅ 避免冗余：不要重复说明
- ✅ 明确输出：强调返回纯 JSON
- ✅ 控制长度：系统提示 < 200字符，用户提示 < 500字符

### 2. Token 管理
- ✅ 合理设置 maxTokens（根据输出规模）
- ✅ 脚本生成：5000 tokens
- ✅ 分镜生成：6000 tokens
- ✅ 简短查询：2000 tokens

### 3. 重试策略
- ✅ 失败后自动重试（更简短的提示词）
- ✅ 最多重试 1 次（避免浪费）
- ✅ 记录重试原因和结果

### 4. 数据验证
- ✅ 验证必需字段存在
- ✅ 过滤无效数据
- ✅ 提供默认值
- ✅ 警告（不阻断）vs 错误（阻断）

### 5. 错误日志
- ✅ 记录错误来源（source）
- ✅ 显示响应长度和首尾片段
- ✅ 标注错误位置
- ✅ 便于调试和监控

## 其他平台错误处理

### 即梦图片生成失败
- 问题：提示词违禁、过长、格式错误
- 方案：违禁词过滤 + 提示词简化（已实现）

### 可灵视频生成失败
- 问题：提示词不符合规范、时长超限
- 方案：提示词优化 + 参数验证

### FFmpeg 处理失败
- 问题：文件路径错误、格式不支持
- 方案：路径验证 + 格式转换

## 监控与改进

### 建议监控指标
- [ ] 各 API 成功率（script/storyboard/video）
- [ ] JSON 解析失败率
- [ ] 重试次数和成功率
- [ ] 平均响应时长
- [ ] Token 用量统计

### 待优化方向
- [ ] 动态调整 maxTokens（根据请求规模）
- [ ] 更智能的截断检测（基于语义）
- [ ] JSON Schema 验证（pydantic/zod）
- [ ] 错误分类和针对性处理
- [ ] 用户友好的错误提示
