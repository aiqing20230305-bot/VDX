# 多模型路由系统 v1.5.0

**完成时间**：2026-04-06  
**版本**：1.5.0

---

## 功能概述

多模型路由系统根据分镜场景特征，自动分析并推荐最优的视频生成模型（Seedance vs Kling），实现智能化模型选择。

**核心价值**：
- 🤖 **自动化**：无需手动判断，系统智能推荐
- 🎯 **精准匹配**：根据风格、运动强度、复杂度等多维度分析
- ⚖️ **策略灵活**：支持质量优先/速度优先/成本优先/平衡模式
- 📊 **可追溯**：提供详细的推荐理由和置信度

---

## 模型能力矩阵

### Seedance 2.0

**擅长领域**：
- ✅ 写实风格
- ✅ 静态场景
- ✅ 产品展示
- ✅ 风景镜头
- ✅ 简单运镜
- ✅ 高清质量

**不擅长领域**：
- ❌ 快速动作
- ❌ 复杂角色运动
- ❌ 多人物交互
- ❌ 极端镜头运动

**最适合风格**：`realistic`, `documentary`, `commercial`, `cinematic`

**技术指标**：
- 质量分数：9/10
- 速度分数：7/10
- 一致性分数：8/10
- 相对成本：1.0x

---

### 可灵 AI

**擅长领域**：
- ✅ 动态场景
- ✅ 快速动作
- ✅ 角色运动
- ✅ 多人物交互
- ✅ 动画风格
- ✅ 特效镜头

**不擅长领域**：
- ❌ 极致写实
- ❌ 细节纹理
- ❌ 静态产品
- ❌ 长时长稳定性

**最适合风格**：`anime`, `cartoon`, `short-drama`, `music-video`

**技术指标**：
- 质量分数：8/10
- 速度分数：6/10
- 一致性分数：7/10
- 相对成本：1.2x

---

## 路由策略

### 1. 质量优先（Quality）

**适用场景**：对外展示的精品内容、品牌宣传片、高端广告

**策略**：
- 选择质量分数最高的模型
- 当前总是选择 Seedance（质量 9/10）

**示例**：
```json
{
  "prioritize": "quality",
  "allowMixedModels": false,
  "qualityThreshold": 9
}
```

---

### 2. 速度优先（Speed）

**适用场景**：快速验证、迭代测试、MVP 开发

**策略**：
- 选择速度分数最高的模型
- 当前总是选择 Seedance（速度 7/10）

**示例**：
```json
{
  "prioritize": "speed",
  "allowMixedModels": false,
  "qualityThreshold": 6
}
```

---

### 3. 成本优先（Cost）

**适用场景**：大批量生产、内部测试内容

**策略**：
- 选择成本最低的模型
- 当前总是选择 Seedance（成本 1.0x）

**示例**：
```json
{
  "prioritize": "cost",
  "allowMixedModels": false,
  "qualityThreshold": 7
}
```

---

### 4. 平衡模式（Balanced）⭐ 推荐

**适用场景**：大多数常规视频生成任务

**策略**：
- 根据场景特征智能推荐
- 自动平衡质量、速度、成本
- 考虑风格适配度

**特征分析维度**：
1. **风格类型**：写实 vs 动画
2. **运动强度**：静态 / 缓慢 / 中等 / 快速 / 动态
3. **场景复杂度**：简单 / 中等 / 复杂
4. **是否有人物**：人物动作推荐 Kling
5. **是否有快速动作**：快速动作推荐 Kling
6. **镜头运动复杂度**：复杂运镜推荐 Kling

**示例**：
```json
{
  "prioritize": "balanced",
  "allowMixedModels": true,
  "qualityThreshold": 7
}
```

---

## API 使用

### POST /api/model-routing

**请求体**：
```typescript
{
  storyboardId: string
  frames: StoryboardFrame[]
  strategy?: {
    prioritize: 'quality' | 'speed' | 'cost' | 'balanced'
    allowMixedModels?: boolean  // 是否允许混合使用模型
    qualityThreshold?: number   // 质量阈值（0-10）
    forceModel?: 'seedance' | 'kling'  // 强制使用某模型
  }
}
```

