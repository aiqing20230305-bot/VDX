/**
 * Export Panel - 导出配置面板
 */
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Download, Loader2, CheckCircle2, XCircle, ArrowLeft, Music, Upload, Volume2,
  Sparkles, Clock, HardDrive, History, Layers, Trash2, ChevronDown, ChevronUp, Type, Image as ImageIcon
} from 'lucide-react'
import type { Frame, ExportConfig, ExportPreset } from '@/types/workspace'
import type { SubtitleTrack } from '@/types'
import { PRESET_AUDIOS, type PresetAudio } from '@/lib/audio/presets'
import { useTranslation } from '@/lib/i18n/context'
import { logger } from '@/lib/utils/logger'
import {
  EXPORT_PRESETS,
  estimateExport,
  recommendPreset,
  formatFileSize,
  formatRenderTime,
} from '@/lib/export/presets'
import {
  getExportHistory,
  addExportHistory,
  deleteExportHistory,
  formatExportTime,
  type ExportHistoryItem,
} from '@/lib/export/history'
import {
  BATCH_EXPORT_PRESETS,
  generateBatchExportTasks,
  estimateBatchTotalSize,
} from '@/lib/export/batch'
import {
  FORMAT_OPTIONS,
  QUALITY_PRESETS,
  WATERMARK_POSITIONS,
  DEFAULT_WATERMARK_CONFIG,
} from '@/lib/export/advanced'
import {
  recordExportData,
  calculateSceneComplexity,
  extractTransitionTypes,
  type ExportFeatures,
} from '@/lib/export/prediction-data'
import { FilterSelector } from '@/components/export/FilterSelector'
import type { FilterId } from '@/lib/video/filters'

const log = logger.context('ExportPanel')

