import type { LogEntry } from '../types'

/**
 * 日志缓冲器配置
 */
export interface LogBufferConfig {
  /**
   * 缓冲区大小（最大日志条数）
   * @default 100
   */
  size?: number

  /**
   * 刷新间隔（毫秒）
   * 定期自动刷新缓冲区的时间间隔
   * @default 1000
   */
  flushInterval?: number

  /**
   * 刷新回调函数
   * 当缓冲区刷新时调用，接收批量日志条目
   */
  onFlush?: (entries: LogEntry[]) => void | Promise<void>

  /**
   * 防抖延迟（毫秒）
   * 用于合并短时间内的多次刷新请求
   * @default 100
   */
  debounceDelay?: number
}

/**
 * 日志缓冲器
 * 
 * 批量处理日志以提高性能，减少 I/O 操作：
 * - 自动批量处理：累积日志到一定数量后批量刷新
 * - 定时刷新：定期刷新缓冲区，避免日志堆积
 * - 防抖机制：合并短时间内的多次刷新请求
 * - 异步刷新：不阻塞主线程
 * 
 * 性能优化：
 * - 减少频繁的 I/O 操作
 * - 批量发送减少网络请求
 * - 防抖避免过度刷新
 */
export class LogBuffer {
  private buffer: LogEntry[] = []
  private size: number
  private flushInterval: number
  private debounceDelay: number
  private onFlush?: (entries: LogEntry[]) => void | Promise<void>

  // 使用 ReturnType<typeof setTimeout> 代替 NodeJS.Timeout，支持浏览器和 Node.js
  private flushTimer?: ReturnType<typeof setTimeout>
  private debounceTimer?: ReturnType<typeof setTimeout>
  private flushing = false

  constructor(config: LogBufferConfig) {
    this.size = config.size ?? 100
    this.flushInterval = config.flushInterval ?? 1000
    this.debounceDelay = config.debounceDelay ?? 100
    this.onFlush = config.onFlush

    // 启动定时刷新
    this.startFlushTimer()
  }

  /**
   * 添加日志到缓冲区
   * 
   * 添加单条日志，并根据缓冲区大小决定是否立即刷新
   * 
   * @param entry - 日志条目
   */
  add(entry: LogEntry): void {
    this.buffer.push(entry)

    // 缓冲区满了，立即刷新（带防抖）
    if (this.buffer.length >= this.size) {
      this.debouncedFlush()
    }
  }

  /**
   * 批量添加日志
   * 
   * 一次性添加多条日志，提高性能
   * 
   * @param entries - 日志条目数组
   */
  addBatch(entries: LogEntry[]): void {
    this.buffer.push(...entries)

    // 检查是否超过缓冲区大小
    if (this.buffer.length >= this.size) {
      this.debouncedFlush()
    }
  }

  /**
   * 防抖刷新
   * 
   * 在短时间内多次调用时，只执行最后一次
   * 避免过度频繁的刷新操作
   * 
   * @private
   */
  private debouncedFlush(): void {
    // 清除之前的防抖定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // 设置新的防抖定时器
    this.debounceTimer = setTimeout(() => {
      this.flush()
      this.debounceTimer = undefined
    }, this.debounceDelay)
  }

  /**
   * 刷新缓冲区
   * 
   * 将缓冲区中的所有日志批量发送，然后清空缓冲区
   * 
   * 特点：
   * - 异步执行，不阻塞主线程
   * - 防止并发刷新（通过 flushing 标志）
   * - 错误处理，不影响后续日志记录
   * 
   * @returns Promise，刷新完成后 resolve
   */
  async flush(): Promise<void> {
    // 避免并发刷新
    if (this.flushing || this.buffer.length === 0) {
      return
    }

    this.flushing = true

    try {
      // 复制缓冲区并立即清空，避免刷新期间新日志丢失
      const entries = [...this.buffer]
      this.buffer = []

      // 调用刷新回调
      if (this.onFlush) {
        await this.onFlush(entries)
      }
    }
    catch (error) {
      console.error('[LogBuffer] Flush error:', error)
    }
    finally {
      this.flushing = false
    }
  }

  /**
   * 启动定时刷新
   * 
   * 创建定时器，定期自动刷新缓冲区
   * 
   * @private
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * 停止定时刷新
   * 
   * 清除定时器，停止自动刷新
   * 
   * @private
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * 获取当前缓冲区大小
   * 
   * @returns 缓冲区中的日志条数
   */
  getSize(): number {
    return this.buffer.length
  }

  /**
   * 获取缓冲区最大容量
   * 
   * @returns 缓冲区最大日志条数
   */
  getCapacity(): number {
    return this.size
  }

  /**
   * 检查缓冲区是否已满
   * 
   * @returns true 表示已满，false 表示未满
   */
  isFull(): boolean {
    return this.buffer.length >= this.size
  }

  /**
   * 清空缓冲区
   * 
   * 直接清空，不触发刷新
   * 注意：这会导致缓冲区中的日志丢失
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * 销毁缓冲器
   * 
   * 停止定时器，刷新剩余日志，释放资源
   * 
   * @returns Promise，销毁完成后 resolve
   */
  async destroy(): Promise<void> {
    // 停止所有定时器
    this.stopFlushTimer()
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = undefined
    }

    // 刷新剩余日志
    await this.flush()
  }
}

/**
 * 创建日志缓冲器
 */
export function createLogBuffer(config: LogBufferConfig): LogBuffer {
  return new LogBuffer(config)
}




