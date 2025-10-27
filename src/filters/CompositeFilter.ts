import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 组合过滤器操作符
 * 
 * - AND: 所有过滤器都必须通过（逻辑与）
 * - OR: 任意过滤器通过即可（逻辑或）
 * - NOT: 所有过滤器都不通过（逻辑非）
 */
export type CompositeOperator = 'AND' | 'OR' | 'NOT'

/**
 * 组合过滤器配置
 */
export interface CompositeFilterConfig {
  /**
   * 组合操作符
   * 
   * 决定如何组合多个子过滤器的结果：
   * - `AND`: 所有过滤器都返回 true 才通过（严格模式）
   * - `OR`: 任意过滤器返回 true 就通过（宽松模式）
   * - `NOT`: 所有过滤器都返回 false 才通过（排除模式）
   * 
   * @default 'AND'
   */
  operator?: CompositeOperator

  /**
   * 子过滤器列表
   * 
   * 可以包含任意类型的过滤器：
   * - LevelFilter
   * - TagFilter
   * - PatternFilter
   * - 自定义过滤器
   * - 嵌套的 CompositeFilter
   */
  filters: LogFilter[]
}

/**
 * 组合过滤器
 * 
 * 组合多个过滤器，实现复杂的过滤逻辑
 * 
 * 特性：
 * - 支持三种组合模式（AND/OR/NOT）
 * - 支持过滤器嵌套
 * - 动态添加/移除子过滤器
 * 
 * 使用场景：
 * - 组合多个条件（AND 模式）
 * - 满足任一条件即可（OR 模式）
 * - 排除符合条件的日志（NOT 模式）
 * 
 * @example
 * ```ts
 * // AND 模式：同时满足级别和标签条件
 * const andFilter = createCompositeFilter({
 *   operator: 'AND',
 *   filters: [
 *     createLevelFilter({ minLevel: LogLevel.WARN }),
 *     createTagFilter({ includeTags: ['critical'] })
 *   ]
 * })
 * 
 * // OR 模式：满足任一条件
 * const orFilter = createCompositeFilter({
 *   operator: 'OR',
 *   filters: [
 *     createLevelFilter({ exactLevels: [LogLevel.FATAL] }),
 *     createTagFilter({ includeTags: ['critical'] })
 *   ]
 * })
 * 
 * // NOT 模式：排除测试相关的调试日志
 * const notFilter = createCompositeFilter({
 *   operator: 'NOT',
 *   filters: [
 *     createLevelFilter({ exactLevels: [LogLevel.DEBUG] }),
 *     createTagFilter({ includeTags: ['test'] })
 *   ]
 * })
 * ```
 */
export class CompositeFilter implements LogFilter {
  name = 'composite'
  private operator: CompositeOperator
  private filters: LogFilter[]

  /**
   * 构造函数
   * 
   * @param config - 组合过滤器配置
   */
  constructor(config: CompositeFilterConfig) {
    this.operator = config.operator ?? 'AND'
    this.filters = config.filters
  }

  /**
   * 过滤日志条目
   * 
   * 根据操作符执行不同的组合逻辑：
   * - AND: 所有子过滤器都返回 true（短路求值）
   * - OR: 任一子过滤器返回 true（短路求值）
   * - NOT: 所有子过滤器都返回 false
   * 
   * @param entry - 日志条目
   * @returns true 表示通过过滤
   */
  filter(entry: LogEntry): boolean {
    // 空过滤器列表默认通过
    if (this.filters.length === 0) {
      return true
    }

    switch (this.operator) {
      case 'AND':
        // 所有过滤器都必须返回 true
        // 使用 every 实现短路求值（遇到 false 立即返回）
        return this.filters.every(filter => filter.filter(entry))

      case 'OR':
        // 任一过滤器返回 true 即可
        // 使用 some 实现短路求值（遇到 true 立即返回）
        return this.filters.some(filter => filter.filter(entry))

      case 'NOT':
        // 所有过滤器都不通过才算通过
        // 即：任一过滤器返回 true 则整体返回 false
        return !this.filters.some(filter => filter.filter(entry))

      default:
        // 未知操作符，默认通过
        return true
    }
  }

  /**
   * 动态添加子过滤器
   * 
   * @param filter - 要添加的过滤器
   * 
   * @example
   * ```ts
   * const composite = createCompositeFilter({ operator: 'AND', filters: [] })
   * composite.addFilter(createLevelFilter({ minLevel: LogLevel.WARN }))
   * composite.addFilter(createTagFilter({ includeTags: ['important'] }))
   * ```
   */
  addFilter(filter: LogFilter): void {
    this.filters.push(filter)
  }

  /**
   * 移除子过滤器
   * 
   * @param name - 过滤器名称
   * 
   * @example
   * ```ts
   * composite.removeFilter('level')
   * ```
   */
  removeFilter(name: string): void {
    const index = this.filters.findIndex(f => f.name === name)
    if (index !== -1) {
      this.filters.splice(index, 1)
    }
  }

  /**
   * 获取所有子过滤器
   * 
   * @returns 子过滤器数组（副本）
   * 
   * @example
   * ```ts
   * const filters = composite.getFilters()
   * console.log(`包含 ${filters.length} 个过滤器`)
   * ```
   */
  getFilters(): LogFilter[] {
    return [...this.filters]
  }
}

/**
 * 创建组合过滤器
 * 
 * 工厂函数，创建并返回一个新的 CompositeFilter 实例
 * 
 * @param config - 组合过滤器配置
 * @returns CompositeFilter 实例
 * 
 * @example
 * ```ts
 * // AND 模式：级别 >= WARN 且包含 'critical' 标签
 * const strictFilter = createCompositeFilter({
 *   operator: 'AND',
 *   filters: [
 *     createLevelFilter({ minLevel: LogLevel.WARN }),
 *     createTagFilter({ includeTags: ['critical'] })
 *   ]
 * })
 * 
 * // OR 模式：致命错误或关键标签
 * const urgentFilter = createCompositeFilter({
 *   operator: 'OR',
 *   filters: [
 *     createLevelFilter({ exactLevels: [LogLevel.FATAL] }),
 *     createTagFilter({ includeTags: ['critical', 'urgent'] })
 *   ]
 * })
 * 
 * // 嵌套组合：(level >= ERROR AND tag='api') OR tag='critical'
 * const complexFilter = createCompositeFilter({
 *   operator: 'OR',
 *   filters: [
 *     createCompositeFilter({
 *       operator: 'AND',
 *       filters: [
 *         createLevelFilter({ minLevel: LogLevel.ERROR }),
 *         createTagFilter({ includeTags: ['api'] })
 *       ]
 *     }),
 *     createTagFilter({ includeTags: ['critical'] })
 *   ]
 * })
 * ```
 */
export function createCompositeFilter(config: CompositeFilterConfig): CompositeFilter {
  return new CompositeFilter(config)
}




