import type { LogEntry, LogLevel } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 日志级别过滤器配置
 */
export interface LevelFilterConfig {
  /**
   * 最小日志级别（包含）
   * 
   * 只记录大于或等于此级别的日志
   * 
   * @example LogLevel.INFO - 只记录 INFO 及以上级别
   */
  minLevel?: LogLevel

  /**
   * 最大日志级别（包含）
   * 
   * 只记录小于或等于此级别的日志
   * 
   * @example LogLevel.WARN - 只记录 WARN 及以下级别
   */
  maxLevel?: LogLevel

  /**
   * 精确匹配的日志级别数组
   * 
   * 只记录在此数组中的级别
   * 如果设置了此项，minLevel 和 maxLevel 将被忽略
   * 
   * @example [LogLevel.ERROR, LogLevel.FATAL] - 只记录错误和致命错误
   */
  exactLevels?: LogLevel[]
}

/**
 * 日志级别过滤器
 * 
 * 根据日志级别过滤日志，支持三种模式：
 * 1. 范围过滤：设置 minLevel 和/或 maxLevel
 * 2. 精确过滤：设置 exactLevels 数组
 * 3. 组合使用（精确过滤优先）
 * 
 * 使用场景：
 * - 只记录错误和警告
 * - 只记录调试信息
 * - 排除 TRACE 级别
 * 
 * @example
 * ```ts
 * // 只记录 WARN 及以上级别
 * const warnFilter = createLevelFilter({ minLevel: LogLevel.WARN })
 * 
 * // 只记录 DEBUG 到 WARN 之间的级别
 * const rangeFilter = createLevelFilter({
 *   minLevel: LogLevel.DEBUG,
 *   maxLevel: LogLevel.WARN
 * })
 * 
 * // 只记录 ERROR 和 FATAL
 * const errorFilter = createLevelFilter({
 *   exactLevels: [LogLevel.ERROR, LogLevel.FATAL]
 * })
 * ```
 */
export class LevelFilter implements LogFilter {
  name = 'level'
  private minLevel?: LogLevel
  private maxLevel?: LogLevel
  private exactLevels?: Set<LogLevel>

  /**
   * 构造函数
   * 
   * @param config - 级别过滤器配置
   */
  constructor(config: LevelFilterConfig) {
    this.minLevel = config.minLevel
    this.maxLevel = config.maxLevel

    // 将精确级别数组转换为 Set 以提高查找性能
    if (config.exactLevels && config.exactLevels.length > 0) {
      this.exactLevels = new Set(config.exactLevels)
    }
  }

  /**
   * 过滤日志条目
   * 
   * 过滤规则（按优先级）：
   * 1. 如果设置了 exactLevels，只检查精确匹配
   * 2. 否则检查范围：minLevel <= level <= maxLevel
   * 
   * @param entry - 日志条目
   * @returns true 表示通过过滤
   */
  filter(entry: LogEntry): boolean {
    // 精确匹配模式（优先）
    if (this.exactLevels) {
      return this.exactLevels.has(entry.level)
    }

    // 范围匹配模式
    // 检查最小级别
    if (this.minLevel !== undefined && entry.level < this.minLevel) {
      return false
    }

    // 检查最大级别
    if (this.maxLevel !== undefined && entry.level > this.maxLevel) {
      return false
    }

    // 通过所有检查
    return true
  }
}

/**
 * 创建日志级别过滤器
 * 
 * 工厂函数，创建并返回一个新的 LevelFilter 实例
 * 
 * @param config - 级别过滤器配置
 * @returns LevelFilter 实例
 * 
 * @example
 * ```ts
 * // 只记录警告和错误
 * const filter1 = createLevelFilter({ minLevel: LogLevel.WARN })
 * logger.addFilter(filter1)
 * 
 * // 只记录 DEBUG 和 INFO
 * const filter2 = createLevelFilter({
 *   minLevel: LogLevel.DEBUG,
 *   maxLevel: LogLevel.INFO
 * })
 * 
 * // 只记录致命错误
 * const filter3 = createLevelFilter({
 *   exactLevels: [LogLevel.FATAL]
 * })
 * ```
 */
export function createLevelFilter(config: LevelFilterConfig): LevelFilter {
  return new LevelFilter(config)
}




