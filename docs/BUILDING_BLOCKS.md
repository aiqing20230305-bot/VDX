# Building Blocks 系统

## 概述

Building Blocks 是一个可组合、可复用的视频生产构建系统，将原有的线性 Skills 重构为原子化的 Blocks，支持灵活组合和并行执行。

## 核心概念

### 1. Block（构建块）

Block 是最小的功能单元，具有：
- **明确的输入输出**：类型安全的接口定义
- **独立执行能力**：可单独测试和调用
- **可组合性**：通过连接形成工作流
- **成本透明**：预估执行时间和成本

**Block 分类**：

| 分类 | 说明 | 示例 |
|------|------|------|
| `input` | 接收用户输入 | 文字输入、图片上传、产品信息 |
| `generate` | 生成内容 | 脚本生成、图片生成、视频生成 |
| `process` | 处理转换 | 图片分析、图生图、内容过滤 |
| `compose` | 合成编辑 | 视频合并、字幕添加、转场效果 |
| `output` | 输出结果 | 视频输出、文件导出 |

### 2. Workflow（工作流）

Workflow 是多个 Blocks 的有序组合，定义了数据流向和执行顺序：

```typescript
interface Workflow {
  nodes: WorkflowNode[]  // 节点（Block 实例）
  edges: WorkflowEdge[]  // 边（数据连接）
}
```

**特性**：
- **DAG 结构**：有向无环图，保证无死循环
- **拓扑排序**：自动确定执行顺序
- **并行执行**：同层节点自动并行，提高效率
- **数据转换**：边上可添加转换函数

### 3. WorkflowEngine（执行引擎）

负责解析工作流、调度执行、管理状态：

```typescript
const engine = createWorkflowEngine()
const execution = await engine.execute(workflow, inputs, {
  onProgress: (event) => console.log(event)
})
```

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户界面 / API                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Workflow Engine                         │
│  • DAG 构建  • 拓扑排序  • 并行调度  • 进度跟踪        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Block Registry                          │
│            管理所有可用的 Building Blocks                 │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌────────┐       ┌────────┐       ┌────────┐
   │ Input  │       │Generate│       │ Output │
   │ Blocks │       │ Blocks │       │ Blocks │
   └────────┘       └────────┘       └────────┘
        │                 │                 │
        └─────────────────┴─────────────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  底层能力（不变）    │
               │  • Claude API        │
               │  • 即梦 API          │
               │  • FFmpeg            │
               │  • Remotion          │
               └──────────────────────┘
```

## 快速开始

### 1. 使用预设模板

```typescript
// 从模板创建工作流
const workflow = createWorkflowFromTemplate('template.product-promo')

// 准备输入
const inputs = {
  user_input: '智能手表产品介绍',
  uploaded_images: [{ url: '/uploads/watch.jpg' }]
}

// 执行
const engine = createWorkflowEngine()
const execution = await engine.execute(workflow, inputs)

console.log(execution.outputs) // 最终视频
```

### 2. 创建自定义工作流

```typescript
const customWorkflow: Workflow = {
  id: uuid(),
  name: '我的工作流',
  nodes: [
    { id: 'n1', blockId: 'input.text', position: { x: 0, y: 0 } },
    { id: 'n2', blockId: 'generate.image', position: { x: 200, y: 0 } },
  ],
  edges: [
    { source: 'n1', sourceOutput: 'text', target: 'n2', targetInput: 'prompt' }
  ],
  ...
}
```

### 3. 创建自定义 Block

```typescript
const MyCustomBlock: Block = {
  id: 'custom.my-block',
  type: 'process.transform',
  category: 'process',
  name: '我的自定义 Block',
  description: '做一些特殊处理',
  
  inputs: [
    { name: 'input', type: 'string', required: true }
  ],
  
  outputs: [
    { name: 'output', type: 'string' }
  ],
  
  execute: async (inputs, context) => {
    const result = doSomething(inputs.input)
    return { output: result }
  },
  
  estimatedDuration: 5,
  cost: 0.1,
}

// 注册
registerBlock(MyCustomBlock)
```

## API 接口

### 1. 列出所有 Blocks

```bash
GET /api/blocks/list?category=generate&search=image
```

### 2. 列出模板

```bash
GET /api/workflow/templates
```

### 3. 执行工作流

```bash
POST /api/workflow/execute
{
  "templateId": "template.product-promo",
  "inputs": {
    "user_input": "产品描述",
    "uploaded_images": [...]
  }
}
```

### 4. 流式执行（实时进度）

```bash
POST /api/workflow/execute
{
  "templateId": "template.product-promo",
  "inputs": {...},
  "stream": true
}