**响应**：
```typescript
{
  success: true
  data: {
    storyboardId: string
    strategy: ModelRoutingStrategy
    decisions: [
      {
        frameIndex: number
        selectedModel: 'seedance' | 'kling'
        reason: string
        alternativeModel: 'seedance' | 'kling'
        confidence: number  // 0-1
        estimatedQuality: number  // 0-10
        estimatedCost: number
      }
    ]
    summary: {
      seedanceCount: number
      klingCount: number
      estimatedTotalCost: number
      estimatedAverageQuality: number
    }
    createdAt: string
  }
}
```

**使用示例**：
```typescript
const response = await fetch('/api/model-routing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storyboardId: 'sb-123',
    frames: storyboard.frames,
    strategy: {
      prioritize: 'balanced',
      allowMixedModels: true,
      qualityThreshold: 7,
    },
  }),
})

const { data } = await response.json()
console.log(`推荐模型：${data.summary.seedanceCount} 帧 Seedance，${data.summary.klingCount} 帧 Kling`)
console.log(`预估质量：${data.summary.estimatedAverageQuality}/10`)
```

---

### GET /api/model-routing/capabilities

获取模型能力矩阵和可用策略。

**响应**：
```typescript
{
  success: true
  data: {
    models: {
      seedance: ModelCapabilities
      kling: ModelCapabilities
    }
    strategies: [
      { name: 'quality', label: '质量优先', description: '...' },
      { name: 'speed', label: '速度优先', description: '...' },
      { name: 'cost', label: '成本优先', description: '...' },
      { name: 'balanced', label: '平衡模式', description: '...' }
    ]
  }
}
```

---

## 自动集成

路由系统已无缝集成到视频生成流程中，**无需用户干预**。

### 生成完整视频

```typescript
handleAction('generate_video', { engine: undefined })
// ↓ 自动触发路由分析
// ↓ 展示推荐结果
// ↓ 使用推荐模型生成
```

### 生成选中帧

```typescript
handleAction('generate_video_with_frames', {
  frameIndices: [0, 1, 2],
  engine: undefined  // 不指定模型
})
// ↓ 自动分析选中的帧
// ↓ 推荐最优模型
```

### 手动指定模型

```typescript
handleAction('generate_video', { engine: 'kling' })
// ↓ 跳过路由，直接使用 Kling
```

---

## 决策示例

### 场景1：动画MV

**输入**：
```json
{
  "frames": [
    {
      "description": "动画角色快速奔跑",
      "cameraAngle": "追踪镜头",
      "duration": 3
    },
    {
      "description": "激烈打斗场面",
      "cameraAngle": "360度旋转",
      "duration": 4
    }
  ],
  "strategy": { "prioritize": "balanced" }
}
```

**输出**：
```json
{
  "decisions": [
    {
      "frameIndex": 0,
      "selectedModel": "kling",
      "reason": "基于场景特征推荐（动画、快速动作）",
      "confidence": 0.8,
      "estimatedQuality": 8
    },
    {
      "frameIndex": 1,
      "selectedModel": "kling",
      "reason": "基于场景特征推荐（动画、复杂镜头）",
      "confidence": 0.9,
      "estimatedQuality": 8
    }
  ],
  "summary": {
    "klingCount": 2,
    "seedanceCount": 0,
    "estimatedAverageQuality": 8.0
  }
}
```

---

### 场景2：产品宣传片

**输入**：
```json
{
  "frames": [
    {
      "description": "产品静态展示，高清特写",
      "cameraAngle": "正面特写",
      "duration": 5
    },
    {
      "description": "产品旋转展示，缓慢运镜",
      "cameraAngle": "环绕镜头",
      "duration": 4
    }
  ],
  "strategy": { "prioritize": "quality" }
}
```

**输出**：
```json
{
  "decisions": [
    {
      "frameIndex": 0,
      "selectedModel": "seedance",
      "reason": "质量优先策略",
      "confidence": 1.0,
      "estimatedQuality": 9
    },
    {
      "frameIndex": 1,
      "selectedModel": "seedance",
      "reason": "质量优先策略",
      "confidence": 1.0,
      "estimatedQuality": 9
    }
  ],
  "summary": {
    "seedanceCount": 2,
    "klingCount": 0,
    "estimatedAverageQuality": 9.0
  }
}
```

---

## 特征检测逻辑

### 人物检测

**关键词**：`人物`, `角色`, `人`, `男`, `女`, `孩子`, `老人`, `青年`, `面部`, `表情`, `动作`, `character`, `person`, `people`, `face`

**权重**：有人物 → +1 分（倾向 Kling）

