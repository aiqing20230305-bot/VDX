/**
 * Toast Context - 全局Toast通知管理
 */
'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer } from '@/components/ui/Toast'
import type { ToastProps, ToastType } from '@/components/ui/Toast'

export interface ToastContextValue {
  showToast: (
    type: ToastType,
    title: string,
    message: string,
    options?: {
      action?: { label: string; onClick: () => void }
      duration?: number
    }
  ) => string
  hideToast: (id: string) => void
  showError: (title: string, message: string, action?: { label: string; onClick: () => void }) => string
  showWarning: (title: string, message: string, action?: { label: string; onClick: () => void }) => string
  showInfo: (title: string, message: string, action?: { label: string; onClick: () => void }) => string
  showSuccess: (title: string, message: string, action?: { label: string; onClick: () => void }) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      options?: {
        action?: { label: string; onClick: () => void }
        duration?: number
      }
    ) => {
      const id = `toast_${Date.now()}_${Math.random()}`
      const toast: ToastProps = {
        id,
        type,
        title,
        message,
        action: options?.action,
        duration: options?.duration ?? (type === 'error' ? 0 : 5000),
        onClose: hideToast,
      }

      setToasts((prev) => [...prev, toast])
      return id
    },
    []
  )

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showError = useCallback(
    (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      return showToast('error', title, message, { action, duration: 0 })
    },
    [showToast]
  )

  const showWarning = useCallback(
    (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      return showToast('warning', title, message, { action })
    },
    [showToast]
  )

  const showInfo = useCallback(
    (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      return showToast('info', title, message, { action })
    },
    [showToast]
  )

  const showSuccess = useCallback(
    (title: string, message: string, action?: { label: string; onClick: () => void }) => {
      return showToast('success', title, message, { action })
    },
    [showToast]
  )

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        showError,
        showWarning,
        showInfo,
        showSuccess,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
