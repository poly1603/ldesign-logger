import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'

/**
 * 紧凑格式化器配置
 */
export interface CompactFormatterConfig {
  /**
   * 是否包含时间戳
   * @default false
   */
  includeTimestamp?: boolean

  /**
   * 最大消息长度
   * @default 100
   */
  maxMessageLength?: number
}

/**
 * 紧凑格式化器
 * 将日志条目格式化为紧凑的单行文本
 */
export class CompactFormatter implements LogFormatter {
  private config: Required<CompactFormatterConfig>

  constructor(config: CompactFormatterConfig = {}) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? false,
      maxMessageLength: config.maxMessageLength ?? 100,
    }
  }

  format(entry: LogEntry): string {
    const parts: string[] = []

    // 日志级别（简写）
    const level = LogLevelNames[entry.level].charAt(0) // T/D/I/W/E/F
    parts.push(level)

    // 时间戳（可选，简化格式）
    if (this.config.includeTimestamp) {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      parts.push(time)
    }

    // 来源（简化）
    if (entry.source) {
      const source = entry.source.split('.').pop() || entry.source
      parts.push(source)
    }

    // 消息（截断）
    let message = entry.message
    if (message.length > this.config.maxMessageLength) {
      message = message.slice(0, this.config.maxMessageLength - 3) + '...'
    }
    parts.push(message)

    // 附加数据（简化）
    if (entry.data !== undefined) {
      parts.push(`+data`)
    }

    // 错误（简化）
    if (entry.error) {
      parts.push(`err:${entry.error.name}`)
    }

    // 标签
    if (entry.tags && entry.tags.length > 0) {
      parts.push(`#${entry.tags.join('#')}`)
    }

    return parts.join(' | ')
  }
}

/**
 * 创建紧凑格式化器
 */
export function createCompactFormatter(config?: CompactFormatterConfig): CompactFormatter {
  return new CompactFormatter(config)
}




