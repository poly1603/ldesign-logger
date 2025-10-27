import type { ILogger, LogEntry, LogLevel, LoggerConfig, LogTransport } from '../types'
import { LogLevelNames } from '../types'
import type { LogFilter } from '../filters/LogFilter'
import { isProduction } from '../utils/environment'

/**
 * Logger 核心实现
 * 
 * 企业级日志系统的核心类，负责：
 * - 日志记录：trace/debug/info/warn/error/fatal 六个级别
 * - 日志过滤：按级别、环境、自定义过滤器
 * - 日志传输：支持多个传输器同时工作
 * - 子 Logger：支持创建带有不同配置的子实例
 * 
 * 设计理念：
 * - 插件化：传输器、过滤器、格式化器都可自定义
 * - 高性能：异步处理，不阻塞主线程
 * - 类型安全：完整的 TypeScript 类型支持
 * - 灵活配置：支持运行时动态调整
 */
export class Logger implements ILogger {
  /** Logger 配置 */
  private config: Required<LoggerConfig>

  /** 日志传输器列表 */
  private transports: LogTransport[] = []

  /** 日志过滤器列表 */
  private filters: LogFilter[] = []

  /**
   * 构造函数
   * 
   * @param config - Logger 配置选项
   */
  constructor(config: LoggerConfig = {}) {
    // 合并默认配置和用户配置
    this.config = {
      name: config.name || 'default',
      level: config.level ?? 2, // 默认 INFO 级别
      enabled: config.enabled ?? true,
      transports: config.transports || [],
      disableDebugInProduction: config.disableDebugInProduction ?? true,
      userId: config.userId,
      sessionId: config.sessionId,
      defaultTags: config.defaultTags || [],
    }

    // 复制传输器数组，避免外部修改影响
    this.transports = [...this.config.transports]
  }

  /**
   * 创建日志条目
   * 
   * 将日志参数转换为标准的 LogEntry 对象，包含：
   * - 基础信息：级别、消息、时间戳、来源
   * - 可选信息：附加数据、错误对象、用户信息、标签
   * 
   * 这是日志系统的核心数据结构，所有传输器和过滤器都基于此结构工作
   * 
   * @param level - 日志级别（TRACE/DEBUG/INFO/WARN/ERROR/FATAL）
   * @param message - 日志消息文本
   * @param data - 附加数据（可选），可以是任何可序列化的对象
   * @param error - 错误对象（可选），用于 error 和 fatal 级别
   * @returns 完整的日志条目对象
   * 
   * @private
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
  ): LogEntry {
    // 创建基础日志条目
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(), // 使用毫秒时间戳
      source: this.config.name, // 日志来源（Logger 名称）
    }

    // 添加附加数据（如果有）
    if (data !== undefined) {
      entry.data = data
    }

    // 添加错误信息（如果有）
    if (error) {
      entry.error = error
      entry.stack = error.stack // 保留完整堆栈跟踪
    }

    // 添加用户标识（如果配置了）
    // 用于追踪特定用户的日志
    if (this.config.userId) {
      entry.userId = this.config.userId
    }

    // 添加会话标识（如果配置了）
    // 用于追踪同一会话中的所有日志
    if (this.config.sessionId) {
      entry.sessionId = this.config.sessionId
    }

    // 添加默认标签（如果有）
    // 标签用于分类和过滤日志
    if (this.config.defaultTags.length > 0) {
      entry.tags = [...this.config.defaultTags]
    }

    return entry
  }

  /**
   * 记录日志（内部方法）
   * 
   * 执行日志记录的核心流程：
   * 1. 检查 Logger 是否启用
   * 2. 检查日志级别过滤
   * 3. 应用生产环境过滤规则
   * 4. 应用自定义过滤器
   * 5. 分发到所有符合条件的传输器
   * 
   * 设计要点：
   * - 快速返回：不符合条件立即返回，避免无用处理
   * - 错误隔离：单个传输器失败不影响其他传输器
   * - 性能优化：过滤在传输之前，减少不必要的序列化
   * 
   * @param entry - 日志条目
   * @private
   */
  private writeLog(entry: LogEntry): void {
    // 1. 检查 Logger 是否启用
    if (!this.config.enabled) {
      return
    }

    // 2. 检查日志级别过滤
    // 低于配置级别的日志直接忽略
    if (entry.level < this.config.level) {
      return
    }

    // 3. 生产环境禁用 debug/trace
    // 减少生产环境日志量，提高性能
    if (this.config.disableDebugInProduction && isProduction()) {
      if (entry.level <= 1) { // TRACE(0) 或 DEBUG(1)
        return
      }
    }

    // 4. 应用自定义过滤器
    // 所有过滤器都必须通过才会记录日志
    for (const filter of this.filters) {
      if (!filter.filter(entry)) {
        return // 任一过滤器返回 false，则不记录
      }
    }

    // 5. 分发到所有符合条件的传输器
    for (const transport of this.transports) {
      // 检查传输器是否启用且日志级别满足要求
      if (transport.enabled && entry.level >= transport.level) {
        try {
          // 调用传输器的 log 方法
          // 注意：这里可能是同步或异步的
          transport.log(entry)
        }
        catch (error) {
          // 捕获传输器错误，避免影响其他传输器和主流程
          // 使用 console.error 确保错误信息不会丢失
          console.error(`[Logger] Transport "${transport.name}" error:`, error)
        }
      }
    }
  }

