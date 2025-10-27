import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 模式过滤器配置
 */
export interface PatternFilterConfig {
  /**
   * 匹配模式（正则表达式）
   * 
   * 可以是：
   * - RegExp 对象：new RegExp('^API')
   * - 字符串：会自动转换为 RegExp
   * 
   * @example /^API/ - 匹配以 "API" 开头的日志
   * @example 'error' - 匹配包含 "error" 的日志
   */
  pattern: RegExp | string

  /**
   * 匹配字段
   * 
   * 指定要匹配的日志字段：
   * - `message`: 日志消息文本
   * - `source`: 日志来源
   * - `userId`: 用户 ID
   * - `sessionId`: 会话 ID
   * 
   * @default 'message'
   */
  field?: 'message' | 'source' | 'userId' | 'sessionId'

  /**
   * 是否反转匹配结果
   * 
   * - false: 匹配则通过（默认）
   * - true: 匹配则过滤掉（排除模式）
   * 
   * @default false
   */
  invert?: boolean
}

/**
 * 模式过滤器
 * 
 * 使用正则表达式匹配日志字段，支持包含和排除两种模式
 * 
 * 使用场景：
 * - 只记录特定模块的日志（如 "api.*"）
 * - 排除特定类型的日志（如 "test.*"）
 * - 根据消息内容过滤
 * - 根据用户 ID 过滤
 * 
 * 性能考虑：
 * - 使用编译后的 RegExp 对象以提高性能
 * - 避免过于复杂的正则表达式
 * 
 * @example
 * ```ts
 * // 只记录包含 "API" 的日志
 * const apiFilter = createPatternFilter({ pattern: /API/i })
 * 
 * // 排除包含 "test" 的日志
 * const noTestFilter = createPatternFilter({
 *   pattern: 'test',
 *   invert: true
 * })
 * 
 * // 只记录特定用户的日志
 * const userFilter = createPatternFilter({
 *   pattern: /^user-123$/,
 *   field: 'userId'
 * })
 * ```
 */
export class PatternFilter implements LogFilter {
  name = 'pattern'
  private pattern: RegExp
  private field: 'message' | 'source' | 'userId' | 'sessionId'
  private invert: boolean

  /**
   * 构造函数
   * 
   * @param config - 模式过滤器配置
   */
  constructor(config: PatternFilterConfig) {
    // 将字符串模式转换为 RegExp 对象
    if (typeof config.pattern === 'string') {
      this.pattern = new RegExp(config.pattern)
    }
    else {
      this.pattern = config.pattern
    }

    this.field = config.field ?? 'message'
    this.invert = config.invert ?? false
  }

  /**
   * 过滤日志条目
   * 
   * 过滤流程：
   * 1. 获取指定字段的值
   * 2. 如果值为空，根据 invert 决定结果
   * 3. 使用正则表达式测试值
   * 4. 根据 invert 返回结果或反转结果
   * 
   * @param entry - 日志条目
   * @returns true 表示通过过滤
   */
  filter(entry: LogEntry): boolean {
    // 获取要匹配的字段值
    const value = entry[this.field]

    // 字段值为空的处理
    if (value === undefined || value === null) {
      // invert=true 时，空值通过（排除模式下空值安全）
      // invert=false 时，空值不通过（包含模式下空值无法匹配）
      return this.invert
    }

    // 测试正则表达式
    const matches = this.pattern.test(String(value))

    // 根据 invert 返回结果
    return this.invert ? !matches : matches
  }
}

/**
 * 创建模式过滤器
 * 
 * 工厂函数，创建并返回一个新的 PatternFilter 实例
 * 
 * @param config - 模式过滤器配置
 * @returns PatternFilter 实例
 * 
 * @example
 * ```ts
 * // 只记录 API 相关日志
 * const apiFilter = createPatternFilter({
 *   pattern: /^API/,
 *   field: 'message'
 * })
 * logger.addFilter(apiFilter)
 * 
 * // 排除测试日志
 * const noTestFilter = createPatternFilter({
 *   pattern: /test/i,
 *   invert: true
 * })
 * 
 * // 只记录特定来源的日志
 * const sourceFilter = createPatternFilter({
 *   pattern: 'my-app',
 *   field: 'source'
 * })
 * ```
 */
export function createPatternFilter(config: PatternFilterConfig): PatternFilter {
  return new PatternFilter(config)
}




