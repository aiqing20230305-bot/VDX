/**
 * 字幕面板 - Timeline 字幕轨道显示和编辑
 */
'use client'

import { useState } from 'react'
import { SubtitleEntry, SubtitleTrack } from '@/types'
import { Plus, Trash2, Edit2, Download, Subtitles } from 'lucide-react'
import { generateSRT } from '@/lib/audio/subtitle-utils'
import { EmptyState } from '@/components/ui/EmptyState'

interface SubtitlePanelProps {
  subtitleTracks: SubtitleTrack[]
  onTracksChange: (tracks: SubtitleTrack[]) => void
  onGenerateSubtitles: () => void
  isGenerating?: boolean
}

export function SubtitlePanel({
  subtitleTracks,
  onTracksChange,
  onGenerateSubtitles,
  isGenerating = false,
}: SubtitlePanelProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    subtitleTracks[0]?.id || null
  )
  const [editingEntry, setEditingEntry] = useState<{
    trackId: string
    entryIndex: number
  } | null>(null)

  const selectedTrack = subtitleTracks.find((t) => t.id === selectedTrackId)

  // 添加新字幕轨道
  const handleAddTrack = () => {
    const newTrack: SubtitleTrack = {
      id: `track_${Date.now()}`,
      name: `字幕轨道 ${subtitleTracks.length + 1}`,
      language: 'zh',
      entries: [],
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    }
    onTracksChange([...subtitleTracks, newTrack])
    setSelectedTrackId(newTrack.id)
  }

  // 删除字幕轨道
  const handleDeleteTrack = (trackId: string) => {
    const confirmed = confirm('确定要删除这个字幕轨道吗？')
    if (!confirmed) return

    const newTracks = subtitleTracks.filter((t) => t.id !== trackId)
    onTracksChange(newTracks)

    if (selectedTrackId === trackId) {
      setSelectedTrackId(newTracks[0]?.id || null)
    }
  }

  // 编辑字幕文本
  const handleEditEntry = (trackId: string, entryIndex: number, newText: string) => {
    const trackIndex = subtitleTracks.findIndex((t) => t.id === trackId)
    if (trackIndex === -1) return

    const newTracks = [...subtitleTracks]
    newTracks[trackIndex].entries[entryIndex].text = newText
    onTracksChange(newTracks)
  }

  // 删除字幕条目
  const handleDeleteEntry = (trackId: string, entryIndex: number) => {
    const trackIndex = subtitleTracks.findIndex((t) => t.id === trackId)
    if (trackIndex === -1) return

    const newTracks = [...subtitleTracks]
    newTracks[trackIndex].entries.splice(entryIndex, 1)
    onTracksChange(newTracks)
  }

  // 导出 SRT 文件
  const handleExportSRT = (track: SubtitleTrack) => {
    const srtContent = generateSRT(track.entries)
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${track.name || 'subtitles'}.srt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 格式化时间显示（秒 → MM:SS.ms）
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-t border-zinc-800">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-100">字幕轨道</h3>
          {subtitleTracks.length > 0 && (
            <span className="text-xs text-zinc-500">
              ({subtitleTracks.length} 个轨道)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateSubtitles}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded transition-colors"
          >
            {isGenerating ? '生成中...' : '生成字幕'}
          </button>
          <button
            onClick={handleAddTrack}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加轨道
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧轨道列表 */}
        <div className="w-48 border-r border-zinc-800 overflow-y-auto">
          {subtitleTracks.length === 0 ? (
            <div className="p-4 flex items-center justify-center h-full">
              <div className="text-center scale-75">
                <EmptyState
                  icon={Subtitles}
                  title="暂无字幕轨道"
                  description="点击【添加轨道】开始"
                />
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {subtitleTracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedTrackId === track.id
                      ? 'bg-cyan-600/20 border border-cyan-600/50'
                      : 'bg-zinc-800 hover:bg-zinc-750 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-zinc-100 truncate">
                        {track.name}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {track.entries.length} 条字幕
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTrack(track.id)
                      }}
                      className="ml-2 p-1 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 右侧字幕条目列表 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTrack ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Subtitles}
                title="选择字幕轨道"
                description="从左侧选择一个字幕轨道以查看详情"
              />
            </div>
          ) : (
            <>
              {/* 轨道工具栏 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                <div className="text-sm text-zinc-400">
                  {selectedTrack.entries.length} 条字幕
                </div>
                <button
                  onClick={() => handleExportSRT(selectedTrack)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出 SRT
                </button>
              </div>

              {/* 字幕条目列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedTrack.entries.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <EmptyState
                      icon={Subtitles}
                      title="暂无字幕"
                      description="点击【生成字幕】或手动添加字幕条目"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTrack.entries.map((entry, index) => {
                      const isEditing =
                        editingEntry?.trackId === selectedTrack.id &&
                        editingEntry?.entryIndex === index

                      return (
                        <div
                          key={index}
                          className="p-3 bg-zinc-800 rounded border border-zinc-700 hover:border-zinc-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              {/* 时间轴 */}
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                <span className="font-mono">
                                  {formatTime(entry.startTime)}
                                </span>
                                <span>→</span>
                                <span className="font-mono">
                                  {formatTime(entry.endTime)}
                                </span>
                                <span className="text-zinc-600">
                                  ({(entry.endTime - entry.startTime).toFixed(1)}s)
                                </span>
                              </div>

                              {/* 字幕文本 */}
                              {isEditing ? (
                                <textarea
                                  value={entry.text}
                                  onChange={(e) =>
                                    handleEditEntry(
                                      selectedTrack.id,
                                      index,
                                      e.target.value
                                    )
                                  }
                                  onBlur={() => setEditingEntry(null)}
                                  className="w-full px-2 py-1 bg-zinc-900 border border-cyan-600 rounded text-sm text-zinc-100 focus:outline-none resize-none"
                                  rows={2}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  onClick={() =>
                                    setEditingEntry({
                                      trackId: selectedTrack.id,
                                      entryIndex: index,
                                    })
                                  }
                                  className="text-sm text-zinc-100 cursor-text hover:bg-zinc-750 px-2 py-1 rounded transition-colors"
                                >
                                  {entry.text}
                                </div>
                              )}
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setEditingEntry({
                                    trackId: selectedTrack.id,
                                    entryIndex: index,
                                  })
                                }
                                className="p-1.5 text-zinc-500 hover:text-cyan-400 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteEntry(selectedTrack.id, index)
                                }
                                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
