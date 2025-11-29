/**
 * 开发桥接传输器
 * @description 在开发模式下将日志传输到 launcher 工具，支持 WebSocket 通信
 */

import type { LogEntry, LogTransport } from '../types'
import { LogLevel } from '../types'

/**
 * 开发桥接传输器配置
 */
export interface DevBridgeTransportOptions {
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** WebSocket 服务器地址 */
  wsUrl?: string
  /** 是否自动重连 */
  autoReconnect?: boolean
  /** 重连间隔（毫秒） */
  reconnectInterval?: number
  /** 最大重连次数 */
  maxReconnectAttempts?: number
  /** 批量发送大小 */
  batchSize?: number
  /** 批量发送间隔（毫秒） */
  batchInterval?: number
  /** 是否在开发环境自动启用 */
  autoEnable?: boolean
}

/**
 * 桥接消息类型
 */
export interface BridgeMessage {
  /** 消息类型 */
  type: 'log' | 'batch' | 'ping' | 'pong'
  /** 日志条目或条目数组 */
  payload: LogEntry | LogEntry[]
  /** 时间戳 */
  timestamp: number
  /** 客户端 ID */
  clientId?: string
}

/**
 * 开发桥接传输器
 * @description 通过 WebSocket 将日志发送到 launcher 开发工具
 */
export class DevBridgeTransport implements LogTransport {
  readonly name = 'dev-bridge'
  level?: LogLevel
  enabled: boolean

  private options: Required<DevBridgeTransportOptions>
  private ws: WebSocket | null = null
  private buffer: LogEntry[] = []
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private batchTimer: ReturnType<typeof setInterval> | null = null
  private clientId: string
  private isConnected = false

  constructor(options: DevBridgeTransportOptions = {}) {
    const isDev = typeof process !== 'undefined'
      ? process.env.NODE_ENV !== 'production'
      : true

    this.options = {
      level: options.level ?? LogLevel.TRACE,
      enabled: options.enabled ?? (options.autoEnable !== false && isDev),
      wsUrl: options.wsUrl ?? 'ws://localhost:9527/__dev_logger',
      autoReconnect: options.autoReconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      batchSize: options.batchSize ?? 50,
      batchInterval: options.batchInterval ?? 1000,
      autoEnable: options.autoEnable ?? true,
    }

    this.level = this.options.level
    this.enabled = this.options.enabled
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    if (this.enabled && typeof WebSocket !== 'undefined') {
      this.connect()
    }
  }

  /** 连接 WebSocket 服务器 */
  connect(): void {
    if (typeof WebSocket === 'undefined') return
    try {
      this.ws = new WebSocket(this.options.wsUrl)
      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.flushBuffer()
        this.startBatchTimer()
      }
      this.ws.onclose = () => {
        this.isConnected = false
        this.stopBatchTimer()
        if (this.options.autoReconnect) this.scheduleReconnect()
      }
      this.ws.onerror = () => { }
      this.ws.onmessage = (event) => this.handleMessage(event.data)
    }
    catch { /* ignore */ }
  }

  private handleMessage(data: string): void {
    try {
      const msg = JSON.parse(data) as BridgeMessage
      if (msg.type === 'ping') {
        this.send({ type: 'pong', payload: [], timestamp: Date.now() })
      }
    }
    catch { /* ignore */ }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, this.options.reconnectInterval)
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return
    this.batchTimer = setInterval(() => this.flushBuffer(), this.options.batchInterval)
  }

  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer)
      this.batchTimer = null
    }
  }

  flushBuffer(): void {
    if (this.buffer.length === 0 || !this.isConnected) return
    const entries = this.buffer.splice(0, this.options.batchSize)
    this.send({
      type: entries.length > 1 ? 'batch' : 'log',
      payload: entries.length > 1 ? entries : entries[0],
      timestamp: Date.now(),
      clientId: this.clientId,
    })
  }

  private send(message: BridgeMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }


  /** 写入日志 */
  write(entry: LogEntry): void {
    if (!this.enabled) return
    this.buffer.push(entry)
    if (this.buffer.length >= this.options.batchSize) {
      this.flushBuffer()
    }
  }

  /** 批量写入日志 */
  writeBatch(entries: LogEntry[]): void {
    if (!this.enabled) return
    this.buffer.push(...entries)
    this.flushBuffer()
  }

  /** 刷新所有缓冲日志 */
  async flush(): Promise<void> {
    this.flushBuffer()
  }

  /** 关闭传输器 */
  async close(): Promise<void> {
    this.enabled = false
    this.stopBatchTimer()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.flushBuffer()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
  }

  /** 获取连接状态 */
  get connected(): boolean {
    return this.isConnected
  }
}

/**
 * 创建开发桥接传输器
 * @param options - 配置选项
 * @returns 传输器实例
 */
export function createDevBridgeTransport(options?: DevBridgeTransportOptions): DevBridgeTransport {
  return new DevBridgeTransport(options)
}