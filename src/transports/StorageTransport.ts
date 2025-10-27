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
   * LocalStorage 或 IndexedDB 中使用的键名
   * @default 'ldesign-logs'
   */
  storageKey?: string

  /**
   * 最大日志条数
   * 超过此数量时，将删除最老的日志
   * @default 1000
   */
  maxLogs?: number

  /**
   * 存储类型
   * - localStorage: 适合少量日志，同步操作
   * - indexedDB: 适合大量日志，异步操作，性能更好
   * @default 'localStorage'
   */
  storageType?: 'localStorage' | 'indexedDB'

  /**
   * 批量保存间隔（毫秒）
   * 延迟批量保存，减少存储操作频率
   * @default 1000
   */
  saveInterval?: number
}

/**
 * Storage 传输器
 * 
 * 将日志持久化到浏览器存储（LocalStorage 或 IndexedDB）
 * 
 * 特性：
 * - 持久化存储：刷新页面后日志仍然存在
 * - 数量限制：防止存储空间无限增长
 * - 批量保存：减少存储操作频率，提高性能
 * - 异步加载：不阻塞主线程
 * 
 * 使用场景：
 * - 本地日志查看和调试
 * - 离线日志收集
 * - 日志备份
 * 
 * 性能考虑：
 * - LocalStorage 同步操作，适合少量日志
 * - IndexedDB 异步操作，适合大量日志
 */
export class StorageTransport implements LogTransport {
  name = 'storage'
  level: LogLevel
  enabled: boolean

  private storageKey: string
  private maxLogs: number
  private storageType: 'localStorage' | 'indexedDB'
  private saveInterval: number

  private buffer: LogEntry[] = []
  // 使用跨平台的定时器类型
  private flushTimer?: ReturnType<typeof setTimeout>
  private isSaving = false

  constructor(config: StorageTransportConfig = {}) {
    this.level = config.level ?? 2 // INFO
    this.enabled = config.enabled ?? true
    this.storageKey = config.storageKey || 'ldesign-logs'
    this.maxLogs = config.maxLogs || 1000
    this.storageType = config.storageType || 'localStorage' // 默认使用 localStorage
    this.saveInterval = config.saveInterval ?? 1000

    // 加载已有日志
    void this.loadLogs()
  }

  /**
   * 加载已有日志
   * 
   * 从存储中读取已保存的日志到缓冲区
   * 
   * @private
   */
  private async loadLogs(): Promise<void> {
    try {
      if (this.storageType === 'localStorage') {
        // LocalStorage 同步读取
        const data = localStorage.getItem(this.storageKey)
        if (data) {
          const logs = JSON.parse(data)
          // 只加载最新的 maxLogs 条
          this.buffer = Array.isArray(logs) ? logs.slice(-this.maxLogs) : []
        }
      }
      else if (this.storageType === 'indexedDB') {
        // IndexedDB 实现（简化版）
        // TODO: 使用 @ldesign/cache 的 IndexedDB 引擎
        // 这里提供基础实现
        await this.loadFromIndexedDB()
      }
    }
    catch (error) {
      console.error('[StorageTransport] Load logs error:', error)
      this.buffer = []
    }
  }

