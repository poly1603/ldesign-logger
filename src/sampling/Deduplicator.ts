/**
 * 日志去重器
 * 
 * 防止相同日志重复记录
 */

import type { LogEntry } from '../types'

/**
 * 去重器配置
 */
export interface DeduplicatorConfig {
  /**
   * 去重时间窗口（毫秒）
   * 
   * 在此时间窗口内，相同的日志只记录一次
   * 
   * @default 5000
   */
  windowMs?: number

  /**
   * 日志相似度判断字段
   * 
   * 用于判断两条日志是否相同的字段
   * 
   * @default ['level', 'message', 'source']
   */
  fields?: Array<keyof LogEntry>

  /**
   * 最大缓存数量
   * 
   * 防止缓存无限增长
   * 
   * @default 1000
   */
  maxCacheSize?: number
}

/**
 * 日志去重器
 * 
 * 在指定时间窗口内，相同的日志只记录一次
 * 
 * 工作原理：
 * - 为每条日志生成唯一指纹（基于指定字段）
 * - 维护最近的日志指纹缓存
 * - 检查新日志时，如果指纹已存在且未过期，则认为重复
 * 
 * 使用场景：
 * - 防止相同错误重复记录
 * - 减少循环中的重复日志
 * - 降低日志存储成本
 * 
 * @example
 * ```ts
 * const dedup = new Deduplicator({ windowMs: 5000 })
 * 
 * const entry = { level: LogLevel.ERROR, message: 'Error', timestamp: Date.now() }
 * 
 * if (!dedup.isDuplicate(entry)) {
 *   logger.error('Error')
 * }
 * ```
 */
export class Deduplicator {
  private windowMs: number
  private fields: Array<keyof LogEntry>
  private maxCacheSize: number

  // 缓存：指纹 -> 首次出现时间
  private cache = new Map<string, number>()

  // 统计
  private totalChecks = 0
  private duplicateCount = 0

  /**
   * 构造函数
   * 
   * @param config - 去重器配置
   */
  constructor(config: DeduplicatorConfig = {}) {
    this.windowMs = config.windowMs ?? 5000
    this.fields = config.fields ?? ['level', 'message', 'source']
    this.maxCacheSize = config.maxCacheSize ?? 1000
  }

  /**
   * 生成日志指纹
   * 
   * 基于指定字段生成唯一标识符
   * 
   * @param entry - 日志条目
   * @returns 指纹字符串
   * 
   * @private
   */
  private generateFingerprint(entry: LogEntry): string {
    const parts: string[] = []

    for (const field of this.fields) {
      const value = entry[field]
      if (value !== undefined && value !== null) {
        parts.push(String(value))
      }
    }

    return parts.join('|')
  }

  /**
   * 清理过期的缓存
   * 
   * @private
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    const expired: string[] = []

    // 找出过期的指纹
    for (const [fingerprint, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.windowMs) {
        expired.push(fingerprint)
      }
    }

    // 删除过期的
    for (const fingerprint of expired) {
      this.cache.delete(fingerprint)
    }

    // 如果缓存仍然过大，删除最老的一半
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries())
      // 按时间戳排序
      entries.sort((a, b) => a[1] - b[1])

      // 删除前一半
      const toDelete = entries.slice(0, Math.floor(entries.length / 2))
      for (const [fingerprint] of toDelete) {
        this.cache.delete(fingerprint)
      }
    }
  }

  /**
   * 检查是否为重复日志
   * 
   * @param entry - 日志条目
   * @returns true 表示重复，false 表示非重复
   */
  isDuplicate(entry: LogEntry): boolean {
    this.totalChecks++

    // 清理过期缓存
    this.cleanExpiredCache()

    // 生成指纹
    const fingerprint = this.generateFingerprint(entry)

    // 检查是否存在
    if (this.cache.has(fingerprint)) {
      this.duplicateCount++
      return true // 重复
    }

    // 记录到缓存
    this.cache.set(fingerprint, Date.now())
    return false // 非重复
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存中的指纹数量
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计对象
   */
  getStats(): {
    totalChecks: number
    duplicateCount: number
    uniqueCount: number
    deduplicationRate: number
    cacheSize: number
  } {
    const uniqueCount = this.totalChecks - this.duplicateCount
    const deduplicationRate = this.totalChecks > 0
      ? (this.duplicateCount / this.totalChecks) * 100
      : 0

    return {
      totalChecks: this.totalChecks,
      duplicateCount: this.duplicateCount,
      uniqueCount,
      deduplicationRate: Math.round(deduplicationRate * 100) / 100,
      cacheSize: this.cache.size,
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.totalChecks = 0
    this.duplicateCount = 0
  }
}

/**
 * 创建去重器
 * 
 * @param config - 去重器配置
 * @returns Deduplicator 实例
 * 
 * @example
 * ```ts
 * // 5秒内相同的日志只记录一次
 * const dedup = createDeduplicator({ windowMs: 5000 })
 * 
 * // 基于级别和消息去重
 * const dedup = createDeduplicator({
 *   windowMs: 10000,
 *   fields: ['level', 'message']
 * })
 * ```
 */
export function createDeduplicator(config?: DeduplicatorConfig): Deduplicator {
  return new Deduplicator(config)
}

