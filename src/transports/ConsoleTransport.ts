import type { LogEntry, LogLevel, LogTransport } from '../types'
import { LogLevelNames } from '../types'

/**
 * Console 传输器配置
 */
export interface ConsoleTransportConfig {
  /**
   * 最低日志级别
   * @default LogLevel.DEBUG
   */
  level?: LogLevel

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean

  /**
   * 是否使用彩色输出
   * @default true
   */
  colors?: boolean

  /**
   * 是否显示时间戳
   * @default true
   */
  timestamp?: boolean
}

/**
 * Console 传输器
 * 将日志输出到浏览器控制台
 */
export class ConsoleTransport implements LogTransport {
  name = 'console'
  level: LogLevel
  enabled: boolean
  private colors: boolean
  private timestamp: boolean

  // 日志级别对应的控制台方法
  private static readonly CONSOLE_METHODS = {
    0: 'debug', // TRACE
    1: 'debug', // DEBUG
    2: 'info',  // INFO
    3: 'warn',  // WARN
    4: 'error', // ERROR
    5: 'error', // FATAL
  }

  // 日志级别对应的颜色
  private static readonly COLORS = {
    0: '#999',    // TRACE - 灰色
    1: '#6366f1',  // DEBUG - 紫色
    2: '#3b82f6',  // INFO - 蓝色
    3: '#f59e0b',  // WARN - 橙色
    4: '#ef4444',  // ERROR - 红色
    5: '#dc2626',  // FATAL - 深红色
  }

  constructor(config: ConsoleTransportConfig = {}) {
    this.level = config.level ?? 1 // DEBUG
    this.enabled = config.enabled ?? true
    this.colors = config.colors ?? true
    this.timestamp = config.timestamp ?? true
  }

  log(entry: LogEntry): void {
    const method = ConsoleTransport.CONSOLE_METHODS[entry.level] as keyof Console
    const levelName = LogLevelNames[entry.level]

    // 格式化输出
    const parts: any[] = []

    // 时间戳
    if (this.timestamp) {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      parts.push(`[${time}]`)
    }

    // 日志级别
    if (this.colors && typeof console[method] === 'function') {
      const color = ConsoleTransport.COLORS[entry.level]
      parts.push(`%c[${levelName}]%c`, `color: ${color}; font-weight: bold`, '')
    }
    else {
      parts.push(`[${levelName}]`)
    }

    // 来源
    if (entry.source) {
      parts.push(`[${entry.source}]`)
    }

    // 消息
    parts.push(entry.message)

    // 附加数据
    if (entry.data !== undefined) {
      parts.push('\n  Data:', entry.data)
    }

    // 错误信息
    if (entry.error) {
      parts.push('\n  Error:', entry.error)
    }

    // 标签
    if (entry.tags && entry.tags.length > 0) {
      parts.push('\n  Tags:', entry.tags.join(', '))
    }

    // 输出到控制台
    ; (console[method] as any)(...parts)
  }
}

/**
 * 创建 Console 传输器
 */
export function createConsoleTransport(config?: ConsoleTransportConfig): ConsoleTransport {
  return new ConsoleTransport(config)
}

