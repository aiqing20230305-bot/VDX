/**
 * AI Agents System - 双Agent协作系统
 *
 * 客户端安全导出（不包含server-only依赖）
 *
 * 导出：
 * - AgentCoordinator（协调器）- 纯状态管理，客户端安全
 * - Agent常量（CONTENT_DIRECTOR_AGENT, TECHNICAL_EXECUTOR_AGENT）
 * - 类型定义
 *
 * 注意：
 * - 服务端专用函数（invokeContentDirector, invokeTechnicalExecutor）
 *   不在此导出，仅在API routes中使用
 */

export {
  AgentCoordinator,
  getGlobalCoordinator,
  resetGlobalCoordinator,
  CONTENT_DIRECTOR_AGENT,
  TECHNICAL_EXECUTOR_AGENT,
  type WorkflowMode,
  type WorkflowStage,
  type WorkflowState,
  type AgentMessage,
} from './agent-coordinator'