---

### 快速动作检测

**关键词**：`快速`, `奔跑`, `跳跃`, `飞行`, `追逐`, `战斗`, `动作`, `冲击`, `爆炸`, `加速`, `fast`, `run`, `jump`, `action`

**权重**：有快速动作 → +2 分（倾向 Kling）

---

### 复杂镜头检测

**关键词**：`旋转镜头`, `环绕`, `快速推进`, `拉伸`, `甩镜头`, `360度`, `螺旋`, `俯冲`, `rotate`, `orbit`, `zoom`, `spin`

**权重**：复杂镜头 → +1 分（倾向 Kling）

---

### 运动强度分析

**静态**：`静止`, `静态`, `固定`, `static`, `still` → -2 分（倾向 Seedance）  
**缓慢**：`缓慢`, `平稳`, `慢镜头`, `slow`, `smooth` → -1 分  
**快速**：`快速`, `急速`, `迅速`, `fast`, `rapid` → +1 分  
**动态**：`动态`, `激烈`, `剧烈`, `dynamic`, `intense` → +2 分（倾向 Kling）

---

### 风格关键词

**写实风格**：`写实`, `真实`, `realistic`, `real` → -2 分（倾向 Seedance）  
**动画风格**：`动画`, `卡通`, `anime`, `cartoon` → +2 分（倾向 Kling）  
**商业产品**：`产品`, `商业`, `commercial`, `product` → -2 分（倾向 Seedance）

---

## 未来优化方向

1. **机器学习模型**：基于历史生成数据训练更精准的路由模型
2. **实时反馈**：根据用户对生成结果的评分，动态调整路由策略
3. **成本预估**：更精确的成本计算和预算控制
4. **混合生成**：支持单个视频内不同帧使用不同模型（需后期合成优化）
5. **A/B 测试**：同时生成两个版本供用户对比选择

---

## 技术架构

```
src/types/index.ts
├─ ModelType
├─ ModelCapabilities
├─ StyleAnalysisResult
├─ ModelRoutingDecision
├─ ModelRoutingStrategy
└─ ModelRoutingResult

src/lib/ai/model-router.ts
├─ MODEL_CAPABILITIES (能力矩阵)
├─ analyzeFrameStyle() (特征分析)
├─ analyzeStoryboard() (批量分析)
├─ routeModels() (路由决策)
└─ generateRoutingResult() (完整流程)

src/app/api/model-routing/route.ts
├─ POST /api/model-routing (路由分析)
└─ GET /api/model-routing/capabilities (获取能力)

src/app/page.tsx
├─ generate_video (自动路由)
└─ generate_video_with_frames (自动路由)
```

---

## 测试用例

### 测试1：平衡模式 - 混合场景

```bash
curl -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "storyboardId": "test-1",
    "frames": [
      {
        "index": 0,
        "description": "动画角色快速奔跑",
        "imagePrompt": "anime character running fast",
        "duration": 3,
        "cameraAngle": "追踪镜头"
      },
      {
        "index": 1,
        "description": "写实风格产品展示",
        "imagePrompt": "realistic product showcase",
        "duration": 5,
        "cameraAngle": "正面特写"
      }
    ],
    "strategy": {
      "prioritize": "balanced",
      "allowMixedModels": true
    }
  }'
```

**预期结果**：
- 第0帧推荐 Kling（动画、快速动作）
- 第1帧推荐 Seedance（写实、静态产品）

---

### 测试2：质量优先

```bash
curl -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "storyboardId": "test-2",
    "frames": [...],
    "strategy": { "prioritize": "quality" }
  }'
```

**预期结果**：
- 所有帧推荐 Seedance（质量最高）

---

### 测试3：强制模型

```bash
curl -X POST http://localhost:3000/api/model-routing \
  -H "Content-Type: application/json" \
  -d '{
    "storyboardId": "test-3",
    "frames": [...],
    "strategy": { "forceModel": "kling" }
  }'
```

**预期结果**：
- 所有帧强制使用 Kling

---

## 更新日志

**v1.5.0** - 2026-04-06
- ✅ 完成多模型路由系统
- ✅ 实现风格分析引擎
- ✅ 实现路由决策引擎
- ✅ 集成到视频生成流程
- ✅ API 测试通过
- ✅ 文档完成

---

**文档维护**：张经纬  
**最后更新**：2026-04-06 23:15
