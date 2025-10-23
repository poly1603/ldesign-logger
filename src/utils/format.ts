/**
 * 格式化工具函数
 */

/**
 * 格式化错误对象
 */
export function formatError(error: Error): {
  name: string
  message: string
  stack?: string
} {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number, format: 'iso' | 'locale' | 'time' = 'iso'): string {
  const date = new Date(timestamp)

  switch (format) {
    case 'iso':
      return date.toISOString()
    case 'locale':
      return date.toLocaleString()
    case 'time':
      return date.toLocaleTimeString()
    default:
      return date.toISOString()
  }
}

/**
 * 获取当前时间戳
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * 截断字符串
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * 格式化堆栈跟踪
 */
export function formatStack(stack?: string, maxLines = 10): string | undefined {
  if (!stack) {
    return undefined
  }

  const lines = stack.split('\n')
  if (lines.length <= maxLines) {
    return stack
  }

  return lines.slice(0, maxLines).join('\n') + '\n... (truncated)'
}




