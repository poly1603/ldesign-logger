/**
 * 性能辅助工具
 * 
 * 提供便捷的性能监控和日志记录功能
 */

import type { ILogger } from '../types'

/**
 * 性能计时器
 * 
 * 用于测量代码执行时间并自动记录日志
 * 
 * @example
 * ```ts
 * const timer = logger.startTimer('database-query')
 * await db.query('SELECT * FROM users')
 * timer.end() // 自动记录耗时日志
 * ```
 */
export class PerformanceTimer {
  private logger: ILogger
  private label: string
  private startTime: number
  private metadata?: Record<string, any>

  /**
   * 构造函数
   * 
   * @param logger - Logger 实例
   * @param label - 计时器标签
   * @param metadata - 附加元数据（可选）
   */
  constructor(logger: ILogger, label: string, metadata?: Record<string, any>) {
    this.logger = logger
    this.label = label
    this.metadata = metadata
    this.startTime = performance.now()
  }

  /**
   * 结束计时并记录日志
   * 
   * @param additionalData - 额外的日志数据（可选）
   * @returns 执行时间（毫秒）
   * 
   * @example
   * ```ts
   * const duration = timer.end({ recordCount: 100 })
   * console.log(`耗时：${duration}ms`)
   * ```
   */
  end(additionalData?: Record<string, any>): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime

    // 合并所有数据
    const logData = {
      ...this.metadata,
      ...additionalData,
      duration: Math.round(duration * 100) / 100, // 保留2位小数
      durationMs: `${Math.round(duration * 100) / 100}ms`,
    }

    // 根据耗时选择日志级别
    if (duration > 5000) {
      // 超过 5 秒，警告级别
      this.logger.warn(`[Performance] ${this.label} took too long`, logData)
    }
    else if (duration > 1000) {
      // 超过 1 秒，提示级别
      this.logger.info(`[Performance] ${this.label}`, logData)
    }
    else {
      // 正常，调试级别
      this.logger.debug(`[Performance] ${this.label}`, logData)
    }

    return duration
  }

  /**
   * 取消计时（不记录日志）
   * 
   * @example
   * ```ts
   * timer.cancel()
   * ```
   */
  cancel(): void {
    // 不执行任何操作，仅作为显式取消的标记
  }
}

/**
 * API 调用日志数据
 */
export interface ApiLogData {
  /**
   * HTTP 方法
   */
  method: string

  /**
   * 请求 URL
   */
  url: string

  /**
   * HTTP 状态码
   */
  status?: number

  /**
   * 请求耗时（毫秒）
   */
  duration?: number

  /**
   * 请求体大小（字节）
   */
  requestSize?: number

  /**
   * 响应体大小（字节）
   */
  responseSize?: number

  /**
   * 错误信息
   */
  error?: string

  /**
   * 其他自定义数据
   */
  [key: string]: any
}

/**
 * Logger 扩展方法
 * 
 * 为 ILogger 接口添加性能辅助方法
 */
export interface ILoggerWithPerformance extends ILogger {
  /**
   * 启动性能计时器
   */
  startTimer(label: string, metadata?: Record<string, any>): PerformanceTimer

  /**
   * 记录 API 调用日志
   */
  logApiCall(data: ApiLogData): void

  /**
   * 记录性能指标
   */
  logMetric(name: string, value: number, unit?: string, metadata?: Record<string, any>): void
}

/**
 * 为 Logger 添加性能辅助方法
 * 
 * @param logger - Logger 实例
 * @returns 增强后的 Logger
 * 
 * @example
 * ```ts
 * import { createLogger } from '@ldesign/logger'
 * import { enhanceLoggerWithPerformance } from '@ldesign/logger/utils'
 * 
 * const logger = enhanceLoggerWithPerformance(createLogger())
 * 
 * // 使用计时器
 * const timer = logger.startTimer('operation')
 * // ... do something
 * timer.end()
 * 
 * // 记录 API 调用
 * logger.logApiCall({
 *   method: 'GET',
 *   url: '/api/users',
 *   status: 200,
 *   duration: 123,
 * })
 * ```
 */
