/**
 * 视频播放器组件 - v2版本
 * 展示生成的视频并支持进度查询
 */
'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download, Loader } from 'lucide-react'
import type { VideoJob } from '@/types'
import { logger } from '@/lib/utils/logger'

interface VideoPlayerProps {
  job: VideoJob
}

export function VideoPlayer({ job }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(job.progress || 0)
  const [currentStatus, setCurrentStatus] = useState(job.status)
  const [logs, setLogs] = useState<string[]>(
    job.logs?.map(l => typeof l === 'string' ? l : l.message) || []
  )

  // 轮询进度
  useEffect(() => {
    if (currentStatus === 'completed' || currentStatus === 'failed') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/status/${job.id}`)
        const data = await res.json()

        if (data.job) {
          setCurrentProgress(data.job.progress || 0)
          setCurrentStatus(data.job.status)
          setLogs(data.job.logs || [])
        }
      } catch (error) {
        logger.error('Failed to fetch video status:', error)
      }
    }, 2000) // 每2秒轮询

    return () => clearInterval(interval)
  }, [job.id, currentStatus])

  const handlePlayPause = () => {
    const video = document.getElementById(`video-${job.id}`) as HTMLVideoElement
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMute = () => {
    const video = document.getElementById(`video-${job.id}`) as HTMLVideoElement
    if (video) {
      video.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleDownload = () => {
    const outputPath = (job as any).outputVideoPath
    if (outputPath) {
      const a = document.createElement('a')
      a.href = outputPath
      a.download = `video-${job.id}.mp4`
      a.click()
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Video/Progress Area */}
      <div className="aspect-video bg-black relative">
        {currentStatus === 'completed' && (job as any).outputVideoPath ? (
          <>
            <video
              id={`video-${job.id}`}
              src={(job as any).outputVideoPath}
              className="w-full h-full object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              loop
            />

            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleMute}
                  className="w-10 h-10 hover:bg-white/10 rounded-full flex items-center justify-center transition"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1" />

                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2 text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            </div>
          </>
        ) : currentStatus === 'pending' || currentStatus === 'running' ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Loader className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <div className="text-lg font-medium mb-2">生成中...</div>
            <div className="text-sm text-zinc-400 mb-4">{currentProgress}%</div>

            {/* Progress Bar */}
            <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        ) : currentStatus === 'failed' ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="text-lg font-medium text-red-400">生成失败</div>
            {job.error && (
              <div className="text-sm text-zinc-500 mt-2 max-w-md text-center">
                {job.error}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Logs Section */}
      {(currentStatus === 'pending' || currentStatus === 'running') && logs.length > 0 && (
        <div className="p-4 border-t border-zinc-800 max-h-32 overflow-y-auto">
          <div className="text-xs font-medium text-zinc-500 mb-2">执行日志</div>
          <div className="space-y-1 font-mono text-xs">
            {logs.slice(-5).map((log, i) => (
              <div key={i} className="text-zinc-400">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      {currentStatus === 'completed' && (
        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            {(job as any).engine && (
              <div className="text-zinc-400">
                引擎: {(job as any).engine === 'seedance' ? 'Seedance 2.0' : (job as any).engine === 'kling' ? '可灵AI' : (job as any).engine}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
