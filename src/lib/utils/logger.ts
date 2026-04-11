/**
 * Logger - 环境感知的日志工具
 *
 * 在开发环境输出日志，生产环境自动禁用
 */

const IS_DEV = process.env.NODE_ENV === 'development'
const IS_TEST = process.env.NODE_ENV === 'test'

/**
 * 日志级别配置
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
} as const

type LogLevel = keyof typeof LOG_LEVELS

/**
 * 获取当前日志级别
 * 生产环境默认 ERROR，开发环境默认 DEBUG
 */
function getCurrentLogLevel(): LogLevel {
  if (IS_TEST) return 'NONE'
  if (IS_DEV) return 'DEBUG'

  // 生产环境可通过环境变量控制
  const level = process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel
  return level && level in LOG_LEVELS ? level : 'ERROR'
}

const currentLevel = LOG_LEVELS[getCurrentLogLevel()]

/**
 * 格式化日志前缀
 */
function formatPrefix(level: string, context?: string): string {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
  const contextStr = context ? `[${context}]` : ''
  return `[${timestamp}] [${level}]${contextStr}`
}

/**
 * 条件日志函数
 */
export const logger = {
  /**
   * 调试日志（仅开发环境）
   */
  debug: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.DEBUG >= currentLevel) {
      console.log(`${formatPrefix('DEBUG')} ${message}`, ...args)
    }
  },

  /**
   * 信息日志
   */
  info: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.INFO >= currentLevel) {
      console.log(`${formatPrefix('INFO')} ${message}`, ...args)
    }
  },

  /**
   * 警告日志
   */
  warn: (message: string, ...args: any[]) => {
    if (LOG_LEVELS.WARN >= currentLevel) {
      console.warn(`${formatPrefix('WARN')} ${message}`, ...args)
    }
  },

  /**
   * 错误日志（生产环境也会输出）
   */
  error: (message: string, error?: Error | unknown, ...args: any[]) => {
    if (LOG_LEVELS.ERROR >= currentLevel) {
      console.error(`${formatPrefix('ERROR')} ${message}`, error, ...args)
    }
  },

  /**
   * 创建带上下文的 logger
   *
   * @example
   * const log = logger.context('VideoEngine')
   * log.debug('Processing frame', frameData)
   */
  context: (contextName: string) => ({
    debug: (message: string, ...args: any[]) => {
      if (LOG_LEVELS.DEBUG >= currentLevel) {
        console.log(`${formatPrefix('DEBUG', contextName)} ${message}`, ...args)
      }
    },
    info: (message: string, ...args: any[]) => {
      if (LOG_LEVELS.INFO >= currentLevel) {
        console.log(`${formatPrefix('INFO', contextName)} ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: any[]) => {
      if (LOG_LEVELS.WARN >= currentLevel) {
        console.warn(`${formatPrefix('WARN', contextName)} ${message}`, ...args)
      }
    },
    error: (message: string, error?: Error | unknown, ...args: any[]) => {
      if (LOG_LEVELS.ERROR >= currentLevel) {
        console.error(`${formatPrefix('ERROR', contextName)} ${message}`, error, ...args)
      }
    },
  }),

  /**
   * 性能计时器
   */
  time: (label: string) => {
    if (IS_DEV) {
      console.time(label)
    }
  },

  timeEnd: (label: string) => {
    if (IS_DEV) {
      console.timeEnd(label)
    }
  },

  /**
   * 分组日志
   */
  group: (label: string) => {
    if (IS_DEV) {
      console.group(label)
    }
  },

  groupEnd: () => {
    if (IS_DEV) {
      console.groupEnd()
    }
  },

  /**
   * 表格日志
   */
  table: (data: any) => {
    if (IS_DEV) {
      console.table(data)
    }
  },
}

/**
 * 开发环境专用日志
 * 仅在开发环境输出，生产环境完全静默
 */
export const devLog = {
  log: (...args: any[]) => {
    if (IS_DEV) console.log(...args)
  },
  warn: (...args: any[]) => {
    if (IS_DEV) console.warn(...args)
  },
  error: (...args: any[]) => {
    if (IS_DEV) console.error(...args)
  },
  table: (data: any) => {
    if (IS_DEV) console.table(data)
  },
}

// 默认导出
export default logger
