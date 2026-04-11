/**
 * Agent 编排器 - 智能工具调用
 * 使用 Claude Tool Use 实现自动化视频生成流程
 */
import Anthropic from '@anthropic-ai/sdk'
import { AGENT_TOOLS, type ToolResult } from './agent-tools'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

export interface AgentState {
  conversationHistory: Anthropic.MessageParam[]
  currentScript?: any
  currentStoryboard?: any
  videoJob?: any
  pendingQuestion?: {
    question: string
    options?: Array<{ label: string; value: string }>
  }
}

export interface AgentMessage {
  type: 'text' | 'tool_call' | 'tool_result' | 'question'
  content: string
  toolCalls?: Array<{
    id: string  // tool_use_id from Claude
    name: string
    input: any
  }>
  toolResults?: ToolResult[]
  question?: {
    question: string
    options?: Array<{ label: string; value: string }>
  }
}

/**
 * Agent 系统提示词
 */
const AGENT_SYSTEM_PROMPT = `你是超级视频Agent，一个顶尖的AI视频创作助手。

# 核心能力

你可以通过以下工具自动完成视频制作：

1. **generate_script** - 生成脚本方案（3个变体）
2. **select_script** - 选择脚本继续
3. **generate_storyboard** - 生成分镜图
4. **generate_video** - 生成最终视频
5. **ask_user_preference** - 询问用户选择或偏好
6. **analyze_upload** - 分析上传的图片/视频/音频

# 工作流程

**标准流程（用户说"我想做xxx视频"）：**
1. 理解需求 → 提取关键参数（主题、时长、风格）
2. 调用 generate_script 生成3个脚本
3. 用 ask_user_preference 让用户选择脚本
4. 用户回复后，调用 select_script
5. 调用 generate_storyboard 生成分镜
6. 用 ask_user_preference 询问是否满意分镜
7. 调用 generate_video 生成视频

**图片起点流程：**
1. 用户上传图片
2. 调用 analyze_upload 分析图片
3. 基于分析结果调用 generate_script（传入images参数）
4. 后续同标准流程

**音乐视频流程：**
1. 用户上传音乐
2. 调用 analyze_upload 分析音乐
3. 调用 generate_script（传入audioPath参数）
4. 后续同标准流程

# 重要规则

1. **主动推进流程** - 不要等待用户明确指令才调用工具，根据上下文自动执行下一步
2. **缺少参数时询问** - 如果用户没说时长/风格，用 ask_user_preference 询问
3. **一次一个工具** - 不要同时调用多个工具，逐步推进
4. **简洁沟通** - 调用工具前简短说明（如"正在生成脚本..."），不要冗长解释
5. **错误恢复** - 如果工具调用失败，向用户说明问题并提供解决方案

# 示例对话

用户: "我想做一个15秒的猫咪视频"
你: "好的，正在为你生成3个猫咪主题的脚本方案..."
→ 调用 generate_script(topic="可爱猫咪日常", duration=15)

工具返回: 3个脚本
你: "已生成3个创意方案，请选择你喜欢的：
A. 猫咪在窗台晒太阳
B. 猫咪追逐毛线球
C. 猫咪和主人玩耍"
→ 调用 ask_user_preference(question="选择你喜欢的脚本", options=[...])

用户: "选B"
你: "收到！正在生成分镜图..."
→ 调用 select_script(scriptIndex=1) → 调用 generate_storyboard()

# 当前任务

用户会通过对话告诉你需求。你需要：
1. 理解意图（生成视频/分析内容/修改方案等）
2. 确定缺少哪些必需参数
3. 如果缺参数，用 ask_user_preference 询问
4. 如果参数齐全，直接调用对应工具
5. 根据工具返回结果，自动执行下一步或询问用户

**记住**：你的目标是让用户只需要说一句话"我想做xxx"，你就能自动完成整个流程（中间只在关键决策点询问用户）。`

/**
 * Agent 编排器主类
 */
export class AgentOrchestrator {
  private state: AgentState = {
    conversationHistory: [],
  }

