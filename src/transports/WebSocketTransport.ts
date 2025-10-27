/**
 * WebSocket 传输器
 * 
 * 通过 WebSocket 实时推送日志到远程服务器
 */

import type { LogEntry, LogLevel, LogTransport } from '../types'

/**
 * WebSocket 连接状态
 */
export enum WebSocketState {
  /** 连接中 */
  CONNECTING = 0,
  /** 已连接 */
  OPEN = 1,
  /** 关闭中 */
  CLOSING = 2,
  /** 已关闭 */
  CLOSED = 3,
}

/**
 * WebSocket 传输器配置
 */
export interface WebSocketTransportConfig {
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
   * WebSocket 服务器地址
   * 
   * @example 'ws://localhost:8080/logs'
   * @example 'wss://logs.example.com/stream'
   */
  url: string

  /**
   * 自动重连
   * 
   * 连接断开后自动尝试重新连接
   * 
   * @default true
   */
  autoReconnect?: boolean

  /**
   * 重连间隔（毫秒）
   * 
   * 连接断开后等待多久再重连
   * 
   * @default 3000
   */
  reconnectInterval?: number

  /**
   * 最大重连次数
   * 
   * 0 表示无限重连
   * 
   * @default 10
   */
  maxReconnectAttempts?: number

  /**
   * 心跳间隔（毫秒）
   * 
   * 定期发送心跳消息保持连接
   * 0 表示禁用心跳
   * 
   * @default 30000
   */
  heartbeatInterval?: number

  /**
   * 批量发送大小
   * 
   * 累积多条日志后批量发送
   * 
   * @default 10
   */
  batchSize?: number

  /**
   * 批量发送间隔（毫秒）
   * 
   * @default 1000
   */
  batchInterval?: number

  /**
   * 最大缓冲区大小
   * 
   * @default 1000
   */
  maxBufferSize?: number

  /**
   * WebSocket 协议（可选）
   */
  protocols?: string | string[]

  /**
   * 连接成功回调
   */
  onConnect?: () => void

  /**
   * 连接断开回调
   */
  onDisconnect?: (code: number, reason: string) => void

  /**
   * 连接错误回调
   */
  onError?: (error: Event) => void
}

/**
 * WebSocket 传输器
 * 
 * 通过 WebSocket 实时推送日志到远程服务器
 * 
 * 特性：
 * - 实时推送：日志立即发送到服务器
 * - 自动重连：连接断开自动重试
 * - 心跳检测：保持连接活跃
 * - 批量发送：减少消息数量
 * - 离线缓冲：断线期间缓存日志
 * 
 * 使用场景：
 * - 实时日志监控
 * - 分布式系统日志聚合
 * - 生产环境问题排查
 * 
 * 性能优化：
 * - 批量发送减少 WebSocket 消息数
 * - 缓冲区限制防止内存泄漏
 * - 心跳保持连接减少重连开销
 */
export class WebSocketTransport implements LogTransport {
  name = 'websocket'
  level: LogLevel
  enabled: boolean

  private url: string
  private autoReconnect: boolean
  private reconnectInterval: number
  private maxReconnectAttempts: number
  private heartbeatInterval: number
  private batchSize: number
  private batchInterval: number
  private maxBufferSize: number
  private protocols?: string | string[]

  private ws?: WebSocket
  private buffer: LogEntry[] = []
  private reconnectAttempts = 0
  private heartbeatTimer?: ReturnType<typeof setTimeout>
  private batchTimer?: ReturnType<typeof setTimeout>
  private isSending = false

  // 回调函数
  private onConnect?: () => void
  private onDisconnect?: (code: number, reason: string) => void
  private onError?: (error: Event) => void

  /**
   * 构造函数
   * 
   * @param config - WebSocket 传输器配置
   */
  constructor(config: WebSocketTransportConfig) {
    this.level = config.level ?? 2 // INFO
    this.enabled = config.enabled ?? true
    this.url = config.url
    this.autoReconnect = config.autoReconnect ?? true
    this.reconnectInterval = config.reconnectInterval ?? 3000
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10
    this.heartbeatInterval = config.heartbeatInterval ?? 30000
    this.batchSize = config.batchSize ?? 10
    this.batchInterval = config.batchInterval ?? 1000
    this.maxBufferSize = config.maxBufferSize ?? 1000
    this.protocols = config.protocols

    this.onConnect = config.onConnect
    this.onDisconnect = config.onDisconnect
    this.onError = config.onError

    // 自动连接
    this.connect()
  }

  /**
   * 连接到 WebSocket 服务器
   * 
   * @private
   */
  private connect(): void {
    try {
      // 创建 WebSocket 连接
      this.ws = new WebSocket(this.url, this.protocols)

      // 连接成功事件
      this.ws.onopen = () => {
        console.info('[WebSocketTransport] Connected to', this.url)
        this.reconnectAttempts = 0 // 重置重连计数

        // 启动心跳
        this.startHeartbeat()

        // 启动批量发送定时器
        this.startBatchTimer()

        // 发送缓冲区中的日志
        if (this.buffer.length > 0) {
          void this.sendLogs()
        }

        // 触发回调
        if (this.onConnect) {
          this.onConnect()
        }
      }

      // 接收消息事件
      this.ws.onmessage = (event) => {
        // 处理服务器响应（如果需要）
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'pong') {
            // 心跳响应
          }
        }
        catch (error) {
          // 忽略非 JSON 消息
        }
      }

      // 连接错误事件
      this.ws.onerror = (error) => {
        console.error('[WebSocketTransport] WebSocket error:', error)

        if (this.onError) {
          this.onError(error)
        }
      }

