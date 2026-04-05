'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, FileText, Image, Video, Trash2, Eye, RotateCcw, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface HistoryRecord {
  id: string
  type: 'script' | 'storyboard' | 'video'
  title: string
  description?: string
  createdAt: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  metadata: Record<string, any>
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onLoadRecord?: (record: HistoryRecord) => void
}

const typeConfig = {
  script: { icon: FileText, label: '脚本', color: 'text-blue-400' },
  storyboard: { icon: Image, label: '分镜', color: 'text-purple-400' },
  video: { icon: Video, label: '视频', color: 'text-green-400' },
}

const statusConfig = {
  pending: { label: '等待中', color: 'text-zinc-400' },
  running: { label: '生成中', color: 'text-yellow-400' },
  completed: { label: '已完成', color: 'text-green-400' },
  failed: { label: '失败', color: 'text-red-400' },
}

export function HistorySidebar({ isOpen, onClose, onLoadRecord }: Props) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'script' | 'storyboard' | 'video'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)

  // 加载历史记录
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, filterType])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.append('type', filterType)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/history?${params}`)
      const data = await res.json()

      if (data.success) {
        setRecords(data.data.records)
      }
    } catch (error) {
      console.error('[Load History Error]', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (record: HistoryRecord) => {
    if (!confirm(`确定删除 "${record.title}" 吗？`)) return

    try {
      const res = await fetch(`/api/history?id=${record.id}&type=${record.type}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        setRecords(records.filter((r) => r.id !== record.id))
        if (selectedRecord?.id === record.id) {
          setSelectedRecord(null)
        }
      }
    } catch (error) {
      console.error('[Delete Error]', error)
      alert('删除失败')
    }
  }

  const handleLoad = (record: HistoryRecord) => {
    onLoadRecord?.(record)
    onClose()
  }

  // 格式化时间
  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 筛选记录
  const filteredRecords = records.filter((r) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* 侧边栏 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[480px] glass border-l border-white/10 z-50 flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="text-purple-400" size={20} />
                <h2 className="text-lg font-semibold text-zinc-100">历史记录</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={20} className="text-zinc-400" />
              </button>
            </div>

            {/* 搜索和筛选 */}
            <div className="px-6 py-4 border-b border-white/10 space-y-3">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  placeholder="搜索历史记录..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadHistory()}
                  className="w-full pl-10 pr-4 py-2 glass border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>

              {/* 类型筛选 */}
              <div className="flex gap-2">
                {(['all', 'script', 'storyboard', 'video'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      filterType === type
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'glass border border-white/10 text-zinc-400 hover:border-white/20'
                    )}
                  >
                    {type === 'all' ? '全部' : typeConfig[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 记录列表 */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-zinc-500 text-sm">
                  加载中...
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-sm">
                  <Clock size={32} className="mb-2 opacity-50" />
                  <p>暂无历史记录</p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const typeInfo = typeConfig[record.type]
                  const statusInfo = statusConfig[record.status]
                  const Icon = typeInfo.icon

                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'glass border rounded-xl p-4 cursor-pointer transition-all group',
                        selectedRecord?.id === record.id
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      )}
                      onClick={() => setSelectedRecord(record)}
                    >
                      {/* 头部 */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className={cn('p-2 rounded-lg glass', typeInfo.color)}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-zinc-200 truncate">
                            {record.title}
                          </h3>
                          {record.description && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {record.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 元信息 */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={statusInfo.color}>{statusInfo.label}</span>
                        <span className="text-zinc-500">{formatTime(record.createdAt)}</span>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleLoad(record)
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Eye size={12} />
                          查看
                        </button>
                        {record.type === 'storyboard' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLoad(record)
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium transition-colors"
                          >
                            <RotateCcw size={12} />
                            重新生成
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(record)
                          }}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
