/**
 * @ldesign/logger-core 类型定义
 * @packageDocumentation
 */

/**
 * 日志级别枚举
 * @description 定义日志的严重程度，从低到高排序
 */
export enum LogLevel {
  /** 追踪级别 - 最详细的日志 */
  TRACE = 0,
  /** 调试级别 - 开发调试信息 */
  DEBUG = 10,
  /** 信息级别 - 一般信息 */
  INFO = 20,
  /** 警告级别 - 潜在问题 */
  WARN = 30,
  /** 错误级别 - 错误信息 */
  ERROR = 40,
  /** 致命级别 - 严重错误 */
  FATAL = 50,
  /** 静默级别 - 不输出任何日志 */
  SILENT = 100,
}

/**
 * 日志级别名称类型
 */
export type LogLevelName = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * 日志条目接口
 * @description 表示单条日志记录的完整信息
 */
export interface LogEntry {
  /** 日志唯一标识符 */
  id: string
  /** 日志时间戳（毫秒） */
  timestamp: number
  /** 日志级别 */
  level: LogLevel
  /** 日志级别名称 */
  levelName: LogLevelName
  /** 日志消息 */
  message: string
  /** 日志附加数据 */
  data?: unknown
  /** 错误对象 */
  error?: Error
  /** 错误堆栈 */
  stack?: string
  /** 日志标签 */
  tags?: string[]
  /** 日志分类 */
  category?: string
  /** 关联 ID（用于追踪） */
  correlationId?: string
  /** 用户 ID */
  userId?: string
  /** 会话 ID */
  sessionId?: string
  /** 日志来源（模块/组件名） */
  source?: string
  /** 额外元数据 */
  meta?: Record<string, unknown>
}

/**
 * 日志上下文接口
 * @description 日志的上下文信息，用于追踪和关联
 */
export interface LogContext {
  /** 关联 ID */
  correlationId?: string
  /** 用户 ID */
  userId?: string
  /** 会话 ID */
  sessionId?: string
  /** 请求 ID */
  requestId?: string
  /** 追踪 ID */
  traceId?: string
  /** 跨度 ID */
  spanId?: string
  /** 额外上下文数据 */
  [key: string]: unknown
}

/**
 * 日志传输器接口
 * @description 用于将日志发送到不同目的地的抽象接口
 */
export interface LogTransport {
  /** 传输器名称 */
  name: string
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 写入日志 */
  write(entry: LogEntry): void | Promise<void>
  /** 批量写入日志 */
  writeBatch?(entries: LogEntry[]): void | Promise<void>
  /** 刷新缓冲区 */
  flush?(): void | Promise<void>
  /** 关闭传输器 */
  close?(): void | Promise<void>
}

/**
 * 日志格式化器接口
 * @description 用于格式化日志输出的抽象接口
 */
export interface LogFormatter {
  /** 格式化器名称 */
  name: string
  /** 格式化日志条目 */
  format(entry: LogEntry): string
}

/**
 * 日志过滤器接口
 * @description 用于过滤日志的抽象接口
 */
export interface LogFilter {
  /** 过滤器名称 */
  name: string
  /** 判断日志是否应该被记录 */
  shouldLog(entry: LogEntry): boolean
}

/**
 * 敏感信息配置
 * @description 用于脱敏处理的配置
 */
export interface SanitizeConfig {
  /** 需要脱敏的字段名列表 */
  sensitiveFields?: string[]
  /** 脱敏替换字符 */
  maskChar?: string
  /** 保留的前缀字符数 */
  keepPrefix?: number
  /** 保留的后缀字符数 */
  keepSuffix?: number
  /** 自定义脱敏函数 */
  customSanitizer?: (key: string, value: unknown) => unknown
}

/**
 * 日志存储选项
 * @description 配置日志持久化存储
 */
export interface StorageOptions {
  /** 存储类型 */
  type: 'localStorage' | 'indexedDB' | 'memory'
  /** 存储键名前缀 */
  prefix?: string
  /** 最大存储条数 */
  maxEntries?: number
  /** 最大存储大小（字节） */
  maxSize?: number
  /** 过期时间（毫秒） */
  ttl?: number
  /** 数据库名称（IndexedDB） */
  dbName?: string
  /** 存储表名（IndexedDB） */
  storeName?: string
}

/**
 * 日志上报选项
 * @description 配置日志远程上报
 */
export interface ReportOptions {
  /** 上报 URL */
  url: string
  /** 请求方法 */
  method?: 'POST' | 'PUT'
  /** 请求头 */
  headers?: Record<string, string>
  /** 批量上报大小 */
  batchSize?: number
  /** 批量上报间隔（毫秒） */
  batchInterval?: number
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟（毫秒） */
  retryDelay?: number
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否使用 Beacon API */
  useBeacon?: boolean
}

/**
 * 日志器配置选项
 * @description 创建日志器实例的完整配置
 */
