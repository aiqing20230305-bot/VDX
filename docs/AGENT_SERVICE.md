# 智能 Agent 服务 - 对话式自动化视频生成

## 概述

超级视频Agent是一个基于Claude Tool Use的智能对话系统，用户只需说出需求（如"我想做一个15秒的猫咪视频"），Agent就能自动规划并执行完整的视频生成流程。

## 架构设计

```
用户输入
   ↓
/api/agent/message (Claude API + Tool Use)
   ↓
Agent 决策：调用工具 or 回复文本
   ↓
前端执行工具（自动循环）
   ↓
/api/agent/tool-results
   ↓
Agent 继续决策...
   ↓
最终输出视频
```

## 核心文件

### 1. 工具定义 (`src/lib/ai/agent-tools.ts`)

定义了6个工具：

- **generate_script** - 生成脚本（3个变体）
- **select_script** - 选择脚本
- **generate_storyboard** - 生成分镜图
- **generate_video** - 生成视频
- **ask_user_preference** - 询问用户选择
- **analyze_upload** - 分析上传内容

### 2. Agent编排器 (`src/lib/ai/agent-orchestrator.ts`)

**AgentOrchestrator类**：
- `processMessage(userMessage)` - 处理用户消息，返回Agent响应
- `submitToolResults(results)` - 提交工具执行结果，继续对话
- `getState()` - 获取当前状态（脚本/分镜/视频任务）

**系统提示词**：
- 定义了Agent的工作方式和流程规则
- 强调主动推进流程、简洁沟通、错误恢复

### 3. API路由

**POST /api/agent/message**
- 接收用户消息
- 调用Claude API with Tool Use
- 返回文本响应或工具调用请求

**POST /api/agent/tool-results**
- 接收工具执行结果
- 提交给Claude API
- 返回下一步响应（可能是新的工具调用或最终回复）

### 4. 前端执行器 (`src/hooks/useAgentExecutor.ts`)

**useAgentExecutor Hook**：
- `sendMessage(message)` - 发送消息并自动处理工具调用循环
- `executeTool(id, name, input)` - 执行单个工具（调用现有API）
- `reset()` - 重置会话

**自动化流程**：
```typescript
while (response.type === 'tool_call') {
  // 执行所有工具
  const results = await Promise.all(
    response.toolCalls.map(call => executeTool(call.id, call.name, call.input))
  )
  
  // 提交结果
  response = await submitToolResults(results)
}
// 得到最终文本响应
```

## 工作流程示例

### 标准流程：用户说"我想做15秒猫咪视频"

1. **用户输入** → `/api/agent/message`
   
2. **Agent理解意图**：
   - 主题：猫咪
   - 时长：15秒
   - 缺少参数：风格（可选）

3. **Agent决策**：直接生成脚本
   - 返回 `tool_call: generate_script(topic="猫咪", duration=15)`

4. **前端自动执行**：
   - 调用 `POST /api/script`
   - 得到3个脚本方案

5. **提交结果** → `/api/agent/tool-results`

6. **Agent收到脚本后**：
   - 返回 `tool_call: ask_user_preference(question="选择脚本", options=[A,B,C])`

7. **暂停等待用户**：
   - 前端显示选项按钮
   - 用户点击"选B"

8. **用户回复** → `/api/agent/message`

9. **Agent执行**：
   - `tool_call: select_script(scriptIndex=1)`
   - `tool_call: generate_storyboard()`

10. **前端自动执行**：
    - 选择脚本
    - 生成分镜图

11. **Agent继续**：
    - `tool_call: generate_video(engine="auto")`

12. **启动视频生成**：
    - 返回任务ID
    - 前端轮询进度

13. **完成**：
    - Agent回复："视频生成完成！"

## 对比：智能模式 vs 手动模式

| 维度 | 智能Agent模式 | 手动模式（现有） |
|------|-------------|---------------|
| 用户输入 | 一句话需求 | 多步操作 |
| 流程控制 | AI自动规划 | 用户点击按钮 |
| 参数确认 | 自动询问缺失参数 | 表单填写 |
| 错误恢复 | Agent自动重试 | 用户手动处理 |
| 灵活性 | 高（可随时改需求） | 中（按流程走） |
| 学习成本 | 低（对话即可） | 中（需了解流程） |

## 优势

1. **极简交互**：用户只需说需求，无需理解技术细节
2. **智能规划**：Agent自动决定工具调用顺序
3. **上下文理解**：记住对话历史，支持追问和修改
4. **容错性强**：工具失败时自动恢复或提示用户
5. **可扩展**：新增工具后，Agent自动学会使用

## 未来增强

### Phase 2 功能
- [ ] **流式响应**：实时显示Agent思考过程
- [ ] **多轮修改**：生成后支持"改成红色"、"加快节奏"等修改
- [ ] **历史学习**：记住用户偏好（如常用风格、时长）

### Phase 3 功能
- [ ] **多模态输入**：支持语音输入、图片拖拽
- [ ] **并行任务**：同时生成多个视频方案
- [ ] **协作模式**：团队成员共享Agent会话

## 测试

访问 `http://localhost:3000/agent-test` 进行测试。

### 测试用例

1. **基础生成**：
   ```
   我想做一个15秒的猫咪视频
   ```

2. **缺参数场景**：
   ```
   做个关于日落的视频
   （Agent会询问时长和风格）
   ```

3. **图片起点**：
   ```
   用这张图片生成视频
   （先上传图片，Agent会分析后生成）
   ```

4. **音乐MV**：
   ```
   用这首歌做个MV
   （上传音乐，Agent分析节拍后生成）
   ```

## 注意事项

1. **会话隔离**：每个用户使用独立sessionId
2. **循环保护**：最多10次工具调用，防止无限循环
3. **错误处理**：工具执行失败时，Agent会收到错误信息并尝试恢复
4. **状态同步**：前端和Agent都维护状态（脚本/分镜/视频任务）

## 与SEKO对比

| 功能 | 超级视频Agent | SEKO |
|------|-------------|------|
| 对话式生成 | ✅ | ✅ |
| 自动工具调用 | ✅ | ❓ |
| 角色库 | 已有基础 | ✅ |
| 数字人 | 规划中 | ✅ |
| 音乐同步 | ✅ | ✅ |
| 社区/探索 | 规划中 | ✅ |

**我们的差异化优势**：
- Claude Tool Use实现的真正智能Agent（不是脚本式流程）
- 更强的上下文理解和对话能力
- 开源可定制的工具体系

## 更新日志

- 2026-04-08: 创建智能Agent服务基础架构
  - agent-tools.ts: 6个工具定义
  - agent-orchestrator.ts: Agent编排器
  - API路由: /api/agent/message, /api/agent/tool-results
  - useAgentExecutor.ts: 前端自动执行Hook
  - agent-test页面: 测试界面
