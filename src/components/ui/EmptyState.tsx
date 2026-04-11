/**
 * EmptyState - 空状态组件
 * 提供友好的空白提示和引导
 */
'use client'

import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-8 py-12">
      {/* 图标 */}
      <div className="w-16 h-16 mb-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Icon className="w-8 h-8 text-zinc-600" />
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">{title}</h3>

      {/* 描述 */}
      <p className="text-sm text-zinc-500 text-center max-w-md mb-6">
        {description}
      </p>

      {/* 操作按钮 */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
        >
          {action.label}
        </button>
      )}

      {/* 自定义内容 */}
      {children}
    </div>
  )
}

/**
 * 预设空状态模板
 */
export const EmptyStates = {
  NoFrames: ({
    onAddFrame,
  }: {
    onAddFrame: () => void
  }) => (
    <EmptyState
      icon={require('lucide-react').Film}
      title="暂无分镜"
      description="开始创建您的第一个分镜，或从模板快速开始"
      action={{ label: '添加分镜', onClick: onAddFrame }}
    />
  ),

  NoProjects: ({
    onCreateProject,
  }: {
    onCreateProject: () => void
  }) => (
    <EmptyState
      icon={require('lucide-react').FolderOpen}
      title="暂无项目"
      description="创建您的第一个视频项目，或从模板快速开始"
      action={{ label: '创建项目', onClick: onCreateProject }}
    />
  ),

  NoSubtitles: ({
    onGenerate,
  }: {
    onGenerate: () => void
  }) => (
    <EmptyState
      icon={require('lucide-react').Subtitles}
      title="暂无字幕"
      description="自动生成字幕或手动添加字幕轨道"
      action={{ label: '生成字幕', onClick: onGenerate }}
    />
  ),

  SearchNoResults: ({ query }: { query: string }) => (
    <EmptyState
      icon={require('lucide-react').Search}
      title="未找到结果"
      description={`没有找到与 "${query}" 相关的内容，请尝试其他关键词`}
    />
  ),

  Error: ({
    title = '出错了',
    description = '加载内容时遇到问题，请刷新页面重试',
    onRetry,
  }: {
    title?: string
    description?: string
    onRetry?: () => void
  }) => (
    <EmptyState
      icon={require('lucide-react').AlertCircle}
      title={title}
      description={description}
      action={onRetry ? { label: '重试', onClick: onRetry } : undefined}
    />
  ),
}
