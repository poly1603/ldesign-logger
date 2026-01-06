/**
 * 对象池
 * @description 用于复用对象，减少 GC 压力，提升性能
 */

/**
 * 对象池配置
 */
export interface ObjectPoolOptions<T> {
  /** 创建新对象的工厂函数 */
  create: () => T
  /** 重置对象的函数 */
  reset?: (obj: T) => void
  /** 初始池大小 */
  initialSize?: number
  /** 最大池大小 */
  maxSize?: number
  /** 是否在归还时验证对象 */
  validate?: (obj: T) => boolean
}

/**
 * 对象池类
 * @description 通用对象池实现，支持对象复用和自动扩展
 * @template T - 池中对象的类型
 * @example
 * ```ts
 * const pool = new ObjectPool({
 *   create: () => ({ id: '', timestamp: 0, message: '' }),
 *   reset: (obj) => {
 *     obj.id = ''
 *     obj.timestamp = 0
 *     obj.message = ''
 *   },
 *   initialSize: 100,
 *   maxSize: 1000,
 * })
 *
 * const obj = pool.acquire()
 * // 使用对象...
 * pool.release(obj)
 * ```
 */
export class ObjectPool<T> {
  /** 空闲对象池 */
  private pool: T[] = []
  /** 配置选项 */
  private options: Required<ObjectPoolOptions<T>>
  /** 当前已创建对象数量 */
  private createdCount = 0
  /** 获取次数统计 */
  private acquireCount = 0
  /** 归还次数统计 */
  private releaseCount = 0
  /** 命中次数统计（从池中获取） */
  private hitCount = 0

  /**
   * 创建对象池
   * @param options - 配置选项
   */
  constructor(options: ObjectPoolOptions<T>) {
    this.options = {
      create: options.create,
      reset: options.reset ?? (() => {}),
      initialSize: options.initialSize ?? 0,
      maxSize: options.maxSize ?? 1000,
      validate: options.validate ?? (() => true),
    }

    // 预创建对象
    this.prewarm(this.options.initialSize)
  }

  /**
   * 获取池大小
   */
  get size(): number {
    return this.pool.length
  }

  /**
   * 获取已创建对象总数
   */
  get totalCreated(): number {
    return this.createdCount
  }

  /**
   * 获取命中率
   */
  get hitRate(): number {
    return this.acquireCount > 0 ? this.hitCount / this.acquireCount : 0
  }

  /**
   * 获取统计信息
   */
  get stats(): ObjectPoolStats {
    return {
      poolSize: this.pool.length,
      totalCreated: this.createdCount,
      acquireCount: this.acquireCount,
      releaseCount: this.releaseCount,
      hitCount: this.hitCount,
      hitRate: this.hitRate,
    }
  }

  /**
   * 从池中获取对象
   * @returns 对象实例
   */
  acquire(): T {
    this.acquireCount++

    if (this.pool.length > 0) {
      this.hitCount++
      return this.pool.pop()!
    }

    // 创建新对象
    this.createdCount++
    return this.options.create()
  }

  /**
   * 将对象归还到池中
   * @param obj - 要归还的对象
   */
  release(obj: T): void {
    this.releaseCount++

    // 验证对象
    if (!this.options.validate(obj)) {
      return
    }

    // 池已满则丢弃
    if (this.pool.length >= this.options.maxSize) {
      return
    }

    // 重置并归还
    this.options.reset(obj)
    this.pool.push(obj)
  }

  /**
   * 批量获取对象
   * @param count - 获取数量
   * @returns 对象数组
   */
  acquireMany(count: number): T[] {
    const result: T[] = []
    for (let i = 0; i < count; i++) {
      result.push(this.acquire())
    }
    return result
  }

  /**
   * 批量归还对象
   * @param objects - 要归还的对象数组
   */
  releaseMany(objects: T[]): void {
    for (const obj of objects) {
      this.release(obj)
    }
  }

  /**
   * 预热池
   * @param count - 预创建的对象数量
   */
  prewarm(count: number): void {
    const toCreate = Math.min(count, this.options.maxSize - this.pool.length)
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.options.create())
      this.createdCount++
    }
  }

  /**
   * 清空池
   */
  clear(): void {
    this.pool = []
  }

  /**
   * 收缩池到指定大小
   * @param targetSize - 目标大小
   */
  shrink(targetSize: number): void {
    if (this.pool.length > targetSize) {
      this.pool.length = targetSize
    }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.acquireCount = 0
    this.releaseCount = 0
    this.hitCount = 0
  }
}

/**
 * 对象池统计信息
 */
export interface ObjectPoolStats {
  /** 当前池大小 */
  poolSize: number
  /** 总创建数量 */
  totalCreated: number
  /** 获取次数 */
  acquireCount: number
  /** 归还次数 */
  releaseCount: number
  /** 命中次数 */
  hitCount: number
  /** 命中率 */
  hitRate: number
}

/**
 * 创建对象池
 * @param options - 配置选项
 * @returns 对象池实例
 */
export function createObjectPool<T>(options: ObjectPoolOptions<T>): ObjectPool<T> {
  return new ObjectPool(options)
}

/**
 * 日志条目对象池
 * @description 专门用于日志条目的对象池，预配置了创建和重置函数
 */
export function createLogEntryPool(options: Partial<ObjectPoolOptions<Record<string, unknown>>> = {}) {
  return new ObjectPool({
    create: () => ({
      id: '',
      timestamp: 0,
      level: 0,
      levelName: '',
      message: '',
      data: undefined,
      error: undefined,
      stack: undefined,
      tags: undefined,
      category: undefined,
      correlationId: undefined,
      userId: undefined,
      sessionId: undefined,
      source: undefined,
      meta: undefined,
    }),
    reset: (obj) => {
      obj.id = ''
      obj.timestamp = 0
      obj.level = 0
      obj.levelName = ''
      obj.message = ''
      obj.data = undefined
      obj.error = undefined
      obj.stack = undefined
      obj.tags = undefined
      obj.category = undefined
      obj.correlationId = undefined
      obj.userId = undefined
      obj.sessionId = undefined
      obj.source = undefined
      obj.meta = undefined
    },
    initialSize: options.initialSize ?? 100,
    maxSize: options.maxSize ?? 1000,
    ...options,
  })
}
