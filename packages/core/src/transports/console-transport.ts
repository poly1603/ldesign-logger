/**
 * 控制台传输器
 * @description 将日志输出到浏览器控制台或 Node.js 控制台
 */

import type { LogEntry, LogTransport } from '../types'
import { LogLevel } from '../types'
import { formatLogAsText, formatTimestamp, getLevelName } from '../utils/format'

/**
 * 控制台传输器配置
 */
export interface ConsoleTransportOptions {
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 是否使用颜色 */
  colors?: boolean
  /** 是否显示时间戳 */
  timestamp?: boolean
  /** 是否显示数据 */
  showData?: boolean
  /** 是否显示堆栈 */
  showStack?: boolean
  /** 是否使用分组 */
  useGroup?: boolean
  /** 时间格式 */
  timeFormat?: 'full' | 'time' | 'iso'
}

/** 日志级别对应的控制台样式 */
const LEVEL_STYLES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'color: #888',
  [LogLevel.DEBUG]: 'color: #0ea5e9',
  [LogLevel.INFO]: 'color: #22c55e',
  [LogLevel.WARN]: 'color: #eab308',
  [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
  [LogLevel.FATAL]: 'color: #a855f7; font-weight: bold; background: #fef2f2',
  [LogLevel.SILENT]: '',
}

/** 日志级别对应的控制台方法 */
const LEVEL_METHODS: Record<LogLevel, 'log' | 'info' | 'warn' | 'error'> = {
  [LogLevel.TRACE]: 'log',
  [LogLevel.DEBUG]: 'log',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.FATAL]: 'error',
  [LogLevel.SILENT]: 'log',
}

/**
 * 控制台传输器
 * @description 将日志美化输出到控制台
 * @example
 * ```ts
 * const transport = new ConsoleTransport({
 *   level: LogLevel.DEBUG,
 *   colors: true,
 *   timestamp: true,
 * })
 *
 * logger.addTransport(transport)
 * ```
 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console'
  level?: LogLevel
  enabled: boolean

  private options: Required<ConsoleTransportOptions>

  constructor(options: ConsoleTransportOptions = {}) {
    this.options = {
      level: options.level ?? LogLevel.TRACE,
      enabled: options.enabled ?? true,
      colors: options.colors ?? true,
      timestamp: options.timestamp ?? true,
      showData: options.showData ?? true,
      showStack: options.showStack ?? true,
      useGroup: options.useGroup ?? false,
      timeFormat: options.timeFormat ?? 'time',
    }

    this.level = this.options.level
    this.enabled = this.options.enabled
  }

  /**
   * 写入日志
   */
  write(entry: LogEntry): void {
    if (!this.enabled) {
      return
    }

    const method = LEVEL_METHODS[entry.level]
    const style = LEVEL_STYLES[entry.level]
    const levelName = getLevelName(entry.level).padEnd(5)

    // 构建日志前缀
    const parts: string[] = []
    const args: unknown[] = []

    // 时间戳
    if (this.options.timestamp) {
      const time = formatTimestamp(entry.timestamp, this.options.timeFormat)
      parts.push(`%c${time}`)
      args.push('color: #888')
    }

    // 级别
    parts.push(`%c${levelName}`)
    args.push(style)

    // 来源
    if (entry.source) {
      parts.push(`%c[${entry.source}]`)
      args.push('color: #6366f1')
    }

    // 标签
    if (entry.tags?.length) {
      parts.push(`%c{${entry.tags.join(',')}}`)
      args.push('color: #f97316')
    }

    // 消息
    parts.push(`%c${entry.message}`)
    args.push('color: inherit')

    // 输出主日志
    const format = parts.join(' ')

    if (this.options.useGroup && (entry.data || entry.stack)) {
      console.groupCollapsed(format, ...args)

      if (this.options.showData && entry.data) {
        console.log('Data:', entry.data)
      }

      if (this.options.showStack && entry.stack) {
        console.log('Stack:', entry.stack)
      }

      console.groupEnd()
    }
    else {
      (console[method] as Function)(format, ...args)

      if (this.options.showData && entry.data) {
        console.log('  Data:', entry.data)
      }

      if (this.options.showStack && entry.stack) {
        console.log('  Stack:', entry.stack)
      }
    }
  }
}

/**
 * 创建控制台传输器
 * @param options - 配置选项
 * @returns 控制台传输器实例
 */
export function createConsoleTransport(options?: ConsoleTransportOptions): ConsoleTransport {
  return new ConsoleTransport(options)
}

