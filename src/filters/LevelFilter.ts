import type { LogEntry, LogLevel } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 日志级别过滤器配置
 */
export interface LevelFilterConfig {
  /**
   * 最小日志级别（包含）
   */
  minLevel?: LogLevel

  /**
   * 最大日志级别（包含）
   */
  maxLevel?: LogLevel

  /**
   * 精确匹配的日志级别
   */
  exactLevels?: LogLevel[]
}

/**
 * 日志级别过滤器
 * 根据日志级别过滤日志
 */
export class LevelFilter implements LogFilter {
  name = 'level'
  private minLevel?: LogLevel
  private maxLevel?: LogLevel
  private exactLevels?: Set<LogLevel>

  constructor(config: LevelFilterConfig) {
    this.minLevel = config.minLevel
    this.maxLevel = config.maxLevel

    if (config.exactLevels && config.exactLevels.length > 0) {
      this.exactLevels = new Set(config.exactLevels)
    }
  }

  filter(entry: LogEntry): boolean {
    // 精确匹配
    if (this.exactLevels) {
      return this.exactLevels.has(entry.level)
    }

    // 范围匹配
    if (this.minLevel !== undefined && entry.level < this.minLevel) {
      return false
    }

    if (this.maxLevel !== undefined && entry.level > this.maxLevel) {
      return false
    }

    return true
  }
}

/**
 * 创建日志级别过滤器
 */
export function createLevelFilter(config: LevelFilterConfig): LevelFilter {
  return new LevelFilter(config)
}