      // 连接关闭事件
      this.ws.onclose = (event) => {
        console.warn('[WebSocketTransport] Disconnected', event.code, event.reason)

        // 停止心跳
        this.stopHeartbeat()

        // 触发回调
        if (this.onDisconnect) {
          this.onDisconnect(event.code, event.reason)
        }

        // 自动重连
        if (this.autoReconnect && this.enabled) {
          this.tryReconnect()
        }
      }
    }
    catch (error) {
      console.error('[WebSocketTransport] Failed to create WebSocket:', error)

      // 尝试重连
      if (this.autoReconnect && this.enabled) {
        this.tryReconnect()
      }
    }
  }

  /**
   * 尝试重新连接
   * 
   * @private
   */
  private tryReconnect(): void {
    // 检查重连次数限制
    if (
      this.maxReconnectAttempts > 0
      && this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      console.error('[WebSocketTransport] Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.info(`[WebSocketTransport] Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts || '∞'})...`)

    // 延迟重连
    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  /**
   * 启动心跳定时器
   * 
   * @private
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval <= 0) {
      return // 心跳已禁用
    }

    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          // 发送心跳消息
          this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        }
        catch (error) {
          console.error('[WebSocketTransport] Heartbeat error:', error)
        }
      }
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳定时器
   * 
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  /**
   * 启动批量发送定时器
   * 
   * @private
   */
  private startBatchTimer(): void {
    this.stopBatchTimer()

    this.batchTimer = setInterval(() => {
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
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = undefined
    }
  }

  /**
   * 记录日志到缓冲区
   * 
   * @param entry - 日志条目
   */
  log(entry: LogEntry): void {
    // 检查缓冲区大小限制
    if (this.buffer.length >= this.maxBufferSize) {
      console.warn(`[WebSocketTransport] Buffer full (${this.maxBufferSize}), dropping oldest log`)
      this.buffer.shift()
    }

    this.buffer.push(entry)

    // 达到批量大小，立即发送
    if (this.buffer.length >= this.batchSize) {
      void this.sendLogs()
    }
  }

  /**
   * 发送日志到服务器
   * 
   * @private
   */
  private async sendLogs(): Promise<void> {
    // 检查连接状态
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // WebSocket 未连接，日志保留在缓冲区
      return
    }

    // 避免并发发送
    if (this.isSending || this.buffer.length === 0) {
      return
    }

    this.isSending = true

    try {
      // 取出一批日志
      const logs = this.buffer.splice(0, this.batchSize)

      // 发送到服务器
      const message = JSON.stringify({
        type: 'logs',
        data: logs,
        timestamp: Date.now(),
      })

      this.ws.send(message)

      // 继续发送剩余日志
      if (this.buffer.length > 0) {
        setTimeout(() => {
          this.isSending = false
          void this.sendLogs()
        }, 50) // 稍微延迟，避免发送过快
      }
      else {
        this.isSending = false
      }
    }
    catch (error) {
      console.error('[WebSocketTransport] Send logs error:', error)
      this.isSending = false
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
    while (this.buffer.length > 0 && !this.isSending) {
      await this.sendLogs()
    }
  }

  /**
   * 断开连接
   * 
   * 主动断开 WebSocket 连接
   */
  disconnect(): void {
    this.enabled = false // 禁用传输器

    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
    }
  }

  /**
   * 手动重连
   * 
   * 强制重新连接到服务器
   */
  reconnect(): void {
    this.disconnect()
    this.enabled = true
    this.reconnectAttempts = 0
    this.connect()
  }

  /**
   * 获取连接状态
   * 
   * @returns WebSocket 连接状态
   */
  getState(): WebSocketState {
    if (!this.ws) {
      return WebSocketState.CLOSED
    }
    return this.ws.readyState
  }

  /**
   * 检查是否已连接
   * 
   * @returns true 表示已连接
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 销毁传输器
   * 
   * 停止所有定时器，发送剩余日志，断开连接
   * 
   * @returns Promise，销毁完成后 resolve
   */
  async destroy(): Promise<void> {
    // 停止定时器
    this.stopHeartbeat()
    this.stopBatchTimer()

    // 发送剩余日志
    await this.flush()

    // 关闭连接
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Transport destroyed')
    }

    // 清空缓冲区
    this.buffer = []
  }
}

/**
 * 创建 WebSocket 传输器
 * 
 * 工厂函数，创建并返回一个新的 WebSocketTransport 实例
 * 
 * @param config - WebSocket 传输器配置
 * @returns WebSocketTransport 实例
 * 
 * @example
 * ```ts
 * // 基础配置
 * const wsTransport = createWebSocketTransport({
 *   url: 'ws://localhost:8080/logs'
 * })
 * 
 * // 完整配置
 * const wsTransport = createWebSocketTransport({
 *   url: 'wss://logs.example.com/stream',
 *   level: LogLevel.WARN,
 *   autoReconnect: true,
 *   reconnectInterval: 5000,
 *   maxReconnectAttempts: 10,
 *   heartbeatInterval: 30000,
 *   batchSize: 20,
 *   onConnect: () => console.log('Connected'),
 *   onDisconnect: (code, reason) => console.log('Disconnected:', code, reason),
 *   onError: (error) => console.error('Error:', error)
 * })
 * 
 * logger.addTransport(wsTransport)
 * ```
 */
export function createWebSocketTransport(
  config: WebSocketTransportConfig,
): WebSocketTransport {
  return new WebSocketTransport(config)
}

