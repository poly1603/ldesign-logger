import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'

/**
 * 紧凑格式化器配置
 */
export interface CompactFormatterConfig {
  /**
   * 是否包含时间戳
   * 
   * 紧凑格式下，时间戳会被简化为本地时间
   * 
   * @default false
   */
  includeTimestamp?: boolean

  /**
   * 最大消息长度
   * 
   * 超过此长度的消息会被截断并添加 "..."
   * 
   * @default 100
   */
  maxMessageLength?: number
}

/**
 * 紧凑格式化器
 * 
 * 将日志条目格式化为紧凑的单行文本，适合：
 * - 移动端日志
 * - 性能监控面板
 * - 实时日志流
 * - 空间受限的显示区域
 * 
 * 特性：
 * - 单行输出：所有信息在一行内
 * - 极简格式：使用简写和符号
 * - 消息截断：防止过长
 * - 高密度：最大化信息密度
 * 
 * 输出示例：
 * ```
 * I 12:00:00 my-app User logged in +data #prod
 * E 12:00:01 api Request failed err:TypeError #critical
 * ```
 * 
 * 格式说明：
 * - `I/D/W/E/F`: 日志级别首字母
 * - `12:00:00`: 时间（可选）
 * - `my-app`: 来源（取最后一段）
 * - `+data`: 有附加数据标记
 * - `err:TypeError`: 错误类型
 * - `#tag`: 标签
 */
export class CompactFormatter implements LogFormatter {
  private config: Required<CompactFormatterConfig>

  /**
   * 构造函数
   * 
   * @param config - 紧凑格式化器配置
   */
  constructor(config: CompactFormatterConfig = {}) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? false,
      maxMessageLength: config.maxMessageLength ?? 100,
    }
  }

  /**
   * 格式化日志条目为紧凑的单行文本
   * 
   * 格式：`级别 [时间] 来源 消息 [+data] [err:类型] [#标签]`
   * 
   * 紧凑策略：
   * - 级别：单字母（T/D/I/W/E/F）
   * - 时间：简化为 HH:MM:SS（可选）
   * - 来源：只取最后一段（如 app.module → module）
   * - 消息：截断超长部分
   * - 数据：仅显示 `+data` 标记
   * - 错误：显示 `err:类型`
   * - 标签：以 # 开头
   * 
   * @param entry - 日志条目
   * @returns 紧凑的单行文本
   */
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
 * 
 * 工厂函数，创建并返回一个新的 CompactFormatter 实例
 * 
 * @param config - 紧凑格式化器配置（可选）
 * @returns CompactFormatter 实例
 * 
 * @example
 * ```ts
 * // 默认配置（无时间戳，最大100字符）
 * const compact = createCompactFormatter()
 * 
 * // 包含时间戳
 * const withTime = createCompactFormatter({ includeTimestamp: true })
 * 
 * // 更短的消息
 * const shorter = createCompactFormatter({ maxMessageLength: 50 })
 * 
 * // 适合移动端
 * const mobile = createCompactFormatter({
 *   includeTimestamp: false,
 *   maxMessageLength: 60
 * })
 * ```
 */
export function createCompactFormatter(config?: CompactFormatterConfig): CompactFormatter {
  return new CompactFormatter(config)
}




