/**
 * 音频控制面板 - v2版本
 * 参考SEKO的音频面板设计
 */
'use client'

import { useState, useRef } from 'react'
import { Upload, Music, Volume2, Gauge, User } from 'lucide-react'

interface AudioPanelProps {
  onAudioUpload?: (file: File) => void
  onVoiceSelect?: (voice: string) => void
}

export function AudioPanel({ onAudioUpload, onVoiceSelect }: AudioPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'ai' | 'library'>('ai')
  const [uploadedAudio, setUploadedAudio] = useState<{
    name: string
    duration: number
  } | null>(null)
  const [volume, setVolume] = useState(100)
  const [speed, setSpeed] = useState(1.0)
  const [selectedVoice, setSelectedVoice] = useState('默认')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 获取音频时长
    const audio = new Audio(URL.createObjectURL(file))
    audio.onloadedmetadata = () => {
      setUploadedAudio({
        name: file.name,
        duration: audio.duration,
      })
      onAudioUpload?.(file)
    }
  }

  const voices = [
    { id: 'default', name: '默认', gender: '男', style: '标准' },
    { id: 'female1', name: '女声1', gender: '女', style: '温柔' },
    { id: 'male1', name: '男声1', gender: '男', style: '磁性' },
    { id: 'child', name: '童声', gender: '中性', style: '活泼' },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedTab('ai')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedTab === 'ai'
              ? 'bg-zinc-900 text-white'
              : 'bg-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          AI生成
        </button>
        <button
          onClick={() => setSelectedTab('library')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
            selectedTab === 'library'
              ? 'bg-zinc-900 text-white'
              : 'bg-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          音乐库
        </button>
      </div>

      {selectedTab === 'ai' ? (
        <>
          {/* Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">旁白台词</label>
            <textarea
              placeholder="输入你想要的旁白台词，AI会自动生成语音..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              声音音色
            </label>
            <div className="grid grid-cols-2 gap-2">
              {voices.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice.name)
                    onVoiceSelect?.(voice.id)
                  }}
                  className={`p-3 rounded-lg text-left transition ${
                    selectedVoice === voice.name
                      ? 'bg-cyan-500/10 border border-cyan-500/50'
                      : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{voice.name}</div>
                  <div className="text-xs text-zinc-500">
                    {voice.gender} · {voice.style}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              声音音量
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-right text-sm text-zinc-400">{volume}</div>
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              声音语速
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-right text-sm text-zinc-400">{speed.toFixed(1)}x</div>
            </div>
          </div>

          {/* Apply Button */}
          <button className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-medium transition">
            应用修改
          </button>
        </>
      ) : (
        <>
          {/* Upload Music */}
          <div>
            <label className="block text-sm font-medium mb-2">描述你想要的音乐</label>
            <input
              type="text"
              placeholder="例如: 轻快的钢琴曲"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 mb-3"
            />
          </div>

          <button
            onClick={handleFileClick}
            className="w-full p-6 border-2 border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-lg transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Music className="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 mx-auto mb-2 transition" />
            <div className="text-sm text-zinc-400 group-hover:text-zinc-300 transition">
              点击/拖拽上传音乐
            </div>
            <div className="text-xs text-zinc-600 mt-1">
              支持 MP3、WAV、FLAC 格式，最大 10MB
            </div>
          </button>

          {uploadedAudio && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{uploadedAudio.name}</div>
                  <div className="text-xs text-zinc-500">
                    {Math.floor(uploadedAudio.duration)}秒
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Volume Control for Music */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              音乐音量
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-12 text-right text-sm text-zinc-400">{volume}</div>
            </div>
          </div>

          <button className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-sm font-medium transition">
            应用
          </button>
        </>
      )}
    </div>
  )
}
