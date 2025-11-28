/**
 * 核心日志器类
 * @description 框架无关的日志记录器实现
 */

import type {
  ILogger,
  LogContext,
  LogEntry,
  LogFilter,
  LogFormatter,
  LoggerOptions,
  LoggerPlugin,
  LogLevelName,
  LogQueryFilter,
  LogTransport,
} from '../types'
import { LogLevel } from '../types'
import { generateId } from '../utils/id-generator'
import { sanitizeObject } from '../utils/sanitize'
import { CircularBuffer } from '../utils/circular-buffer'
import { AsyncQueue } from '../utils/async-queue'
import { formatLogAsCsvRow, getCsvHeader } from '../utils/format'

/** 默认日志器配置 */
const DEFAULT_OPTIONS: LoggerOptions = {
  name: 'default',
  level: LogLevel.INFO,
  enabled: true,
  transports: [],
  filters: [],
  defaultTags: [],
  maxBufferSize: 1000,
  async: false,
  enablePerformance: false,
  enableErrorTracking: false,
}

/**
 * 核心日志器类
 * @description 提供多级别日志记录、过滤、格式化和传输功能
 * @example
 * ```ts
 * const logger = new Logger({
 *   name: 'my-app',
 *   level: LogLevel.DEBUG,
 *   transports: [consoleTransport],
 * })
 *
 * logger.info('应用启动')
 * logger.error('发生错误', new Error('Something went wrong'))
 * ```
 */
export class Logger implements ILogger {
  /** 日志器名称 */
  readonly name: string
  /** 当前日志级别 */
  level: LogLevel
  /** 是否启用 */
  enabled: boolean

  /** 配置选项 */
  private options: LoggerOptions
  /** 传输器列表 */
  private transports: LogTransport[] = []
  /** 过滤器列表 */
  private filters: LogFilter[] = []
  /** 格式化器 */
  private formatter?: LogFormatter
  /** 日志历史缓冲区 */
  private history: CircularBuffer<LogEntry>
  /** 异步队列 */
  private asyncQueue?: AsyncQueue<LogEntry>
  /** 当前上下文 */
  private context: LogContext = {}
  /** 默认标签 */
  private defaultTags: string[] = []
  /** 已安装的插件 */
  private plugins: Map<string, LoggerPlugin> = new Map()

  /**
   * 创建日志器实例
   * @param options - 日志器配置选项
   */
  constructor(options: LoggerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.name = this.options.name || 'default'
    this.level = this.options.level ?? LogLevel.INFO
    this.enabled = this.options.enabled ?? true
    this.defaultTags = this.options.defaultTags || []
    this.context = this.options.defaultContext || {}
    this.formatter = this.options.formatter

    // 初始化历史缓冲区
    this.history = new CircularBuffer(this.options.maxBufferSize || 1000)

    // 初始化传输器
    if (this.options.transports) {
      this.transports = [...this.options.transports]
    }

    // 初始化过滤器
    if (this.options.filters) {
      this.filters = [...this.options.filters]
    }

    // 初始化异步队列
    if (this.options.async) {
      this.asyncQueue = new AsyncQueue({
        batchSize: 50,
        flushInterval: 1000,
      })
      this.asyncQueue.onFlush(entries => this.processBatch(entries))
    }
  }

  /**
   * 追踪级别日志
   */
  trace(message: string, data?: unknown): void {
    this.log(LogLevel.TRACE, message, data)
  }

