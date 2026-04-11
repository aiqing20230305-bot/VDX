'use client'

/**
 * 可视化工作流编辑器
 * 基于 React Flow 实现拖拽式 Building Blocks 搭建
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { BlockNodeType } from './BlockNode'
import { BlocksPalette } from './BlocksPalette'
import { NodeConfigPanel } from './NodeConfigPanel'
import { WorkflowToolbar } from './WorkflowToolbar'

const nodeTypes = {
  blockNode: BlockNodeType,
}

export default function WorkflowEditorPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState('新建工作流')

  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // 连接节点
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges]
  )

  // 选择节点
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  // 从 Palette 拖拽添加节点
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const blockData = event.dataTransfer.getData('application/reactflow')
      if (!blockData) return

      const block = JSON.parse(blockData)

      const bounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!bounds) return

      const position = {
        x: event.clientX - bounds.left - 75,
        y: event.clientY - bounds.top - 25,
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: 'blockNode',
        position,
        data: {
          blockId: block.id,
          blockName: block.name,
          blockCategory: block.category,
          blockIcon: block.icon,
          inputs: block.inputs,
          outputs: block.outputs,
          config: {},
        },
      }

      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // 更新节点配置
  const onUpdateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, any>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                config,
              },
            }
          }
          return node
        })
      )
    },
    [setNodes]
  )

  // 删除选中节点
  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    )
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  // 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        onDeleteNode()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNode, onDeleteNode])

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* 左侧：Blocks 面板 */}
      <BlocksPalette />

      {/* 中间：画布 */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-900"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#27272a" />
          <Controls className="bg-zinc-800 border-zinc-700" />
          <MiniMap
            className="bg-zinc-800 border-zinc-700"
            nodeColor={(node) => {
              const category = node.data?.blockCategory
              return category === 'input'
                ? '#3b82f6'
                : category === 'generate'
                ? '#8b5cf6'
                : category === 'process'
                ? '#10b981'
                : category === 'compose'
                ? '#f59e0b'
                : category === 'output'
                ? '#ef4444'
                : '#6b7280'
            }}
          />

          {/* 工具栏 */}
          <Panel position="top-center">
            <WorkflowToolbar
              workflowName={workflowName}
              onNameChange={setWorkflowName}
              nodes={nodes}
              edges={edges}
              onClear={() => {
                setNodes([])
                setEdges([])
                setSelectedNode(null)
              }}
            />
          </Panel>
        </ReactFlow>
      </div>

      {/* 右侧：节点配置面板 */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(config) => onUpdateNodeConfig(selectedNode.id, config)}
          onDelete={onDeleteNode}
        />
      )}
    </div>
  )
}
