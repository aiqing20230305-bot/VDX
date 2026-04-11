/**
 * Version History Panel - 版本历史面板
 * 显示项目的历史快照，支持回退
 */
'use client'

import { useState } from 'react'
import { History, RotateCcw, X, AlertTriangle } from 'lucide-react'
import * as VersionHistory from '@/lib/storage/version-history'
import type { ProjectSnapshot } from '@/lib/storage/version-history'
import type { Frame } from '@/types/workspace'

interface VersionHistoryPanelProps {
  projectId: string
  currentFrames: Frame[]
  onRestore: (frames: Frame[]) => void
  onClose: () => void
}

export function VersionHistoryPanel({
  projectId,
  currentFrames,
  onRestore,
  onClose,
}: VersionHistoryPanelProps) {
  const history = VersionHistory.getVersionHistory(projectId)
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProjectSnapshot | null>(null)

  const handleRestore = (snapshotId: string) => {
    const frames = VersionHistory.restoreSnapshot(projectId, snapshotId)
    if (frames) {
      onRestore(frames)
      onClose()
    }
  }

  const getOperationIcon = (type: ProjectSnapshot['operationType']) => {
    switch (type) {
      case 'delete':
      case 'batch_delete':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'reorder':
        return <History className="w-4 h-4 text-cyan-400" />
      case 'add':
        return <History className="w-4 h-4 text-green-400" />
      case 'update':
        return <History className="w-4 h-4 text-blue-400" />
      default:
        return <History className="w-4 h-4 text-zinc-400" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl h-[80vh] bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col shadow-2xl">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <History className="w-5 h-5 text-cyan-400" />
              版本历史
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {history.snapshots.length} 个历史版本（最多保留10个）
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-zinc-200"
            aria-label="关闭"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 版本列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.snapshots.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <History className="w-16 h-16 text-zinc-700 mb-4" />
              <p className="text-lg text-zinc-500">暂无历史版本</p>
              <p className="text-sm text-zinc-600 mt-2">
                当你删除、重排或批量操作场景时，会自动保存快照
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 当前状态 */}
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <History className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-cyan-300">
                        当前状态
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {currentFrames.length} 个场景
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-cyan-500/20 rounded-full text-xs text-cyan-400 font-medium">
                    当前
                  </div>
                </div>
              </div>

              {/* 历史快照列表（倒序显示） */}
              {[...history.snapshots].reverse().map((snapshot, index) => {
                const isSelected = selectedSnapshot?.id === snapshot.id
                const diff = VersionHistory.compareSnapshots(
                  snapshot,
                  history.snapshots[history.snapshots.length - 1 - index + 1] || snapshot
                )

                return (
                  <div
                    key={snapshot.id}
                    className={`p-4 rounded-xl border transition-[background-color,border-color] cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/50 border-cyan-500/50'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => setSelectedSnapshot(snapshot)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center mt-0.5">
                          {getOperationIcon(snapshot.operationType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200">
                            {snapshot.operation}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            {VersionHistory.formatRelativeTime(snapshot.timestamp)}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="text-zinc-600">
                              {snapshot.frameCount} 个场景
                            </span>
                            {diff.frameDiff !== 0 && (
                              <span
                                className={
                                  diff.frameDiff > 0 ? 'text-green-500' : 'text-red-500'
                                }
                              >
                                {diff.frameDiff > 0 ? '+' : ''}
                                {diff.frameDiff}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestore(snapshot.id)
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-cyan-500/20 border border-zinc-700 hover:border-cyan-500/50 rounded-lg text-xs font-medium text-zinc-400 hover:text-cyan-400 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        恢复
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 text-center">
          <p className="text-xs text-zinc-600">
            提示：恢复到历史版本会覆盖当前状态，建议先备份重要内容
          </p>
        </div>
      </div>
    </div>
  )
}
