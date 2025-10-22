import type { LogEntry, LogLevel, LogTransport } from '../types'

/**
 * Storage 传输器配置
 */
export interface StorageTransportConfig {
  /**
   * 最低日志级别
   * @default LogLevel.INFO
   */
  level?: LogLevel

  /**
   * 是否启用
   * @default true
   */
  enabled?: boolean

  /**
   * 存储键名
   * @default 'ldesign-logs'
   */
  storageKey?: string

  /**
   * 最大日志条数
   * @default 1000
   */
  maxLogs?: number

  /**
   * 使用 IndexedDB 还是 LocalStorage
   * @default 'indexedDB'
   */
  storageType?: 'localStorage' | 'indexedDB'
}

/**
 * Storage 传输器
 * 将日志持久化到浏览器存储
 */
export class StorageTransport implements LogTransport {
  name = 'storage'
  level: LogLevel
  enabled: boolean
  private storageKey: string
  private maxLogs: number
  private storageType: 'localStorage' | 'indexedDB'
  private buffer: LogEntry[] = []
  private flushTimer?: NodeJS.Timeout

  constructor(config: StorageTransportConfig = {}) {
    this.level = config.level ?? 2 // INFO
    this.enabled = config.enabled ?? true
    this.storageKey = config.storageKey || 'ldesign-logs'
    this.maxLogs = config.maxLogs || 1000
    this.storageType = config.storageType || 'indexedDB'

    // 加载已有日志
    this.loadLogs()
  }

  /**
   * 加载已有日志
   */
  private async loadLogs(): Promise<void> {
    try {
      if (this.storageType === 'localStorage') {
        const data = localStorage.getItem(this.storageKey)
        if (data) {
          this.buffer = JSON.parse(data)
        }
      }
      else if (this.storageType === 'indexedDB') {
        // 使用 @ldesign/cache 的 IndexedDB 引擎
        // 这里简化处理，实际使用时需要集成 cache 包
      }
    }
    catch (error) {
      console.error('[StorageTransport] Load logs error:', error)
    }
  }

  /**
   * 保存日志
   */
  private async saveLogs(): Promise<void> {
    try {
      // 限制日志数量
      if (this.buffer.length > this.maxLogs) {
        this.buffer = this.buffer.slice(-this.maxLogs)
      }

      if (this.storageType === 'localStorage') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.buffer))
      }
      else if (this.storageType === 'indexedDB') {
        // 使用 IndexedDB 存储
        // 实际使用时集成 @ldesign/cache
      }
    }
    catch (error) {
      console.error('[StorageTransport] Save logs error:', error)
    }
  }

  log(entry: LogEntry): void {
    this.buffer.push(entry)

    // 延迟批量保存（1秒后）
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      this.saveLogs()
    }, 1000)
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }
    await this.saveLogs()
  }

  async destroy(): Promise<void> {
    await this.flush()
    this.buffer = []
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.buffer]
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.buffer = []
    try {
      if (this.storageType === 'localStorage') {
        localStorage.removeItem(this.storageKey)
      }
    }
    catch (error) {
      console.error('[StorageTransport] Clear logs error:', error)
    }
  }
}

/**
 * 创建 Storage 传输器
 */
export function createStorageTransport(config?: StorageTransportConfig): StorageTransport {
  return new StorageTransport(config)
}

