/**
 * Workflow 执行引擎
 * 解析工作流 DAG，拓扑排序，并行执行
 */
import type {
  Workflow,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge,
  NodeExecution,
  BlockContext,
  ProgressEvent,
} from '../blocks/types'
import { BlockRegistry } from '../blocks/registry'
import { createBlockContext } from '../blocks/context'
import { v4 as uuid } from 'uuid'
import { logger } from '../utils/logger'

const log = logger.context('WorkflowEngine')

export class WorkflowEngine {
  /**
   * 执行工作流
   */
  async execute(
    workflow: Workflow,
    inputs: Record<string, any>,
    options?: {
      userId?: string
      onProgress?: (event: ProgressEvent) => void
      metadata?: Record<string, any>
    }
  ): Promise<WorkflowExecution> {
    const executionId = uuid()
    const startTime = Date.now()

    log.info('Starting execution', { executionId, workflow: workflow.name, nodeCount: workflow.nodes.length })

    // 创建执行记录
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'running',
      inputs,
      startedAt: new Date(),
      nodeExecutions: workflow.nodes.map(node => ({
        nodeId: node.id,
        blockId: node.blockId,
        status: 'pending',
        inputs: {},
        retryCount: 0,
        logs: [],
      })),
      metadata: options?.metadata,
    }

    // 创建执行上下文
    const context = createBlockContext({
      workflowId: workflow.id,
      executionId,
      userId: options?.userId,
      metadata: options?.metadata,
    })

    // 监听进度事件
    if (options?.onProgress) {
      context.onProgress(options.onProgress)
    }

    // 保存初始输入到上下文（同时保存带前缀和不带前缀的版本）
    Object.entries(inputs).forEach(([key, value]) => {
      context.set(`input.${key}`, value)  // 带前缀
      context.set(key, value)  // 不带前缀（兼容性）
    })

    try {
      // 1. 构建 DAG
      const graph = this.buildDAG(workflow)

      // 2. 拓扑排序（确定执行顺序）
      const sortedNodes = this.topologicalSort(workflow, graph)

      // 3. 识别可并行执行的批次
      const batches = this.identifyParallelBatches(workflow, sortedNodes, graph)

      log.debug('Execution plan created', {
        batchCount: batches.length,
        batches: batches.map((batch, i) => ({
          batch: i + 1,
          nodes: batch.map(n => n.id)
        }))
      })

      // 4. 按批次执行节点
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        log.debug('Executing batch', { current: i + 1, total: batches.length, nodeCount: batch.length })

        // 并行执行当前批次的所有节点
        await Promise.all(
          batch.map(node => this.executeNode(node, workflow, context, execution))
        )
      }

      // 5. 收集输出
      const outputs = this.collectOutputs(workflow, context)

      execution.status = 'completed'
      execution.outputs = outputs
      execution.completedAt = new Date()
      execution.duration = Date.now() - startTime

      // 计算总成本
      execution.totalCost = execution.nodeExecutions.reduce((sum, ne) => {
        const block = BlockRegistry.get(ne.blockId)
        return sum + (block?.cost || 0)
      }, 0)

      log.info('Execution completed', { duration: execution.duration, totalCost: execution.totalCost })

      return execution
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.completedAt = new Date()
      execution.duration = Date.now() - startTime

      log.error('Execution failed', error)

