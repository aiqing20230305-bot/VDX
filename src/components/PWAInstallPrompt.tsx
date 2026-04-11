/**
 * PWA Install Prompt - PWA安装提示组件
 * 引导用户将应用添加到主屏幕
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 检查是否已安装
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isInstalled) {
      return
    }

    // 检查是否已关闭过提示
    const hasClosedPrompt = localStorage.getItem('pwa-install-prompt-closed')
    if (hasClosedPrompt) {
      return
    }

    // 监听beforeinstallprompt事件
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // 延迟5秒显示提示，避免打扰用户
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // 显示安装提示
    await deferredPrompt.prompt()

    // 等待用户选择
    const { outcome } = await deferredPrompt.userChoice

    // 清除prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleClose = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-prompt-closed', 'true')
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl shadow-black/50">
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 transition"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 内容 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1 pr-6">
            <h3 className="text-sm font-semibold text-zinc-100 mb-1">
              安装超级视频Agent
            </h3>
            <p className="text-xs text-zinc-400">
              将应用添加到主屏幕，获得更快的访问速度和离线访问能力
            </p>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
          >
            安装
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition"
          >
            稍后
          </button>
        </div>
      </div>
    </div>
  )
}
