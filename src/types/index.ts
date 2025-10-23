/**
 * 日志级别
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

/**
 * 日志级别名称映射
 */
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
}

/**
 * 日志条目
 */
export interface LogEntry {
  /**
   * 日志级别
   */
  level: LogLevel

  /**
   * 日志消息
   */
  message: string

  /**
   * 时间戳
   */
  timestamp: number

  /**
   * 日志来源（模块名）
   */
  source?: string

  /**
   * 附加数据
   */
  data?: any

  /**
   * 错误对象
   */
  error?: Error

  /**
   * 堆栈跟踪
   */
  stack?: string

  /**
   * 用户ID
   */
  userId?: string

  /**
   * 会话ID
   */
  sessionId?: string

  /**
   * 标签
   */
  tags?: string[]
}

/**
 * 日志传输器接口
 */
export interface LogTransport {
  /**
   * 传输器名称
   */
  name: string

  /**
   * 最低日志级别
   */
  level: LogLevel

  /**
   * 是否启用
   */
  enabled: boolean

  /**
   * 记录日志
   */
  log(entry: LogEntry): void | Promise<void>

  /**
   * 刷新缓冲区
   */
  flush?(): void | Promise<void>

  /**
   * 销毁传输器
   */
  destroy?(): void | Promise<void>
}

/**
 * 日志格式化器接口
 */
export interface LogFormatter {
  /**
   * 格式化日志条目
   */
  format(entry: LogEntry): string
}

/**
 * Logger 配置
 */
export interface LoggerConfig {
  /**
   * Logger 名称
   */
  name?: string

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
   * 日志传输器
   */
  transports?: LogTransport[]

  /**
   * 是否在生产环境禁用 debug/trace
   * @default true
   */
  disableDebugInProduction?: boolean

  /**
   * 用户ID（用于日志追踪）
   */
  userId?: string

  /**
   * 会话ID（用于日志追踪）
   */
  sessionId?: string

  /**
   * 默认标签
   */
  defaultTags?: string[]
}

/**
 * Logger 接口
 */
export interface ILogger {
  /**
   * Trace 日志
   */
  trace(message: string, data?: any): void

  /**
   * Debug 日志
   */
  debug(message: string, data?: any): void

  /**
   * Info 日志
   */
  info(message: string, data?: any): void

  /**
   * Warn 日志
   */
  warn(message: string, data?: any): void

  /**
   * Error 日志
   */
  error(message: string, error?: Error, data?: any): void

  /**
   * Fatal 日志
   */
  fatal(message: string, error?: Error, data?: any): void

  /**
   * 通用日志方法
   */
  log(level: LogLevel, message: string, data?: any, error?: Error): void

  /**
   * 创建子 Logger
   */
  child(config: Partial<LoggerConfig>): ILogger

  /**
   * 添加传输器
   */
  addTransport(transport: LogTransport): void

  /**
   * 移除传输器
   */
  removeTransport(name: string): void

  /**
   * 添加过滤器
   */
  addFilter(filter: any): void

  /**
   * 移除过滤器
   */
  removeFilter(name: string): void

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void

  /**
   * 启用/禁用 Logger
   */
  enable(): void
  disable(): void

  /**
   * 刷新所有传输器
   */
  flush(): Promise<void>

  /**
   * 销毁 Logger
   */
  destroy(): Promise<void>
}

/**
 * 性能日志条目
 */
export interface PerformanceLogEntry {
  /**
   * 操作名称
   */
  operation: string

  /**
   * 开始时间
   */
  startTime: number

  /**
   * 结束时间
   */
  endTime: number

  /**
   * 持续时间（毫秒）
   */
  duration: number

  /**
   * 附加数据
   */
  data?: any
}






