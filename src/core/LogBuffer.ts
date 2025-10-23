import type { LogEntry } from '../types'

/**
 * 日志缓冲器配置
 */
export interface LogBufferConfig {
  /**
   * 缓冲区大小
   * @default 100
   */
  size?: number

  /**
   * 刷新间隔（毫秒）
   * @default 1000
   */
  flushInterval?: number

  /**
   * 刷新回调
   */
  onFlush?: (entries: LogEntry[]) => void | Promise<void>
}

/**
 * 日志缓冲器
 * 批量处理日志以提高性能
 */
export class LogBuffer {
  private buffer: LogEntry[] = []
  private size: number
  private flushInterval: number
  private onFlush?: (entries: LogEntry[]) => void | Promise<void>
  private flushTimer?: NodeJS.Timeout
  private flushing = false

  constructor(config: LogBufferConfig) {
    this.size = config.size ?? 100
    this.flushInterval = config.flushInterval ?? 1000
    this.onFlush = config.onFlush

    // 启动定时刷新
    this.startFlushTimer()
  }

  /**
   * 添加日志到缓冲区
   */
  add(entry: LogEntry): void {
    this.buffer.push(entry)

    // 缓冲区满了，立即刷新
    if (this.buffer.length >= this.size) {
      this.flush()
    }
  }

  /**
   * 批量添加日志
   */
  addBatch(entries: LogEntry[]): void {
    this.buffer.push(...entries)

    if (this.buffer.length >= this.size) {
      this.flush()
    }
  }

  /**
   * 刷新缓冲区
   */
  async flush(): Promise<void> {
    if (this.flushing || this.buffer.length === 0) {
      return
    }

    this.flushing = true

    try {
      const entries = [...this.buffer]
      this.buffer = []

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
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  /**
   * 停止定时刷新
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * 获取缓冲区大小
   */
  getSize(): number {
    return this.buffer.length
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = []
  }

  /**
   * 销毁缓冲器
   */
  async destroy(): Promise<void> {
    this.stopFlushTimer()
    await this.flush()
  }
}

/**
 * 创建日志缓冲器
 */
export function createLogBuffer(config: LogBufferConfig): LogBuffer {
  return new LogBuffer(config)
}