export interface LoggerOptions {
  /** 日志器名称 */
  name?: string
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 传输器列表 */
  transports?: LogTransport[]
  /** 格式化器 */
  formatter?: LogFormatter
  /** 过滤器列表 */
  filters?: LogFilter[]
  /** 默认标签 */
  defaultTags?: string[]
  /** 默认分类 */
  defaultCategory?: string
  /** 默认上下文 */
  defaultContext?: LogContext
  /** 敏感信息配置 */
  sanitize?: SanitizeConfig
  /** 存储选项 */
  storage?: StorageOptions
  /** 上报选项 */
  report?: ReportOptions
  /** 是否启用性能监控 */
  enablePerformance?: boolean
  /** 是否启用错误追踪 */
  enableErrorTracking?: boolean
  /** 最大缓冲区大小 */
  maxBufferSize?: number
  /** 是否异步处理 */
  async?: boolean
  /** 是否使用 Web Worker */
  useWorker?: boolean
}

/**
 * 日志器接口
 * @description 日志器的核心 API 接口
 */
export interface ILogger {
  /** 日志器名称 */
  readonly name: string
  /** 当前日志级别 */
  level: LogLevel
  /** 是否启用 */
  enabled: boolean

  /** 追踪级别日志 */
  trace(message: string, data?: unknown): void
  /** 调试级别日志 */
  debug(message: string, data?: unknown): void
  /** 信息级别日志 */
  info(message: string, data?: unknown): void
  /** 警告级别日志 */
  warn(message: string, data?: unknown): void
  /** 错误级别日志 */
  error(message: string, error?: Error | unknown, data?: unknown): void
  /** 致命级别日志 */
  fatal(message: string, error?: Error | unknown, data?: unknown): void

  /** 使用指定级别记录日志 */
  log(level: LogLevel, message: string, data?: unknown): void
  /** 记录带上下文的日志 */
  withContext(context: LogContext): ILogger
  /** 记录带标签的日志 */
  withTags(...tags: string[]): ILogger
  /** 创建子日志器 */
  child(options: Partial<LoggerOptions>): ILogger

  /** 添加传输器 */
  addTransport(transport: LogTransport): void
  /** 移除传输器 */
  removeTransport(name: string): void
  /** 添加过滤器 */
  addFilter(filter: LogFilter): void
  /** 移除过滤器 */
  removeFilter(name: string): void

  /** 刷新缓冲区 */
  flush(): Promise<void>
  /** 关闭日志器 */
  close(): Promise<void>
  /** 清空日志 */
  clear(): void

  /** 获取日志历史 */
  getHistory(limit?: number): LogEntry[]
  /** 查询日志 */
  query(filter: LogQueryFilter): LogEntry[]
  /** 导出日志 */
  export(format: 'json' | 'csv'): string
}

/**
 * 日志查询过滤器
 * @description 用于查询和过滤日志的条件
 */
export interface LogQueryFilter {
  /** 开始时间 */
  startTime?: number
  /** 结束时间 */
  endTime?: number
  /** 日志级别列表 */
  levels?: LogLevel[]
  /** 标签列表 */
  tags?: string[]
  /** 分类 */
  category?: string
  /** 关键词 */
  keyword?: string
  /** 来源 */
  source?: string
  /** 限制条数 */
  limit?: number
  /** 偏移量 */
  offset?: number
}

/**
 * 性能指标接口
 * @description 性能监控数据
 */
export interface PerformanceMetrics {
  /** 指标名称 */
  name: string
  /** 开始时间 */
  startTime: number
  /** 结束时间 */
  endTime?: number
  /** 持续时间（毫秒） */
  duration?: number
  /** 指标类型 */
  type: 'timing' | 'counter' | 'gauge'
  /** 指标值 */
  value?: number
  /** 额外数据 */
  data?: Record<string, unknown>
}

/**
 * 错误信息接口
 * @description 错误追踪数据
 */
export interface ErrorInfo {
  /** 错误名称 */
  name: string
  /** 错误消息 */
  message: string
  /** 错误堆栈 */
  stack?: string
  /** 错误代码 */
  code?: string | number
  /** 错误类型 */
  type: 'error' | 'unhandledRejection' | 'resourceError' | 'apiError' | 'custom'
  /** 错误来源 */
  source?: string
  /** 错误发生位置 */
  location?: {
    filename?: string
    lineno?: number
    colno?: number
  }
  /** 用户操作序列 */
  breadcrumbs?: Breadcrumb[]
  /** 额外数据 */
  extra?: Record<string, unknown>
}

/**
 * 用户操作面包屑
 * @description 记录用户操作序列，用于错误追踪
 */
export interface Breadcrumb {
  /** 操作类型 */
  type: 'navigation' | 'click' | 'http' | 'console' | 'custom'
  /** 操作类别 */
  category: string
  /** 操作消息 */
  message: string
  /** 操作数据 */
  data?: Record<string, unknown>
  /** 时间戳 */
  timestamp: number
}

/**
 * 插件接口
 * @description 日志器插件的抽象接口
 */
export interface LoggerPlugin {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version?: string
  /** 安装插件 */
  install(logger: ILogger, options?: Record<string, unknown>): void
  /** 卸载插件 */
  uninstall?(logger: ILogger): void
}

/**
 * 计时器接口
 * @description 用于性能计时的接口
 */
export interface Timer {
  /** 计时器名称 */
  name: string
  /** 结束计时并返回持续时间 */
  end(): number
  /** 取消计时 */
  cancel(): void
}

