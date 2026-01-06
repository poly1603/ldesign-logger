/**
 * 离线队列
 * @description 用于在网络断开时缓存日志，网络恢复后自动重发
 */

import type { LogEntry, OfflineLogEntry, OfflineQueueOptions } from '../types'

/**
 * 离线队列
 * @description 支持 IndexedDB/localStorage 持久化的离线日志队列
 * @example
 * ```ts
 * const queue = new OfflineQueue({
 *   maxSize: 1000,
 *   storageKey: 'offline-logs',
 *   useIndexedDB: true,
 * })
 *
 * // 添加到队列
 * queue.enqueue(entry, 'http')
 *
 * // 网络恢复时处理
 * queue.onOnline(async (entries) => {
 *   await sendToServer(entries)
 * })
 * ```
 */
export class OfflineQueue {
  private options: Required<OfflineQueueOptions>
  private memoryQueue: OfflineLogEntry[] = []
  private db: IDBDatabase | null = null
  private isOnline: boolean
  private onlineHandlers: ((entries: OfflineLogEntry[]) => Promise<void>)[] = []
  private checkTimer: ReturnType<typeof setInterval> | null = null
  private isProcessing = false

  constructor(options: OfflineQueueOptions = {}) {
    this.options = {
      maxSize: options.maxSize ?? 1000,
      storageKey: options.storageKey ?? 'ldesign_offline_logs',
      useIndexedDB: options.useIndexedDB ?? true,
      checkInterval: options.checkInterval ?? 5000,
      retryBatchSize: options.retryBatchSize ?? 50,
    }

    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

    // 初始化存储
    if (this.options.useIndexedDB) {
      this.initIndexedDB()
    }
    else {
      this.loadFromLocalStorage()
    }

    // 监听网络状态
    this.setupNetworkListeners()

    // 启动定时检查
    this.startPeriodicCheck()
  }

  /**
   * 获取队列大小
   */
  get size(): number {
    return this.memoryQueue.length
  }

  /**
   * 是否在线
   */
  get online(): boolean {
    return this.isOnline
  }

  /**
   * 添加日志到队列
   * @param entry - 日志条目
   * @param transport - 目标传输器名称
   */
  async enqueue(entry: LogEntry, transport: string): Promise<void> {
    const offlineEntry: OfflineLogEntry = {
      entry,
      queuedAt: Date.now(),
      retryCount: 0,
      transport,
    }

    // 检查队列大小限制
    if (this.memoryQueue.length >= this.options.maxSize) {
      // 移除最旧的
      this.memoryQueue.shift()
    }

    this.memoryQueue.push(offlineEntry)

    // 持久化
    if (this.options.useIndexedDB) {
      await this.saveToIndexedDB(offlineEntry)
    }
    else {
      this.saveToLocalStorage()
    }
  }

  /**
   * 批量添加日志到队列
   * @param entries - 日志条目数组
   * @param transport - 目标传输器名称
   */
  async enqueueBatch(entries: LogEntry[], transport: string): Promise<void> {
    for (const entry of entries) {
      await this.enqueue(entry, transport)
    }
  }

  /**
   * 获取并移除指定数量的日志
   * @param count - 数量
   * @param transport - 可选的传输器过滤
   */
  async dequeue(count: number, transport?: string): Promise<OfflineLogEntry[]> {
    let entries: OfflineLogEntry[]

    if (transport) {
      const filtered = this.memoryQueue.filter(e => e.transport === transport)
      entries = filtered.splice(0, count)
      this.memoryQueue = this.memoryQueue.filter(e => e.transport !== transport || filtered.includes(e))
    }
    else {
      entries = this.memoryQueue.splice(0, count)
    }

    // 从持久化存储中移除
    if (this.options.useIndexedDB) {
      await this.removeFromIndexedDB(entries.map(e => e.entry.id))
    }
    else {
      this.saveToLocalStorage()
    }

    return entries
  }

  /**
   * 获取所有日志（不移除）
   * @param transport - 可选的传输器过滤
   */
  getAll(transport?: string): OfflineLogEntry[] {
    if (transport) {
      return this.memoryQueue.filter(e => e.transport === transport)
    }
    return [...this.memoryQueue]
  }

  /**
   * 注册网络恢复处理器
   * @param handler - 处理函数
   */
  onOnline(handler: (entries: OfflineLogEntry[]) => Promise<void>): void {
    this.onlineHandlers.push(handler)
  }

