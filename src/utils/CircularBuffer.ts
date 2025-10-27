/**
 * 循环缓冲区（Ring Buffer）
 * 
 * 固定大小的循环缓冲区，用于高性能的日志存储
 * 
 * 特性：
 * - 固定内存占用：预分配数组，避免动态扩容
 * - O(1) 复杂度：读写操作都是常数时间
 * - 自动覆盖：满了自动覆盖最老的数据
 * - 无 GC 压力：不创建新数组，减少垃圾回收
 * 
 * 适用场景：
 * - 日志缓冲
 * - 性能监控数据
 * - 实时数据流
 */
export class CircularBuffer<T> {
  /** 内部存储数组 */
  private buffer: Array<T | undefined>

  /** 缓冲区容量 */
  private capacity: number

  /** 写指针位置 */
  private writeIndex = 0

  /** 读指针位置 */
  private readIndex = 0

  /** 当前元素数量 */
  private count = 0

  /** 是否已满（至少写满一圈） */
  private isFilled = false

  /**
   * 构造函数
   * 
   * @param capacity - 缓冲区容量（必须 > 0）
   * 
   * @example
   * ```ts
   * const buffer = new CircularBuffer<LogEntry>(1000)
   * ```
   */
  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('CircularBuffer capacity must be > 0')
    }

    this.capacity = capacity
    // 预分配数组，避免后续扩容
    this.buffer = new Array(capacity)
  }

  /**
   * 添加元素到缓冲区
   * 
   * 如果缓冲区已满，会自动覆盖最老的元素
   * 
   * @param item - 要添加的元素
   * 
   * @example
   * ```ts
   * buffer.push(logEntry)
   * ```
   */
  push(item: T): void {
    // 写入数据
    this.buffer[this.writeIndex] = item

    // 移动写指针（循环）
    this.writeIndex = (this.writeIndex + 1) % this.capacity

    // 如果缓冲区已满，移动读指针
    if (this.isFilled) {
      this.readIndex = (this.readIndex + 1) % this.capacity
    }
    else {
      this.count++
      // 检查是否第一次填满
      if (this.count === this.capacity) {
        this.isFilled = true
      }
    }
  }

  /**
   * 批量添加元素
   * 
   * @param items - 要添加的元素数组
   * 
   * @example
   * ```ts
   * buffer.pushBatch([entry1, entry2, entry3])
   * ```
   */
  pushBatch(items: T[]): void {
    for (const item of items) {
      this.push(item)
    }
  }

  /**
   * 读取所有元素（按插入顺序）
   * 
   * 返回的数组从最老的元素到最新的元素
   * 
   * @returns 所有元素的数组
   * 
   * @example
   * ```ts
   * const allLogs = buffer.toArray()
   * ```
   */
  toArray(): T[] {
    const result: T[] = []

    if (this.count === 0) {
      return result
    }

    if (this.isFilled) {
      // 缓冲区已满，从读指针开始读取一圈
      for (let i = 0; i < this.capacity; i++) {
        const index = (this.readIndex + i) % this.capacity
        const item = this.buffer[index]
        if (item !== undefined) {
          result.push(item)
        }
      }
    }
    else {
      // 缓冲区未满，从0读取到写指针
      for (let i = 0; i < this.count; i++) {
        const item = this.buffer[i]
        if (item !== undefined) {
          result.push(item)
        }
      }
    }

    return result
  }

  /**
   * 读取最新的 N 个元素
   * 
   * @param count - 要读取的元素数量
   * @returns 最新的 N 个元素数组
   * 
   * @example
   * ```ts
   * // 获取最新的 10 条日志
   * const recentLogs = buffer.getLast(10)
   * ```
   */
  getLast(count: number): T[] {
    const result: T[] = []
    const actualCount = Math.min(count, this.count)

    if (actualCount === 0) {
      return result
    }

    // 从最新位置往前读取
    for (let i = 0; i < actualCount; i++) {
      const index = (this.writeIndex - 1 - i + this.capacity) % this.capacity
      const item = this.buffer[index]
      if (item !== undefined) {
        result.unshift(item) // 插入到数组开头，保持顺序
      }
    }

    return result
  }

  /**
   * 清空缓冲区
   * 
   * 注意：不会释放内存，只是重置指针
   * 
   * @example
   * ```ts
   * buffer.clear()
   * ```
   */
  clear(): void {
    this.writeIndex = 0
    this.readIndex = 0
    this.count = 0
    this.isFilled = false
    // 可选：清空数组引用，帮助 GC
    // this.buffer.fill(undefined)
  }

  /**
   * 获取当前元素数量
   * 
   * @returns 当前元素数量
   */
  size(): number {
    return this.count
  }

  /**
   * 获取缓冲区容量
   * 
   * @returns 缓冲区容量
   */
  getCapacity(): number {
    return this.capacity
  }

  /**
   * 检查缓冲区是否为空
   * 
   * @returns true 表示为空
   */
  isEmpty(): boolean {
    return this.count === 0
  }

  /**
   * 检查缓冲区是否已满
   * 
   * @returns true 表示已满
   */
  isFull(): boolean {
    return this.count === this.capacity
  }

  /**
   * 获取缓冲区使用率（百分比）
   * 
   * @returns 使用率（0-100）
   */
  usage(): number {
    return (this.count / this.capacity) * 100
  }

  /**
   * 迭代器支持
   * 
   * 允许使用 for...of 循环
   * 
   * @example
   * ```ts
   * for (const entry of buffer) {
   *   console.log(entry)
   * }
   * ```
   */
  *[Symbol.iterator](): Iterator<T> {
    const items = this.toArray()
    for (const item of items) {
      yield item
    }
  }
}

/**
 * 创建循环缓冲区
 * 
 * @param capacity - 缓冲区容量
 * @returns 循环缓冲区实例
 * 
 * @example
 * ```ts
 * const buffer = createCircularBuffer<LogEntry>(1000)
 * ```
 */
export function createCircularBuffer<T>(capacity: number): CircularBuffer<T> {
  return new CircularBuffer<T>(capacity)
}