      throw error
    }
  }

  /**
   * 构建有向无环图（DAG）
   */
  private buildDAG(workflow: Workflow): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>()

    // 初始化所有节点
    workflow.nodes.forEach(node => {
      graph.set(node.id, new Set())
    })

    // 添加边（依赖关系）
    workflow.edges.forEach(edge => {
      // target 依赖 source（source → target）
      graph.get(edge.target)?.add(edge.source)
    })

    // Debug: print DAG
    log.debug('DAG constructed', {
      dependencies: Array.from(graph.entries()).map(([nodeId, deps]) => ({
        node: nodeId,
        dependsOn: Array.from(deps)
      }))
    })

    return graph
  }

  /**
   * 拓扑排序
   * 返回节点执行顺序（保证依赖在前）
   */
  private topologicalSort(workflow: Workflow, graph: Map<string, Set<string>>): WorkflowNode[] {
    const sorted: WorkflowNode[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected: ${nodeId}`)
      }

      visiting.add(nodeId)

      // 先访问所有依赖节点
      const deps = graph.get(nodeId) || new Set()
      deps.forEach(depId => visit(depId))

      visiting.delete(nodeId)
      visited.add(nodeId)

      const node = workflow.nodes.find(n => n.id === nodeId)
      if (node) sorted.push(node)
    }

    workflow.nodes.forEach(node => visit(node.id))

    return sorted
  }

  /**
   * 识别可并行执行的批次
   * 同一批次的节点互不依赖，可以并行执行
   */
  private identifyParallelBatches(
    workflow: Workflow,
    sortedNodes: WorkflowNode[],
    graph: Map<string, Set<string>>
  ): WorkflowNode[][] {
    const batches: WorkflowNode[][] = []
    const completed = new Set<string>()

    while (completed.size < sortedNodes.length) {
      const batch: WorkflowNode[] = []

      for (const node of sortedNodes) {
        if (completed.has(node.id)) continue

        // 检查该节点的所有依赖是否都已完成
        const deps = graph.get(node.id) || new Set()
        const allDepsCompleted = Array.from(deps).every(depId => completed.has(depId))

        if (allDepsCompleted) {
          batch.push(node)
          // ⚠️ 不要在这里标记为完成！
          // completed.add(node.id) 移到循环外
        }
      }

      if (batch.length === 0 && completed.size < sortedNodes.length) {
        throw new Error('Deadlock detected: no nodes can be executed')
      }

      // ✅ 批次构建完成后，标记这些节点为已完成
      batch.forEach(node => completed.add(node.id))

      batches.push(batch)
    }

    return batches
  }

  /**
   * 执行单个节点
   */
  private async executeNode(
    node: WorkflowNode,
    workflow: Workflow,
    context: BlockContext,
    execution: WorkflowExecution
  ): Promise<void> {
    const nodeExecution = execution.nodeExecutions.find(ne => ne.nodeId === node.id)!

    try {
      nodeExecution.status = 'running'
      nodeExecution.startedAt = new Date()

      // 获取 Block
      const block = BlockRegistry.require(node.blockId)

      // 收集输入（从上游节点的输出）
      const inputs = this.collectInputs(node, workflow, context)

      // 应用节点配置（覆盖默认值）
      const finalInputs = { ...inputs, ...(node.config || {}) }

      context.log('info', `[${node.id}] Starting block: ${block.name}`)
      context.log('info', `[${node.id}] Inputs:`, finalInputs)

      // 触发进度事件
      context.emitProgress({
        blockId: block.id,
        nodeId: node.id,
        status: 'running',
        progress: 0,
      })

      // 执行 Block
      const outputs = await block.execute(finalInputs, context)

      // 保存输出到上下文
      log.debug('Saving outputs', { nodeId: node.id, outputKeys: Object.keys(outputs) })
      Object.entries(outputs).forEach(([key, value]) => {
        const contextKey = `${node.id}.${key}`
        context.set(contextKey, value)

        // 验证保存成功
        const retrieved = context.get(contextKey)
        if (retrieved !== value) {
          log.error('Context verification failed', { contextKey, saved: value, retrieved })
        }
      })

      nodeExecution.status = 'completed'
      nodeExecution.inputs = finalInputs
      nodeExecution.outputs = outputs
      nodeExecution.completedAt = new Date()
      nodeExecution.duration = Date.now() - nodeExecution.startedAt.getTime()

      context.log('info', `[${node.id}] Completed in ${nodeExecution.duration}ms`)
      context.log('info', `[${node.id}] Outputs:`, outputs)

      // 触发完成事件
      context.emitProgress({
        blockId: block.id,
        nodeId: node.id,
        status: 'completed',
        progress: 100,
        data: outputs,
      })
    } catch (error) {
      nodeExecution.status = 'failed'
      nodeExecution.error = error instanceof Error ? error.message : 'Unknown error'
      nodeExecution.completedAt = new Date()
      nodeExecution.duration = Date.now() - (nodeExecution.startedAt?.getTime() || Date.now())

      context.log('error', `[${node.id}] Failed:`, error)

      // 触发失败事件
      context.emitProgress({
        blockId: node.blockId,
        nodeId: node.id,
        status: 'failed',
        message: nodeExecution.error,
      })

      throw error
    }
  }

  /**
   * 收集节点的输入（从上游节点的输出）
   */
  private collectInputs(
    node: WorkflowNode,
    workflow: Workflow,
    context: BlockContext
  ): Record<string, any> {
    const inputs: Record<string, any> = {}

    // 找到所有指向该节点的边
    const incomingEdges = workflow.edges.filter(e => e.target === node.id)

    log.debug('Collecting inputs', {
      nodeId: node.id,
      incomingEdges: incomingEdges.map(e => `${e.source}.${e.sourceOutput} -> ${e.targetInput}`)
    })

    // 如果没有 incoming edges，这是一个起始节点
    // 尝试从 context 中获取初始输入（匹配 Block 的 input 定义）
    if (incomingEdges.length === 0) {
      const block = BlockRegistry.get(node.blockId)
      if (block) {
        log.debug('Start node detected, checking for initial inputs', { nodeId: node.id })

        block.inputs.forEach(inputDef => {
          // 尝试从 context 中获取匹配的值
          // 优先级：input.xxx > xxx
          const prefixedKey = `input.${inputDef.name}`
          const directKey = inputDef.name

          const value = context.get(prefixedKey) ?? context.get(directKey)

          if (value !== undefined) {
            log.debug('Found initial input', { inputName: inputDef.name, valueType: typeof value })
            inputs[inputDef.name] = value
          }
        })
      }
    }

    incomingEdges.forEach(edge => {
      // 从上游节点的输出中获取值
      const contextKey = `${edge.source}.${edge.sourceOutput}`
      const value = context.get(contextKey)

      if (value === undefined) {
        const allState = (context as any).getAllState ? (context as any).getAllState() : {}
        log.warn('Missing input', {
          contextKey,
          targetInput: `${edge.target}.${edge.targetInput}`,
          availableKeys: Object.keys(allState)
        })
      }

      // 应用数据转换（如果有）
      const finalValue = edge.transform
        ? this.applyTransform(value, edge.transform)
        : value

      inputs[edge.targetInput] = finalValue
    })

    log.debug('Inputs collected', { nodeId: node.id, inputKeys: Object.keys(inputs) })

    return inputs
  }

  /**
   * 应用数据转换函数
   */
  private applyTransform(value: any, transformCode: string): any {
    try {
      // 简单的 eval 实现（生产环境应使用沙箱）
      const fn = new Function('value', `return ${transformCode}`)
      return fn(value)
    } catch (error) {
      log.error('Transform error', error)
      return value
    }
  }

  /**
   * 收集工作流的最终输出
   */
  private collectOutputs(workflow: Workflow, context: BlockContext): Record<string, any> {
    const outputs: Record<string, any> = {}

    // 找到所有没有出边的节点（输出节点）
    const outputNodes = workflow.nodes.filter(node => {
      return !workflow.edges.some(e => e.source === node.id)
    })

    outputNodes.forEach(node => {
      const block = BlockRegistry.get(node.blockId)
      if (!block) return

      block.outputs.forEach(output => {
        const key = `${node.id}.${output.name}`
        const value = context.get(key)
        if (value !== undefined) {
          outputs[output.name] = value
        }
      })
    })

    return outputs
  }
}

/**
 * 创建工作流引擎实例
 */
export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine()
}