interface ExportPanelProps {
  frames: Frame[]
  subtitleTracks?: SubtitleTrack[]
  onExport: (config: ExportConfig) => void
  onBack?: () => void
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error'

export function ExportPanel({ frames, subtitleTracks = [], onExport, onBack }: ExportPanelProps) {
  const { t } = useTranslation()

  // 智能推荐预设
  const recommendedPreset = useMemo(() => recommendPreset(frames), [frames])
  const recommendedConfig = useMemo(
    () => EXPORT_PRESETS.find(p => p.id === recommendedPreset),
    [recommendedPreset]
  )

  const [config, setConfig] = useState<ExportConfig>({
    preset: recommendedPreset,
    projectInfo: {
      title: '',
      description: '',
    },
    videoSettings: {
      ...recommendedConfig!.videoSettings,
    },
    audioSettings: {
      enabled: false,
      source: 'none',
      volume: 80,
    },
    subtitleTracks: subtitleTracks,
    style: {
      theme: 'modern',
      mood: 'professional',
    },
    filterSettings: {
      filterId: 'none',
      intensity: 100,
    },
  })

  // 实时预估
  const estimate = useMemo(() => estimateExport(frames, config), [frames, config])

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [exportedVideoUrl, setExportedVideoUrl] = useState('')
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null)
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null)
  const audioFileInputRef = useRef<HTMLInputElement>(null)
  const audioPreviewRef = useRef<HTMLAudioElement>(null)

  // 历史记录和批量导出
  const [showHistory, setShowHistory] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([])
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedBatchPreset, setSelectedBatchPreset] = useState<string | null>(null)

  // 高级选项
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 加载历史记录
  useEffect(() => {
    setExportHistory(getExportHistory())
  }, [])

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac)$/i)) {
      alert('请上传 MP3, WAV, M4A 或 AAC 格式的音频文件')
      return
    }

    // 验证文件大小（最大 50MB）
    if (file.size > 50 * 1024 * 1024) {
      alert('音频文件过大，请上传小于 50MB 的文件')
      return
    }

    setUploadedAudioFile(file)
    setConfig(prev => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings!,
        enabled: true,
        source: 'upload',
        uploadedFile: file.name,
      }
    }))
  }

  const handleAudioPresetSelect = (presetId: string) => {
    setConfig(prev => ({
      ...prev,
      audioSettings: {
        ...prev.audioSettings!,
        enabled: true,
        source: 'preset',
        presetId,
      }
    }))
  }

  const handleExportPresetSelect = (presetId: ExportPreset) => {
    const preset = EXPORT_PRESETS.find(p => p.id === presetId)
    if (!preset) return

    setConfig(prev => ({
      ...prev,
      preset: presetId,
      videoSettings: {
        ...preset.videoSettings,
      },
    }))
  }

  const handleLoadHistoryConfig = (historyItem: ExportHistoryItem) => {
    setConfig(historyItem.config)
    setShowHistory(false)
  }

  const handleDeleteHistory = (id: string) => {
    deleteExportHistory(id)
    setExportHistory(getExportHistory())
  }

  const handleBatchExport = async () => {
    if (!selectedBatchPreset) return

    const batchTasks = generateBatchExportTasks(config, selectedBatchPreset)
    setExportStatus('exporting')
    setProgress(0)

    try {
      // 并行提交所有任务（提升导出效率）
      let completedCount = 0
      const totalTasks = batchTasks.length

      // 为每个任务添加进度回调
      const taskPromises = batchTasks.map(async (taskConfig) => {
        try {
          const result = await submitRenderTask(taskConfig)
          completedCount++
          setProgress(Math.round((completedCount / totalTasks) * 100))
          return { status: 'fulfilled', value: result, config: taskConfig }
        } catch (error) {
          completedCount++
          setProgress(Math.round((completedCount / totalTasks) * 100))
          return { status: 'rejected', reason: error, config: taskConfig }
        }
      })

      // 等待所有任务完成（使用 Promise.allSettled 保证容错）
      const results = await Promise.all(taskPromises)

      // 统计结果
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failedCount = results.filter(r => r.status === 'rejected').length

      // 根据结果设置状态
      if (failedCount === 0) {
        setExportStatus('success')
      } else if (successCount === 0) {
        setExportStatus('error')
        setErrorMessage(`所有任务失败 (${failedCount}/${totalTasks})`)
      } else {
        setExportStatus('success')
        // 部分成功的情况，在成功消息中提示
      }
    } catch (error: any) {
      setExportStatus('error')
      setErrorMessage(error.message || '批量导出失败')
    }
  }

  const submitRenderTask = async (taskConfig: ExportConfig) => {
    // 复用现有的导出逻辑
    const response = await fetch('/api/video/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: `project_${Date.now()}`,
        projectTitle: taskConfig.projectInfo.title,
        frames,
        config: {
          resolution: taskConfig.videoSettings.resolution,
          fps: taskConfig.videoSettings.fps,
          format: taskConfig.videoSettings.format || 'mp4',
          quality: taskConfig.videoSettings.quality || 80,
        },
        subtitleTracks: taskConfig.subtitleTracks,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create render task')
    }

    return response.json()
  }

  const togglePreview = (audioUrl: string) => {
    if (isPlayingPreview === audioUrl) {
      audioPreviewRef.current?.pause()
      setIsPlayingPreview(null)
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = audioUrl
        audioPreviewRef.current.play()
        setIsPlayingPreview(audioUrl)
      }
    }
  }

  const handleExport = async () => {
    setExportStatus('exporting')
    setProgress(0)
    setErrorMessage('')

    // 记录开始时间（用于计算实际渲染时间）
    const renderStartTime = Date.now()

    try {
      // 处理音频文件上传（如果需要）
      let audioPath: string | undefined = undefined

      if (config.audioSettings?.enabled) {
        if (config.audioSettings.source === 'upload' && uploadedAudioFile) {
          // 上传音频文件
          const formData = new FormData()
          formData.append('audio', uploadedAudioFile)

          const uploadResponse = await fetch('/api/audio/upload', {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload audio file')
          }

          const uploadResult = await uploadResponse.json()
          audioPath = uploadResult.path
        } else if (config.audioSettings.source === 'preset' && config.audioSettings.presetId) {
          // 使用预设音乐
          const preset = PRESET_AUDIOS.find(a => a.id === config.audioSettings?.presetId)
          if (preset) {
            audioPath = preset.url
          }
        }
      }

      // 调用视频渲染API
      const response = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `project_${Date.now()}`,
          projectTitle: config.projectInfo.title,
          frames,
          config: {
            resolution: config.videoSettings.resolution,
            fps: config.videoSettings.fps,
            format: config.videoSettings.format || 'mp4',
            quality: 80,
          },
          audioPath,
          subtitleTracks: config.subtitleTracks,
          filterSettings: config.filterSettings,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create render task')
      }

      const { taskId, queueName } = await response.json()

      // 使用 SSE 订阅进度更新
      const eventSource = new EventSource(
        `/api/tasks/progress?taskId=${taskId}&queueName=${queueName}`
      )

      eventSource.addEventListener('progress', (event) => {
        const progressData = JSON.parse(event.data)
        setProgress(Math.round(progressData.progress || 0))
      })

      eventSource.addEventListener('completed', (event) => {
        const result = JSON.parse(event.data)
        setExportStatus('success')
        setProgress(100)
        setExportedVideoUrl(result.videoUrl)
        eventSource.close()

        // 计算实际渲染时间（秒）
        const actualRenderTime = (Date.now() - renderStartTime) / 1000

        // 记录实际导出数据（用于 ML 模型训练）
        const features: ExportFeatures = {
          frameCount: frames.length,
          resolution: config.videoSettings.resolution,
          fps: config.videoSettings.fps,
          videoDuration: estimate.duration,
          sceneComplexity: calculateSceneComplexity(frames),
          transitionCount: frames.length - 1,
          transitionTypes: extractTransitionTypes(frames),
          hasAudio: config.audioSettings?.enabled || false,
          hasSubtitles: (config.subtitleTracks?.length || 0) > 0,
          hasWatermark: config.watermark?.enabled || false,
          subtitleTrackCount: config.subtitleTracks?.length || 0,
          format: config.videoSettings.format || 'mp4',
          quality: config.videoSettings.quality || 80,
        }

        recordExportData(features, {
          renderTime: actualRenderTime,
          fileSize: result.fileSize,
          timestamp: Date.now(),
        })

        // 保存到历史记录
        addExportHistory({
          config,
          videoUrl: result.videoUrl,
          fileSize: result.fileSize,
          duration: estimate.duration,
          status: 'completed',
        })
        setExportHistory(getExportHistory())

        onExport(config) // 通知父组件
      })

      eventSource.addEventListener('failed', (event) => {
        const error = JSON.parse(event.data)
        setExportStatus('error')
        setErrorMessage(error.message || '渲染失败')
        eventSource.close()
      })

      eventSource.onerror = (error) => {
        log.error('SSE connection error', error)
        setExportStatus('error')
        setErrorMessage('连接失败，请重试')
        eventSource.close()
      }

      // 10分钟超时
      setTimeout(() => {
        if (exportStatus === 'exporting') {
          setExportStatus('error')
          setErrorMessage('渲染超时')
          eventSource.close()
        }
      }, 600000)
    } catch (error: any) {
      setExportStatus('error')
      setErrorMessage(error.message || '导出失败')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      {onBack && (
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 bg-zinc-950/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition min-h-[44px]"
            disabled={exportStatus === 'exporting'}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('export.backToEdit')}
          </button>

          {/* 历史记录按钮 */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            disabled={exportStatus === 'exporting'}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition min-h-[40px] disabled:opacity-50"
          >
            <History className="w-4 h-4" />
            历史记录 ({exportHistory.length})
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* 导出状态显示 */}
        {exportStatus !== 'idle' && (
          <div className={`p-4 rounded-xl border ${
            exportStatus === 'exporting' ? 'bg-cyan-500/5 border-cyan-500/30' :
            exportStatus === 'success' ? 'bg-green-500/5 border-green-500/30' :
            'bg-red-500/5 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {exportStatus === 'exporting' && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
              {exportStatus === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
              {exportStatus === 'error' && <XCircle className="w-5 h-5 text-red-400" />}

              <div className="flex-1">
                <div className="font-medium mb-1">
                  {exportStatus === 'exporting' && t('export.exporting')}
                  {exportStatus === 'success' && t('export.exportSuccess')}
                  {exportStatus === 'error' && t('export.exportFailed')}
                </div>
                {exportStatus === 'exporting' && (
                  <div className="text-sm text-zinc-400">
                    {t('export.progress')}: {progress}%
                    <div className="mt-2 w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-[width] duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {exportStatus === 'error' && (
                  <div className="text-sm text-red-400">{errorMessage}</div>
                )}
                {exportStatus === 'success' && exportedVideoUrl && (
                  <div className="flex gap-2 mt-2">
                    <a
                      href={`/api/video/download?url=${encodeURIComponent(exportedVideoUrl)}`}
                      download
                      className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      {t('export.download')}
                    </a>
                    <span className="text-zinc-600">|</span>
                    <a
                      href={exportedVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                    >
                      {t('export.preview')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 导出预设选择 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-300">导出预设</h3>
            {config.preset === recommendedPreset && (
              <span className="flex items-center gap-1 text-xs text-cyan-400 px-2 py-1 bg-cyan-500/10 rounded-full">
                <Sparkles className="w-3 h-3" />
                智能推荐
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXPORT_PRESETS.map(preset => {
              const isSelected = config.preset === preset.id
              const isRecommended = preset.id === recommendedPreset

              return (
                <button
                  key={preset.id}
                  onClick={() => handleExportPresetSelect(preset.id)}
                  disabled={exportStatus === 'exporting'}
                  className={`
                    relative p-3 rounded-lg text-left transition min-h-[88px]
                    ${isSelected
                      ? 'bg-cyan-500/20 border-2 border-cyan-500'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-2 border-transparent'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {/* 推荐标签 */}
                  {isRecommended && !isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[10px] text-cyan-400 px-1.5 py-0.5 bg-cyan-500/10 rounded">
                        推荐
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-200 mb-1">
                        {preset.name}
                      </div>
                      <div className="text-xs text-zinc-500 leading-snug">
                        {preset.description}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 实时预估 */}
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
          <div className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            导出预估
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-zinc-500 mb-1">视频时长</div>
              <div className="text-zinc-300 font-medium">
                {Math.floor(estimate.duration / 60)}分{Math.round(estimate.duration % 60)}秒
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">文件大小</div>
              <div className="text-zinc-300 font-medium">
                {formatFileSize(estimate.fileSizeMin)} - {formatFileSize(estimate.fileSizeMax)}
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                <Clock className="w-3 h-3" />
                渲染时间
                {estimate.usedML && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    AI 预测
                  </span>
                )}
              </div>
              <div className="text-zinc-300 font-medium">
                {formatRenderTime(estimate.renderTime)}
              </div>
              {estimate.confidence && (
                <div className="text-[10px] text-zinc-500 mt-0.5">
                  预估置信度: {Math.round(estimate.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 项目信息 */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t('export.projectInfo')}</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={config.projectInfo.title}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                projectInfo: { ...prev.projectInfo, title: e.target.value }
              }))}
              placeholder={t('export.projectTitle')}
              disabled={exportStatus === 'exporting'}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 min-h-[44px]"
            />
            <textarea
              value={config.projectInfo.description}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                projectInfo: { ...prev.projectInfo, description: e.target.value }
              }))}
              placeholder={t('export.projectDescription')}
              rows={3}
              disabled={exportStatus === 'exporting'}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* 视频设置 */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">{t('export.videoSettings')}</h3>
          <div className="space-y-3">
            <select
              value={config.videoSettings.resolution}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                preset: 'custom',
                videoSettings: { ...prev.videoSettings, resolution: e.target.value as any }
              }))}
              disabled={exportStatus === 'exporting'}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 min-h-[44px]"
            >
              <option value="720p">{t('export.resolution.720p')}</option>
              <option value="1080p">{t('export.resolution.1080p')}</option>
              <option value="4k">{t('export.resolution.4k')}</option>
            </select>
            <select
              value={config.videoSettings.fps}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                preset: 'custom',
                videoSettings: { ...prev.videoSettings, fps: Number(e.target.value) as any }
              }))}
              disabled={exportStatus === 'exporting'}
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-50 min-h-[44px]"
            >
              <option value={24}>{t('export.fps.24')}</option>
              <option value={30}>{t('export.fps.30')}</option>
              <option value={60}>{t('export.fps.60')}</option>
            </select>
          </div>
        </div>

        {/* 音频配乐 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-300">{t('export.audio.title')}</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.audioSettings?.enabled || false}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  audioSettings: {
                    ...prev.audioSettings!,
                    enabled: e.target.checked,
                    source: e.target.checked ? (prev.audioSettings?.source || 'preset') : 'none',
                  }
                }))}
                disabled={exportStatus === 'exporting'}
                className="w-4 h-4 accent-cyan-500"
              />
              <span className="text-xs text-zinc-500">{t('export.audio.enable')}</span>
            </label>
          </div>

          {config.audioSettings?.enabled && (
            <div className="space-y-3">
              {/* 音源选择 */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    audioSettings: { ...prev.audioSettings!, source: 'preset' }
                  }))}
                  disabled={exportStatus === 'exporting'}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition min-h-[44px] ${
                    config.audioSettings.source === 'preset'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  } disabled:opacity-50`}
                >
                  <Music className="w-4 h-4 inline-block mr-1" />
                  {t('export.audio.preset')}
                </button>
                <button
                  onClick={() => {
                    setConfig(prev => ({
                      ...prev,
                      audioSettings: { ...prev.audioSettings!, source: 'upload' }
                    }))
                    audioFileInputRef.current?.click()
                  }}
                  disabled={exportStatus === 'exporting'}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition min-h-[44px] ${
                    config.audioSettings.source === 'upload'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                  } disabled:opacity-50`}
                >
                  <Upload className="w-4 h-4 inline-block mr-1" />
                  {t('export.audio.upload')}
                </button>
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/m4a,audio/aac,.mp3,.wav,.m4a,.aac"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </div>

              {/* 预设音乐列表 */}
              {config.audioSettings.source === 'preset' && (
                <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2 border border-zinc-800 rounded-lg p-2">
                  {PRESET_AUDIOS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAudioPresetSelect(preset.id)}
                      className={`w-full p-3 rounded-lg text-left transition min-h-[52px] ${
                        config.audioSettings?.presetId === preset.id
                          ? 'bg-cyan-500/20 border border-cyan-500/50'
                          : 'bg-zinc-900 hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-200 truncate">{preset.name}</div>
                          <div className="text-xs text-zinc-500 mt-1 truncate">
                            {preset.genre} · {preset.mood} · {preset.duration}秒 · {preset.bpm} BPM
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePreview(preset.preview || preset.url)
                          }}
                          className="p-2 hover:bg-zinc-700 rounded min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
                        >
                          <Music className={`w-4 h-4 ${isPlayingPreview === (preset.preview || preset.url) ? 'text-cyan-400' : 'text-zinc-500'}`} />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 已上传文件显示 */}
              {config.audioSettings.source === 'upload' && uploadedAudioFile && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-sm text-zinc-300 mb-1">{t('export.audio.selected')}</div>
                  <div className="text-xs text-zinc-500 truncate">{uploadedAudioFile.name}</div>
                  <div className="text-xs text-zinc-600 mt-1">
                    {t('export.audio.size')}: {(uploadedAudioFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}

              {/* 音量控制 */}
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs text-zinc-400">{t('export.audio.volume')}</span>
                  <span className="text-xs text-cyan-400 ml-auto">
                    {config.audioSettings.volume}%
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.audioSettings.volume}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    audioSettings: {
                      ...prev.audioSettings!,
                      volume: Number(e.target.value)
                    }
                  }))}
                  disabled={exportStatus === 'exporting'}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}

          {/* 隐藏的音频预览元素 */}
          <audio
            ref={audioPreviewRef}
            onEnded={() => setIsPlayingPreview(null)}
            onPause={() => setIsPlayingPreview(null)}
          />
        </div>

        {/* 视频滤镜 */}
        <div>
          <FilterSelector
            value={config.filterSettings?.filterId || 'none'}
            intensity={config.filterSettings?.intensity || 100}
            onChange={(filterId, intensity) =>
              setConfig((prev) => ({
                ...prev,
                filterSettings: { filterId, intensity },
              }))
            }
          />
        </div>

        {/* 高级选项（折叠） */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 rounded-lg transition"
            disabled={exportStatus === 'exporting'}
          >
            <span className="text-sm font-semibold text-zinc-300">高级选项</span>
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4 text-zinc-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4 p-4 border border-zinc-800 rounded-lg">
              {/* 视频格式 */}
              <div>
                <label className="text-sm font-semibold text-zinc-300 mb-3 block">视频格式</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      videoSettings: { ...prev.videoSettings, format: 'mp4' }
                    }))}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      config.videoSettings.format === 'mp4'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    disabled={exportStatus === 'exporting'}
                  >
                    <div className="font-medium">MP4</div>
                    <div className="text-xs opacity-70 mt-0.5">H.264 (推荐)</div>
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      videoSettings: { ...prev.videoSettings, format: 'webm' }
                    }))}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      config.videoSettings.format === 'webm'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    disabled={exportStatus === 'exporting'}
                  >
                    <div className="font-medium">WebM</div>
                    <div className="text-xs opacity-70 mt-0.5">VP9 (更小)</div>
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({
                      ...prev,
                      videoSettings: { ...prev.videoSettings, format: 'mov' }
                    }))}
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      config.videoSettings.format === 'mov'
                        ? 'bg-cyan-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                    }`}
                    disabled={exportStatus === 'exporting'}
                  >
                    <div className="font-medium">MOV</div>
                    <div className="text-xs opacity-70 mt-0.5">ProRes (专业)</div>
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {config.videoSettings.format === 'mp4' && '最广泛兼容，适合所有平台'}
                  {config.videoSettings.format === 'webm' && '开源格式，文件更小，适合网页播放'}
                  {config.videoSettings.format === 'mov' && '专业编辑格式，适合 Final Cut/Premiere'}
                </p>
              </div>

              {/* 水印设置 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-zinc-300">水印</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.watermark?.enabled || false}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        watermark: {
                          ...(prev.watermark || DEFAULT_WATERMARK_CONFIG),
                          enabled: e.target.checked,
                        }
                      }))}
                      disabled={exportStatus === 'exporting'}
                      className="w-4 h-4 accent-cyan-500"
                    />
                    <span className="text-xs text-zinc-500">启用水印</span>
                  </label>
                </div>

                {config.watermark?.enabled && (
                  <div className="space-y-3">
                    {/* 水印类型 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          watermark: { ...(prev.watermark || DEFAULT_WATERMARK_CONFIG), type: 'text' }
                        }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition ${
                          config.watermark.type === 'text'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                        disabled={exportStatus === 'exporting'}
                      >
                        <Type className="w-4 h-4 inline-block mr-1" />
                        文字
                      </button>
                      <button
                        onClick={() => setConfig(prev => ({
                          ...prev,
                          watermark: { ...(prev.watermark || DEFAULT_WATERMARK_CONFIG), type: 'image' }
                        }))}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition ${
                          config.watermark.type === 'image'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                        }`}
                        disabled={exportStatus === 'exporting'}
                      >
                        <ImageIcon className="w-4 h-4 inline-block mr-1" />
                        图片
                      </button>
                    </div>

                    {/* 文字水印内容 */}
                    {config.watermark.type === 'text' && (
                      <input
                        type="text"
                        value={config.watermark.text || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          watermark: { ...(prev.watermark || DEFAULT_WATERMARK_CONFIG), text: e.target.value }
                        }))}
                        placeholder="输入水印文字"
                        disabled={exportStatus === 'exporting'}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                      />
                    )}

                    {/* 位置选择 */}
                    <select
                      value={config.watermark.position}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        watermark: { ...(prev.watermark || DEFAULT_WATERMARK_CONFIG), position: e.target.value as any }
                      }))}
                      disabled={exportStatus === 'exporting'}
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                    >
                      {WATERMARK_POSITIONS.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>

                    {/* 透明度 */}
                    <div>
                      <label className="text-xs text-zinc-400 mb-2 block">
                        透明度: {Math.round((config.watermark.opacity || 0.8) * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(config.watermark.opacity || 0.8) * 100}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          watermark: { ...(prev.watermark || DEFAULT_WATERMARK_CONFIG), opacity: Number(e.target.value) / 100 }
                        }))}
                        disabled={exportStatus === 'exporting'}
                        className="w-full accent-cyan-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 批量导出选项 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-300">批量导出</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBatchMode}
                onChange={(e) => setIsBatchMode(e.target.checked)}
                disabled={exportStatus === 'exporting'}
                className="w-4 h-4 accent-cyan-500"
              />
              <span className="text-xs text-zinc-500">启用批量导出</span>
            </label>
          </div>

          {isBatchMode && (
            <div className="space-y-2">
              {BATCH_EXPORT_PRESETS.map(preset => {
                const isSelected = selectedBatchPreset === preset.id
                const totalSize = estimateBatchTotalSize(
                  generateBatchExportTasks(config, preset.id),
                  estimate.duration
                )

                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedBatchPreset(preset.id)}
                    disabled={exportStatus === 'exporting'}
                    className={`
                      w-full p-3 rounded-lg text-left transition
                      ${isSelected
                        ? 'bg-cyan-500/20 border-2 border-cyan-500'
                        : 'bg-zinc-900 hover:bg-zinc-800 border-2 border-transparent'
                      }
                      disabled:opacity-50
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <Layers className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-zinc-200 mb-1">
                          {preset.name}
                        </div>
                        <div className="text-xs text-zinc-500 mb-2">
                          {preset.description}
                        </div>
                        <div className="text-xs text-zinc-600">
                          {preset.configs.length} 个文件 · 约 {formatFileSize(totalSize)}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 导出按钮 */}
        <button
          onClick={isBatchMode ? handleBatchExport : handleExport}
          disabled={exportStatus === 'exporting' || (isBatchMode && !selectedBatchPreset)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 rounded-xl font-medium transition shadow-lg shadow-cyan-500/20 disabled:shadow-none"
        >
          {exportStatus === 'exporting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isBatchMode ? '批量导出中' : t('export.exporting')}
            </>
          ) : (
            <>
              {isBatchMode ? <Layers className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              {isBatchMode ? '开始批量导出' : t('export.exportButton')}
            </>
          )}
        </button>

        {/* 统计信息 */}
        <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
          <div className="flex justify-between">
            <span>总场景数</span>
            <span className="text-zinc-300">{frames.length}</span>
          </div>
          <div className="flex justify-between">
            <span>总时长</span>
            <span className="text-zinc-300">
              {frames.reduce((sum, f) => sum + f.duration, 0)}秒
            </span>
          </div>
        </div>
      </div>

      {/* 历史记录侧边栏 */}
      {showHistory && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col">
          {/* 侧边栏头部 */}
          <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4">
            <h3 className="text-sm font-semibold text-zinc-200">导出历史</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* 历史记录列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {exportHistory.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <div className="text-sm">暂无导出历史</div>
              </div>
            ) : (
              exportHistory.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-zinc-200 mb-1 line-clamp-1">
                        {item.config.projectInfo.title || '未命名项目'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatExportTime(item.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="text-zinc-500 hover:text-red-400 transition flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-zinc-600 space-y-1 mb-3">
                    <div>
                      {item.config.videoSettings.resolution} · {item.config.videoSettings.fps}fps
                    </div>
                    <div>
                      时长 {Math.floor(item.duration / 60)}分{Math.round(item.duration % 60)}秒
                      {item.fileSize && ` · ${formatFileSize(item.fileSize)}`}
                    </div>
                  </div>

                  <button
                    onClick={() => handleLoadHistoryConfig(item)}
                    disabled={exportStatus === 'exporting'}
                    className="w-full px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs rounded-lg transition disabled:opacity-50"
                  >
                    重用此配置
                  </button>

                  {item.videoUrl && item.status === 'completed' && (
                    <a
                      href={item.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs text-center rounded-lg transition"
                    >
                      重新下载
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
