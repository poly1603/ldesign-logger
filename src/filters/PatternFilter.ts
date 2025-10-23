import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 模式过滤器配置
 */
export interface PatternFilterConfig {
  /**
   * 匹配模式（正则表达式）
   */
  pattern: RegExp | string

  /**
   * 匹配字段
   * @default 'message'
   */
  field?: 'message' | 'source' | 'userId' | 'sessionId'

  /**
   * 是否反转匹配（匹配则排除）
   * @default false
   */
  invert?: boolean
}

/**
 * 模式过滤器
 * 根据正则表达式匹配日志字段
 */
export class PatternFilter implements LogFilter {
  name = 'pattern'
  private pattern: RegExp
  private field: 'message' | 'source' | 'userId' | 'sessionId'
  private invert: boolean

  constructor(config: PatternFilterConfig) {
    if (typeof config.pattern === 'string') {
      this.pattern = new RegExp(config.pattern)
    }
    else {
      this.pattern = config.pattern
    }

    this.field = config.field ?? 'message'
    this.invert = config.invert ?? false
  }

  filter(entry: LogEntry): boolean {
    const value = entry[this.field]

    if (value === undefined || value === null) {
      return this.invert
    }

    const matches = this.pattern.test(String(value))

    return this.invert ? !matches : matches
  }
}

/**
 * 创建模式过滤器
 */
export function createPatternFilter(config: PatternFilterConfig): PatternFilter {
  return new PatternFilter(config)
}




