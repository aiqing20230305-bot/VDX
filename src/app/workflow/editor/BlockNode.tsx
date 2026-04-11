/**
 * Block 节点组件
 * 工作流画布中的可视化节点
 */
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { BLOCK_ICON_MAP, DEFAULT_BLOCK_ICON } from '@/lib/blocks/iconMap'

const CategoryColors = {
  input: 'border-blue-500 bg-blue-500/10',
  generate: 'border-purple-500 bg-purple-500/10',
  process: 'border-green-500 bg-green-500/10',
  compose: 'border-orange-500 bg-orange-500/10',
  output: 'border-red-500 bg-red-500/10',
}

export const BlockNodeType = memo(({ data, selected }: NodeProps) => {
  const {
    blockName,
    blockCategory,
    blockIcon,
    inputs = [] as any[],
    outputs = [] as any[],
  } = data as any

  const Icon = (blockIcon && BLOCK_ICON_MAP[blockIcon as string]) || DEFAULT_BLOCK_ICON

  const categoryColor = CategoryColors[blockCategory as keyof typeof CategoryColors] || 'border-zinc-600 bg-zinc-800'

  return (
    <div
      className={`
        min-w-[200px] rounded-lg border-2 ${categoryColor}
        ${selected ? 'ring-2 ring-cyan-500' : ''}
        transition-all
      `}
    >
      {/* 输入端口 */}
      {inputs.length > 0 && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 space-y-3">
          {inputs.map((input: any, i: number) => (
            <Handle
              key={input.name}
              type="target"
              position={Position.Left}
              id={input.name}
              className="!w-4 !h-4 !bg-cyan-400 !border-2 !border-zinc-900"
              style={{ top: `${((i + 1) / (inputs.length + 1)) * 100}%` }}
            />
          ))}
        </div>
      )}

      {/* 节点内容 */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-5 h-5 text-cyan-400" />
          <div className="font-semibold text-sm">{blockName}</div>
        </div>

        {/* 输入列表 */}
        {inputs.length > 0 && (
          <div className="text-xs text-zinc-400 space-y-1 mb-2">
            {inputs.slice(0, 3).map((input: any) => (
              <div key={input.name} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-400/50" />
                <span>{input.name}</span>
                {input.required && <span className="text-red-400">*</span>}
              </div>
            ))}
            {inputs.length > 3 && (
              <div className="text-zinc-500">+{inputs.length - 3} more</div>
            )}
          </div>
        )}

        {/* 输出列表 */}
        {outputs.length > 0 && (
          <div className="text-xs text-zinc-400 space-y-1">
            {outputs.slice(0, 2).map((output: any) => (
              <div key={output.name} className="flex items-center gap-1 justify-end">
                <span>{output.name}</span>
                <div className="w-2 h-2 rounded-full bg-purple-400/50" />
              </div>
            ))}
            {outputs.length > 2 && (
              <div className="text-zinc-500 text-right">+{outputs.length - 2} more</div>
            )}
          </div>
        )}
      </div>

      {/* 输出端口 */}
      {outputs.length > 0 && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 space-y-3">
          {outputs.map((output: any, i: number) => (
            <Handle
              key={output.name}
              type="source"
              position={Position.Right}
              id={output.name}
              className="!w-4 !h-4 !bg-purple-400 !border-2 !border-zinc-900"
              style={{ top: `${((i + 1) / (outputs.length + 1)) * 100}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
})

BlockNodeType.displayName = 'BlockNodeType'
