/**
 * Timeline Editor - 时间轴编辑视图（专业级拖拽重排）
 * 参考 SEKO 12.png + Flova AI 级别交互
 *
 * 布局：
 * - 左侧：场景缩略图列表（垂直，支持拖拽排序）
 * - 中间：当前选中帧大图预览
 * - 底部：完整时间轴（水平滚动）
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Plus, Trash2, Copy, MoveVertical, AlertCircle, GripVertical, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { Frame } from '@/types/workspace'
import { OptimizedImage } from '@/components/ui/OptimizedImage'
import { EmptyStates } from '@/components/ui/EmptyState'
import { SubtitlePanel } from './SubtitlePanel'
import { useTranslation } from '@/lib/i18n/context'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TimelineEditorProps {
  frames: Frame[]
  selectedFrameId: string | null
  selectedFrameIds?: string[]
  onFrameSelect: (frameId: string, multi?: boolean) => void
  onFrameAdd: () => void
  onFrameDelete: (frameId: string) => void
  onFrameDuplicate: (frameId: string) => void
  onFrameReorder: (fromIndex: number, toIndex: number) => void
  onFrameUpdate: (frameId: string, updates: Partial<Frame>) => void
  onBatchDelete?: (frameIds: string[]) => void
  subtitleTracks?: import('@/types').SubtitleTrack[]
  onSubtitleTracksChange?: (tracks: import('@/types').SubtitleTrack[]) => void
  onGenerateSubtitles?: () => void
  isGeneratingSubtitles?: boolean
}

/** 内联可编辑字段组件 */
function EditableField({
  value,
  onSave,
  type = 'text',
  className = '',
}: {
  value: string | number
  onSave: (newValue: string | number) => void
  type?: 'text' | 'number'
  className?: string
}) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value))
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const newValue = type === 'number' ? Number(editValue) : editValue
    if (newValue !== value) {
      onSave(newValue)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(String(value))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`group inline-flex items-center gap-1 hover:text-cyan-400 transition ${className}`}
        title={t('timeline.clickToEdit')}
        aria-label={`${value}, ${t('timeline.clickToEdit')}`}
      >
        <span>{value}</span>
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      {type === 'text' ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="px-2 py-0.5 bg-zinc-800 border border-cyan-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 min-w-[60px]"
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          min={1}
          max={60}
          className="px-2 py-0.5 bg-zinc-800 border border-cyan-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 w-16"
        />
      )}
      <button
        onClick={handleSave}
        className="p-0.5 hover:bg-green-500/20 text-green-400 rounded transition"
        title={t('timeline.saveEnter')}
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={handleCancel}
        className="p-0.5 hover:bg-red-500/20 text-red-400 rounded transition"
        title={t('timeline.cancelEsc')}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/** 可拖拽的帧项组件 */
function SortableFrameItem({
  frame,
  index,
  isSelected,
  onSelect,
}: {
  frame: Frame
  index: number
  isSelected: boolean
  onSelect: (e: React.MouseEvent) => void
}) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: frame.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${index * 50}ms`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group w-full rounded-lg border-2 transition-[border-color,background-color,box-shadow] duration-200
        animate-fade-in
        ${isSelected
          ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'
        }
        ${isDragging ? 'cursor-grabbing shadow-2xl scale-105' : 'cursor-default'}
      `}
    >
      <div className="flex items-start gap-2 p-3">
        {/* 拖拽手柄 */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 hover:bg-zinc-800 rounded cursor-grab active:cursor-grabbing transition mt-1"
          title={t('timeline.dragToReorder')}
        >
          <GripVertical className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400" />
        </button>

        {/* 内容区域（点击选中） */}
        <button
          onClick={(e) => onSelect(e)}
          className="flex-1 text-left min-w-0"
        >
          {/* 缩略图 */}
          <div className="relative aspect-video rounded overflow-hidden bg-zinc-800 mb-2">
            {frame.imageUrl ? (
              <OptimizedImage
                src={frame.imageUrl}
                alt={`Frame ${index + 1}`}
                fill
                className="object-cover"
                skeleton={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                {t('timeline.generatingShort')}
              </div>
            )}
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/90 rounded text-xs font-medium">
              {index + 1}
            </div>
          </div>

          {/* 信息 */}
          <div className="text-xs text-zinc-400 line-clamp-2 mb-1">
            {frame.sceneDescription}
          </div>
          <div className="text-xs text-zinc-600">
            {frame.duration}{t('timeline.seconds')}
          </div>
        </button>
      </div>
    </div>
  )
}

