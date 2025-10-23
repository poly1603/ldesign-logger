import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 组合过滤器操作符
 */
export type CompositeOperator = 'AND' | 'OR' | 'NOT'

/**
 * 组合过滤器配置
 */
export interface CompositeFilterConfig {
  /**
   * 组合操作符
   * - AND: 所有过滤器都通过
   * - OR: 任意过滤器通过
   * - NOT: 所有过滤器都不通过
   * @default 'AND'
   */
  operator?: CompositeOperator

  /**
   * 子过滤器列表
   */
  filters: LogFilter[]
}

/**
 * 组合过滤器
 * 组合多个过滤器
 */
export class CompositeFilter implements LogFilter {
  name = 'composite'
  private operator: CompositeOperator
  private filters: LogFilter[]

  constructor(config: CompositeFilterConfig) {
    this.operator = config.operator ?? 'AND'
    this.filters = config.filters
  }

  filter(entry: LogEntry): boolean {
    if (this.filters.length === 0) {
      return true
    }

    switch (this.operator) {
      case 'AND':
        return this.filters.every(filter => filter.filter(entry))

      case 'OR':
        return this.filters.some(filter => filter.filter(entry))

      case 'NOT':
        return !this.filters.some(filter => filter.filter(entry))

      default:
        return true
    }
  }

  /**
   * 添加过滤器
   */
  addFilter(filter: LogFilter): void {
    this.filters.push(filter)
  }

  /**
   * 移除过滤器
   */
  removeFilter(name: string): void {
    const index = this.filters.findIndex(f => f.name === name)
    if (index !== -1) {
      this.filters.splice(index, 1)
    }
  }

  /**
   * 获取所有过滤器
   */
  getFilters(): LogFilter[] {
    return [...this.filters]
  }
}

/**
 * 创建组合过滤器
 */
export function createCompositeFilter(config: CompositeFilterConfig): CompositeFilter {
  return new CompositeFilter(config)
}




