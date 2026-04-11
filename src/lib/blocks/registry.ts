/**
 * Block 注册中心
 * 管理所有可用的 Building Blocks
 */
import type { Block, BlockFilter, BlockType, BlockCategory } from './types'
import { logger } from '@/lib/utils/logger'

const log = logger.context('BlockRegistry')

class BlockRegistryImpl {
  private blocks: Map<string, Block> = new Map()

  /**
   * 注册一个 Block
   */
  register(block: Block): void {
    if (this.blocks.has(block.id)) {
      log.warn('Block already registered, overwriting', { blockId: block.id })
    }
    this.blocks.set(block.id, block)
    log.debug('Block registered', { blockId: block.id, name: block.name })
  }

  /**
   * 批量注册 Blocks
   */
  registerMany(blocks: Block[]): void {
    blocks.forEach(block => this.register(block))
  }

  /**
   * 注销一个 Block
   */
  unregister(blockId: string): void {
    if (this.blocks.delete(blockId)) {
      log.debug('Block unregistered', { blockId })
    } else {
      log.warn('Block not found for unregistration', { blockId })
    }
  }

  /**
   * 获取一个 Block
   */
  get(blockId: string): Block | undefined {
    return this.blocks.get(blockId)
  }

  /**
   * 获取一个 Block（不存在则抛出错误）
   */
  require(blockId: string): Block {
    const block = this.blocks.get(blockId)
    if (!block) {
      throw new Error(`Block not found: ${blockId}`)
    }
    return block
  }

  /**
   * 检查 Block 是否存在
   */
  exists(blockId: string): boolean {
    return this.blocks.has(blockId)
  }

  /**
   * 列出所有 Blocks（支持过滤）
   */
  list(filter?: BlockFilter): Block[] {
    let blocks = Array.from(this.blocks.values())

    if (filter) {
      // 按类型过滤
      if (filter.type) {
        blocks = blocks.filter(b => b.type === filter.type)
      }

      // 按分类过滤
      if (filter.category) {
        blocks = blocks.filter(b => b.category === filter.category)
      }

      // 按能力过滤（检查 Block 是否在指定能力列表中）
      if (filter.capabilities && filter.capabilities.length > 0) {
        blocks = blocks.filter(b => filter.capabilities!.includes(b.type))
      }

      // 按搜索关键词过滤
      if (filter.search) {
        const keyword = filter.search.toLowerCase()
        blocks = blocks.filter(b =>
          b.name.toLowerCase().includes(keyword) ||
          b.description.toLowerCase().includes(keyword) ||
          b.id.toLowerCase().includes(keyword)
        )
      }
    }

    return blocks
  }

  /**
   * 按分类分组
   */
  groupByCategory(): Record<BlockCategory, Block[]> {
    const grouped: Record<string, Block[]> = {
      input: [],
      generate: [],
      process: [],
      compose: [],
      output: [],
    }

    for (const block of this.blocks.values()) {
      grouped[block.category].push(block)
    }

    return grouped as Record<BlockCategory, Block[]>
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const byCategory = this.groupByCategory()
    return {
      total: this.blocks.size,
      byCategory: {
        input: byCategory.input.length,
        generate: byCategory.generate.length,
        process: byCategory.process.length,
        compose: byCategory.compose.length,
        output: byCategory.output.length,
      },
    }
  }

  /**
   * 清空所有 Blocks（谨慎使用）
   */
  clear(): void {
    this.blocks.clear()
    log.debug('All blocks cleared')
  }
}

// 单例模式
export const BlockRegistry = new BlockRegistryImpl()

// 方便导入的辅助函数
export function registerBlock(block: Block): void {
  BlockRegistry.register(block)
}

export function registerBlocks(blocks: Block[]): void {
  BlockRegistry.registerMany(blocks)
}

export function getBlock(blockId: string): Block | undefined {
  return BlockRegistry.get(blockId)
}

export function requireBlock(blockId: string): Block {
  return BlockRegistry.require(blockId)
}

export function listBlocks(filter?: BlockFilter): Block[] {
  return BlockRegistry.list(filter)
}
