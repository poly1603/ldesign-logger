/**
 * 存储传输器
 * @description 将日志持久化到本地存储（localStorage 或 IndexedDB）
 */

import type { LogEntry, LogTransport, StorageOptions } from '../types'
import { LogLevel } from '../types'

/**
 * 存储传输器配置
 */
export interface StorageTransportOptions extends StorageOptions {
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 存储传输器
 * @description 支持 localStorage 和 IndexedDB 的日志持久化传输器
 * @example
 * ```ts
 * const transport = new StorageTransport({
 *   type: 'indexedDB',
 *   dbName: 'app-logs',
 *   maxEntries: 10000,
 * })
 *
 * logger.addTransport(transport)
 * ```
 */
export class StorageTransport implements LogTransport {
  readonly name = 'storage'
  level?: LogLevel
  enabled: boolean

  private options: Required<StorageTransportOptions>
  private db?: IDBDatabase
  private memoryStorage: LogEntry[] = []

  constructor(options: StorageTransportOptions = { type: 'localStorage' }) {
    this.options = {
      type: options.type,
      prefix: options.prefix ?? 'ldesign_logs_',
      maxEntries: options.maxEntries ?? 1000,
      maxSize: options.maxSize ?? 5 * 1024 * 1024, // 5MB
      ttl: options.ttl ?? 7 * 24 * 60 * 60 * 1000, // 7 天
      dbName: options.dbName ?? 'ldesign_logs',
      storeName: options.storeName ?? 'logs',
      level: options.level ?? LogLevel.TRACE,
      enabled: options.enabled ?? true,
    }

    this.level = this.options.level
    this.enabled = this.options.enabled

    // 初始化 IndexedDB
    if (this.options.type === 'indexedDB') {
      this.initIndexedDB()
    }
  }

  /**
   * 写入日志
   */
  write(entry: LogEntry): void {
    if (!this.enabled) {
      return
    }

    switch (this.options.type) {
      case 'localStorage':
        this.writeToLocalStorage(entry)
        break
      case 'indexedDB':
        this.writeToIndexedDB(entry)
        break
      case 'memory':
        this.writeToMemory(entry)
        break
    }
  }

  /**
   * 批量写入日志
   */
  writeBatch(entries: LogEntry[]): void {
    for (const entry of entries) {
      this.write(entry)
    }
  }

  /**
   * 读取所有日志
   */
  async readAll(): Promise<LogEntry[]> {
    switch (this.options.type) {
      case 'localStorage':
        return this.readFromLocalStorage()
      case 'indexedDB':
        return this.readFromIndexedDB()
      case 'memory':
        return [...this.memoryStorage]
      default:
        return []
    }
  }

  /**
   * 清空日志
   */
  async clear(): Promise<void> {
    switch (this.options.type) {
      case 'localStorage':
        this.clearLocalStorage()
        break
      case 'indexedDB':
        await this.clearIndexedDB()
        break
      case 'memory':
        this.memoryStorage = []
        break
    }
  }

  /**
   * 关闭传输器
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = undefined
    }
  }

  /**
   * 初始化 IndexedDB
   * @private
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[StorageTransport] IndexedDB 不可用，回退到内存存储')
      this.options.type = 'memory'
      return
    }

    try {
      const request = indexedDB.open(this.options.dbName, 1)

      request.onerror = () => {
        console.error('[StorageTransport] IndexedDB 打开失败')
        this.options.type = 'memory'
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.options.storeName)) {
          const store = db.createObjectStore(this.options.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('level', 'level', { unique: false })
        }
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
      }
    }
    catch (error) {
      console.error('[StorageTransport] IndexedDB 初始化失败:', error)
      this.options.type = 'memory'
    }
  }

  /**
   * 写入 localStorage
   * @private
   */
  private writeToLocalStorage(entry: LogEntry): void {
    try {
      const key = `${this.options.prefix}${entry.id}`
      localStorage.setItem(key, JSON.stringify(entry))
      this.cleanupLocalStorage()
    }
    catch (error) {
      console.error('[StorageTransport] localStorage 写入失败:', error)
    }
  }

  /**
   * 从 localStorage 读取
   * @private
   */
  private readFromLocalStorage(): LogEntry[] {
    const entries: LogEntry[] = []
    const prefix = this.options.prefix

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            entries.push(JSON.parse(data))
          }
        }
        catch {
          // 忽略解析错误
        }
      }
    }

    return entries.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * 清理 localStorage
   * @private
   */
  private cleanupLocalStorage(): void {
    const entries = this.readFromLocalStorage()
    const now = Date.now()

    // 删除过期条目
    for (const entry of entries) {
      if (now - entry.timestamp > this.options.ttl) {
        localStorage.removeItem(`${this.options.prefix}${entry.id}`)
      }
    }

    // 删除超出数量限制的条目
    if (entries.length > this.options.maxEntries) {
      const toRemove = entries.slice(0, entries.length - this.options.maxEntries)
      for (const entry of toRemove) {
        localStorage.removeItem(`${this.options.prefix}${entry.id}`)
      }
    }
  }

  /**
   * 清空 localStorage
   * @private
   */
  private clearLocalStorage(): void {
    const keysToRemove: string[] = []
    const prefix = this.options.prefix

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  /**
   * 写入 IndexedDB
   * @private
   */
  private writeToIndexedDB(entry: LogEntry): void {
    if (!this.db) {
      this.memoryStorage.push(entry)
      return
    }

    try {
      const transaction = this.db.transaction(this.options.storeName, 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      store.add(entry)
    }
    catch (error) {
      console.error('[StorageTransport] IndexedDB 写入失败:', error)
    }
  }

  /**
   * 从 IndexedDB 读取
   * @private
   */
  private readFromIndexedDB(): Promise<LogEntry[]> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve([...this.memoryStorage])
        return
      }

      const transaction = this.db.transaction(this.options.storeName, 'readonly')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => resolve([])
    })
  }

  /**
   * 清空 IndexedDB
   * @private
   */
  private clearIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        this.memoryStorage = []
        resolve()
        return
      }

      const transaction = this.db.transaction(this.options.storeName, 'readwrite')
      const store = transaction.objectStore(this.options.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => resolve()
    })
  }

  /**
   * 写入内存
   * @private
   */
  private writeToMemory(entry: LogEntry): void {
    this.memoryStorage.push(entry)

    // 限制数量
    if (this.memoryStorage.length > this.options.maxEntries) {
      this.memoryStorage.shift()
    }
  }
}

/**
 * 创建存储传输器
 * @param options - 配置选项
 * @returns 存储传输器实例
 */
export function createStorageTransport(options?: StorageTransportOptions): StorageTransport {
  return new StorageTransport(options)
}