  /**
   * 记录 TRACE 级别日志
   * 
   * 用于非常详细的调试信息，通常仅在开发环境使用
   * 
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * logger.trace('Function called', { params: { id: 123 } })
   * ```
   */
  trace(message: string, data?: any): void {
    this.log(0, message, data) // TRACE
  }

  /**
   * 记录 DEBUG 级别日志
   * 
   * 用于调试信息，帮助开发者理解程序执行流程
   * 
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * logger.debug('User data loaded', { userId: '123', count: 5 })
   * ```
   */
  debug(message: string, data?: any): void {
    this.log(1, message, data) // DEBUG
  }

  /**
   * 记录 INFO 级别日志
   * 
   * 用于常规信息，记录系统正常运行的重要事件
   * 
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * logger.info('User logged in', { username: 'john', ip: '192.168.1.1' })
   * ```
   */
  info(message: string, data?: any): void {
    this.log(2, message, data) // INFO
  }

  /**
   * 记录 WARN 级别日志
   * 
   * 用于警告信息，表示潜在问题但不影响正常运行
   * 
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * logger.warn('API rate limit approaching', { usage: 95, limit: 100 })
   * ```
   */
  warn(message: string, data?: any): void {
    this.log(3, message, data) // WARN
  }

  /**
   * 记录 ERROR 级别日志
   * 
   * 用于错误信息，表示功能异常但系统可以继续运行
   * 
   * @param message - 日志消息
   * @param error - 错误对象（可选）
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * try {
   *   await riskyOperation()
   * } catch (err) {
   *   logger.error('Operation failed', err, { operation: 'riskyOperation' })
   * }
   * ```
   */
  error(message: string, error?: Error, data?: any): void {
    this.log(4, message, data, error) // ERROR
  }

  /**
   * 记录 FATAL 级别日志
   * 
   * 用于致命错误，表示严重问题导致系统无法继续运行
   * 
   * @param message - 日志消息
   * @param error - 错误对象（可选）
   * @param data - 附加数据（可选）
   * 
   * @example
   * ```ts
   * logger.fatal('Database connection lost', error, { dbHost: 'localhost' })
   * ```
   */
  fatal(message: string, error?: Error, data?: any): void {
    this.log(5, message, data, error) // FATAL
  }

