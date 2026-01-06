/**
 * WebSocket 传输器
 * @description 将日志实时推送到 WebSocket 服务器
 */

import type { LogEntry, LogTransport, WebSocketState, WebSocketTransportOptions } from '../types'
import { LogLevel } from '../types'
import { AsyncQueue } from '../utils/async-queue'

/**
 * WebSocket 传输器
 * @description 支持实时推送、自动重连、心跳保活的 WebSocket 日志传输器
 * @example
 * ```ts
 * const transport = new WebSocketTransport({
 *   url: 'wss://logs.example.com/stream',
 *   autoReconnect: true,
 *   heartbeatInterval: 30000,
 *   batchSize: 20,
 * })
 *
 * logger.addTransport(transport)
 * ```
 */
export class WebSocketTransport implements LogTransport {
  readonly name = 'websocket'
  level?: LogLevel
  enabled: boolean

  private options: Required<WebSocketTransportOptions>
  private ws: WebSocket | null = null
  private state: WebSocketState = 'disconnected'
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private queue: AsyncQueue<LogEntry>
  private pendingMessages: string[] = []
  private isDestroyed = false

  constructor(options: WebSocketTransportOptions) {
    this.options = {
      url: options.url,
      level: options.level ?? LogLevel.TRACE,
      enabled: options.enabled ?? true,
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      batchSize: options.batchSize ?? 20,
      batchInterval: options.batchInterval ?? 1000,
      onConnect: options.onConnect ?? (() => {}),
      onDisconnect: options.onDisconnect ?? (() => {}),
      onError: options.onError ?? (() => {}),
      protocols: options.protocols ?? [],
    }

    this.level = this.options.level
    this.enabled = this.options.enabled

    // 初始化队列
    this.queue = new AsyncQueue({
      batchSize: this.options.batchSize,
      flushInterval: this.options.batchInterval,
    })

    this.queue.onFlush(entries => this.sendBatch(entries))

    // 自动连接
    if (this.enabled) {
      this.connect()
    }
  }

  /**
   * 获取当前连接状态
   */
  getState(): WebSocketState {
    return this.state
  }

  /**
   * 是否已连接
   */
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 连接到 WebSocket 服务器
   */
  connect(): void {
    if (this.isDestroyed || this.state === 'connecting' || this.state === 'connected') {
      return
    }

    this.state = 'connecting'

    try {
      const protocols = Array.isArray(this.options.protocols)
        ? this.options.protocols
        : this.options.protocols
          ? [this.options.protocols]
          : undefined

      this.ws = new WebSocket(this.options.url, protocols)
      this.setupEventHandlers()
    }
    catch (error) {
      console.error('[WebSocketTransport] 连接失败:', error)
      this.state = 'disconnected'
      this.options.onError(error as Error)
      this.scheduleReconnect()
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.stopHeartbeat()
    this.cancelReconnect()

    if (this.ws) {
      this.ws.onclose = null // 防止触发重连
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }

    this.state = 'disconnected'
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
    // 等待所有待发送消息发送完毕
    await this.flushPendingMessages()
  }

  /**
   * 关闭传输器
   */
  async close(): Promise<void> {
    this.isDestroyed = true
    await this.flush()
    this.disconnect()
    this.queue.destroy()
  }

  /**
   * 设置 WebSocket 事件处理器
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.ws) {
      return
    }

    this.ws.onopen = () => {
      this.state = 'connected'
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.options.onConnect()

      // 发送积压的消息
      this.flushPendingMessages()
    }

    this.ws.onclose = (event) => {
      this.state = 'disconnected'
      this.stopHeartbeat()
      this.options.onDisconnect(event.code, event.reason)

      // 自动重连
      if (!this.isDestroyed && this.options.autoReconnect) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (event) => {
      console.error('[WebSocketTransport] WebSocket 错误:', event)
      this.options.onError(new Error('WebSocket error'))
    }

    this.ws.onmessage = (event) => {
      // 处理服务器响应（如心跳响应）
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'pong') {
          // 心跳响应
        }
      }
      catch {
        // 忽略非 JSON 消息
      }
    }
  }

  /**
   * 发送日志批次
   * @private
   */
  private sendBatch(entries: LogEntry[]): void {
    if (entries.length === 0) {
      return
    }

    const message = JSON.stringify({
      type: 'logs',
      logs: entries,
      timestamp: Date.now(),
    })

    this.send(message)
  }

  /**
   * 发送消息
   * @private
   */
  private send(message: string): void {
    if (this.isConnected()) {
      try {
        this.ws!.send(message)
      }
      catch (error) {
        console.error('[WebSocketTransport] 发送失败:', error)
        this.pendingMessages.push(message)
      }
    }
    else {
      // 连接未就绪，暂存消息
      this.pendingMessages.push(message)

      // 限制待发送消息数量
      if (this.pendingMessages.length > 1000) {
        this.pendingMessages.shift()
      }
    }
  }

  /**
   * 发送积压的消息
   * @private
   */
  private async flushPendingMessages(): Promise<void> {
    while (this.pendingMessages.length > 0 && this.isConnected()) {
      const message = this.pendingMessages.shift()
      if (message) {
        try {
          this.ws!.send(message)
        }
        catch {
          this.pendingMessages.unshift(message)
          break
        }
      }
    }
  }

  /**
   * 启动心跳
   * @private
   */
  private startHeartbeat(): void {
    if (this.options.heartbeatInterval <= 0) {
      return
    }

    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
      }
    }, this.options.heartbeatInterval)
  }

  /**
   * 停止心跳
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 计划重连
   * @private
   */
  private scheduleReconnect(): void {
    if (this.isDestroyed || !this.options.autoReconnect) {
      return
    }

    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WebSocketTransport] 达到最大重连次数，停止重连')
      return
    }

    this.cancelReconnect()
    this.state = 'reconnecting'
    this.reconnectAttempts++

    // 指数退避
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000, // 最大 30 秒
    )

    console.info(`[WebSocketTransport] ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * 取消重连
   * @private
   */
  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

/**
 * 创建 WebSocket 传输器
 * @param options - 配置选项
 * @returns WebSocket 传输器实例
 */
export function createWebSocketTransport(options: WebSocketTransportOptions): WebSocketTransport {
  return new WebSocketTransport(options)
}
