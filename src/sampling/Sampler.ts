/**
 * 日志采样器
 * 
 * 按比例采样日志，减少日志量
 */

/**
 * 采样器配置
 */
export interface SamplerConfig {
  /**
   * 采样率（0-1）
   * 
   * - 0: 不记录任何日志
   * - 0.1: 记录 10% 的日志
   * - 1: 记录所有日志
   * 
   * @default 1
   */
  sampleRate?: number

  /**
   * 采样策略
   * 
   * - `random`: 随机采样
   * - `fixed`: 固定间隔采样（每 N 条记录一条）
   * 
   * @default 'random'
   */
  strategy?: 'random' | 'fixed'
}

/**
 * 日志采样器
 * 
 * 按指定比例采样日志，减少日志量但保持代表性
 * 
 * 采样策略：
 * - 随机采样：每条日志有固定概率被记录，适合大数据量
 * - 固定间隔：每 N 条记录一条，适合均匀分布的日志
 * 
 * 使用场景：
 * - 高频日志降频
 * - 生产环境日志量控制
 * - 性能优化
 * 
 * @example
 * ```ts
 * // 只记录 10% 的日志
 * const sampler = new Sampler({ sampleRate: 0.1 })
 * 
 * if (sampler.shouldSample()) {
 *   logger.info('Message')
 * }
 * ```
 */
export class Sampler {
  private sampleRate: number
  private strategy: 'random' | 'fixed'
  private counter = 0

  /**
   * 构造函数
   * 
   * @param config - 采样器配置
   */
  constructor(config: SamplerConfig = {}) {
    this.sampleRate = config.sampleRate ?? 1
    this.strategy = config.strategy ?? 'random'

    // 验证采样率
    if (this.sampleRate < 0 || this.sampleRate > 1) {
      throw new Error('Sample rate must be between 0 and 1')
    }
  }

  /**
   * 检查是否应该采样此日志
   * 
   * @returns true 表示应该记录，false 表示跳过
   */
  shouldSample(): boolean {
    // 采样率为 0，不记录任何日志
    if (this.sampleRate === 0) {
      return false
    }

    // 采样率为 1，记录所有日志
    if (this.sampleRate === 1) {
      return true
    }

    if (this.strategy === 'random') {
      // 随机采样
      return Math.random() < this.sampleRate
    }
    else {
      // 固定间隔采样
      this.counter++
      const interval = Math.round(1 / this.sampleRate)
      return this.counter % interval === 0
    }
  }

  /**
   * 设置采样率
   * 
   * @param rate - 新的采样率（0-1）
   */
  setSampleRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Sample rate must be between 0 and 1')
    }
    this.sampleRate = rate
  }

  /**
   * 获取当前采样率
   * 
   * @returns 采样率
   */
  getSampleRate(): number {
    return this.sampleRate
  }

  /**
   * 重置计数器（仅对固定间隔策略有效）
   */
  reset(): void {
    this.counter = 0
  }
}

/**
 * 创建采样器
 * 
 * @param config - 采样器配置
 * @returns Sampler 实例
 * 
 * @example
 * ```ts
 * // 随机采样 20%
 * const sampler = createSampler({ sampleRate: 0.2, strategy: 'random' })
 * 
 * // 固定间隔采样（每5条记录一条）
 * const sampler = createSampler({ sampleRate: 0.2, strategy: 'fixed' })
 * ```
 */
export function createSampler(config?: SamplerConfig): Sampler {
  return new Sampler(config)
}