  /**
   * 通用日志方法
   * 
   * 可以指定任意日志级别记录日志
   * 
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 附加数据（可选）
   * @param error - 错误对象（可选）
   * 
   * @example
   * ```ts
   * logger.log(LogLevel.INFO, 'Custom log', { custom: 'data' })
   * ```
   */
  log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry = this.createEntry(level, message, data, error)
    this.writeLog(entry)
  }

  /**
   * 创建子 Logger
   * 
   * 子 Logger 继承父 Logger 的配置和传输器，但可以覆盖部分配置
   * 子 Logger 的名称会自动添加父 Logger 名称作为前缀
   * 
   * 使用场景：
   * - 为不同模块创建独立的 Logger
   * - 为不同功能设置不同的日志级别
   * 
   * @param config - 子 Logger 配置（会覆盖父配置）
   * @returns 新的 Logger 实例
   * 
   * @example
   * ```ts
   * const apiLogger = logger.child({ name: 'api', level: LogLevel.DEBUG })
   * const dbLogger = logger.child({ name: 'database' })
   * 
   * apiLogger.info('Request received') // [parent.api] Request received
   * dbLogger.info('Query executed')    // [parent.database] Query executed
   * ```
   */
  child(config: Partial<LoggerConfig>): ILogger {
    return new Logger({
      ...this.config,
      ...config,
      // 子 Logger 名称格式：父名称.子名称
      name: config.name ? `${this.config.name}.${config.name}` : this.config.name,
      // 共享父 Logger 的传输器
      transports: this.transports,
    })
  }

  /**
   * 添加传输器
   * 
   * 动态添加日志传输器，可以在运行时扩展日志输出目标
   * 同名传输器不会重复添加
   * 
   * @param transport - 日志传输器实例
   * 
   * @example
   * ```ts
   * logger.addTransport(createHttpTransport({ url: 'https://api.example.com/logs' }))
   * ```
   */
  addTransport(transport: LogTransport): void {
    // 防止重复添加同名传输器
    if (!this.transports.find(t => t.name === transport.name)) {
      this.transports.push(transport)
    }
  }

  /**
   * 移除传输器
   * 
   * 根据名称移除指定的传输器
   * 
   * @param name - 传输器名称
   * 
   * @example
   * ```ts
   * logger.removeTransport('http')
   * ```
   */
  removeTransport(name: string): void {
    const index = this.transports.findIndex(t => t.name === name)
    if (index !== -1) {
      this.transports.splice(index, 1)
    }
  }

  /**
   * 添加过滤器
   * 
   * 动态添加日志过滤器，可以在运行时调整日志过滤规则
   * 同名过滤器不会重复添加
   * 
   * @param filter - 日志过滤器实例
   * 
   * @example
   * ```ts
   * logger.addFilter(createTagFilter({ includeTags: ['important'] }))
   * ```
   */
  addFilter(filter: LogFilter): void {
    // 防止重复添加同名过滤器
    if (!this.filters.find(f => f.name === filter.name)) {
      this.filters.push(filter)
    }
  }

  /**
   * 移除过滤器
   * 
   * 根据名称移除指定的过滤器
   * 
   * @param name - 过滤器名称
   * 
   * @example
   * ```ts
   * logger.removeFilter('tag')
   * ```
   */
  removeFilter(name: string): void {
    const index = this.filters.findIndex(f => f.name === name)
    if (index !== -1) {
      this.filters.splice(index, 1)
    }
  }

  /**
   * 设置日志级别
   * 
   * 动态调整日志级别，低于此级别的日志将被忽略
   * 
   * @param level - 新的日志级别
   * 
   * @example
   * ```ts
   * // 开发环境显示所有日志
   * logger.setLevel(LogLevel.TRACE)
   * 
   * // 生产环境只显示警告和错误
   * logger.setLevel(LogLevel.WARN)
   * ```
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * 启用 Logger
   * 
   * 启用后会开始记录日志
   * 
   * @example
   * ```ts
   * logger.enable()
   * ```
   */
  enable(): void {
    this.config.enabled = true
  }

  /**
   * 禁用 Logger
   * 
   * 禁用后所有日志都不会记录
   * 
   * @example
   * ```ts
   * logger.disable()
   * ```
   */
  disable(): void {
    this.config.enabled = false
  }

  /**
   * 刷新所有传输器
   * 
   * 强制所有传输器立即发送缓冲区中的日志
   * 通常在程序退出前调用，确保日志不丢失
   * 
   * @returns Promise，所有传输器刷新完成后 resolve
   * 
   * @example
   * ```ts
   * // 程序退出前刷新日志
   * process.on('exit', async () => {
   *   await logger.flush()
   * })
   * ```
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.transports.map(async (transport) => {
        if (transport.flush) {
          try {
            await transport.flush()
          }
          catch (error) {
            console.error(`[Logger] Flush transport "${transport.name}" error:`, error)
          }
        }
      }),
    )
  }

  /**
   * 销毁 Logger
   * 
   * 刷新并销毁所有传输器，释放资源
   * 销毁后 Logger 将无法继续使用
   * 
   * @returns Promise，销毁完成后 resolve
   * 
   * @example
   * ```ts
   * // 应用关闭时清理资源
   * await logger.destroy()
   * ```
   */
  async destroy(): Promise<void> {
    // 先刷新所有待发送的日志
    await this.flush()

    // 销毁所有传输器
    await Promise.all(
      this.transports.map(async (transport) => {
        if (transport.destroy) {
          try {
            await transport.destroy()
          }
          catch (error) {
            console.error(`[Logger] Destroy transport "${transport.name}" error:`, error)
          }
        }
      }),
    )

    // 清空传输器列表
    this.transports = []
  }
}

/**
 * 创建 Logger 实例
 * 
 * 工厂函数，创建并返回一个新的 Logger 实例
 * 
 * @param config - Logger 配置选项（可选）
 * @returns Logger 实例
 * 
 * @example
 * ```ts
 * // 使用默认配置
 * const logger = createLogger()
 * 
 * // 自定义配置
 * const logger = createLogger({
 *   name: 'my-app',
 *   level: LogLevel.INFO,
 *   transports: [
 *     createConsoleTransport(),
 *     createHttpTransport({ url: 'https://api.example.com/logs' })
 *   ]
 * })
 * ```
 */
export function createLogger(config?: LoggerConfig): ILogger {
  return new Logger(config)
}