  /**
   * 手动触发重试
   */
  async retry(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.memoryQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      const entries = await this.dequeue(this.options.retryBatchSize)

      for (const handler of this.onlineHandlers) {
        try {
          await handler(entries)
        }
        catch (error) {
          // 重试失败，重新入队
          for (const entry of entries) {
            entry.retryCount++
            if (entry.retryCount < 5) { // 最多重试 5 次
              await this.enqueue(entry.entry, entry.transport)
            }
          }
          console.error('[OfflineQueue] 重试失败:', error)
        }
      }
    }
    finally {
      this.isProcessing = false
    }
  }

  /**
   * 清空队列
   */
  async clear(): Promise<void> {
    this.memoryQueue = []

    if (this.options.useIndexedDB) {
      await this.clearIndexedDB()
    }
    else {
      localStorage.removeItem(this.options.storageKey)
    }
  }

  /**
   * 销毁队列
   */
  destroy(): void {
    this.stopPeriodicCheck()
    this.removeNetworkListeners()

    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  /**
   * 初始化 IndexedDB
   * @private
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof indexedDB === 'undefined') {
      console.warn('[OfflineQueue] IndexedDB 不可用，回退到 localStorage')
      this.options.useIndexedDB = false
      this.loadFromLocalStorage()
      return
    }

    try {
      const request = indexedDB.open(`${this.options.storageKey}_db`, 1)

      request.onerror = () => {
        console.error('[OfflineQueue] IndexedDB 打开失败')
        this.options.useIndexedDB = false
        this.loadFromLocalStorage()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('logs')) {
          const store = db.createObjectStore('logs', { keyPath: 'entry.id' })
          store.createIndex('queuedAt', 'queuedAt', { unique: false })
          store.createIndex('transport', 'transport', { unique: false })
        }
      }

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        await this.loadFromIndexedDB()
      }
    }
    catch (error) {
      console.error('[OfflineQueue] IndexedDB 初始化失败:', error)
      this.options.useIndexedDB = false
      this.loadFromLocalStorage()
    }
  }

  /**
   * 保存到 IndexedDB
   * @private
   */
  private async saveToIndexedDB(entry: OfflineLogEntry): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction('logs', 'readwrite')
        const store = transaction.objectStore('logs')
        store.put(entry)
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      }
      catch {
        resolve()
      }
    })
  }

  /**
   * 从 IndexedDB 加载
   * @private
   */
  private async loadFromIndexedDB(): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction('logs', 'readonly')
        const store = transaction.objectStore('logs')
        const request = store.getAll()

        request.onsuccess = () => {
          this.memoryQueue = request.result || []
          // 按时间排序
          this.memoryQueue.sort((a, b) => a.queuedAt - b.queuedAt)
          resolve()
        }
        request.onerror = () => resolve()
      }
      catch {
        resolve()
      }
    })
  }

  /**
   * 从 IndexedDB 移除
   * @private
   */
  private async removeFromIndexedDB(ids: string[]): Promise<void> {
    if (!this.db || ids.length === 0) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction('logs', 'readwrite')
        const store = transaction.objectStore('logs')
        for (const id of ids) {
          store.delete(id)
        }
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      }
      catch {
        resolve()
      }
    })
  }

  /**
   * 清空 IndexedDB
   * @private
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction('logs', 'readwrite')
        const store = transaction.objectStore('logs')
        store.clear()
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => resolve()
      }
      catch {
        resolve()
      }
    })
  }

  /**
   * 保存到 localStorage
   * @private
   */
  private saveToLocalStorage(): void {
    try {
      const data = JSON.stringify(this.memoryQueue)
      localStorage.setItem(this.options.storageKey, data)
    }
    catch (error) {
      console.error('[OfflineQueue] localStorage 保存失败:', error)
    }
  }

  /**
   * 从 localStorage 加载
   * @private
   */
  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem(this.options.storageKey)
      if (data) {
        this.memoryQueue = JSON.parse(data)
      }
    }
    catch (error) {
      console.error('[OfflineQueue] localStorage 加载失败:', error)
    }
  }

  /**
   * 设置网络监听器
   * @private
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  /**
   * 移除网络监听器
   * @private
   */
  private removeNetworkListeners(): void {
    if (typeof window === 'undefined') {
      return
    }

    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  /**
   * 处理上线事件
   * @private
   */
  private handleOnline = (): void => {
    this.isOnline = true
    // 延迟一下确保网络稳定
    setTimeout(() => {
      this.retry()
    }, 1000)
  }

  /**
   * 处理离线事件
   * @private
   */
  private handleOffline = (): void => {
    this.isOnline = false
  }

  /**
   * 启动定时检查
   * @private
   */
  private startPeriodicCheck(): void {
    if (this.options.checkInterval <= 0) {
      return
    }

    this.checkTimer = setInterval(() => {
      if (this.isOnline && this.memoryQueue.length > 0) {
        this.retry()
      }
    }, this.options.checkInterval)
  }

  /**
   * 停止定时检查
   * @private
   */
  private stopPeriodicCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }
}

/**
 * 创建离线队列
 * @param options - 配置选项
 * @returns 离线队列实例
 */
export function createOfflineQueue(options?: OfflineQueueOptions): OfflineQueue {
  return new OfflineQueue(options)
}
