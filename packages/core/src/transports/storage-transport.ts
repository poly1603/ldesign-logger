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
  /** 批量写入大小 */
  batchSize?: number
  /** 批量写入间隔（毫秒） */
  batchInterval?: number
  /** 是否启用压缩 */
  compress?: boolean
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
 *   batchSize: 50,
 *   batchInterval: 1000,
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
  private dbReady: Promise<void> | null = null
  private memoryStorage: LogEntry[] = []
  private writeBuffer: LogEntry[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private isFlushing = false

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
      batchSize: options.batchSize ?? 50,
      batchInterval: options.batchInterval ?? 1000,
      compress: options.compress ?? false,
    }

    this.level = this.options.level
    this.enabled = this.options.enabled

    // 初始化 IndexedDB
    if (this.options.type === 'indexedDB') {
      this.dbReady = this.initIndexedDB()
    }
  }

  /**
   * 写入日志
   */
  write(entry: LogEntry): void {
    if (!this.enabled) {
      return
    }

    // 使用缓冲区批量写入
    this.writeBuffer.push(entry)

    // 达到批量大小时立即写入
    if (this.writeBuffer.length >= this.options.batchSize) {
      this.flushBuffer()
    }
    else {
      // 否则设置延迟写入
      this.scheduleFlush()
    }
  }

  /**
   * 批量写入日志
   */
  writeBatch(entries: LogEntry[]): void {
    if (!this.enabled) {
      return
    }

    this.writeBuffer.push(...entries)

    if (this.writeBuffer.length >= this.options.batchSize) {
      this.flushBuffer()
    }
    else {
      this.scheduleFlush()
    }
  }

  /**
   * 刷新缓冲区
   */
  async flush(): Promise<void> {
    await this.flushBuffer()
  }

  /**
   * 计划刷新
   * @private
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      return
    }

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.flushBuffer()
    }, this.options.batchInterval)
  }

  /**
   * 刷新缓冲区到存储
   * @private
   */
  private async flushBuffer(): Promise<void> {
    if (this.isFlushing || this.writeBuffer.length === 0) {
      return
    }

    this.isFlushing = true
    const entries = this.writeBuffer.splice(0, this.writeBuffer.length)

    try {
      switch (this.options.type) {
        case 'localStorage':
          this.writeToLocalStorageBatch(entries)
          break
        case 'indexedDB':
          await this.writeToIndexedDBBatch(entries)
          break
        case 'memory':
          this.writeToMemoryBatch(entries)
          break
      }
    }
    catch (error) {
      console.error('[StorageTransport] 批量写入失败:', error)
      // 写入失败时尝试写入内存
      this.writeToMemoryBatch(entries)
    }
    finally {
      this.isFlushing = false
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
    // 清除定时器
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // 刷新剩余数据
    await this.flushBuffer()

    if (this.db) {
      this.db.close()
      this.db = undefined
    }
  }

  /**
   * 批量写入 localStorage
   * @private
   */
  private writeToLocalStorageBatch(entries: LogEntry[]): void {
    try {
      for (const entry of entries) {
        const key = `${this.options.prefix}${entry.id}`
        localStorage.setItem(key, JSON.stringify(entry))
      }
      this.cleanupLocalStorage()
    }
    catch (error) {
      console.error('[StorageTransport] localStorage 批量写入失败:', error)
    }
  }

  /**
   * 批量写入 IndexedDB
   * @private
   */
  private async writeToIndexedDBBatch(entries: LogEntry[]): Promise<void> {
    // 等待数据库就绪
    if (this.dbReady) {
      await this.dbReady
    }

    if (!this.db) {
      this.memoryStorage.push(...entries)
      return
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction(this.options.storeName, 'readwrite')
        const store = transaction.objectStore(this.options.storeName)

        for (const entry of entries) {
          store.put(entry)
        }

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }
      catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 批量写入内存
   * @private
   */
  private writeToMemoryBatch(entries: LogEntry[]): void {
    this.memoryStorage.push(...entries)

    // 限制数量
    while (this.memoryStorage.length > this.options.maxEntries) {
      this.memoryStorage.shift()
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

