# Workflow Engine Critical Fix (v1.8.1)

**日期**: 2026-04-10  
**影响版本**: v1.8.0 → v1.8.1  
**严重程度**: Critical（核心功能不可用）

## 问题描述

Building Blocks 工作流系统的节点间数据传递完全失效，导致所有模板（SimpleText2ImageTemplate、ProductPromoTemplate 等）无法执行。

### 症状
```bash
POST /api/workflow/execute
{
  "templateId": "template.simple-text2image",
  "inputs": { "text": "一只可爱的猫咪" }
}

# 返回错误
ProcessFilterBlock: Missing required input 'prompt'. 
Received inputs: ["prompt"]  # key 存在但值为 undefined
```

### 数据流预期
```
n1 (input.text) → outputs: { text: "猫咪" }
                     ↓
n2 (process.filter) → inputs: { prompt: "猫咪" } ✅
                     → outputs: { filteredPrompt: "猫咪" }
                     ↓
n3 (generate.image) → inputs: { prompt: "猫咪" } ✅
```

### 实际数据流（Bug）
```
n1/n2/n3 同时启动（并行执行） ⚠️
n2 collectInputs 时，n1 还未完成 ⚠️
context.get('n1.text') → undefined ❌
```

---

## 根因分析

### Bug #1: 批次调度时序错误

**文件**: `src/lib/workflow/engine.ts`  
**函数**: `identifyParallelBatches()`  
**问题**: 在**构建批次的过程中**立即标记节点为已完成

```typescript
// ⚠️ 错误代码（v1.8.0）
private identifyParallelBatches(...): WorkflowNode[][] {
  const completed = new Set<string>()
  
  while (completed.size < sortedNodes.length) {
    const batch: WorkflowNode[] = []
    
    for (const node of sortedNodes) {
      const deps = graph.get(node.id) || new Set()
      const allDepsCompleted = Array.from(deps).every(depId => completed.has(depId))
      
      if (allDepsCompleted) {
        batch.push(node)
        completed.add(node.id)  // ⚠️ 立即标记为完成！
      }
    }
    
    batches.push(batch)
  }
}
```

**导致的问题**：

假设工作流 n1 → n2 → n3（串行依赖）

1. 循环开始，`completed = {}`
2. 检查 n1：无依赖 → 加入 batch，`completed = {n1}`
3. **继续同一循环**，检查 n2：依赖 n1，`completed.has('n1') = true` → 加入 batch，`completed = {n1, n2}`
4. **继续同一循环**，检查 n3：依赖 n2，`completed.has('n2') = true` → 加入 batch，`completed = {n1, n2, n3}`
5. 结果：`batches = [[n1, n2, n3]]` ❌（应该是 `[[n1], [n2], [n3]]`）

**执行结果**：
```javascript
// v1.8.0（错误）
await Promise.all([executeNode(n1), executeNode(n2), executeNode(n3)])

// n2 开始执行时：
collectInputs(n2) → context.get('n1.text') → undefined  // n1 还在执行中！
```

---

### Bug #2: InputTextBlock 输入源固定

**文件**: `src/lib/blocks/input-blocks.ts`  
**问题**: 起始节点从固定 context key 读取，而不是从 inputs 参数

```typescript
// ⚠️ 错误代码（v1.8.0）
execute: async (inputs, context) => {
  const text = context.get('user_input') || inputs.defaultValue || ''
  // ⚠️ 无法获取工作流传入的 inputs.text
}
```

**影响**: 即使修复 Bug #1，起始节点仍无法获取初始输入。

---

### Bug #3: 起始节点输入缺失

**文件**: `src/lib/workflow/engine.ts`  
**函数**: `collectInputs()`  
**问题**: 起始节点（无 incoming edges）的输入未从 context 中注入

```typescript
// ⚠️ 错误代码（v1.8.0）
private collectInputs(node, workflow, context) {
  const inputs = {}
  const incomingEdges = workflow.edges.filter(e => e.target === node.id)
  
  // 如果 incomingEdges.length === 0（起始节点），inputs 为空 ❌
  
  incomingEdges.forEach(edge => {
    inputs[edge.targetInput] = context.get(`${edge.source}.${edge.sourceOutput}`)
  })
  
  return inputs  // 起始节点返回 {}
}
```

---

## 修复方案

### Fix #1: 批次标记延迟

**变更**: 将 `completed.add()` 移到批次构建完成**之后**

```typescript
// ✅ 修复后（v1.8.1）
private identifyParallelBatches(...): WorkflowNode[][] {
  while (completed.size < sortedNodes.length) {
    const batch: WorkflowNode[] = []
    
    for (const node of sortedNodes) {
      const deps = graph.get(node.id) || new Set()
      const allDepsCompleted = Array.from(deps).every(depId => completed.has(depId))
      
      if (allDepsCompleted) {
        batch.push(node)
        // ⚠️ 不要在这里标记！
      }
    }
    
    // ✅ 批次构建完成后，统一标记
    batch.forEach(node => completed.add(node.id))
    batches.push(batch)
  }
}
```

