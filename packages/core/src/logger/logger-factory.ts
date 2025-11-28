/**
 * 日志器工厂
 * @description 提供便捷的日志器创建和管理功能
 */

import type { ILogger, LoggerOptions } from '../types'
import { Logger } from './logger'

/** 日志器实例缓存 */
const loggerCache = new Map<string, ILogger>()

/** 默认日志器实例 */
let defaultLogger: ILogger | null = null

/**
 * 创建日志器实例
 * @description 创建一个新的日志器实例
 * @param options - 日志器配置选项
 * @returns 日志器实例
 * @example
 * ```ts
 * const logger = createLogger({
 *   name: 'my-app',
 *   level: LogLevel.DEBUG,
 * })
 *
 * logger.info('应用启动')
 * ```
 */
export function createLogger(options: LoggerOptions = {}): ILogger {
  return new Logger(options)
}

/**
 * 获取或创建命名日志器
 * @description 根据名称获取缓存的日志器，如果不存在则创建
 * @param name - 日志器名称
 * @param options - 日志器配置选项
 * @returns 日志器实例
 * @example
 * ```ts
 * const logger = getLogger('auth')
 * logger.info('用户登录')
 *
 * // 再次获取同一个日志器
 * const sameLogger = getLogger('auth')
 * ```
 */
export function getLogger(name: string, options?: LoggerOptions): ILogger {
  let logger = loggerCache.get(name)

  if (!logger) {
    logger = createLogger({ ...options, name })
    loggerCache.set(name, logger)
  }

  return logger
}

/**
 * 获取默认日志器
 * @description 获取全局默认日志器实例
 * @returns 默认日志器实例
 * @example
 * ```ts
 * const logger = getDefaultLogger()
 * logger.info('使用默认日志器')
 * ```
 */
export function getDefaultLogger(): ILogger {
  if (!defaultLogger) {
    defaultLogger = createLogger({ name: 'default' })
  }
  return defaultLogger
}

/**
 * 设置默认日志器
 * @description 设置全局默认日志器实例
 * @param logger - 日志器实例
 * @example
 * ```ts
 * const customLogger = createLogger({ name: 'custom' })
 * setDefaultLogger(customLogger)
 * ```
 */
export function setDefaultLogger(logger: ILogger): void {
  defaultLogger = logger
}

/**
 * 获取所有缓存的日志器
 * @description 获取所有已创建并缓存的日志器
 * @returns 日志器名称和实例的映射
 */
export function getAllLoggers(): Map<string, ILogger> {
  return new Map(loggerCache)
}

/**
 * 移除缓存的日志器
 * @description 从缓存中移除指定名称的日志器
 * @param name - 日志器名称
 * @returns 是否成功移除
 */
export function removeLogger(name: string): boolean {
  const logger = loggerCache.get(name)
  if (logger) {
    logger.close()
    loggerCache.delete(name)
    return true
  }
  return false
}

/**
 * 清除所有缓存的日志器
 * @description 关闭并移除所有缓存的日志器
 */
export async function clearAllLoggers(): Promise<void> {
  const closePromises = Array.from(loggerCache.values()).map(logger => logger.close())
  await Promise.all(closePromises)
  loggerCache.clear()
  defaultLogger = null
}

/**
 * 配置所有日志器
 * @description 批量更新所有缓存日志器的配置
 * @param updates - 要更新的配置
 */
export function configureAllLoggers(updates: Partial<Pick<ILogger, 'level' | 'enabled'>>): void {
  for (const logger of loggerCache.values()) {
    if (updates.level !== undefined) {
      logger.level = updates.level
    }
    if (updates.enabled !== undefined) {
      logger.enabled = updates.enabled
    }
  }

  if (defaultLogger) {
    if (updates.level !== undefined) {
      defaultLogger.level = updates.level
    }
    if (updates.enabled !== undefined) {
      defaultLogger.enabled = updates.enabled
    }
  }
}

