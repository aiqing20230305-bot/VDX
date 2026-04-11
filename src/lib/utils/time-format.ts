/**
 * 时间格式化工具
 * 用于聊天消息时间戳显示
 */

/**
 * 格式化相对时间（用于显示）
 * @param timestamp - ISO 8601 时间戳或 Date 对象
 * @returns 相对时间字符串（"刚刚"、"5分钟前"、"今天 14:30"等）
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  // 1分钟内
  if (diffMinutes < 1) {
    return '刚刚'
  }

  // 1小时内
  if (diffHours < 1) {
    return `${diffMinutes}分钟前`
  }

  // 今天
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `今天 ${formatTime(date)}`
  }

  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  if (isYesterday) {
    return `昨天 ${formatTime(date)}`
  }

  // 今年内
  const isThisYear = date.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return `${formatDate(date, false)} ${formatTime(date)}`
  }

  // 更早
  return `${formatDate(date, true)} ${formatTime(date)}`
}

/**
 * 格式化绝对时间（用于悬停显示完整信息）
 * @param timestamp - ISO 8601 时间戳或 Date 对象
 * @returns 绝对时间字符串（"2026-04-10 14:30:45"）
 */
export function formatAbsoluteTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化时间部分（HH:MM）
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 格式化日期部分（MM-DD 或 YYYY-MM-DD）
 */
function formatDate(date: Date, includeYear: boolean): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (includeYear) {
    return `${year}-${month}-${day}`
  }
  return `${month}-${day}`
}
