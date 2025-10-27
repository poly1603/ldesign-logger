import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'
import { formatTimestamp } from '../utils/format'

/**
 * 文本格式化器配置
 */
export interface TextFormatterConfig {
  /**
   * 时间戳格式
   * 
   * - `iso`: ISO 8601 格式（2023-01-01T12:00:00.000Z）
   * - `locale`: 本地化格式（2023/1/1 12:00:00）
   * - `time`: 仅时间（12:00:00）
   * 
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
   * 是否包含日志来源
   * @default true
   */
  includeSource?: boolean

  /**
   * 字段分隔符
   * 
   * 用于分隔时间戳、级别、来源等字段
   * 
   * @default ' '
   */
  separator?: string
}

/**
 * 文本格式化器
 * 
 * 将日志条目格式化为人类可读的文本，适合：
 * - 文件日志
 * - 终端输出
 * - 邮件通知
 * - 文本查看器
 * 
 * 特性：
 * - 易读：结构清晰，层次分明
 * - 可配置：控制时间格式和字段
 * - 多行输出：附加数据和错误信息分行显示
 * 
 * 输出示例：
 * ```
 * [2023-01-01T12:00:00.000Z] [INFO] [my-app] User logged in
 *   Data: { userId: '123' }
 *   Tags: frontend, production
 * ```
 */
export class TextFormatter implements LogFormatter {
  private config: Required<TextFormatterConfig>

  /**
   * 构造函数
   * 
   * @param config - 文本格式化器配置
   */
  constructor(config: TextFormatterConfig = {}) {
    this.config = {
      timestampFormat: config.timestampFormat ?? 'iso',
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevel: config.includeLevel ?? true,
      includeSource: config.includeSource ?? true,
      separator: config.separator ?? ' ',
    }
  }

  /**
   * 格式化日志条目为文本字符串
   * 
   * 格式化规则：
   * 1. 第一行：时间戳 + 级别 + 来源 + 消息
   * 2. 后续行：附加数据、错误、标签（缩进2空格）
   * 
   * @param entry - 日志条目
   * @returns 格式化后的文本字符串
   */
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
 * 
 * 工厂函数，创建并返回一个新的 TextFormatter 实例
 * 
 * @param config - 文本格式化器配置（可选）
 * @returns TextFormatter 实例
 * 
 * @example
 * ```ts
 * // ISO 时间格式
 * const iso = createTextFormatter({ timestampFormat: 'iso' })
 * 
 * // 本地化时间格式
 * const locale = createTextFormatter({ timestampFormat: 'locale' })
 * 
 * // 仅时间，不含来源
 * const simple = createTextFormatter({
 *   timestampFormat: 'time',
 *   includeSource: false
 * })
 * 
 * // 自定义分隔符
 * const custom = createTextFormatter({ separator: ' | ' })
 * ```
 */
export function createTextFormatter(config?: TextFormatterConfig): TextFormatter {
  return new TextFormatter(config)
}




