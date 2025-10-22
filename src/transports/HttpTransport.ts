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
   * 上报地址
   */
  url: string

  /**
   * 请求方法
   * @default 'POST'
   */
  method?: 'POST' | 'PUT'

  /**
   * 请求头
   */
  headers?: Record<string, string>

  /**
   * 批量发送大小
   * @default 10
   */
  batchSize?: number

  /**
   * 批量发送间隔（毫秒）
   * @default 5000
   */
  batchInterval?: number

  /**
   * 请求超时（毫秒）
   * @default 10000
   */
  timeout?: number

  /**
   * 重试次数
   * @default 3
   */
  retryCount?: number
}

/**
 * HTTP 传输器
 * 将日志上报到远程服务器
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
  private buffer: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout

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
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry)

    // 达到批量大小，立即发送
    if (this.buffer.length >= this.batchSize) {
      this.sendLogs()
      return
    }

    // 延迟批量发送
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.sendLogs()
      }, this.batchInterval)
    }
  }

  /**
   * 发送日志到服务器
   */
  private async sendLogs(retries = 0): Promise<void> {
    if (this.buffer.length === 0) {
      return
    }

    const logs = [...this.buffer]
    this.buffer = []

    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }

    try {
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
    }
    catch (error) {
      console.error('[HttpTransport] Send logs error:', error)

      // 重试
      if (retries < this.retryCount) {
        // 将失败的日志放回缓冲区
        this.buffer.unshift(...logs)
        // 指数退避重试
        setTimeout(() => {
          this.sendLogs(retries + 1)
        }, Math.min(1000 * 2 ** retries, 30000))
      }
      else {
        console.error('[HttpTransport] Max retries reached, logs lost')
      }
    }
  }

  async flush(): Promise<void> {
    await this.sendLogs()
  }

  async destroy(): Promise<void> {
    await this.flush()
  }
}

/**
 * 创建 HTTP 传输器
 */
export function createHttpTransport(config: HttpTransportConfig): HttpTransport {
  return new HttpTransport(config)
}

