import type { LogEntry } from '../types'
import type { LogFilter } from './LogFilter'

/**
 * 标签过滤器配置
 */
export interface TagFilterConfig {
  /**
   * 包含的标签（任意匹配）
   */
  includeTags?: string[]

  /**
   * 排除的标签（任意匹配）
   */
  excludeTags?: string[]

  /**
   * 是否要求包含所有标签
   * @default false
   */
  requireAllTags?: boolean
}

/**
 * 标签过滤器
 * 根据标签过滤日志
 */
export class TagFilter implements LogFilter {
  name = 'tag'
  private includeTags?: Set<string>
  private excludeTags?: Set<string>
  private requireAllTags: boolean

  constructor(config: TagFilterConfig) {
    if (config.includeTags && config.includeTags.length > 0) {
      this.includeTags = new Set(config.includeTags)
    }

    if (config.excludeTags && config.excludeTags.length > 0) {
      this.excludeTags = new Set(config.excludeTags)
    }

    this.requireAllTags = config.requireAllTags ?? false
  }

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
 */
export function createTagFilter(config: TagFilterConfig): TagFilter {
  return new TagFilter(config)
}




