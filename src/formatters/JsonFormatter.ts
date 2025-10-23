import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'
import { toJSON } from '../utils/serialize'

/**
 * JSON 格式化器配置
 */
export interface JsonFormatterConfig {
  /**
   * 是否美化输出
   * @default false
   */
  pretty?: boolean

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
}

/**
 * JSON 格式化器
 * 将日志条目格式化为 JSON 字符串
 */
export class JsonFormatter implements LogFormatter {
  private config: Required<JsonFormatterConfig>

  constructor(config: JsonFormatterConfig = {}) {
    this.config = {
      pretty: config.pretty ?? false,
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevel: config.includeLevel ?? true,
      includeSource: config.includeSource ?? true,
    }
  }

  format(entry: LogEntry): string {
    const output: any = {
      message: entry.message,
    }

    if (this.config.includeTimestamp) {
      output.timestamp = entry.timestamp
      output.time = new Date(entry.timestamp).toISOString()
    }

    if (this.config.includeLevel) {
      output.level = LogLevelNames[entry.level]
      output.levelValue = entry.level
    }

    if (this.config.includeSource && entry.source) {
      output.source = entry.source
    }

    if (entry.data !== undefined) {
      output.data = entry.data
    }

    if (entry.error) {
      output.error = {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      }
    }

    if (entry.userId) {
      output.userId = entry.userId
    }

    if (entry.sessionId) {
      output.sessionId = entry.sessionId
    }

    if (entry.tags && entry.tags.length > 0) {
      output.tags = entry.tags
    }

    return toJSON(output, this.config.pretty)
  }
}

/**
 * 创建 JSON 格式化器
 */
export function createJsonFormatter(config?: JsonFormatterConfig): JsonFormatter {
  return new JsonFormatter(config)
}