  /**
   * 从 IndexedDB 加载日志（简化实现）
   * 
   * @private
   */
  private async loadFromIndexedDB(): Promise<void> {
    // IndexedDB 基础实现
    // 实际项目中应使用 @ldesign/cache
    try {
      const request = indexedDB.open('ldesign-logger', 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storageKey)) {
          db.createObjectStore(this.storageKey, { keyPath: 'timestamp' })
        }
      }

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = db.transaction(this.storageKey, 'readonly')
        const store = transaction.objectStore(this.storageKey)
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          const logs = getAllRequest.result || []
          // 只保留最新的 maxLogs 条
          this.buffer = logs.slice(-this.maxLogs)
        }
      }
    }
    catch (error) {
      console.warn('[StorageTransport] IndexedDB not available, fallback to memory only', error)
      this.buffer = []
    }
  }

  /**
   * 保存日志到存储
   * 
   * 批量保存缓冲区中的日志，并限制总数量
   * 
   * @private
   */
  private async saveLogs(): Promise<void> {
    if (this.isSaving) {
      return // 避免并发保存
    }

    this.isSaving = true

    try {
      // 限制日志数量，保留最新的
      if (this.buffer.length > this.maxLogs) {
        this.buffer = this.buffer.slice(-this.maxLogs)
      }

      if (this.storageType === 'localStorage') {
        // LocalStorage 同步保存
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.buffer))
        }
        catch (quotaError) {
          // LocalStorage 满了，删除一半旧日志后重试
          console.warn('[StorageTransport] LocalStorage quota exceeded, removing old logs')
          this.buffer = this.buffer.slice(-Math.floor(this.maxLogs / 2))
          localStorage.setItem(this.storageKey, JSON.stringify(this.buffer))
        }
      }
      else if (this.storageType === 'indexedDB') {
        // IndexedDB 异步保存
        await this.saveToIndexedDB()
      }
    }
    catch (error) {
      console.error('[StorageTransport] Save logs error:', error)
    }
    finally {
      this.isSaving = false
    }
  }

  /**
   * 保存日志到 IndexedDB（简化实现）
   * 
   * @private
   */
  private async saveToIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('ldesign-logger', 1)

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          if (!db.objectStoreNames.contains(this.storageKey)) {
            db.createObjectStore(this.storageKey, { keyPath: 'timestamp' })
          }
        }

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          const transaction = db.transaction(this.storageKey, 'readwrite')
          const store = transaction.objectStore(this.storageKey)

          // 先清空旧数据
          store.clear()

          // 保存新数据
          for (const log of this.buffer) {
            store.add(log)
          }

          transaction.oncomplete = () => {
            resolve()
          }

          transaction.onerror = () => {
            reject(new Error('IndexedDB transaction failed'))
          }
        }

        request.onerror = () => {
          reject(new Error('IndexedDB open failed'))
        }
      }
      catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 记录日志到缓冲区
   * 
   * @param entry - 日志条目
   */
  log(entry: LogEntry): void {
    // 检查缓冲区大小，防止内存泄漏
    if (this.buffer.length >= this.maxLogs) {
      // 缓冲区满了，删除最老的日志
      this.buffer.shift()
    }

    this.buffer.push(entry)

    // 延迟批量保存，减少存储操作频率
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    this.flushTimer = setTimeout(() => {
      void this.saveLogs()
      this.flushTimer = undefined
    }, this.saveInterval)
  }

  /**
   * 刷新缓冲区
   * 
   * 立即保存所有待保存的日志
   * 
   * @returns Promise，保存完成后 resolve
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }
    await this.saveLogs()
  }

  /**
   * 销毁传输器
   * 
   * 保存剩余日志，释放资源
   * 
   * @returns Promise，销毁完成后 resolve
   */
  async destroy(): Promise<void> {
    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }

    // 保存剩余日志
    await this.flush()

    // 清空缓冲区
    this.buffer = []
  }

  /**
   * 获取所有日志
   * 
   * 返回缓冲区中的所有日志（副本）
   * 
   * @returns 日志条目数组
   */
  getLogs(): LogEntry[] {
    return [...this.buffer]
  }

  /**
   * 获取日志数量
   * 
   * @returns 当前日志条数
   */
  getLogCount(): number {
    return this.buffer.length
  }

  /**
   * 清空日志
   * 
   * 清空缓冲区和存储中的所有日志
   * 
   * @returns Promise，清空完成后 resolve
   */
  async clear(): Promise<void> {
    this.buffer = []

    try {
      if (this.storageType === 'localStorage') {
        localStorage.removeItem(this.storageKey)
      }
      else if (this.storageType === 'indexedDB') {
        await this.clearIndexedDB()
      }
    }
    catch (error) {
      console.error('[StorageTransport] Clear logs error:', error)
    }
  }

  /**
   * 清空 IndexedDB 中的日志
   * 
   * @private
   */
  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('ldesign-logger', 1)

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result

          if (!db.objectStoreNames.contains(this.storageKey)) {
            resolve()
            return
          }

          const transaction = db.transaction(this.storageKey, 'readwrite')
          const store = transaction.objectStore(this.storageKey)
          const clearRequest = store.clear()

          clearRequest.onsuccess = () => {
            resolve()
          }

          clearRequest.onerror = () => {
            reject(new Error('IndexedDB clear failed'))
          }
        }

        request.onerror = () => {
          reject(new Error('IndexedDB open failed'))
        }
      }
      catch (error) {
        reject(error)
      }
    })
  }
}

/**
 * 创建 Storage 传输器
 */
export function createStorageTransport(config?: StorageTransportConfig): StorageTransport {
  return new StorageTransport(config)
}






