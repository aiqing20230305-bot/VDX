/**
 * Project Sidebar - 项目历史记录与管理面板
 * 支持项目列表、切换、删除、重命名
 */
'use client'

import { useState } from 'react'
import { Plus, Folder, MoreVertical, Trash2, Edit2, Check, X, History, FolderOpen, Film } from 'lucide-react'
import type { Frame, Project } from '@/types/workspace'
import type { StoredProject } from '@/lib/storage/projects'
import Image from 'next/image'
import { EmptyState } from '@/components/ui/EmptyState'

interface ProjectSidebarProps {
  frames: Frame[]
  selectedFrameId: string | null
  onFrameSelect: (frameId: string) => void
  projects: StoredProject[]
  currentProject: Project | null
  onProjectSelect: (projectId: string) => void
  onProjectDelete: (projectId: string) => void
  onProjectRename: (projectId: string, newTitle: string) => void
  onNewProject: () => void
  onShowVersionHistory?: () => void
}

export function ProjectSidebar({
  frames,
  selectedFrameId,
  onFrameSelect,
  projects,
  currentProject,
  onProjectSelect,
  onProjectDelete,
  onProjectRename,
  onNewProject,
  onShowVersionHistory,
}: ProjectSidebarProps) {
  const [showProjectList, setShowProjectList] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const handleRenameStart = (project: StoredProject) => {
    setEditingProjectId(project.id)
    setEditTitle(project.title)
    setMenuOpenId(null)
  }

  const handleRenameSave = () => {
    if (editingProjectId && editTitle.trim()) {
      onProjectRename(editingProjectId, editTitle.trim())
    }
    setEditingProjectId(null)
  }

  const handleRenameCancel = () => {
    setEditingProjectId(null)
    setEditTitle('')
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部：项目切换 */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={() => setShowProjectList(!showProjectList)}
          className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition group"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Folder className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {currentProject?.title || '选择项目'}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${showProjectList ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 新建项目按钮 */}
        <button
          onClick={onNewProject}
          className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg text-sm text-cyan-400 transition"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {/* 项目列表（展开时显示） */}
      {showProjectList && (
        <>
          {projects.length > 0 ? (
            <div className="border-b border-zinc-800 bg-zinc-950/50 max-h-[40vh] overflow-y-auto">
              <div className="p-2 space-y-1">
                {projects.map((project) => (
              <div
                key={project.id}
                className={`
                  group relative rounded-lg border transition
                  ${currentProject?.id === project.id
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
                  }
                `}
              >
                <button
                  onClick={() => {
                    onProjectSelect(project.id)
                    setShowProjectList(false)
                  }}
                  className="w-full p-2 text-left"
                >
                  {/* 缩略图 */}
                  <div className="relative aspect-video rounded overflow-hidden bg-zinc-800 mb-2">
                    {project.thumbnail ? (
                      <Image
                        src={project.thumbnail}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Folder className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}
                  </div>

                  {/* 项目信息 */}
                  {editingProjectId === project.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSave()
                          if (e.key === 'Escape') handleRenameCancel()
                        }}
                        className="flex-1 px-2 py-1 bg-zinc-800 border border-cyan-500 rounded text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        autoFocus
                      />
                      <button
                        onClick={handleRenameSave}
                        className="p-1 hover:bg-green-500/20 text-green-400 rounded transition"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleRenameCancel}
                        className="p-1 hover:bg-red-500/20 text-red-400 rounded transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-300 font-medium line-clamp-1 mb-1">
                      {project.title}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{project.frameCount} 个场景</span>
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>

                {/* 操作菜单 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === project.id ? null : project.id)
                    }}
                    className="p-1 bg-black/90 hover:bg-black rounded"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>

                  {menuOpenId === project.id && (
                    <div className="absolute top-full right-0 mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-10 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRenameStart(project)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        重命名
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onProjectDelete(project.id)
                          setMenuOpenId(null)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-b border-zinc-800 bg-zinc-950/50 p-4">
              <EmptyState
                icon={FolderOpen}
                title="暂无项目"
                description="点击【新建项目】开始创作"
              />
            </div>
          )}
        </>
      )}

      {/* 当前项目的场景列表 */}
      {currentProject && frames.length > 0 && (
        <>
          <div className="px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-zinc-300">场景列表</h3>
              <span className="text-xs text-zinc-600">{frames.length} 个镜头</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {frames.map((frame, index) => (
              <button
                key={frame.id}
                onClick={() => onFrameSelect(frame.id)}
                className={`
                  w-full p-2 rounded-lg border-2 transition text-left
                  ${frame.id === selectedFrameId
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
                  }
                `}
              >
                <div className="relative aspect-video rounded overflow-hidden bg-zinc-800 mb-2">
                  {frame.imageUrl ? (
                    <Image
                      src={frame.imageUrl}
                      alt={`Frame ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      生成中...
                    </div>
                  )}
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/90 rounded text-[10px] font-medium">
                    {index + 1}
                  </div>
                </div>
                <div className="text-xs text-zinc-400 line-clamp-1">
                  {frame.sceneDescription}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 空状态 */}
      {!currentProject ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <EmptyState
            icon={FolderOpen}
            title="选择或新建项目"
            description="开始你的创作"
          />
        </div>
      ) : frames.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <EmptyState
            icon={Film}
            title="还没有场景"
            description="从聊天开始生成分镜"
          />
        </div>
      ) : null}
    </div>
  )
}