export function TimelineEditor({
  frames,
  selectedFrameId,
  selectedFrameIds = [],
  onFrameSelect,
  onFrameAdd,
  onFrameDelete,
  onFrameDuplicate,
  onFrameReorder,
  onFrameUpdate,
  onBatchDelete,
  subtitleTracks = [],
  onSubtitleTracksChange,
  onGenerateSubtitles,
  isGeneratingSubtitles = false,
}: TimelineEditorProps) {
  const { t } = useTranslation()
  const selectedFrame = frames.find(f => f.id === selectedFrameId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [frameToDelete, setFrameToDelete] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [showMobileSceneList, setShowMobileSceneList] = useState(false)

  // 处理帧选择（支持Shift+点击连选，Cmd/Ctrl+点击切换）
  const handleFrameClick = (frameId: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+点击：连选范围
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      for (let i = start; i <= end; i++) {
        if (i < frames.length) {
          onFrameSelect(frames[i].id, true)
        }
      }
    } else if (e.metaKey || e.ctrlKey) {
      // Cmd/Ctrl+点击：切换单个
      onFrameSelect(frameId, true)
      setLastSelectedIndex(index)
    } else {
      // 普通点击：单选
      onFrameSelect(frameId, false)
      setLastSelectedIndex(index)
    }
  }

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 移动后才触发拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = frames.findIndex(f => f.id === active.id)
      const newIndex = frames.findIndex(f => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        onFrameReorder(oldIndex, newIndex)
      }
    }
  }

  const handleDeleteClick = (frameId: string) => {
    setFrameToDelete(frameId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (frameToDelete) {
      onFrameDelete(frameToDelete)
      setShowDeleteConfirm(false)
      setFrameToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setFrameToDelete(null)
  }

  // 获取拖拽中的帧（用于 DragOverlay）
  const activeFrame = activeId ? frames.find(f => f.id === activeId) : null

  // 空状态检查
  if (frames.length === 0) {
    return (
      <EmptyStates.NoFrames onAddFrame={onFrameAdd} />
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* 批量操作栏 */}
        {selectedFrameIds.length > 1 && (
          <div className="h-14 border-b border-zinc-800 bg-cyan-500/10 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm font-medium text-cyan-400">
                已选 {selectedFrameIds.length} 个
              </span>
              <button
                onClick={() => {
                  // 清空选择
                  selectedFrameIds.forEach(id => onFrameSelect(id, false))
                }}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition"
              >
                {t('timeline.cancel')}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onBatchDelete && onBatchDelete(selectedFrameIds)}
                className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg text-xs sm:text-sm font-medium transition min-h-[44px]"
                aria-label={t('timeline.batchDelete')}
              >
                <Trash2 className="w-4 h-4 inline-block sm:mr-1" />
                <span className="hidden sm:inline">{t('timeline.batchDelete')}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:flex-row">
          {/* 左侧：场景列表（可拖拽排序） - 移动端隐藏，桌面端显示 */}
        <div className="hidden md:flex md:w-64 border-r border-zinc-800 flex-col" data-tour="frame-list">
          {/* 标题 */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">{t('timeline.sceneList')}</h3>
            <span className="text-xs text-zinc-600">{frames.length} {t('timeline.scenes')}</span>
          </div>

          {/* 场景缩略图（可排序） */}
          <div className="flex-1 overflow-y-auto p-3">
            <SortableContext
              items={frames.map(f => f.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {frames.map((frame, index) => (
                  <SortableFrameItem
                    key={frame.id}
                    frame={frame}
                    index={index}
                    isSelected={selectedFrameIds.includes(frame.id)}
                    onSelect={(e) => handleFrameClick(frame.id, index, e)}
                  />
                ))}
              </div>
            </SortableContext>

            {/* 添加场景 */}
            <button
              onClick={onFrameAdd}
              className="w-full mt-2 p-6 rounded-lg border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-cyan-400"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs">{t('timeline.addScene')}</span>
            </button>
          </div>

          {/* 底部统计 */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
            <div className="text-xs text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>{t('timeline.totalScenes')}</span>
                <span className="text-zinc-300">{frames.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('timeline.totalDuration')}</span>
                <span className="text-zinc-300">
                  {frames.reduce((sum, f) => sum + f.duration, 0)}{t('timeline.seconds')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 中间：主预览区 */}
        <div className="flex-1 flex flex-col" data-tour="preview-area">
          {/* 预览窗口 */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 flex items-center justify-center">
            {selectedFrame ? (
              <div className="max-w-5xl w-full">
                {/* 大图预览 */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-2xl border border-zinc-800/50">
                  {selectedFrame.imageUrl ? (
                    <OptimizedImage
                      src={selectedFrame.imageUrl}
                      alt={`Frame ${selectedFrame.index + 1}`}
                      fill
                      objectFit="contain"
                      className="w-full h-full"
                      priority={true}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-cyan-500/10 border-2 border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                          <Play className="w-8 h-8 text-cyan-400" />
                        </div>
                        <div className="text-zinc-400">{t('timeline.generating')}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 帧信息（支持内联编辑） */}
                <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-base sm:text-lg font-semibold mb-2">
                        {t('common.scene')} {selectedFrame.index + 1}
                      </h4>
                      <div className="text-sm text-zinc-400">
                        <EditableField
                          value={selectedFrame.sceneDescription}
                          onSave={(newValue) =>
                            onFrameUpdate(selectedFrame.id, { sceneDescription: String(newValue) })
                          }
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onFrameDuplicate(selectedFrame.id)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition group min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title={t('timeline.duplicateScene')}
                        aria-label={t('timeline.duplicateScene')}
                      >
                        <Copy className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(selectedFrame.id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition group min-w-[44px] min-h-[44px] flex items-center justify-center"
                        title={t('timeline.deleteScene')}
                        aria-label={t('timeline.deleteScene')}
                      >
                        <Trash2 className="w-4 h-4 text-zinc-400 group-hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div>
                      <div className="text-zinc-500 mb-1">{t('timeline.durationLabel')}</div>
                      <div className="font-medium">
                        <EditableField
                          value={selectedFrame.duration}
                          onSave={(newValue) =>
                            onFrameUpdate(selectedFrame.id, { duration: Number(newValue) })
                          }
                          type="number"
                        />
                      </div>
                    </div>
                    {selectedFrame.cameraMove && (
                      <div>
                        <div className="text-zinc-500 mb-1">{t('timeline.cameraMove')}</div>
                        <div className="font-medium">
                          <EditableField
                            value={selectedFrame.cameraMove}
                            onSave={(newValue) =>
                              onFrameUpdate(selectedFrame.id, { cameraMove: String(newValue) })
                            }
                            type="text"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-zinc-500 mb-1">{t('timeline.imagePrompt')}</div>
                      <div className="font-medium text-xs text-zinc-400">
                        <EditableField
                          value={selectedFrame.imagePrompt}
                          onSave={(newValue) =>
                            onFrameUpdate(selectedFrame.id, { imagePrompt: String(newValue) })
                          }
                          type="text"
                          className="line-clamp-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-zinc-500">
                <MoveVertical className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('timeline.selectScenePrompt')}</p>
              </div>
            )}
          </div>

          {/* 底部：时间轴 */}
          <div className="h-28 sm:h-32 border-t border-zinc-800 bg-zinc-950/50 p-3 sm:p-4" data-tour="timeline-track">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">{t('timeline.timeline')}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
              {frames.map((frame, index) => (
                <button
                  key={frame.id}
                  onClick={() => onFrameSelect(frame.id)}
                  className={`
                    flex-shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded overflow-hidden border-2 transition-[border-color,box-shadow] duration-200
                    ${frame.id === selectedFrameId
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 scale-105'
                      : 'border-zinc-800 hover:border-zinc-700 hover:scale-102'
                    }
                  `}
                >
                  {frame.imageUrl ? (
                    <div className="relative w-full h-full">
                      <OptimizedImage
                        src={frame.imageUrl}
                        alt={`Frame ${index + 1}`}
                        fill
                        className="object-cover"
                        skeleton={true}
                      />
                      <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/90 rounded text-[10px] font-medium">
                        {frame.duration}s
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 字幕面板（可折叠） */}
          {onSubtitleTracksChange && onGenerateSubtitles && (
            <div className="border-t border-zinc-800">
              {/* 折叠标题栏 */}
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-100">
                    字幕编辑
                  </span>
                  {subtitleTracks.length > 0 && (
                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                      {subtitleTracks.length} 个轨道
                    </span>
                  )}
                </div>
                {showSubtitles ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {/* 字幕面板内容 */}
              {showSubtitles && (
                <div className="h-80">
                  <SubtitlePanel
                    subtitleTracks={subtitleTracks}
                    onTracksChange={onSubtitleTracksChange}
                    onGenerateSubtitles={onGenerateSubtitles}
                    isGenerating={isGeneratingSubtitles}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 移动端场景列表按钮（浮动） */}
        <button
          onClick={() => setShowMobileSceneList(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-cyan-500 hover:bg-cyan-600 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          aria-label={t('timeline.viewSceneList')}
        >
          <MoveVertical className="w-6 h-6 text-white" />
        </button>

        {/* 移动端场景列表抽屉 */}
        {showMobileSceneList && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            {/* 遮罩 */}
            <div
              className="absolute inset-0 bg-black/70 animate-in fade-in duration-200"
              onClick={() => setShowMobileSceneList(false)}
            />

            {/* 抽屉内容 */}
            <div className="relative w-full max-h-[70vh] bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col">
              {/* 标题栏 */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-base font-semibold">{t('timeline.sceneList')}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{frames.length} {t('timeline.scenes')}</span>
                  <button
                    onClick={() => setShowMobileSceneList(false)}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 场景缩略图网格（移动端用网格更合适） */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3">
                  {frames.map((frame, index) => (
                    <button
                      key={frame.id}
                      onClick={() => {
                        onFrameSelect(frame.id)
                        setShowMobileSceneList(false)
                      }}
                      className={`
                        relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                        ${frame.id === selectedFrameId
                          ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                          : 'border-zinc-800'
                        }
                      `}
                    >
                      {frame.imageUrl ? (
                        <>
                          <OptimizedImage
                            src={frame.imageUrl}
                            alt={`Scene ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="text-xs font-medium text-white mb-1">
                              {t('common.scene')} {index + 1}
                            </div>
                            <div className="text-[10px] text-zinc-300 line-clamp-2">
                              {frame.sceneDescription}
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/90 rounded text-[10px] font-medium">
                            {frame.duration}{t('timeline.seconds')}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                <button
                  onClick={() => {
                    onFrameAdd()
                    setShowMobileSceneList(false)
                  }}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition flex items-center justify-center gap-2 text-zinc-400 hover:text-cyan-400 min-h-[44px]"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">{t('timeline.addScene')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认对话框 */}
        {showDeleteConfirm && frameToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t('timeline.confirmDelete')}</h3>
                  <p className="text-sm text-zinc-400">
                    {t('timeline.deleteWarning')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-medium transition"
                >
                  {t('timeline.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-medium transition"
                >
                  {t('timeline.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* 拖拽预览层（显示正在拖动的元素） */}
      <DragOverlay>
        {activeFrame ? (
          <div className="w-64 p-3 rounded-lg border-2 border-cyan-500 bg-cyan-500/30 shadow-2xl">
            <div className="relative aspect-video rounded overflow-hidden bg-zinc-800 mb-2">
              {activeFrame.imageUrl ? (
                <OptimizedImage
                  src={activeFrame.imageUrl}
                  alt="Dragging"
                  fill
                  className="object-cover opacity-80"
                  priority={true}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                  生成中...
                </div>
              )}
            </div>
            <div className="text-xs text-cyan-300 line-clamp-2">
              {activeFrame.sceneDescription}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
