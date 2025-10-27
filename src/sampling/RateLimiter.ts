/**
 * 速率限制器
 * 
 * 限制日志记录的频率，防止日志洪水
 */

/**
 * 速率限制器配置
 */
export interface RateLimiterConfig {
  /**
   * 时间窗口（毫秒）
   * 
   * 在此时间窗口内最多允许指定数量的日志
   * 
   * @default 1000
   */
  windowMs?: number

  /**
   * 最大日志数
   * 
   * 在时间窗口内允许的最大日志数量
   * 
   * @default 100
   */
  maxLogs?: number
}

/**
 * 速率限制器
 * 
 * 使用滑动时间窗口算法限制日志频率
 * 
 * 工作原理：
 * - 维护一个时间戳数组，记录最近的日志时间
 * - 每次检查时，移除过期的时间戳（超出窗口）
 * - 如果当前窗口内的日志数未超过限制，允许记录
 * 
 * 使用场景：
 * - 防止日志洪水攻击
 * - 限制高频错误日志
 * - 保护日志服务器
 * 
 * @example
 * ```ts
 * // 每秒最多 100 条日志
 * const limiter = new RateLimiter({ windowMs: 1000, maxLogs: 100 })
 * 
 * if (limiter.allowLog()) {
 *   logger.info('Message')
 * }
 * ```
 */
export class RateLimiter {
  private windowMs: number
  private maxLogs: number
  private timestamps: number[] = []

  /**
   * 构造函数
   * 
   * @param config - 速率限制器配置
   */
  constructor(config: RateLimiterConfig = {}) {
    this.windowMs = config.windowMs ?? 1000
    this.maxLogs = config.maxLogs ?? 100
  }

  /**
   * 检查是否允许记录日志
   * 
   * @returns true 表示允许，false 表示超过限制
   */
  allowLog(): boolean {
    const now = Date.now()

    // 移除过期的时间戳
    this.timestamps = this.timestamps.filter(
      timestamp => now - timestamp < this.windowMs,
    )

    // 检查是否超过限制
    if (this.timestamps.length >= this.maxLogs) {
      return false // 超过限制
    }

    // 记录当前时间戳
    this.timestamps.push(now)
    return true
  }

  /**
   * 获取当前窗口内的日志数
   * 
   * @returns 日志数量
   */
  getCurrentCount(): number {
    const now = Date.now()
    return this.timestamps.filter(
      timestamp => now - timestamp < this.windowMs,
    ).length
  }

  /**
   * 获取剩余配额
   * 
   * @returns 剩余可记录的日志数
   */
  getRemainingQuota(): number {
    return Math.max(0, this.maxLogs - this.getCurrentCount())
  }

  /**
   * 重置限制器
   * 
   * 清空所有时间戳记录
   */
  reset(): void {
    this.timestamps = []
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计对象
   */
  getStats(): {
    windowMs: number
    maxLogs: number
    currentCount: number
    remainingQuota: number
    utilizationRate: number
  } {
    const currentCount = this.getCurrentCount()
    const remainingQuota = this.getRemainingQuota()
    const utilizationRate = (currentCount / this.maxLogs) * 100

    return {
      windowMs: this.windowMs,
      maxLogs: this.maxLogs,
      currentCount,
      remainingQuota,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
    }
  }
}

/**
 * 创建速率限制器
 * 
 * @param config - 速率限制器配置
 * @returns RateLimiter 实例
 * 
 * @example
 * ```ts
 * const limiter = createRateLimiter({ windowMs: 1000, maxLogs: 100 })
 * ```
 */
export function createRateLimiter(config?: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config)
}

