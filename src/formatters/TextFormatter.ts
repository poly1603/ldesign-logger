import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'
import { formatTimestamp } from '../utils/format'

/**
 * 文本格式化器配置
 */
export interface TextFormatterConfig {
  /**
   * 时间戳格式
   * @default 'iso'
   */
  timestampFormat?: 'iso' | 'locale' | 'time'

  /**
   * 是否包含时间戳
   * @default true
   */
  includeTimestamp?: boolean

  /**
   * 是否包含日志级别
   * @default true
   */
  includeLevel?: boolean

  /**
   * 是否包含来源
   * @default true
   */
  includeSource?: boolean

  /**
   * 字段分隔符
   * @default ' '
   */
  separator?: string
}

/**
 * 文本格式化器
 * 将日志条目格式化为人类可读的文本
 */
export class TextFormatter implements LogFormatter {
  private config: Required<TextFormatterConfig>

  constructor(config: TextFormatterConfig = {}) {
    this.config = {
      timestampFormat: config.timestampFormat ?? 'iso',
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevel: config.includeLevel ?? true,
      includeSource: config.includeSource ?? true,
      separator: config.separator ?? ' ',
    }
  }

  format(entry: LogEntry): string {
    const parts: string[] = []

    // 时间戳
    if (this.config.includeTimestamp) {
      const timestamp = formatTimestamp(entry.timestamp, this.config.timestampFormat)
      parts.push(`[${timestamp}]`)
    }

    // 日志级别
    if (this.config.includeLevel) {
      const level = LogLevelNames[entry.level]
      parts.push(`[${level}]`)
    }

    // 来源
    if (this.config.includeSource && entry.source) {
      parts.push(`[${entry.source}]`)
    }

    // 消息
    parts.push(entry.message)

    let output = parts.join(this.config.separator)

    // 附加数据
    if (entry.data !== undefined) {
      output += `\n  Data: ${JSON.stringify(entry.data)}`
    }

    // 错误信息
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`
      }
    }

    // 用户和会话
    if (entry.userId) {
      output += `\n  UserId: ${entry.userId}`
    }

    if (entry.sessionId) {
      output += `\n  SessionId: ${entry.sessionId}`
    }

    // 标签
    if (entry.tags && entry.tags.length > 0) {
      output += `\n  Tags: ${entry.tags.join(', ')}`
    }

    return output
  }
}

/**
 * 创建文本格式化器
 */
export function createTextFormatter(config?: TextFormatterConfig): TextFormatter {
  return new TextFormatter(config)
}




