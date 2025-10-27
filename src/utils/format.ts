/**
 * 格式化工具函数
 * 
 * 提供各种数据格式化功能，用于日志输出和显示
 */

/**
 * 格式化错误对象
 * 
 * 将 Error 对象转换为可序列化的普通对象
 * 包含错误名称、消息和堆栈跟踪
 * 
 * @param error - 错误对象
 * @returns 格式化后的错误信息对象
 * 
 * @example
 * ```ts
 * try {
 *   throw new Error('Something went wrong')
 * } catch (err) {
 *   const formatted = formatError(err as Error)
 *   console.log(formatted)
 *   // { name: 'Error', message: 'Something went wrong', stack: '...' }
 * }
 * ```
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
 * 
 * 将毫秒时间戳转换为人类可读的时间字符串
 * 
 * 支持的格式：
 * - `iso`: ISO 8601 格式（2023-01-01T12:00:00.000Z）
 * - `locale`: 本地化格式（根据系统语言）
 * - `time`: 仅时间部分（12:00:00）
 * 
 * @param timestamp - 毫秒时间戳
 * @param format - 格式类型，默认 'iso'
 * @returns 格式化后的时间字符串
 * 
 * @example
 * ```ts
 * const now = Date.now()
 * 
 * formatTimestamp(now, 'iso')     // '2023-01-01T12:00:00.000Z'
 * formatTimestamp(now, 'locale')  // '2023/1/1 12:00:00'（中文环境）
 * formatTimestamp(now, 'time')    // '12:00:00'
 * ```
 */
export function formatTimestamp(timestamp: number, format: 'iso' | 'locale' | 'time' = 'iso'): string {
  const date = new Date(timestamp)

  switch (format) {
    case 'iso':
      // ISO 8601 标准格式，适合日志存储和传输
      return date.toISOString()
    case 'locale':
      // 本地化格式，根据用户系统语言显示
      return date.toLocaleString()
    case 'time':
      // 仅时间部分，适合控制台显示
      return date.toLocaleTimeString()
    default:
      return date.toISOString()
  }
}

/**
 * 获取当前时间戳
 * 
 * 返回当前时间的毫秒时间戳（自 1970-01-01 00:00:00 UTC）
 * 
 * @returns 当前时间戳（毫秒）
 * 
 * @example
 * ```ts
 * const timestamp = getTimestamp()
 * console.log(timestamp)  // 1672531200000
 * ```
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * 截断字符串
 * 
 * 如果字符串超过指定长度，截断并添加省略号（...）
 * 
 * @param str - 要截断的字符串
 * @param maxLength - 最大长度（包含省略号）
 * @returns 截断后的字符串
 * 
 * @example
 * ```ts
 * truncate('This is a very long message', 10)
 * // 'This is...'
 * 
 * truncate('Short', 10)
 * // 'Short'
 * ```
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  // 预留 3 个字符给省略号
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * 格式化堆栈跟踪
 * 
 * 限制堆栈跟踪的行数，避免日志过长
 * 超过指定行数时，截断并添加 "(truncated)" 标记
 * 
 * @param stack - 堆栈跟踪字符串
 * @param maxLines - 最大行数，默认 10
 * @returns 格式化后的堆栈跟踪，如果输入为空则返回 undefined
 * 
 * @example
 * ```ts
 * const error = new Error('Test error')
 * const formatted = formatStack(error.stack, 5)
 * // 只保留前 5 行堆栈
 * ```
 */
export function formatStack(stack?: string, maxLines = 10): string | undefined {
  if (!stack) {
    return undefined
  }

  const lines = stack.split('\n')

  // 堆栈行数在限制内，直接返回
  if (lines.length <= maxLines) {
    return stack
  }

  // 截断并添加标记
  return lines.slice(0, maxLines).join('\n') + '\n... (truncated)'
}




