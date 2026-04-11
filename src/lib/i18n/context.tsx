'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'zh' | 'en'

interface Messages {
  [key: string]: any
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  messages: Messages
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Import default messages synchronously to avoid flash
import zhMessages from '../../../messages/zh.json'
import enMessages from '../../../messages/en.json'

const messagesMap = {
  zh: zhMessages,
  en: enMessages,
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Get initial locale from localStorage (client-only)
  const getInitialLocale = (): Locale => {
    if (typeof window === 'undefined') return 'zh'
    const saved = localStorage.getItem('locale') as Locale | null
    return (saved === 'zh' || saved === 'en') ? saved : 'zh'
  }

  const initialLocale = getInitialLocale()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Messages>(messagesMap[initialLocale])

  // Update messages when locale changes
  useEffect(() => {
    setMessages(messagesMap[locale])
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = messages

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        return key // Return key if path not found
      }
    }

    return typeof value === 'string' ? value : key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, messages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider')
  }
  return context
}
