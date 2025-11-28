/**
 * HTTP 传输器
 * @description 将日志批量上报到远程服务器
 */

import type { LogEntry, LogTransport, ReportOptions } from '../types'
import { LogLevel } from '../types'
import { AsyncQueue } from '../utils/async-queue'

/**
 * HTTP 传输器配置
 */
export interface HttpTransportOptions extends ReportOptions {
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 自定义请求处理函数 */
  customRequest?: (entries: LogEntry[], options: ReportOptions) => Promise<void>
}

/**
 * HTTP 传输器
 * @description 支持批量上报、重试机制的 HTTP 日志传输器
 * @example
 * ```ts
 * const transport = new HttpTransport({
 *   url: 'https://api.example.com/logs',
 *   batchSize: 50,
 *   batchInterval: 5000,
 * })
 *
 * logger.addTransport(transport)
 * ```
 */
export class HttpTransport implements LogTransport {
  readonly name = 'http'
  level?: LogLevel
  enabled: boolean

  private options: Required<HttpTransportOptions>
  private queue: AsyncQueue<LogEntry>
  private retryQueue: LogEntry[] = []

  constructor(options: HttpTransportOptions) {
    this.options = {
      url: options.url,
      method: options.method ?? 'POST',
      headers: options.headers ?? { 'Content-Type': 'application/json' },
      batchSize: options.batchSize ?? 50,
      batchInterval: options.batchInterval ?? 5000,
      retryCount: options.retryCount ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      timeout: options.timeout ?? 10000,
      useBeacon: options.useBeacon ?? false,
      level: options.level ?? LogLevel.WARN,
      enabled: options.enabled ?? true,
      customRequest: options.customRequest as HttpTransportOptions['customRequest'],
    }

    this.level = this.options.level
    this.enabled = this.options.enabled

    // 初始化队列
    this.queue = new AsyncQueue({
      batchSize: this.options.batchSize,
      flushInterval: this.options.batchInterval,
    })

    this.queue.onFlush(entries => this.sendBatch(entries))

    // 页面卸载时使用 Beacon API 发送剩余日志
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.sendBeacon())
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.sendBeacon()
        }
      })
    }
  }

  /**
   * 写入日志
   */
  write(entry: LogEntry): void {
    if (!this.enabled) {
      return
    }
    this.queue.push(entry)
  }

  /**
   * 批量写入日志
   */
  writeBatch(entries: LogEntry[]): void {
    if (!this.enabled) {
      return
    }
    this.queue.pushMany(entries)
  }

  /**
   * 刷新缓冲区
   */
  async flush(): Promise<void> {
    await this.queue.flush()
  }

  /**
   * 关闭传输器
   */
  async close(): Promise<void> {
    await this.flush()
    this.queue.destroy()
  }

  /**
   * 发送日志批次
   * @private
   */
  private async sendBatch(entries: LogEntry[], retryCount = 0): Promise<void> {
    if (entries.length === 0) {
      return
    }

    try {
      // 使用自定义请求处理
      if (this.options.customRequest) {
        await this.options.customRequest(entries, this.options)
        return
      }

      // 发送请求
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout)

      const response = await fetch(this.options.url, {
        method: this.options.method,
        headers: this.options.headers,
        body: JSON.stringify({ logs: entries, timestamp: Date.now() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    }
    catch (error) {
      console.error('[HttpTransport] 发送日志失败:', error)

      // 重试逻辑
      if (retryCount < this.options.retryCount) {
        await this.delay(this.options.retryDelay * (retryCount + 1))
        await this.sendBatch(entries, retryCount + 1)
      }
      else {
        // 重试失败，加入重试队列
        this.retryQueue.push(...entries)
      }
    }
  }

  /**
   * 使用 Beacon API 发送剩余日志
   * @private
   */
  private sendBeacon(): void {
    if (!this.options.useBeacon || typeof navigator?.sendBeacon !== 'function') {
      return
    }

    // 获取队列中的所有日志
    const allEntries = [...this.retryQueue]
    this.retryQueue = []

    if (allEntries.length === 0) {
      return
    }

    const blob = new Blob(
      [JSON.stringify({ logs: allEntries, timestamp: Date.now() })],
      { type: 'application/json' },
    )

    navigator.sendBeacon(this.options.url, blob)
  }

  /**
   * 延迟函数
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 创建 HTTP 传输器
 * @param options - 配置选项
 * @returns HTTP 传输器实例
 */
export function createHttpTransport(options: HttpTransportOptions): HttpTransport {
  return new HttpTransport(options)
}

