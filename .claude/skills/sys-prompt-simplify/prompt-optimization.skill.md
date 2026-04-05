# Prompt Optimization Skill

## 功能
智能优化图片生成提示词，确保符合即梦/可灵平台规范，提高生成成功率。

## 核心能力

### 1. 风格预设简化
- **简化前**：`shot on Sony A7IV with 35mm f/1.4 lens, natural lighting, shallow depth of field, film grain, photorealistic, 8K resolution...`
- **简化后**：`photorealistic, natural lighting, high quality photo`
- 移除冗余技术参数（相机型号、镜头参数、分辨率）
- 保留核心风格要素（写实/电影/动漫等）

### 2. 提示词自动简化
```typescript
function simplifyPrompt(prompt: string): string
```
- 移除相机技术参数（ISO、焦距、光圈等）
- 移除过度具体的技术术语（subsurface scattering等）
- 移除多余形容词（professional、detailed等）
- 合并重复逗号和空格
- 长度控制在200字符以内

### 3. 平台规范引导
更新 Claude 系统提示词：
- 要求生成简洁提示词（50-80词）
- 避免冗余和重复
- 禁止品牌名称和暴力词汇
- 优先主体、动作、场景、光线

### 4. 集成到生成流程
```typescript
// storyboard-engine.ts
const filtered = filterPrompt(fullPrompt)  // 违禁词过滤
const finalPrompt = simplifyPrompt(filtered.filtered)  // 自动简化
```

## 使用场景

### 场景1：生成失败重试
- 平台返回错误时
- 自动调用 `simplifyPrompt` 简化提示词
- 重新提交生成

### 场景2：主动优化
- 分镜生成时自动简化
- 确保所有提示词符合规范
- 提高首次生成成功率

### 场景3：对话式修改
- 用户修改提示词后
- 自动检查和简化
- 保持平台合规性

## 技术实现

### 文件结构
```
src/lib/ai/
├── style-presets.ts          # 风格预设（已简化）
├── storyboard-engine.ts      # 集成简化流程
└── content-filter.ts         # 违禁词过滤
```

### 关键函数
```typescript
// 简化提示词
export function simplifyPrompt(prompt: string): string

// 检查提示词是否过长
export function isPromptTooLong(prompt: string): boolean

// 应用风格（已简化）
export function applyStyleToPrompt(framePrompt: string, style: StylePreset): string
```

## 效果对比

### 优化前
```
shot on Sony A7IV with 35mm f/1.4 lens, natural lighting, shallow depth of field, 
film grain, photorealistic, 8K resolution, RAW photo quality, realistic skin texture, 
natural color grading, professional high quality detailed iPhone smartphone with glossy 
surface, triple camera arranged in triangle, Apple logo on back, subsurface scattering, 
global illumination, Blender Cycles render
```
**问题**：过长（292字符）、冗余技术参数、品牌名称

### 优化后
```
photorealistic, natural lighting, smartphone with glossy surface, triple camera 
arranged in triangle, logo on back
```
**改进**：简洁（109字符）、无冗余、无品牌词、保留核心要素

## 迭代记录

### v1.0 (2026-04-05)
- ✅ 简化所有风格预设（真实/电影/动漫/3D/插画）
- ✅ 实现 `simplifyPrompt` 自动简化函数
- ✅ 集成到分镜生成流程
- ✅ 更新 Claude 系统提示词
- ✅ 添加长度检查 `isPromptTooLong`
- ✅ 更新违禁词规则（成人内容、药物等）

## 待优化方向

- [ ] 失败重试机制（自动简化重试）
- [ ] 提示词质量评分（预测生成成功率）
- [ ] A/B 测试不同简化策略
- [ ] 按平台（即梦/可灵）定制简化规则
- [ ] 提示词模板库（常见场景预设）

## 相关文档
- `.claude/FEATURES_SUMMARY.md` - 完整功能总览
- `src/lib/ai/content-filter.ts` - 违禁词过滤系统
- `src/lib/ai/storyboard-engine.ts` - 分镜生成引擎