# 返回 SSE 流
data: {"blockId":"generate.script","status":"running","progress":20}
data: {"blockId":"generate.script","status":"completed","progress":100}
...
```

## 内置 Blocks 列表

### 输入类（3 个）

| ID | 名称 | 说明 |
|----|------|------|
| `input.text` | 文字输入 | 接收用户文字描述 |
| `input.image` | 图片上传 | 接收图片文件 |
| `input.product` | 产品信息 | 接收产品描述和图片，分析特征 |

### 生成类（4 个）

| ID | 名称 | 说明 | 成本 |
|----|------|------|------|
| `generate.script` | 脚本生成 | 根据主题生成视频脚本 | 0.2 |
| `generate.prompts` | 分镜提示词生成 | 将脚本转为分镜和提示词 | 0.3 |
| `generate.image` | 文生图 | 使用即梦生成图片 | 1.0 |
| `generate.video` | 视频生成 | 使用 Seedance/Kling 生成视频 | 10.0 |

### 处理类（3 个）

| ID | 名称 | 说明 | 成本 |
|----|------|------|------|
| `process.analyze` | 内容分析 | Claude Vision 分析图片内容 | 0.05 |
| `process.transform` | 图生图 | 基于参考图生成新图片 | 1.5 |
| `process.filter` | 内容过滤 | 过滤违禁词 | 0 |

### 合成类（3 个）

| ID | 名称 | 说明 |
|----|------|------|
| `compose.merge` | 视频合并 | FFmpeg 合并多个视频片段 |
| `compose.subtitle` | 字幕合成 | FFmpeg/Remotion 添加字幕 |
| `compose.transition` | 转场效果 | 添加 fade/slide/zoom 等转场 |

### 输出类（2 个）

| ID | 名称 | 说明 |
|----|------|------|
| `output.video` | 视频输出 | 保存最终视频并返回 URL |
| `output.export` | 导出文件 | 导出 JSON/TXT/MD/SRT 文件 |

## 内置模板

### 1. 产品宣传片生成 (`template.product-promo`)

**流程**：产品描述 + 图片 → 分析 → 脚本 → 分镜 → 图生图 → 视频生成 → 合并 → 输出

**输入**：
```json
{
  "user_input": "智能手表产品介绍",
  "uploaded_images": [{"url": "/uploads/watch.jpg"}]
}
```

**输出**：30秒宣传视频

**预估**：
- 时长：~3-5 分钟
- 成本：~15 积分

### 2. 简单文生图 (`template.simple-text2image`)

**流程**：文字描述 → 内容过滤 → 生成图片

**输入**：
```json
{
  "user_input": "一只橙色的猫坐在窗台上"
}
```

**输出**：图片 URL

**预估**：
- 时长：~30 秒
- 成本：~1 积分

### 3. 图片分析 (`template.image-analysis`)

**流程**：上传图片 → Claude 分析 → 导出报告

**输入**：
```json
{
  "uploaded_images": [{"url": "/uploads/photo.jpg"}]
}
```

**输出**：分析报告文本

**预估**：
- 时长：~5 秒
- 成本：~0.05 积分

## 测试页面

访问 `http://localhost:3000/test-blocks` 可视化测试所有功能：

- 📋 查看所有可用 Blocks
- 📦 选择模板并执行
- 📊 实时查看执行进度
- 📈 成本和时间统计

## 与 Skills 的对比

| 维度 | 原 Skills 系统 | Building Blocks 系统 |
|------|---------------|---------------------|
| **可组合性** | ❌ 固定流程 | ✅ 自由组合 |
| **并行执行** | ❌ 串行执行 | ✅ 智能并行 |
| **成本可见** | ❌ 不透明 | ✅ 精确预估 |
| **资产复用** | ❌ 重复生成 | ✅ 资产库支持 |
| **新功能开发** | 🐌 修改核心流程 | ⚡ 新增 Block 即可 |
| **错误恢复** | ❌ 手动重试 | ✅ 自动降级 |
| **可视化编排** | ❌ 代码配置 | ✅ 拖拽搭建（TODO） |

## 下一步计划

### Phase 2: 可视化编排器（3 周）
- [ ] React Flow 拖拽编辑器
- [ ] 实时工作流预览
- [ ] 模板市场

### Phase 3: Agent 智能编排（3 周）
- [ ] Agent 系统和任务队列
- [ ] 并行执行和错误恢复
- [ ] 性能监控和负载均衡

### Phase 4: 模板市场（2 周）
- [ ] 模板保存和分享
- [ ] 资产库和去重
- [ ] 用户评分和推荐

## 贡献指南

### 添加新 Block

1. 在对应分类文件中添加 Block 定义（如 `generate-blocks.ts`）
2. 在 `index.ts` 中导出
3. 测试执行
4. 更新文档

### 创建模板

1. 在 `templates.ts` 中定义工作流结构
2. 测试执行和输出
3. 添加示例输入
4. 更新文档

## 常见问题

### Q: Block 和原来的 Skill 有什么区别？

A: Skill 是完整的流程（如"脚本生成 → 分镜生成 → 视频生成"），Block 是原子操作（只做一件事，如"脚本生成"）。Blocks 可以自由组合成 Workflow，更灵活。

### Q: 如何处理长时间执行的任务？

A: 使用流式 API (`stream: true`) 实时获取进度，或使用后台任务系统（Phase 3）。

### Q: 如何保证 Block 之间的数据类型安全？

A: WorkflowEngine 在执行前会验证所有 Edge 的类型匹配，不匹配会提前报错。

### Q: 资产复用如何实现？

A: 每个 Block 执行完成后，结果会保存到 AssetLibrary，相同输入会直接返回缓存（Phase 4 实现）。

## 许可证

MIT
