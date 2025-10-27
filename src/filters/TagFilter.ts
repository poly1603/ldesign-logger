import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 标签过滤器配置
 */
export interface TagFilterConfig {
  /**
   * 包含的标签（白名单）
   * 
   * 日志必须至少包含其中一个标签（或全部，取决于 requireAllTags）
   * 
   * @example ['important', 'critical']
   */
  includeTags?: string[]

  /**
   * 排除的标签（黑名单）
   * 
   * 日志包含任一标签则被过滤掉
   * 
   * @example ['debug', 'test']
   */
  excludeTags?: string[]

  /**
   * 是否要求包含所有标签
   * 
   * - true: 必须包含 includeTags 中的所有标签（AND 逻辑）
   * - false: 只需包含任意一个标签（OR 逻辑）
   * 
   * @default false
   */
  requireAllTags?: boolean
}

/**
 * 标签过滤器
 * 
 * 根据日志标签过滤日志，支持白名单和黑名单模式
 * 
 * 过滤逻辑：
 * 1. 先检查黑名单（excludeTags）：包含任一标签则过滤
 * 2. 再检查白名单（includeTags）：
 *    - requireAllTags=true：必须包含所有标签
 *    - requireAllTags=false：包含任一标签即可
 * 
 * 使用场景：
 * - 只记录生产环境日志
 * - 排除测试相关日志
 * - 只记录关键业务日志
 * 
 * @example
 * ```ts
 * // 只记录包含 'important' 或 'critical' 标签的日志
 * const filter1 = createTagFilter({
 *   includeTags: ['important', 'critical']
 * })
 * 
 * // 排除测试日志
 * const filter2 = createTagFilter({
 *   excludeTags: ['test', 'debug']
 * })
 * 
 * // 必须同时包含 'production' 和 'api' 标签
 * const filter3 = createTagFilter({
 *   includeTags: ['production', 'api'],
 *   requireAllTags: true
 * })
 * ```
 */
export class TagFilter implements LogFilter {
  name = 'tag'
  private includeTags?: Set<string>
  private excludeTags?: Set<string>
  private requireAllTags: boolean

  /**
   * 构造函数
   * 
   * @param config - 标签过滤器配置
   */
  constructor(config: TagFilterConfig) {
    // 将标签数组转换为 Set 以提高查找性能
    if (config.includeTags && config.includeTags.length > 0) {
      this.includeTags = new Set(config.includeTags)
    }

    if (config.excludeTags && config.excludeTags.length > 0) {
      this.excludeTags = new Set(config.excludeTags)
    }

    this.requireAllTags = config.requireAllTags ?? false
  }

  /**
   * 过滤日志条目
   * 
   * 过滤流程：
   * 1. 获取日志的标签列表
   * 2. 检查黑名单：包含任一排除标签则返回 false
   * 3. 检查白名单：
   *    - 如果 requireAllTags=true，必须包含所有标签
   *    - 如果 requireAllTags=false，包含任一标签即可
   * 
   * @param entry - 日志条目
   * @returns true 表示通过过滤
   */
  filter(entry: LogEntry): boolean {
    const tags = entry.tags || []

    // 检查排除标签
    if (this.excludeTags) {
      for (const tag of tags) {
        if (this.excludeTags.has(tag)) {
          return false
        }
      }
    }

    // 检查包含标签
    if (this.includeTags) {
      if (this.requireAllTags) {
        // 要求包含所有标签
        for (const tag of this.includeTags) {
          if (!tags.includes(tag)) {
            return false
          }
        }
        return true
      }
      else {
        // 要求包含任意标签
        for (const tag of tags) {
          if (this.includeTags.has(tag)) {
            return true
          }
        }
        return false
      }
    }

    return true
  }
}

/**
 * 创建标签过滤器
 * 
 * 工厂函数，创建并返回一个新的 TagFilter 实例
 * 
 * @param config - 标签过滤器配置
 * @returns TagFilter 实例
 * 
 * @example
 * ```ts
 * // 只记录生产环境日志
 * const prodFilter = createTagFilter({
 *   includeTags: ['production']
 * })
 * logger.addFilter(prodFilter)
 * 
 * // 排除测试日志
 * const noTestFilter = createTagFilter({
 *   excludeTags: ['test', 'debug']
 * })
 * 
 * // 只记录同时包含 'api' 和 'critical' 标签的日志
 * const criticalApiFilter = createTagFilter({
 *   includeTags: ['api', 'critical'],
 *   requireAllTags: true
 * })
 * ```
 */
export function createTagFilter(config: TagFilterConfig): TagFilter {
  return new TagFilter(config)
}




