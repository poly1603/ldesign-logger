/**
 * 创建 Vue 日志器
 * @description 创建集成了 Vue 功能的日志器实例
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import {
  createErrorTracker,
  createLogger as createCoreLogger,
  createPerformanceMonitor,
  type ErrorTracker,
  type ILogger,
  type LogContext,
  type LogEntry,
  type LoggerOptions,
  type LoggerPlugin,
  type LogFilter,
  type LogLevel,
  type LogQueryFilter,
  type LogTransport,
  type PerformanceMonitor,
  type Timer,
} from '@ldesign/logger-core'
import type { VueLogger, VueLoggerOptions } from '../types'
import { installVueLogger, setupRouterTracking } from './vue-plugin'

/**
 * 创建 Vue 日志器
 * @description 创建一个集成了 Vue 错误处理、路由追踪和性能监控的日志器
 * @param options - 配置选项
 * @returns Vue 日志器实例
 * @example
 * ```ts
 * import { createLogger } from '@ldesign/logger-vue'
 *
 * const logger = createLogger({
 *   level: 'debug',
 *   enableErrorTracking: true,
 *   enablePerformanceMonitoring: true,
 * })
 *
 * app.use(logger)
 * ```
 */
export function createLogger(options: VueLoggerOptions = {}): VueLogger {
  const {
    enableErrorTracking = true,
    enablePerformanceMonitoring = true,
    enableRouterTracking = true,
    errorTracking = {},
    performanceMonitoring = {},
    ...loggerOptions
  } = options

  // 创建核心日志器
  const coreLogger = createCoreLogger(loggerOptions)

  // 创建错误追踪器
  let errorTracker: ErrorTracker | undefined
  if (enableErrorTracking) {
    errorTracker = createErrorTracker({
      ...errorTracking,
      logger: coreLogger,
    })
    errorTracker.start()
  }

  // 创建性能监控器
  let performanceMonitor: PerformanceMonitor | undefined
  if (enablePerformanceMonitoring) {
    performanceMonitor = createPerformanceMonitor({
      ...performanceMonitoring,
      logger: coreLogger,
    })
    performanceMonitor.start()
  }

  // 保存 router 引用
  let router: Router | undefined

  // 创建 Vue 日志器
  const vueLogger: VueLogger = {
    // 代理核心日志器方法
    get name() { return coreLogger.name },
    get level() { return coreLogger.level },
    set level(value: LogLevel) { coreLogger.level = value },
    get enabled() { return coreLogger.enabled },
    set enabled(value: boolean) { coreLogger.enabled = value },

    trace: (message: string, data?: unknown) => coreLogger.trace(message, data),
    debug: (message: string, data?: unknown) => coreLogger.debug(message, data),
    info: (message: string, data?: unknown) => coreLogger.info(message, data),
    warn: (message: string, data?: unknown) => coreLogger.warn(message, data),
    error: (message: string, error?: Error | unknown, data?: unknown) =>
      coreLogger.error(message, error, data),
    fatal: (message: string, error?: Error | unknown, data?: unknown) =>
      coreLogger.fatal(message, error, data),

    withContext: (context: LogContext): ILogger => coreLogger.withContext(context),
    withTags: (...tags: string[]): ILogger => coreLogger.withTags(...tags),
    child: (childOptions: Partial<LoggerOptions>): ILogger => coreLogger.child(childOptions),

    startTimer: (name: string): Timer => coreLogger.startTimer(name),
    time: (name: string): void => coreLogger.time(name),
    timeEnd: (name: string): number => coreLogger.timeEnd(name),

    addTransport: (transport: LogTransport): void => coreLogger.addTransport(transport),
    removeTransport: (name: string): boolean => coreLogger.removeTransport(name),
    addFilter: (filter: LogFilter): void => coreLogger.addFilter(filter),
    removeFilter: (name: string): boolean => coreLogger.removeFilter(name),

    use: (plugin: LoggerPlugin): void => coreLogger.use(plugin),
    query: (filter: LogQueryFilter): LogEntry[] => coreLogger.query(filter),
    export: (format: 'json' | 'csv'): string => coreLogger.export(format),
    clear: (): void => coreLogger.clear(),
    flush: (): Promise<void> => coreLogger.flush(),
    close: (): Promise<void> => coreLogger.close(),

    // Vue 特有方法
    getErrorTracker: () => errorTracker,
    getPerformanceMonitor: () => performanceMonitor,

    // Vue 插件安装方法
    install(app: App) {
      installVueLogger(app, vueLogger, options)

      // 尝试获取 router
      // Vue 3 中 router 会在 app.use(router) 后可用
      // 我们需要在下一个 tick 检查
      setTimeout(() => {
        const appRouter = app.config.globalProperties.$router as Router | undefined
        if (appRouter && enableRouterTracking) {
          router = appRouter
          setupRouterTracking(router, vueLogger)
        }
      }, 0)
    },
  }

  return vueLogger
}

/**
 * 创建简单日志器
 * @description 创建一个不带 Vue 集成的简单日志器
 * @param options - 配置选项
 * @returns 日志器实例
 */
export function createSimpleLogger(options: LoggerOptions = {}): ILogger {
  return createCoreLogger(options)
}

