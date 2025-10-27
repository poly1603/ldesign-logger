import type { LogEntry, LogLevel, LogTransport } from '../types'

/**
 * HTTP 传输器配置
 */
export interface HttpTransportConfig {
  /**
   * 最低日志级别
   * @default LogLevel.WARN
   */
  level?: LogLevel

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean

  /**
   * 上报地址（必填）
   * 日志将通过 HTTP 请求发送到此 URL
   */
  url: string

  /**
   * 请求方法
   * @default 'POST'
   */
  method?: 'POST' | 'PUT'

  /**
   * 自定义请求头
   * 可用于添加认证信息等
   */
  headers?: Record<string, string>

  /**
   * 批量发送大小（条数）
   * 累积到指定条数后批量发送，减少网络请求
   * @default 10
   */
  batchSize?: number

  /**
   * 批量发送间隔（毫秒）
   * 定时批量发送，避免日志堆积
   * @default 5000
   */
  batchInterval?: number

  /**
   * 请求超时时间（毫秒）
   * @default 10000
   */
  timeout?: number

  /**
   * 失败重试次数
   * @default 3
   */
  retryCount?: number

  /**
   * 最大缓冲区大小（条数）
   * 防止内存无限增长，超过此数量时丢弃最老的日志
   * @default 1000
   */
  maxBufferSize?: number
}

/**
 * HTTP 传输器
 * 
 * 将日志通过 HTTP 请求上报到远程服务器
 * 
 * 特性：
 * - 批量发送：累积多条日志后批量发送，减少网络开销
 * - 定时发送：定期自动发送，避免日志堆积
 * - 失败重试：支持指数退避重试策略
 * - 缓冲区限制：防止内存泄漏
 * - 请求超时：避免长时间等待
 * 
 * 性能优化：
 * - 批量发送减少网络请求次数
 * - 异步发送不阻塞主线程
 * - 缓冲区大小限制防止内存溢出
 */
export class HttpTransport implements LogTransport {
  name = 'http'
  level: LogLevel
  enabled: boolean

  private url: string
  private method: 'POST' | 'PUT'
  private headers: Record<string, string>
  private batchSize: number
  private batchInterval: number
  private timeout: number
  private retryCount: number
  private maxBufferSize: number

  private buffer: LogEntry[] = []
  // 使用跨平台的定时器类型
  private flushTimer?: ReturnType<typeof setTimeout>
  private isSending = false

  constructor(config: HttpTransportConfig) {
    this.level = config.level ?? 3 // WARN
    this.enabled = config.enabled ?? true
    this.url = config.url
    this.method = config.method || 'POST'
    this.headers = config.headers || {}
    this.batchSize = config.batchSize || 10
    this.batchInterval = config.batchInterval || 5000
    this.timeout = config.timeout || 10000
    this.retryCount = config.retryCount || 3
    this.maxBufferSize = config.maxBufferSize || 1000

    // 启动定时发送
    this.startBatchTimer()
  }

  /**
   * 记录日志到缓冲区
   * 
   * @param entry - 日志条目
   */
  log(entry: LogEntry): void {
    // 检查缓冲区大小限制，防止内存泄漏
    if (this.buffer.length >= this.maxBufferSize) {
      // 缓冲区已满，丢弃最老的日志（FIFO策略）
      console.warn(`[HttpTransport] Buffer full (${this.maxBufferSize}), dropping oldest log`)
      this.buffer.shift()
    }

    this.buffer.push(entry)

    // 达到批量大小，立即发送
    if (this.buffer.length >= this.batchSize) {
      void this.sendLogs()
    }
  }

  /**
   * 启动批量发送定时器
   * 
   * @private
   */
  private startBatchTimer(): void {
    // 清除旧定时器
    this.stopBatchTimer()

    // 创建新定时器
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        void this.sendLogs()
      }
    }, this.batchInterval)
  }

  /**
   * 停止批量发送定时器
   * 
   * @private
   */
  private stopBatchTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  /**
   * 发送日志到服务器
   * 
   * 批量发送日志，支持失败重试和指数退避
   * 
   * @param retries - 当前重试次数
   * @returns Promise
   * @private
   */
  private async sendLogs(retries = 0): Promise<void> {
    // 避免并发发送
    if (this.isSending || this.buffer.length === 0) {
      return
    }

    this.isSending = true

    // 复制并清空缓冲区，避免发送期间新日志丢失
    const logs = this.buffer.splice(0, this.batchSize)

    try {
      // 使用 AbortController 实现请求超时
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.url, {
        method: this.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({ logs }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 成功后，如果缓冲区还有日志，继续发送
      if (this.buffer.length > 0) {
        // 稍后继续发送，避免过快
        setTimeout(() => {
          this.isSending = false
          void this.sendLogs()
        }, 100)
      }
      else {
        this.isSending = false
      }
    }
    catch (error) {
      console.error('[HttpTransport] Send logs error:', error)

      // 失败重试
      if (retries < this.retryCount) {
        // 将失败的日志放回缓冲区头部（保持顺序）
        // 但要检查缓冲区大小，避免无限增长
        if (this.buffer.length + logs.length <= this.maxBufferSize) {
          this.buffer.unshift(...logs)
        }
        else {
          console.warn(`[HttpTransport] Buffer overflow, dropping ${logs.length} logs`)
        }

        // 指数退避重试：1s, 2s, 4s, 8s, ...（最大 30s）
        const retryDelay = Math.min(1000 * 2 ** retries, 30000)
        setTimeout(() => {
          this.isSending = false
          void this.sendLogs(retries + 1)
        }, retryDelay)
      }
      else {
        // 达到最大重试次数，丢弃日志
        console.error(`[HttpTransport] Max retries (${this.retryCount}) reached, ${logs.length} logs lost`)
        this.isSending = false
      }
    }
  }

  /**
   * 刷新缓冲区
   * 
   * 立即发送所有待发送的日志
   * 
   * @returns Promise，发送完成后 resolve
   */
  async flush(): Promise<void> {
    // 停止定时器，避免干扰
    this.stopBatchTimer()

    // 发送所有日志
    while (this.buffer.length > 0 && !this.isSending) {
      await this.sendLogs()
    }

    // 重新启动定时器
    this.startBatchTimer()
  }

  /**
   * 销毁传输器
   * 
   * 停止定时器，发送剩余日志，释放资源
   * 
   * @returns Promise，销毁完成后 resolve
   */
  async destroy(): Promise<void> {
    // 停止定时器
    this.stopBatchTimer()

    // 发送剩余日志
    await this.flush()

    // 清空缓冲区
    this.buffer = []
  }
}

/**
 * 创建 HTTP 传输器
 */
export function createHttpTransport(config: HttpTransportConfig): HttpTransport {
  return new HttpTransport(config)
}






