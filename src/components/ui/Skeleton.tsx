/**
 * Skeleton - 骨架屏加载占位组件
 * 用于内容加载时的占位，提供更好的感知性能
 */
'use client'

import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
  style?: React.CSSProperties
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  style,
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  }

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]',
    none: '',
  }

  return (
    <div
      className={cn(
        'bg-zinc-800',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * SkeletonText - 文本骨架屏
 */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          className={index === lines - 1 ? 'w-2/3' : 'w-full'}
        />
      ))}
    </div>
  )
}

/**
 * SkeletonCard - 卡片骨架屏
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'border border-zinc-800 rounded-xl p-6 space-y-4',
        className
      )}
    >
      {/* 标题 */}
      <Skeleton variant="text" className="h-6 w-3/4" />

      {/* 内容行 */}
      <SkeletonText lines={3} />

      {/* 底部操作区 */}
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rounded" className="h-9 w-24" />
        <Skeleton variant="rounded" className="h-9 w-24" />
      </div>
    </div>
  )
}

/**
 * SkeletonAvatar - 头像骨架屏
 */
export function SkeletonAvatar({
  size = 40,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  )
}

/**
 * SkeletonImage - 图片骨架屏
 */
export function SkeletonImage({
  aspectRatio = '16/9',
  className,
}: {
  aspectRatio?: string
  className?: string
}) {
  return (
    <Skeleton
      variant="rounded"
      className={cn('w-full', className)}
      style={{ aspectRatio }}
    />
  )
}

/**
 * SkeletonGrid - 网格骨架屏
 */
export function SkeletonGrid({
  cols = 3,
  rows = 2,
  gap = 4,
  className,
}: {
  cols?: number
  rows?: number
  gap?: number
  className?: string
}) {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: `${gap * 0.25}rem`,
  }

  return (
    <div style={gridStyle} className={className}>
      {Array.from({ length: cols * rows }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}

/**
 * SkeletonList - 列表骨架屏
 */
export function SkeletonList({
  items = 5,
  className,
}: {
  items?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <SkeletonAvatar size={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * SkeletonTable - 表格骨架屏
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* 表头 */}
      <div className="flex gap-4 pb-3 border-b border-zinc-800">
        {Array.from({ length: cols }).map((_, index) => (
          <Skeleton key={index} variant="text" className="h-4 flex-1" />
        ))}
      </div>

      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}
