/**
 * Building Blocks 系统入口
 * 注册所有可用的 Blocks
 */
import { logger } from '../utils/logger'

const log = logger.context('BlocksSystem')

// 导出核心类型（避免命名冲突，显式导出）
export type {
  BlockType,
  BlockCategory,
  BlockInput,
  BlockOutput,
  Block,
  BlockDataType,
  BlockContext,
  BlockFilter,
  WorkflowNode,
  WorkflowEdge,
  Workflow,
  WorkflowExecution,
} from './types'

// 导出 registry（BlockRegistry 实例）
export { BlockRegistry, registerBlock, registerBlocks, getBlock, requireBlock, listBlocks } from './registry'

// 导出 context
export * from './context'

// 导入所有 Blocks
import { InputBlocks } from './input-blocks'
import { GenerateBlocks } from './generate-blocks'
import { ProcessBlocks } from './process-blocks'
import { ComposeBlocks } from './compose-blocks'
import { OutputBlocks } from './output-blocks'

// 导出所有 Blocks
export { InputBlocks, GenerateBlocks, ProcessBlocks, ComposeBlocks, OutputBlocks }

// 全部 Blocks 列表
export const ALL_BLOCKS = [
  ...InputBlocks,
  ...GenerateBlocks,
  ...ProcessBlocks,
  ...ComposeBlocks,
  ...OutputBlocks,
]

let initialized = false

/**
 * 初始化 Block 系统
 * 注册所有内置 Blocks
 */
export function initializeBlocks() {
  if (initialized) return

  const { BlockRegistry } = require('./registry')

  // 注册所有 Blocks
  BlockRegistry.registerMany(ALL_BLOCKS)

  initialized = true

  const stats = BlockRegistry.getStats()
  log.info('Blocks initialized', {
    total: stats.total,
    input: stats.byCategory.input,
    generate: stats.byCategory.generate,
    process: stats.byCategory.process,
    compose: stats.byCategory.compose,
    output: stats.byCategory.output,
  })
}

// 不自动初始化，由 API route 按需调用
