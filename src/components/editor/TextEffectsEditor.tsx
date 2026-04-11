'use client'

/**
 * 文字效果编辑器
 * 支持编辑字幕、标题、弹幕
 */
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type {
  Storyboard,
  SubtitleTrack,
  SubtitleEntry,
  TitleTrack,
  TitleEntry,
  BulletTrack,
  BulletEntry,
} from '@/types'
import { cn } from '@/lib/utils/cn'

interface TextEffectsEditorProps {
  storyboard: Storyboard
  onUpdate: (storyboard: Storyboard) => void
}

type TabType = 'subtitles' | 'titles' | 'bullets'

export function TextEffectsEditor({ storyboard, onUpdate }: TextEffectsEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('subtitles')

  // ─── 字幕相关方法 ───────────────────────────────────
  const addSubtitleTrack = () => {
    const newTrack: SubtitleTrack = {
      id: uuid(),
      entries: [{ startTime: 0, endTime: 3, text: '新字幕', position: 'bottom' }],
      enabled: true,
    }
    onUpdate({
      ...storyboard,
      subtitles: [...(storyboard.subtitles || []), newTrack],
    })
  }

  const updateSubtitle = (
    trackId: string,
    entryIndex: number,
    updates: Partial<SubtitleEntry>
  ) => {
    const updatedSubtitles = storyboard.subtitles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.map((entry, i) =>
          i === entryIndex ? { ...entry, ...updates } : entry
        ),
      }
    })
    onUpdate({ ...storyboard, subtitles: updatedSubtitles })
  }

  const addSubtitleEntry = (trackId: string) => {
    const updatedSubtitles = storyboard.subtitles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: [
          ...track.entries,
          { startTime: 0, endTime: 3, text: '新字幕', position: 'bottom' as const },
        ],
      }
    })
    onUpdate({ ...storyboard, subtitles: updatedSubtitles })
  }

  const deleteSubtitleEntry = (trackId: string, entryIndex: number) => {
    const updatedSubtitles = storyboard.subtitles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.filter((_, i) => i !== entryIndex),
      }
    })
    onUpdate({ ...storyboard, subtitles: updatedSubtitles })
  }

  const deleteSubtitleTrack = (trackId: string) => {
    const updatedSubtitles = storyboard.subtitles?.filter(track => track.id !== trackId)
    onUpdate({ ...storyboard, subtitles: updatedSubtitles })
  }

  // ─── 标题相关方法 ───────────────────────────────────
  const addTitleTrack = () => {
    const newTrack: TitleTrack = {
      id: uuid(),
      entries: [{ startTime: 0, endTime: 2, text: '新标题', position: 'center' }],
      enabled: true,
    }
    onUpdate({
      ...storyboard,
      titles: [...(storyboard.titles || []), newTrack],
    })
  }

  const updateTitle = (
    trackId: string,
    entryIndex: number,
    updates: Partial<TitleEntry>
  ) => {
    const updatedTitles = storyboard.titles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.map((entry, i) =>
          i === entryIndex ? { ...entry, ...updates } : entry
        ),
      }
    })
    onUpdate({ ...storyboard, titles: updatedTitles })
  }

  const addTitleEntry = (trackId: string) => {
    const updatedTitles = storyboard.titles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: [
          ...track.entries,
          { startTime: 0, endTime: 2, text: '新标题', position: 'center' as const },
        ],
      }
    })
    onUpdate({ ...storyboard, titles: updatedTitles })
  }

  const deleteTitleEntry = (trackId: string, entryIndex: number) => {
    const updatedTitles = storyboard.titles?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.filter((_, i) => i !== entryIndex),
      }
    })
    onUpdate({ ...storyboard, titles: updatedTitles })
  }

  const deleteTitleTrack = (trackId: string) => {
    const updatedTitles = storyboard.titles?.filter(track => track.id !== trackId)
    onUpdate({ ...storyboard, titles: updatedTitles })
  }

  // ─── 弹幕相关方法 ───────────────────────────────────
  const addBulletTrack = () => {
    const newTrack: BulletTrack = {
      id: uuid(),
      entries: [{ id: uuid(), time: 1, text: '666' }],
      enabled: true,
    }
    onUpdate({
      ...storyboard,
      bullets: [...(storyboard.bullets || []), newTrack],
    })
  }

  const updateBullet = (
    trackId: string,
    entryIndex: number,
    updates: Partial<BulletEntry>
  ) => {
    const updatedBullets = storyboard.bullets?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.map((entry, i) =>
          i === entryIndex ? { ...entry, ...updates } : entry
        ),
      }
    })
    onUpdate({ ...storyboard, bullets: updatedBullets })
  }

  const addBulletEntry = (trackId: string) => {
    const updatedBullets = storyboard.bullets?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: [
          ...track.entries,
          { id: uuid(), time: 0, text: '新弹幕' },
        ],
      }
    })
    onUpdate({ ...storyboard, bullets: updatedBullets })
  }

  const deleteBulletEntry = (trackId: string, entryIndex: number) => {
    const updatedBullets = storyboard.bullets?.map(track => {
      if (track.id !== trackId) return track
      return {
        ...track,
        entries: track.entries.filter((_, i) => i !== entryIndex),
      }
    })
    onUpdate({ ...storyboard, bullets: updatedBullets })
  }

  const deleteBulletTrack = (trackId: string) => {
    const updatedBullets = storyboard.bullets?.filter(track => track.id !== trackId)
    onUpdate({ ...storyboard, bullets: updatedBullets })
  }

  return (
    <div className="bg-[var(--bg-tertiary)] border-t border-white/10 max-h-96 overflow-y-auto">
      <div className="sticky top-0 bg-[var(--bg-tertiary)] border-b border-white/10 px-6 py-3 z-10">
        {/* Tab 切换 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('subtitles')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'subtitles'
                ? 'bg-gradient-to-r bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            )}
          >
            字幕 {storyboard.subtitles && `(${storyboard.subtitles.length})`}
          </button>
          <button
            onClick={() => setActiveTab('titles')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'titles'
                ? 'bg-gradient-to-r bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            )}
          >
            标题 {storyboard.titles && `(${storyboard.titles.length})`}
          </button>
          <button
            onClick={() => setActiveTab('bullets')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'bullets'
                ? 'bg-gradient-to-r bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            )}
          >
            弹幕 {storyboard.bullets && `(${storyboard.bullets.length})`}
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        {/* 字幕编辑面板 */}
        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            <button
              onClick={addSubtitleTrack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
            >
              <Plus size={16} />
              <span className="text-sm">添加字幕轨道</span>
            </button>

            {storyboard.subtitles && storyboard.subtitles.length > 0 ? (
              storyboard.subtitles.map((track, trackIndex) => (
                <div key={track.id} className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-zinc-100">
                      字幕轨道 {trackIndex + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addSubtitleEntry(track.id)}
                        className="px-3 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 transition-colors"
                      >
                        + 添加
                      </button>
                      <button
                        onClick={() => deleteSubtitleTrack(track.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {track.entries.map((entry, i) => (
                      <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center">
                        <span className="text-xs text-zinc-500 w-6">{i + 1}</span>

                        <input
                          type="text"
                          value={entry.text}
                          onChange={(e) => updateSubtitle(track.id, i, { text: e.target.value })}
                          placeholder="字幕文本"
                          className="px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-sm focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <input
                          type="number"
                          value={entry.startTime}
                          onChange={(e) => updateSubtitle(track.id, i, {
                            startTime: parseFloat(e.target.value)
                          })}
                          placeholder="开始"
                          className="w-20 px-2 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-xs focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <input
                          type="number"
                          value={entry.endTime}
                          onChange={(e) => updateSubtitle(track.id, i, {
                            endTime: parseFloat(e.target.value)
                          })}
                          placeholder="结束"
                          className="w-20 px-2 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-xs focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <button
                          onClick={() => deleteSubtitleEntry(track.id, i)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">
                暂无字幕轨道，点击上方按钮添加
              </div>
            )}
          </div>
        )}

        {/* 标题编辑面板 */}
        {activeTab === 'titles' && (
          <div className="space-y-4">
            <button
              onClick={addTitleTrack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
            >
              <Plus size={16} />
              <span className="text-sm">添加标题轨道</span>
            </button>

            {storyboard.titles && storyboard.titles.length > 0 ? (
              storyboard.titles.map((track, trackIndex) => (
                <div key={track.id} className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-zinc-100">
                      标题轨道 {trackIndex + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addTitleEntry(track.id)}
                        className="px-3 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 transition-colors"
                      >
                        + 添加
                      </button>
                      <button
                        onClick={() => deleteTitleTrack(track.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {track.entries.map((entry, i) => (
                      <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 items-center">
                        <span className="text-xs text-zinc-500 w-6">{i + 1}</span>

                        <input
                          type="text"
                          value={entry.text}
                          onChange={(e) => updateTitle(track.id, i, { text: e.target.value })}
                          placeholder="标题文本"
                          className="px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-sm focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <input
                          type="number"
                          value={entry.startTime}
                          onChange={(e) => updateTitle(track.id, i, {
                            startTime: parseFloat(e.target.value)
                          })}
                          placeholder="开始"
                          className="w-20 px-2 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-xs focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <input
                          type="number"
                          value={entry.endTime}
                          onChange={(e) => updateTitle(track.id, i, {
                            endTime: parseFloat(e.target.value)
                          })}
                          placeholder="结束"
                          className="w-20 px-2 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-xs focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <button
                          onClick={() => deleteTitleEntry(track.id, i)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">
                暂无标题轨道，点击上方按钮添加
              </div>
            )}
          </div>
        )}

        {/* 弹幕编辑面板 */}
        {activeTab === 'bullets' && (
          <div className="space-y-4">
            <button
              onClick={addBulletTrack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-all"
            >
              <Plus size={16} />
              <span className="text-sm">添加弹幕轨道</span>
            </button>

            {storyboard.bullets && storyboard.bullets.length > 0 ? (
              storyboard.bullets.map((track, trackIndex) => (
                <div key={track.id} className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-zinc-100">
                      弹幕轨道 {trackIndex + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addBulletEntry(track.id)}
                        className="px-3 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-white/10 text-zinc-300 hover:border-cyan-500/30 transition-colors"
                      >
                        + 添加
                      </button>
                      <button
                        onClick={() => deleteBulletTrack(track.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {track.entries.map((entry, i) => (
                      <div key={entry.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center">
                        <span className="text-xs text-zinc-500 w-6">{i + 1}</span>

                        <input
                          type="text"
                          value={entry.text}
                          onChange={(e) => updateBullet(track.id, i, { text: e.target.value })}
                          placeholder="弹幕文本"
                          className="px-3 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-sm focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <input
                          type="number"
                          value={entry.time}
                          onChange={(e) => updateBullet(track.id, i, {
                            time: parseFloat(e.target.value)
                          })}
                          placeholder="时间"
                          className="w-24 px-2 py-2 rounded bg-[var(--bg-tertiary)] border border-white/10 bg-zinc-900/50 text-zinc-100 text-xs focus:border-cyan-500/30 focus:outline-none transition-colors"
                        />

                        <button
                          onClick={() => deleteBulletEntry(track.id, i)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">
                暂无弹幕轨道，点击上方按钮添加
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
