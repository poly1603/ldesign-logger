import type { LogEntry, LogLevel, LogTransport } from '../types'
import { LogLevelNames } from '../types'

/**
 * Console 传输器配置
 */
export interface ConsoleTransportConfig {
  /**
   * 最低日志级别
   * 只有达到或超过此级别的日志才会输出到控制台
   * @default LogLevel.DEBUG
   */
  level?: LogLevel

  /**
   * 是否启用传输器
   * @default true
   */
  enabled?: boolean

  /**
   * 是否使用彩色输出
   * 在支持的浏览器中，日志级别会显示为不同颜色
   * @default true
   */
  colors?: boolean

  /**
   * 是否显示时间戳
   * 在日志消息前显示本地时间
   * @default true
   */
  timestamp?: boolean
}

/**
 * Console 传输器
 * 
 * 将日志输出到浏览器控制台（或 Node.js 终端）
 * 
 * 特性：
 * - 彩色输出：不同日志级别显示不同颜色
 * - 时间戳：可选显示时间信息
 * - 智能格式化：自动使用合适的 console 方法
 * - 对象展开：附加数据以可读形式展示
 * 
 * 使用场景：
 * - 开发环境调试
 * - 浏览器实时监控
 * - 快速问题定位
 * 
 * 性能考虑：
 * - 零延迟：同步输出，无缓冲
 * - 适合开发：生产环境建议降低级别或禁用
 */
export class ConsoleTransport implements LogTransport {
  name = 'console'
  level: LogLevel
  enabled: boolean
  private colors: boolean
  private timestamp: boolean

  /**
   * 日志级别对应的控制台方法映射
   * 
   * 不同级别的日志使用不同的 console 方法：
   * - TRACE/DEBUG → console.debug
   * - INFO → console.info
   * - WARN → console.warn
   * - ERROR/FATAL → console.error
   */
  private static readonly CONSOLE_METHODS = {
    0: 'debug', // TRACE
    1: 'debug', // DEBUG
    2: 'info',  // INFO
    3: 'warn',  // WARN
    4: 'error', // ERROR
    5: 'error', // FATAL
  }

  /**
   * 日志级别对应的颜色
   * 
   * 使用 CSS 颜色值，在浏览器控制台中渲染为彩色文本
   */
  private static readonly COLORS = {
    0: '#999',     // TRACE - 灰色（次要信息）
    1: '#6366f1',  // DEBUG - 紫色（调试信息）
    2: '#3b82f6',  // INFO - 蓝色（常规信息）
    3: '#f59e0b',  // WARN - 橙色（警告）
    4: '#ef4444',  // ERROR - 红色（错误）
    5: '#dc2626',  // FATAL - 深红色（严重错误）
  }

  /**
   * 构造函数
   * 
   * @param config - Console 传输器配置
   */
  constructor(config: ConsoleTransportConfig = {}) {
    this.level = config.level ?? 1 // 默认 DEBUG 级别
    this.enabled = config.enabled ?? true
    this.colors = config.colors ?? true
    this.timestamp = config.timestamp ?? true
  }

  /**
   * 记录日志到控制台
   * 
   * 执行流程：
   * 1. 选择合适的 console 方法（debug/info/warn/error）
   * 2. 格式化时间戳（如果启用）
   * 3. 格式化日志级别（彩色或纯文本）
   * 4. 添加日志来源
   * 5. 输出消息和附加数据
   * 
   * @param entry - 日志条目
   */
  log(entry: LogEntry): void {
    // 获取对应的 console 方法
    const method = ConsoleTransport.CONSOLE_METHODS[entry.level] as keyof Console
    const levelName = LogLevelNames[entry.level]

    // 构建输出内容数组
    const parts: any[] = []

    // 1. 添加时间戳
    if (this.timestamp) {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      parts.push(`[${time}]`)
    }

    // 2. 添加日志级别（彩色或纯文本）
    if (this.colors && typeof console[method] === 'function') {
      // 彩色输出（使用 %c 占位符）
      const color = ConsoleTransport.COLORS[entry.level]
      parts.push(`%c[${levelName}]%c`, `color: ${color}; font-weight: bold`, '')
    }
    else {
      // 纯文本输出
      parts.push(`[${levelName}]`)
    }

    // 3. 添加日志来源
    if (entry.source) {
      parts.push(`[${entry.source}]`)
    }

    // 4. 添加主消息
    parts.push(entry.message)

    // 5. 添加附加数据（如果有）
    if (entry.data !== undefined) {
      parts.push('\n  Data:', entry.data)
    }

    // 6. 添加错误信息（如果有）
    if (entry.error) {
      parts.push('\n  Error:', entry.error)
    }

    // 7. 添加标签（如果有）
    if (entry.tags && entry.tags.length > 0) {
      parts.push('\n  Tags:', entry.tags.join(', '))
    }

    // 8. 输出到控制台
    // 使用分号开头避免 ASI 问题
    ; (console[method] as any)(...parts)
  }
}

/**
 * 创建 Console 传输器
 * 
 * 工厂函数，创建并返回一个新的 ConsoleTransport 实例
 * 
 * @param config - Console 传输器配置（可选）
 * @returns ConsoleTransport 实例
 * 
 * @example
 * ```ts
 * // 使用默认配置
 * const consoleTransport = createConsoleTransport()
 * 
 * // 自定义配置
 * const consoleTransport = createConsoleTransport({
 *   level: LogLevel.INFO,    // 只输出 INFO 及以上级别
 *   colors: true,            // 启用彩色输出
 *   timestamp: true,         // 显示时间戳
 * })
 * 
 * // 添加到 Logger
 * logger.addTransport(consoleTransport)
 * ```
 */
export function createConsoleTransport(config?: ConsoleTransportConfig): ConsoleTransport {
  return new ConsoleTransport(config)
}






