/**
 * 异步队列
 * @description 用于异步处理日志的队列，避免阻塞主线程
 */

/**
 * 异步队列配置
 */
export interface AsyncQueueOptions {
  /** 最大队列长度 */
  maxSize?: number
  /** 批量处理大小 */
  batchSize?: number
  /** 处理间隔（毫秒） */
  flushInterval?: number
  /** 是否自动处理 */
  autoFlush?: boolean
}

/**
 * 异步队列类
 * @description 支持批量处理和自动刷新的异步队列
 * @template T - 队列元素类型
 * @example
 * ```ts
 * const queue = new AsyncQueue<LogEntry>({
 *   batchSize: 10,
 *   flushInterval: 1000,
 * })
 *
 * queue.onFlush(entries => {
 *   // 批量处理日志
 *   console.log('处理日志:', entries.length)
 * })
 *
 * queue.push(entry1)
 * queue.push(entry2)
 * ```
 */
export class AsyncQueue<T> {
  /** 队列数据 */
  private queue: T[] = []
  /** 刷新回调列表 */
  private flushCallbacks: ((items: T[]) => void | Promise<void>)[] = []
  /** 定时器 ID */
  private timerId: ReturnType<typeof setTimeout> | null = null
  /** 是否正在刷新 */
  private flushing: boolean = false
  /** 配置选项 */
  private options: Required<AsyncQueueOptions>

  /**
   * 创建异步队列
   * @param options - 配置选项
   */
  constructor(options: AsyncQueueOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 1000,
      batchSize: options.batchSize ?? 50,
      flushInterval: options.flushInterval ?? 5000,
      autoFlush: options.autoFlush ?? true,
    }

    if (this.options.autoFlush) {
      this.startAutoFlush()
    }
  }

  /**
   * 获取当前队列长度
   */
  get length(): number {
    return this.queue.length
  }

  /**
   * 队列是否为空
   */
  get isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * 添加元素到队列
   * @param item - 要添加的元素
   */
  push(item: T): void {
    // 超过最大长度时，丢弃最旧的
    if (this.queue.length >= this.options.maxSize) {
      this.queue.shift()
    }

    this.queue.push(item)

    // 达到批量大小时自动刷新
    if (this.queue.length >= this.options.batchSize) {
      this.flush()
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
   * 注册刷新回调
   * @param callback - 刷新时调用的回调函数
   */
  onFlush(callback: (items: T[]) => void | Promise<void>): void {
    this.flushCallbacks.push(callback)
  }

  /**
   * 刷新队列
   * @description 处理队列中的所有元素
   */
  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) {
      return
    }

    this.flushing = true

    try {
      // 取出当前队列中的所有元素
      const items = this.queue.splice(0, this.queue.length)

      // 调用所有回调
      await Promise.all(
        this.flushCallbacks.map(callback => callback(items)),
      )
    }
    finally {
      this.flushing = false
    }
  }

  /**
   * 启动自动刷新
   */
  private startAutoFlush(): void {
    if (this.timerId) {
      return
    }

    this.timerId = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.options.flushInterval)
  }

  /**
   * 停止自动刷新
   */
  stopAutoFlush(): void {
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.queue = []
  }

  /**
   * 销毁队列
   */
  destroy(): void {
    this.stopAutoFlush()
    this.clear()
    this.flushCallbacks = []
  }
}

