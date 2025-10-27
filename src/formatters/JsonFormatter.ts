import type { LogEntry, LogFormatter } from '../types'
import { LogLevelNames } from '../types'
import { toJSON } from '../utils/serialize'

/**
 * JSON 格式化器配置
 */
export interface JsonFormatterConfig {
  /**
   * 是否美化输出
   * 
   * true: 格式化为多行缩进的 JSON（易读）
   * false: 紧凑的单行 JSON（节省空间）
   * 
   * @default false
   */
  pretty?: boolean

  /**
   * 是否包含时间戳
   * 
   * 包含两种格式：
   * - timestamp: 毫秒时间戳（数字）
   * - time: ISO 8601 字符串
   * 
   * @default true
   */
  includeTimestamp?: boolean

  /**
   * 是否包含日志级别
   * 
   * 包含两种格式：
   * - level: 级别名称（字符串，如 "INFO"）
   * - levelValue: 级别数值（数字，如 2）
   * 
   * @default true
   */
  includeLevel?: boolean

  /**
   * 是否包含日志来源
   * 
   * @default true
   */
  includeSource?: boolean
}

/**
 * JSON 格式化器
 * 
 * 将日志条目格式化为 JSON 字符串，适合：
 * - 远程日志服务器
 * - 结构化日志存储
 * - 日志分析工具
 * - API 传输
 * 
 * 特性：
 * - 结构化：便于机器解析
 * - 可配置：控制输出字段
 * - 安全序列化：处理循环引用
 * - 紧凑或美化：适应不同需求
 * 
 * 性能考虑：
 * - 紧凑模式（pretty=false）性能最佳
 * - 美化模式（pretty=true）更易读但略慢
 */
export class JsonFormatter implements LogFormatter {
  private config: Required<JsonFormatterConfig>

  /**
   * 构造函数
   * 
   * @param config - JSON 格式化器配置
   */
  constructor(config: JsonFormatterConfig = {}) {
    this.config = {
      pretty: config.pretty ?? false,
      includeTimestamp: config.includeTimestamp ?? true,
      includeLevel: config.includeLevel ?? true,
      includeSource: config.includeSource ?? true,
    }
  }

  /**
   * 格式化日志条目为 JSON 字符串
   * 
   * 输出结构：
   * ```json
   * {
   *   "message": "日志消息",
   *   "timestamp": 1672531200000,
   *   "time": "2023-01-01T00:00:00.000Z",
   *   "level": "INFO",
   *   "levelValue": 2,
   *   "source": "my-app",
   *   "data": { "custom": "data" },
   *   "error": { "name": "Error", "message": "...", "stack": "..." },
   *   "userId": "user-123",
   *   "sessionId": "session-456",
   *   "tags": ["tag1", "tag2"]
   * }
   * ```
   * 
   * @param entry - 日志条目
   * @returns JSON 字符串
   */
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
 * 
 * 工厂函数，创建并返回一个新的 JsonFormatter 实例
 * 
 * @param config - JSON 格式化器配置（可选）
 * @returns JsonFormatter 实例
 * 
 * @example
 * ```ts
 * // 紧凑 JSON（用于传输）
 * const compact = createJsonFormatter({ pretty: false })
 * 
 * // 美化 JSON（用于查看）
 * const pretty = createJsonFormatter({ pretty: true })
 * 
 * // 最小化输出（只包含消息）
 * const minimal = createJsonFormatter({
 *   includeTimestamp: false,
 *   includeLevel: false,
 *   includeSource: false
 * })
 * ```
 */
export function createJsonFormatter(config?: JsonFormatterConfig): JsonFormatter {
  return new JsonFormatter(config)
}




