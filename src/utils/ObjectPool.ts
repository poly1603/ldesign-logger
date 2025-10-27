/**
 * 对象池（Object Pool）
 * 
 * 通过复用对象减少内存分配和 GC 压力，提升高频操作性能
 * 
 * 特性：
 * - 对象复用：避免频繁创建和销毁对象
 * - 自动扩容：池不够用时自动创建新对象
 * - 大小限制：防止池无限增长
 * - 类型安全：完整的 TypeScript 类型支持
 * 
 * 适用场景：
 * - LogEntry 对象复用
 * - 高频创建的临时对象
 * - 性能关键路径
 * 
 * @example
 * ```ts
 * interface LogEntry {
 *   level: number
 *   message: string
 *   timestamp: number
 * }
 * 
 * const pool = new ObjectPool<LogEntry>(
 *   () => ({ level: 0, message: '', timestamp: 0 }),
 *   (entry) => {
 *     entry.level = 0
 *     entry.message = ''
 *     entry.timestamp = 0
 *   }
 * )
 * 
 * const entry = pool.acquire()
 * entry.level = 1
 * entry.message = 'test'
 * entry.timestamp = Date.now()
 * 
 * // 使用完毕归还
 * pool.release(entry)
 * ```
 */
export class ObjectPool<T> {
  /** 对象池 */
  private pool: T[] = []

  /** 对象工厂函数 */
  private factory: () => T

  /** 对象重置函数 */
  private reset?: (obj: T) => void

  /** 池的最大大小 */
  private maxSize: number

  /** 统计：池命中次数 */
  private hits = 0

  /** 统计：创建新对象次数 */
  private misses = 0

  /**
   * 构造函数
   * 
   * @param factory - 对象工厂函数，用于创建新对象
   * @param reset - 对象重置函数（可选），用于清理对象状态
   * @param maxSize - 池的最大大小，默认 100
   * 
   * @example
   * ```ts
   * const pool = new ObjectPool<LogEntry>(
   *   () => ({ level: 0, message: '', timestamp: 0 }),
   *   (entry) => {
   *     entry.level = 0
   *     entry.message = ''
   *     entry.timestamp = 0
   *   },
   *   200 // 最多缓存 200 个对象
   * )
   * ```
   */
  constructor(
    factory: () => T,
    reset?: (obj: T) => void,
    maxSize = 100,
  ) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize
  }

  /**
   * 从池中获取对象
   * 
   * 如果池中有可用对象，直接返回；否则创建新对象
   * 
   * @returns 对象实例
   * 
   * @example
   * ```ts
   * const entry = pool.acquire()
   * entry.message = 'Hello'
   * ```
   */
  acquire(): T {
    if (this.pool.length > 0) {
      this.hits++
      return this.pool.pop()!
    }
    else {
      this.misses++
      return this.factory()
    }
  }

  /**
   * 将对象归还到池中
   * 
   * 如果池未满，对象会被保存以便复用；否则丢弃
   * 
   * @param obj - 要归还的对象
   * 
   * @example
   * ```ts
   * pool.release(entry)
   * ```
   */
  release(obj: T): void {
    // 检查池大小限制
    if (this.pool.length >= this.maxSize) {
      return // 池已满，丢弃对象
    }

    // 重置对象状态
    if (this.reset) {
      this.reset(obj)
    }

    // 归还到池中
    this.pool.push(obj)
  }

  /**
   * 批量归还对象
   * 
   * @param objects - 要归还的对象数组
   * 
   * @example
   * ```ts
   * pool.releaseBatch([entry1, entry2, entry3])
   * ```
   */
  releaseBatch(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj)
    }
  }

  /**
   * 清空对象池
   * 
   * @example
   * ```ts
   * pool.clear()
   * ```
   */
  clear(): void {
    this.pool = []
  }

  /**
   * 获取池中可用对象数量
   * 
   * @returns 可用对象数量
   */
  size(): number {
    return this.pool.length
  }

  /**
   * 获取池的最大大小
   * 
   * @returns 最大大小
   */
  getMaxSize(): number {
    return this.maxSize
  }

  /**
   * 获取统计信息
   * 
   * @returns 统计对象
   * 
   * @example
   * ```ts
   * const stats = pool.getStats()
   * console.log(`命中率: ${stats.hitRate}%`)
   * ```
   */
  getStats(): {
    hits: number
    misses: number
    hitRate: number
    size: number
    maxSize: number
  } {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.pool.length,
      maxSize: this.maxSize,
    }
  }

  /**
   * 重置统计信息
   * 
   * @example
   * ```ts
   * pool.resetStats()
   * ```
   */
  resetStats(): void {
    this.hits = 0
    this.misses = 0
  }

  /**
   * 预热池（提前创建对象）
   * 
   * 在应用启动时调用，避免首次使用时的创建延迟
   * 
   * @param count - 要预创建的对象数量
   * 
   * @example
   * ```ts
   * // 启动时预创建 50 个对象
   * pool.warmup(50)
   * ```
   */
  warmup(count: number): void {
    const actualCount = Math.min(count, this.maxSize)

    for (let i = 0; i < actualCount; i++) {
      if (this.pool.length < this.maxSize) {
        this.pool.push(this.factory())
      }
    }
  }
}

/**
 * 创建对象池
 * 
 * @param factory - 对象工厂函数
 * @param reset - 对象重置函数（可选）
 * @param maxSize - 池的最大大小（可选）
 * @returns 对象池实例
 * 
 * @example
 * ```ts
 * const pool = createObjectPool<LogEntry>(
 *   () => ({ level: 0, message: '', timestamp: 0 }),
 *   (entry) => { entry.message = '' }
 * )
 * ```
 */
export function createObjectPool<T>(
  factory: () => T,
  reset?: (obj: T) => void,
  maxSize?: number,
): ObjectPool<T> {
  return new ObjectPool<T>(factory, reset, maxSize)
}


