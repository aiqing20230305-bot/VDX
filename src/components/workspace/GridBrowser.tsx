/**
 * Grid Browser - 网格浏览视图（专业级交互）
 * 参考 Figma/Miro 级别的卡片浏览体验
 */
'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Maximize2, Trash2, Download, Film } from 'lucide-react'
import type { Frame } from '@/types/workspace'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslation } from '@/lib/i18n/context'

interface GridBrowserProps {
  frames: Frame[]
  selectedFrameIds: string[]
  onFrameSelect: (frameId: string, multi: boolean) => void
  onFrameOpen: (frameId: string) => void
  onBatchDelete?: (frameIds: string[]) => void
}

export function GridBrowser({
  frames,
  selectedFrameIds,
  onFrameSelect,
  onFrameOpen,
  onBatchDelete,
}: GridBrowserProps) {
  const { t } = useTranslation()
  const [hoveredFrameId, setHoveredFrameId] = useState<string | null>(null)

  // 快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A / Ctrl+A: 全选
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        frames.forEach(f => onFrameSelect(f.id, true))
      }
      // Escape: 取消选择
      if (e.key === 'Escape') {
        selectedFrameIds.forEach(id => onFrameSelect(id, false))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [frames, selectedFrameIds, onFrameSelect])

  const handleFrameClick = (frameId: string, e: React.MouseEvent) => {
    // Cmd/Ctrl + 点击 = 多选模式
    const isMultiSelect = e.metaKey || e.ctrlKey
    onFrameSelect(frameId, isMultiSelect)
  }

  const handleFrameDoubleClick = (frameId: string) => {
    // 双击 = 打开详情（切换到 Timeline）
    onFrameOpen(frameId)
  }

  const handleBatchDelete = () => {
    if (onBatchDelete && selectedFrameIds.length > 0) {
      if (confirm(t('grid.confirmDeleteBatch').replace('{{count}}', String(selectedFrameIds.length)))) {
        onBatchDelete(selectedFrameIds)
      }
    }
  }

  const allSelected = frames.length > 0 && selectedFrameIds.length === frames.length
  const someSelected = selectedFrameIds.length > 0 && !allSelected

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏（批量操作） */}
      {selectedFrameIds.length > 0 && (
        <div className="h-14 border-b border-zinc-800 bg-cyan-500/5 flex items-center justify-between px-4 sm:px-6 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-cyan-400">
                {t('grid.selected')} {selectedFrameIds.length} {t('grid.totalCount')}
              </span>
            </div>
            <button
              onClick={() => selectedFrameIds.forEach(id => onFrameSelect(id, false))}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition min-h-[44px] px-2"
            >
              {t('timeline.cancel')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onBatchDelete && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-lg text-xs sm:text-sm text-red-400 transition min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('grid.batchDelete')}</span>
              </button>
            )}
            <button
              onClick={() => {
                /**
                 * Batch Export Implementation
                 *
                 * 功能: 批量导出选中的多个分镜帧为独立图片或视频片段
                 *
                 * 实现建议:
                 * 1. 导出选项:
                 *    - 图片导出: 下载选中帧的 imageUrl（PNG/JPG）
                 *    - 视频片段导出: 使用 Seedance/Kling 生成选中帧的视频
                 *    - 合并导出: 将选中帧合成为一个视频
                 *
                 * 2. 导出流程:
                 *    Step 1: 弹出导出选项对话框
                 *      - 用户选择导出格式（图片/视频/合并视频）
                 *      - 选择分辨率、质量参数
                 *    Step 2: 执行导出
                 *      - 图片: 使用 JSZip 打包下载
                 *      - 视频: 调用 /api/video/generate 批量生成
                 *      - 合并视频: 调用 /api/video/remotion-render（仅选中帧）
                 *    Step 3: 进度反馈
                 *      - 显示进度条: "导出中 3/10"
                 *      - 完成后提示下载
                 *
                 * 3. 代码示例:
                 *    const handleBatchExport = async () => {
                 *      const selectedFrames = frames.filter(f => selectedFrameIds.has(f.id))
                 *
                 *      // 图片导出
                 *      if (exportType === 'image') {
                 *        const zip = new JSZip()
                 *        for (const frame of selectedFrames) {
                 *          const blob = await fetch(frame.imageUrl).then(r => r.blob())
                 *          zip.file(`frame-${frame.id}.png`, blob)
                 *        }
                 *        const zipBlob = await zip.generateAsync({ type: 'blob' })
                 *        downloadFile(zipBlob, 'frames.zip')
                 *      }
                 *
                 *      // 视频导出
                 *      if (exportType === 'video') {
                 *        const { jobId } = await fetch('/api/video/generate', {
                 *          method: 'POST',
                 *          body: JSON.stringify({
                 *            storyboard: { frames: selectedFrames },
                 *            engine: 'remotion'
                 *          })
                 *        }).then(r => r.json())
                 *
                 *        // 监听进度
                 *        subscribeToJobProgress(jobId, (progress) => {
                 *          // Handle progress update
                 *        })
                 *      }
                 *    }
                 *
                 * 4. 依赖库:
                 *    - jszip: npm install jszip
                 *    - file-saver: npm install file-saver
                 *
                 * 参考:
                 * - src/components/workspace/ExportPanel.tsx（导出配置）
                 * - src/app/api/video/remotion-render/route.ts（视频渲染）
                 */
                alert(t('grid.batchExportSoon'))
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs sm:text-sm transition min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{t('grid.batchExport')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 网格容器 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          {/* 响应式网格：大屏6列，中屏4列，小屏2列 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {frames.map((frame, index) => {
              const isSelected = selectedFrameIds.includes(frame.id)
              const isHovered = hoveredFrameId === frame.id

              return (
                <div
                  key={frame.id}
                  className={`
                    group relative aspect-video rounded-xl overflow-hidden border-2 transition-[border-color,transform,box-shadow] duration-200 cursor-pointer
                    ${isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-[0.98] shadow-xl shadow-cyan-500/20'
                      : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg'
                    }
                  `}
                  onClick={(e) => handleFrameClick(frame.id, e)}
                  onDoubleClick={() => handleFrameDoubleClick(frame.id)}
                  onMouseEnter={() => setHoveredFrameId(frame.id)}
                  onMouseLeave={() => setHoveredFrameId(null)}
                >
                  {/* 缩略图 */}
                  {frame.imageUrl ? (
                    <OptimizedImage
                      src={frame.imageUrl}
                      alt={`Frame ${index + 1}`}
                      fill
                      className={`transition-transform duration-300 ${isHovered ? 'scale-105' : 'scale-100'}`}
                      skeleton={true}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                  )}

                  {/* 悬停遮罩（详情信息） - 移动端始终显示 */}
                  <div
                    className={`
                      absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent
                      flex flex-col justify-end p-2 sm:p-3 md:p-4 transition-opacity duration-200
                      ${isHovered || isSelected ? 'opacity-100' : 'md:opacity-0 opacity-100'}
                    `}
                  >
                    <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{t('common.scene')} {index + 1}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-300 line-clamp-2 mb-1 sm:mb-2">
                      {frame.sceneDescription}
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-zinc-400">
                      <span>{frame.duration}{t('timeline.seconds')}</span>
                      {frame.cameraMove && (
                        <span className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{frame.cameraMove}</span>
                      )}
                    </div>
                  </div>

                  {/* 序号角标 */}
                  <div className="absolute top-2 left-2 w-7 h-7 bg-black/90 rounded-full flex items-center justify-center text-xs font-bold border border-white/10">
                    {index + 1}
                  </div>

                  {/* 选中标记 */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-7 h-7 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 animate-in zoom-in-95 duration-200">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* 悬停操作按钮 */}
                  {isHovered && !isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFrameDoubleClick(frame.id)
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/90 hover:bg-cyan-500 rounded-lg flex items-center justify-center transition group/btn animate-in zoom-in-95 duration-200"
                      title={t('grid.viewDetails')}
                    >
                      <Maximize2 className="w-4 h-4 text-white group-hover/btn:scale-110 transition" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* 空状态 */}
          {frames.length === 0 && (
            <div className="h-[50vh]">
              <EmptyState
                icon={Film}
                title="暂无分镜"
                description="从聊天界面开始创作你的第一个视频"
              />
            </div>
          )}
        </div>
      </div>

      {/* 底部提示栏 */}
      <div className="h-10 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between px-4 sm:px-6 text-xs text-zinc-500">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-[10px] sm:text-xs">{t('grid.total')} {frames.length} {t('grid.totalCount')}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-[10px] sm:text-xs">
            {frames.reduce((sum, f) => sum + f.duration, 0)} {t('timeline.seconds')}
          </span>
        </div>
        {/* 键盘快捷键提示 - 仅桌面端显示 */}
        <div className="hidden md:flex items-center gap-3">
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
            ⌘/Ctrl + Click
          </kbd>
          <span>{t('grid.multiSelect')}</span>
          <span className="text-zinc-700">·</span>
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
            Double Click
          </kbd>
          <span>{t('grid.viewDetails')}</span>
          <span className="text-zinc-700">·</span>
          <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px]">
            ⌘/Ctrl + A
          </kbd>
          <span>{t('grid.selectAll')}</span>
        </div>
      </div>
    </div>
  )
}