  /**
   * 处理用户消息，返回Agent响应
   */
  async processMessage(userMessage: string): Promise<AgentMessage> {
    // 添加用户消息到历史
    this.state.conversationHistory.push({
      role: 'user',
      content: userMessage,
    })

    // 调用 Claude API
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      messages: this.state.conversationHistory,
      tools: AGENT_TOOLS,
    })

    // 处理响应
    if (response.stop_reason === 'tool_use') {
      // Agent 想要调用工具
      const toolCalls: Array<{ id: string; name: string; input: any }> = response.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map(block => ({
          id: block.id,  // 保存 tool_use_id
          name: block.name,
          input: block.input,
        }))

      // 添加到历史
      this.state.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      })

      // 返回工具调用消息（前端会执行这些工具）
      return {
        type: 'tool_call',
        content: this.extractTextFromResponse(response),
        toolCalls,
      }
    }

    // 纯文本响应
    const textContent = this.extractTextFromResponse(response)

    this.state.conversationHistory.push({
      role: 'assistant',
      content: textContent,
    })

    return {
      type: 'text',
      content: textContent,
    }
  }

  /**
   * 提交工具执行结果，继续对话
   */
  async submitToolResults(results: ToolResult[]): Promise<AgentMessage> {
    // 构建工具结果消息
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = results.map(result => ({
      type: 'tool_result' as const,
      tool_use_id: result.toolUseId,  // 使用正确的 tool_use_id
      content: result.error
        ? `Error: ${result.error}`
        : JSON.stringify(result.result),
    }))

    // 添加到历史
    this.state.conversationHistory.push({
      role: 'user',
      content: toolResultBlocks,
    })

    // 更新状态
    results.forEach(result => {
      if (result.toolName === 'generate_script' && result.result?.scripts) {
        this.state.currentScript = null // 重置，等待用户选择
      } else if (result.toolName === 'select_script' && result.result?.script) {
        this.state.currentScript = result.result.script
      } else if (result.toolName === 'generate_storyboard' && result.result?.storyboard) {
        this.state.currentStoryboard = result.result.storyboard
      } else if (result.toolName === 'generate_video' && result.result?.jobId) {
        this.state.videoJob = result.result
      }
    })

    // 继续对话（让Agent决定下一步）
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      system: AGENT_SYSTEM_PROMPT,
      messages: this.state.conversationHistory,
      tools: AGENT_TOOLS,
    })

    if (response.stop_reason === 'tool_use') {
      const toolCalls: Array<{ id: string; name: string; input: any }> = response.content
        .filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use')
        .map(block => ({
          id: block.id,
          name: block.name,
          input: block.input,
        }))

      this.state.conversationHistory.push({
        role: 'assistant',
        content: response.content,
      })

      return {
        type: 'tool_call',
        content: this.extractTextFromResponse(response),
        toolCalls,
      }
    }

    const textContent = this.extractTextFromResponse(response)

    this.state.conversationHistory.push({
      role: 'assistant',
      content: textContent,
    })

    return {
      type: 'text',
      content: textContent,
    }
  }

  /**
   * 获取当前状态（供前端查询）
   */
  getState(): AgentState {
    return this.state
  }

  /**
   * 重置状态（新会话）
   */
  reset() {
    this.state = {
      conversationHistory: [],
    }
  }

  /**
   * 从响应中提取文本内容
   */
  private extractTextFromResponse(response: Anthropic.Message): string {
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    )
    return textBlocks.map(block => block.text).join('\n')
  }
}

/**
 * 创建Agent实例（单例模式，按会话隔离）
 */
const agentInstances = new Map<string, AgentOrchestrator>()

export function getAgentInstance(sessionId: string): AgentOrchestrator {
  if (!agentInstances.has(sessionId)) {
    agentInstances.set(sessionId, new AgentOrchestrator())
  }
  return agentInstances.get(sessionId)!
}

export function deleteAgentInstance(sessionId: string) {
  agentInstances.delete(sessionId)
}