  /**
   * 调试级别日志
   */
  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  /**
   * 信息级别日志
   */
  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data)
  }

  /**
   * 警告级别日志
   */
  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data)
  }

  /**
   * 错误级别日志
   */
  error(message: string, error?: Error | unknown, data?: unknown): void {
    this.logWithError(LogLevel.ERROR, message, error, data)
  }

  /**
   * 致命级别日志
   */
  fatal(message: string, error?: Error | unknown, data?: unknown): void {
    this.logWithError(LogLevel.FATAL, message, error, data)
  }

  /**
   * 使用指定级别记录日志
   */
  log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry = this.createEntry(level, message, data)
    this.processEntry(entry)
  }

  /**
   * 记录带错误的日志
   * @private
   */
  private logWithError(level: LogLevel, message: string, error?: Error | unknown, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry = this.createEntry(level, message, data)

    if (error instanceof Error) {
      entry.error = error
      entry.stack = error.stack
    }
    else if (error) {
      entry.data = { ...entry.data as object, error }
    }

    this.processEntry(entry)
  }

  /**
   * 记录带上下文的日志
   */
  withContext(context: LogContext): ILogger {
    const child = this.child({})
    Object.assign((child as Logger).context, context)
    return child
  }

  /**
   * 记录带标签的日志
   */
  withTags(...tags: string[]): ILogger {
    const child = this.child({})
      ; (child as Logger).defaultTags = [...this.defaultTags, ...tags]
    return child
  }

  /**
   * 创建子日志器
   */
  child(options: Partial<LoggerOptions>): ILogger {
    const childLogger = new Logger({
      ...this.options,
      ...options,
      name: options.name || `${this.name}:child`,
      transports: [...this.transports],
      filters: [...this.filters],
    })

    // 继承上下文
    Object.assign((childLogger as Logger).context, this.context)
      ; (childLogger as Logger).defaultTags = [...this.defaultTags]

    return childLogger
  }

  /**
   * 添加传输器
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * 移除传输器
   */
  removeTransport(name: string): void {
    const index = this.transports.findIndex(t => t.name === name)
    if (index !== -1) {
      this.transports.splice(index, 1)
    }
  }

  /**
   * 添加过滤器
   */
  addFilter(filter: LogFilter): void {
    this.filters.push(filter)
  }

  /**
   * 移除过滤器
   */
  removeFilter(name: string): void {
    const index = this.filters.findIndex(f => f.name === name)
    if (index !== -1) {
      this.filters.splice(index, 1)
    }
  }

  /**
   * 安装插件
   */
  use(plugin: LoggerPlugin, options?: Record<string, unknown>): this {
    if (this.plugins.has(plugin.name)) {
      console.warn(`插件 "${plugin.name}" 已安装`)
      return this
    }

    plugin.install(this, options)
    this.plugins.set(plugin.name, plugin)
    return this
  }

  /**
   * 刷新缓冲区
   */
  async flush(): Promise<void> {
    if (this.asyncQueue) {
      await this.asyncQueue.flush()
    }

    await Promise.all(
      this.transports.map(t => t.flush?.()),
    )
  }

  /**
   * 关闭日志器
   */
  async close(): Promise<void> {
    await this.flush()

    if (this.asyncQueue) {
      this.asyncQueue.destroy()
    }

    await Promise.all(
      this.transports.map(t => t.close?.()),
    )

    // 卸载插件
    for (const plugin of this.plugins.values()) {
      plugin.uninstall?.(this)
    }
    this.plugins.clear()
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.history.clear()
  }

  /**
   * 获取日志历史
   */
  getHistory(limit?: number): LogEntry[] {
    if (limit) {
      return this.history.getLast(limit)
    }
    return this.history.toArray()
  }

  /**
   * 查询日志
   */
  query(filter: LogQueryFilter): LogEntry[] {
    let entries = this.history.toArray()

    if (filter.startTime) {
      entries = entries.filter(e => e.timestamp >= filter.startTime!)
    }
    if (filter.endTime) {
      entries = entries.filter(e => e.timestamp <= filter.endTime!)
    }
    if (filter.levels?.length) {
      entries = entries.filter(e => filter.levels!.includes(e.level))
    }
    if (filter.tags?.length) {
      entries = entries.filter(e => e.tags?.some(t => filter.tags!.includes(t)))
    }
    if (filter.category) {
      entries = entries.filter(e => e.category === filter.category)
    }
    if (filter.source) {
      entries = entries.filter(e => e.source === filter.source)
    }
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      entries = entries.filter(e => e.message.toLowerCase().includes(kw))
    }
    if (filter.offset) {
      entries = entries.slice(filter.offset)
    }
    if (filter.limit) {
      entries = entries.slice(0, filter.limit)
    }

    return entries
  }

  /**
   * 导出日志
   */
  export(format: 'json' | 'csv'): string {
    const entries = this.history.toArray()

    if (format === 'json') {
      return JSON.stringify(entries, null, 2)
    }

    // CSV 格式
    const header = getCsvHeader()
    const rows = entries.map(formatLogAsCsvRow)
    return [header, ...rows].join('\n')
  }

  /**
   * 判断是否应该记录日志
   * @private
   */
  private shouldLog(level: LogLevel): boolean {
    return this.enabled && level >= this.level
  }

  /**
   * 获取日志级别名称
   * @private
   */
  private getLevelName(level: LogLevel): LogLevelName {
    const names: Record<LogLevel, LogLevelName> = {
      [LogLevel.TRACE]: 'trace',
      [LogLevel.DEBUG]: 'debug',
      [LogLevel.INFO]: 'info',
      [LogLevel.WARN]: 'warn',
      [LogLevel.ERROR]: 'error',
      [LogLevel.FATAL]: 'fatal',
      [LogLevel.SILENT]: 'fatal',
    }
    return names[level] || 'info'
  }

  /**
   * 创建日志条目
   * @private
   */
  private createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
    // 脱敏处理
    const sanitizedData = this.options.sanitize
      ? sanitizeObject(data, this.options.sanitize)
      : data

    return {
      id: generateId(),
      timestamp: Date.now(),
      level,
      levelName: this.getLevelName(level),
      message,
      data: sanitizedData,
      tags: [...this.defaultTags],
      category: this.options.defaultCategory,
      source: this.name,
      correlationId: this.context.correlationId as string | undefined,
      userId: this.context.userId as string | undefined,
      sessionId: this.context.sessionId as string | undefined,
      meta: { ...this.context },
    }
  }

  /**
   * 处理日志条目
   * @private
   */
  private processEntry(entry: LogEntry): void {
    // 应用过滤器
    for (const filter of this.filters) {
      if (!filter.shouldLog(entry)) {
        return
      }
    }

    // 添加到历史
    this.history.push(entry)

    // 异步或同步处理
    if (this.asyncQueue) {
      this.asyncQueue.push(entry)
    }
    else {
      this.writeToTransports(entry)
    }
  }

  /**
   * 批量处理日志条目
   * @private
   */
  private async processBatch(entries: LogEntry[]): Promise<void> {
    for (const transport of this.transports) {
      if (transport.writeBatch) {
        await transport.writeBatch(entries)
      }
      else {
        for (const entry of entries) {
          await transport.write(entry)
        }
      }
    }
  }

  /**
   * 写入传输器
   * @private
   */
  private writeToTransports(entry: LogEntry): void {
    for (const transport of this.transports) {
      if (transport.enabled === false) {
        continue
      }
      if (transport.level !== undefined && entry.level < transport.level) {
        continue
      }

      try {
        transport.write(entry)
      }
      catch (err) {
        console.error(`传输器 "${transport.name}" 写入失败:`, err)
      }
    }
  }
}

