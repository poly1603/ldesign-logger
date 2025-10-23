import type { ILogger, LogEntry, LogLevel, LoggerConfig, LogTransport } from '../types'
import { LogLevelNames } from '../types'
import type { LogFilter } from '../filters/LogFilter'
import { isProduction } from '../utils/environment'

/**
 * Logger 核心实现
 */
export class Logger implements ILogger {
  private config: Required<LoggerConfig>
  private transports: LogTransport[] = []
  private filters: LogFilter[] = []

  constructor(config: LoggerConfig = {}) {
    this.config = {
      name: config.name || 'default',
      level: config.level ?? 2, // INFO
      enabled: config.enabled ?? true,
      transports: config.transports || [],
      disableDebugInProduction: config.disableDebugInProduction ?? true,
      userId: config.userId,
      sessionId: config.sessionId,
      defaultTags: config.defaultTags || [],
    }

    this.transports = [...this.config.transports]
  }

  /**
   * 创建日志条目
   */
  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      source: this.config.name,
    }

    if (data !== undefined) {
      entry.data = data
    }

    if (error) {
      entry.error = error
      entry.stack = error.stack
    }

    if (this.config.userId) {
      entry.userId = this.config.userId
    }

    if (this.config.sessionId) {
      entry.sessionId = this.config.sessionId
    }

    if (this.config.defaultTags.length > 0) {
      entry.tags = [...this.config.defaultTags]
    }

    return entry
  }

  /**
   * 记录日志
   */
  private writeLog(entry: LogEntry): void {
    // 检查是否启用
    if (!this.config.enabled) {
      return
    }

    // 检查日志级别
    if (entry.level < this.config.level) {
      return
    }

    // 生产环境禁用 debug/trace
    if (this.config.disableDebugInProduction && isProduction()) {
      if (entry.level <= 1) { // TRACE or DEBUG
        return
      }
    }

    // 应用过滤器
    for (const filter of this.filters) {
      if (!filter.filter(entry)) {
        return
      }
    }

    // 发送到所有传输器
    for (const transport of this.transports) {
      if (transport.enabled && entry.level >= transport.level) {
        try {
          transport.log(entry)
        }
        catch (error) {
          console.error(`[Logger] Transport "${transport.name}" error:`, error)
        }
      }
    }
  }

  trace(message: string, data?: any): void {
    this.log(0, message, data) // TRACE
  }

  debug(message: string, data?: any): void {
    this.log(1, message, data) // DEBUG
  }

  info(message: string, data?: any): void {
    this.log(2, message, data) // INFO
  }

  warn(message: string, data?: any): void {
    this.log(3, message, data) // WARN
  }

  error(message: string, error?: Error, data?: any): void {
    this.log(4, message, data, error) // ERROR
  }

  fatal(message: string, error?: Error, data?: any): void {
    this.log(5, message, data, error) // FATAL
  }

  log(level: LogLevel, message: string, data?: any, error?: Error): void {
    const entry = this.createEntry(level, message, data, error)
    this.writeLog(entry)
  }

  child(config: Partial<LoggerConfig>): ILogger {
    return new Logger({
      ...this.config,
      ...config,
      name: config.name ? `${this.config.name}.${config.name}` : this.config.name,
      transports: this.transports,
    })
  }

  addTransport(transport: LogTransport): void {
    if (!this.transports.find(t => t.name === transport.name)) {
      this.transports.push(transport)
    }
  }

  removeTransport(name: string): void {
    const index = this.transports.findIndex(t => t.name === name)
    if (index !== -1) {
      this.transports.splice(index, 1)
    }
  }

  addFilter(filter: LogFilter): void {
    if (!this.filters.find(f => f.name === filter.name)) {
      this.filters.push(filter)
    }
  }

  removeFilter(name: string): void {
    const index = this.filters.findIndex(f => f.name === name)
    if (index !== -1) {
      this.filters.splice(index, 1)
    }
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  enable(): void {
    this.config.enabled = true
  }

  disable(): void {
    this.config.enabled = false
  }

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

  async destroy(): Promise<void> {
    await this.flush()

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

    this.transports = []
  }
}

/**
 * 创建 Logger 实例
 */
export function createLogger(config?: LoggerConfig): ILogger {
  return new Logger(config)
}