**效果**：
```javascript
// Iteration 1: completed = {}
batch1 = [n1]  // n1 无依赖
completed = {n1}  // 批次结束后标记

// Iteration 2: completed = {n1}
batch2 = [n2]  // n2 依赖 n1，n1 已标记完成
completed = {n1, n2}

// Iteration 3: completed = {n1, n2}
batch3 = [n3]  // n3 依赖 n2，n2 已标记完成
completed = {n1, n2, n3}

// 结果：batches = [[n1], [n2], [n3]] ✅
```

---

### Fix #2: InputTextBlock 多源读取

```typescript
// ✅ 修复后（v1.8.1）
execute: async (inputs, context) => {
  const text = inputs.text ||           // 1️⃣ 优先从 inputs 参数
               inputs.value ||           // 2️⃣ 备用 key
               context.get('user_input') || // 3️⃣ 兼容旧逻辑
               context.get('text') ||    // 4️⃣ 直接 key
               inputs.defaultValue ||    // 5️⃣ 默认值
               ''                        // 6️⃣ 兜底空字符串
  
  return { text: String(text) }
}
```

---

### Fix #3: 起始节点输入注入

```typescript
// ✅ 修复后（v1.8.1）
private collectInputs(node, workflow, context) {
  const inputs = {}
  const incomingEdges = workflow.edges.filter(e => e.target === node.id)
  
  // ✅ 起始节点特殊处理
  if (incomingEdges.length === 0) {
    const block = BlockRegistry.get(node.blockId)
    if (block) {
      block.inputs.forEach(inputDef => {
        // 尝试从 context 获取初始输入
        const value = context.get(`input.${inputDef.name}`) ?? 
                      context.get(inputDef.name)
        if (value !== undefined) {
          inputs[inputDef.name] = value
        }
      })
    }
  }
  
  // 从上游节点收集输入
  incomingEdges.forEach(edge => {
    inputs[edge.targetInput] = context.get(`${edge.source}.${edge.sourceOutput}`)
  })
  
  return inputs
}
```

---

## 验证结果

### 测试用例
```bash
curl -X POST http://localhost:3000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "template.simple-text2image",
    "inputs": { "text": "一只可爱的猫咪在阳光下睡觉" }
  }'
```

### 预期输出（v1.8.1）
```
[WorkflowEngine] DAG constructed:
  n1 depends on: [none]
  n2 depends on: [n1]
  n3 depends on: [n2]

[WorkflowEngine] Execution plan: 3 batches ✅
  Batch 1: [n1]
  Batch 2: [n2]
  Batch 3: [n3]

[WorkflowEngine] Executing batch 1/1 (1 nodes)
[InputTextBlock] received text = "一只可爱的猫咪在阳光下睡觉" ✅
[WorkflowEngine] Saved "n1.text" = "一只可爱的猫咪在阳光下睡觉..." ✅

[WorkflowEngine] Executing batch 2/1 (1 nodes)
[ProcessFilterBlock] prompt = "一只可爱的猫咪在阳光下睡觉" ✅
[WorkflowEngine] Saved "n2.filteredPrompt" = "一只可爱的猫咪在阳光下睡觉..." ✅

[WorkflowEngine] Executing batch 3/1 (1 nodes)
[GenerateImageBlock] prompt = "一只可爱的猫咪在阳光下睡觉" ✅
```

---

## 影响范围

### 受影响的功能
- ✅ Building Blocks 工作流系统
- ✅ 所有工作流模板（SimpleText2Image, ProductPromo, ImageAnalysis）
- ✅ 可视化工作流编排器（/test-blocks）
- ✅ 依赖链数据传递

### 不受影响的功能
- ✅ Agent 对话生成（Chat）
- ✅ 分镜图生成（Storyboard）
- ✅ 视频生成（Video Pipeline）
- ✅ Timeline/Grid 编辑器

---

## 回归测试清单

- [x] SimpleText2ImageTemplate 执行成功
- [x] 3节点串行依赖正确解析
- [x] 数据在节点间正确传递
- [x] 起始节点接收初始输入
- [x] 过滤器接收并处理 prompt
- [ ] ProductPromoTemplate 执行（需要产品图）
- [ ] 可视化编辑器自定义工作流

---

## 相关文件

| 文件 | 变更类型 | 关键改动 |
|------|---------|---------|
| `src/lib/workflow/engine.ts` | 修复 | L187-218: 批次标记延迟<br/>L307-345: 起始节点输入注入<br/>L133-150: DAG 调试日志 |
| `src/lib/blocks/input-blocks.ts` | 修复 | L48-66: 多源输入读取 |
| `docs/WORKFLOW_FIX_v1.8.1.md` | 新增 | 本文档 |

---

## 经验教训

1. **并行调度的复杂性**: 批次构建时的标记时机会影响后续批次的判断
2. **起始节点是特殊情况**: 需要从 context 注入初始输入，不能仅依赖 edges
3. **日志的重要性**: DAG 构建、批次计划、数据传递的详细日志帮助快速定位
4. **测试覆盖**: 需要端到端测试验证完整数据流，单元测试无法覆盖调度逻辑

---

## 后续优化

1. **单元测试**: 为 `identifyParallelBatches` 添加测试用例
2. **集成测试**: 自动化测试所有工作流模板
3. **性能监控**: 记录每个批次的执行时长
4. **错误恢复**: 部分节点失败时的回滚策略
