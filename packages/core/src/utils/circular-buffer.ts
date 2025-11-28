/**
 * 环形缓冲区
 * @description 固定大小的高性能缓冲区，用于存储日志历史
 */

/**
 * 环形缓冲区类
 * @description 固定大小的环形缓冲区，自动覆盖最旧的数据
 * @template T - 缓冲区元素类型
 * @example
 * ```ts
 * const buffer = new CircularBuffer<string>(3)
 * buffer.push('a')
 * buffer.push('b')
 * buffer.push('c')
 * buffer.push('d') // 'a' 被覆盖
 * buffer.toArray() // ['b', 'c', 'd']
 * ```
 */
export class CircularBuffer<T> {
  /** 存储数组 */
  private buffer: (T | undefined)[]
  /** 写入位置 */
  private writeIndex: number = 0
  /** 当前元素数量 */
  private count: number = 0

  /**
   * 创建环形缓冲区
   * @param capacity - 缓冲区容量
   */
  constructor(private readonly capacity: number) {
    if (capacity <= 0) {
      throw new Error('缓冲区容量必须大于 0')
    }
    this.buffer = new Array(capacity)
  }

  /**
   * 获取缓冲区容量
   */
  get size(): number {
    return this.capacity
  }

  /**
   * 获取当前元素数量
   */
  get length(): number {
    return this.count
  }

  /**
   * 缓冲区是否已满
   */
  get isFull(): boolean {
    return this.count === this.capacity
  }

  /**
   * 缓冲区是否为空
   */
  get isEmpty(): boolean {
    return this.count === 0
  }

  /**
   * 添加元素
   * @param item - 要添加的元素
   */
  push(item: T): void {
    this.buffer[this.writeIndex] = item
    this.writeIndex = (this.writeIndex + 1) % this.capacity
    if (this.count < this.capacity) {
      this.count++
    }
  }

  /**
   * 批量添加元素
   * @param items - 要添加的元素数组
   */
  pushMany(items: T[]): void {
    for (const item of items) {
      this.push(item)
    }
  }

  /**
   * 获取指定位置的元素
   * @param index - 索引位置（0 为最旧的元素）
   * @returns 元素或 undefined
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this.count) {
      return undefined
    }

    const actualIndex = this.isFull
      ? (this.writeIndex + index) % this.capacity
      : index

    return this.buffer[actualIndex]
  }

  /**
   * 获取最新的 n 个元素
   * @param n - 元素数量
   * @returns 元素数组
   */
  getLast(n: number): T[] {
    const count = Math.min(n, this.count)
    const result: T[] = []

    for (let i = this.count - count; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * 转换为数组
   * @returns 包含所有元素的数组（按时间顺序）
   */
  toArray(): T[] {
    const result: T[] = []

    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        result.push(item)
      }
    }

    return result
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = new Array(this.capacity)
    this.writeIndex = 0
    this.count = 0
  }

  /**
   * 遍历所有元素
   * @param callback - 回调函数
   */
  forEach(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.count; i++) {
      const item = this.get(i)
      if (item !== undefined) {
        callback(item, i)
      }
    }
  }

  /**
   * 过滤元素
   * @param predicate - 过滤条件
   * @returns 满足条件的元素数组
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.toArray().filter(predicate)
  }
}