export function enhanceLoggerWithPerformance(
  logger: ILogger,
): ILoggerWithPerformance {
  const enhanced = logger as ILoggerWithPerformance

  /**
   * 启动性能计时器
   */
  enhanced.startTimer = (label: string, metadata?: Record<string, any>) => {
    return new PerformanceTimer(logger, label, metadata)
  }

  /**
   * 记录 API 调用日志
   */
  enhanced.logApiCall = (data: ApiLogData) => {
    const { method, url, status, duration, error, ...rest } = data

    // 构建日志消息
    const message = `${method} ${url}`

    // 构建日志数据
    const logData: Record<string, any> = {
      method,
      url,
      ...rest,
    }

    if (status !== undefined) {
      logData.status = status
    }

    if (duration !== undefined) {
      logData.duration = Math.round(duration * 100) / 100
      logData.durationMs = `${Math.round(duration * 100) / 100}ms`
    }

    // 根据状态码选择日志级别
    if (error || (status && status >= 500)) {
      logger.error(`[API] ${message}`, undefined, logData)
    }
    else if (status && status >= 400) {
      logger.warn(`[API] ${message}`, logData)
    }
    else if (duration && duration > 3000) {
      logger.warn(`[API] ${message} (slow)`, logData)
    }
    else {
      logger.info(`[API] ${message}`, logData)
    }
  }

  /**
   * 记录性能指标
   */
  enhanced.logMetric = (
    name: string,
    value: number,
    unit = 'ms',
    metadata?: Record<string, any>,
  ) => {
    logger.info(`[Metric] ${name}`, {
      metric: name,
      value,
      unit,
      ...metadata,
    })
  }

  return enhanced
}

/**
 * 性能计时装饰器（实验性）
 * 
 * 注意：TypeScript 装饰器需要在 tsconfig.json 中启用 experimentalDecorators
 * 
 * @param logger - Logger 实例
 * @param label - 计时器标签（可选，默认使用方法名）
 * 
 * @example
 * ```ts
 * class UserService {
 *   @logPerformance(logger, 'fetch-users')
 *   async fetchUsers() {
 *     // ... 实现
 *   }
 * }
 * ```
 */
export function logPerformance(logger: ILogger, label?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value
    const timerLabel = label || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer(logger, timerLabel)

      try {
        const result = await originalMethod.apply(this, args)
        timer.end()
        return result
      }
      catch (error) {
        timer.end({ error: error instanceof Error ? error.message : String(error) })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * 性能监控包装器
 * 
 * 包装一个函数，自动添加性能监控
 * 
 * @param fn - 要包装的函数
 * @param logger - Logger 实例
 * @param label - 计时器标签
 * @returns 包装后的函数
 * 
 * @example
 * ```ts
 * const monitoredFetch = wrapWithPerformance(
 *   fetch,
 *   logger,
 *   'http-request'
 * )
 * 
 * const response = await monitoredFetch('https://api.example.com/data')
 * ```
 */
export function wrapWithPerformance<T extends (...args: any[]) => any>(
  fn: T,
  logger: ILogger,
  label: string,
): T {
  return ((...args: any[]) => {
    const timer = new PerformanceTimer(logger, label)

    try {
      const result = fn(...args)

      // 处理 Promise
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            timer.end()
            return value
          })
          .catch((error: any) => {
            timer.end({ error: error instanceof Error ? error.message : String(error) })
            throw error
          })
      }

      // 同步函数
      timer.end()
      return result
    }
    catch (error) {
      timer.end({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }) as T
}

/**
 * 批量记录性能指标
 * 
 * @param logger - Logger 实例
 * @param metrics - 性能指标对象
 * 
 * @example
 * ```ts
 * logMetrics(logger, {
 *   'page-load-time': 1234,
 *   'api-response-time': 567,
 *   'render-time': 89,
 * })
 * ```
 */
export function logMetrics(
  logger: ILogger,
  metrics: Record<string, number>,
  unit = 'ms',
): void {
  for (const [name, value] of Object.entries(metrics)) {
    logger.info(`[Metric] ${name}`, {
      metric: name,
      value,
      unit,
    })
  }
}


