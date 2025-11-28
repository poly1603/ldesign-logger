/**
 * Vue 日志器类型定义
 * @packageDocumentation
 */

import type {
  ErrorTrackerOptions,
  ILogger,
  LoggerOptions,
  LogLevel,
  PerformanceMonitorOptions,
} from '@ldesign/logger-core'
import type { App, InjectionKey } from 'vue'

/**
 * Vue 日志器配置选项
 */
export interface VueLoggerOptions extends LoggerOptions {
  /** 是否启用 Vue 错误处理 */
  enableVueErrorHandler?: boolean
  /** 是否启用 Vue 警告处理 */
  enableVueWarnHandler?: boolean
  /** 是否启用路由错误追踪 */
  enableRouterTracking?: boolean
  /** 是否启用错误追踪 */
  enableErrorTracking?: boolean
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean
  /** 错误追踪配置 */
  errorTracking?: ErrorTrackerOptions
  /** 性能监控配置 */
  performanceMonitoring?: PerformanceMonitorOptions
  /** 全局属性名称 */
  globalPropertyName?: string
  /** 是否在开发模式下启用 */
  enableInDev?: boolean
  /** 是否在生产模式下启用 */
  enableInProd?: boolean
}

/**
 * Vue 日志器实例
 */
export interface VueLogger extends ILogger {
  /** 安装到 Vue 应用 */
  install: (app: App) => void
  /** 获取错误追踪器 */
  getErrorTracker: () => import('@ldesign/logger-core').ErrorTracker | undefined
  /** 获取性能监控器 */
  getPerformanceMonitor: () => import('@ldesign/logger-core').PerformanceMonitor | undefined
}

/**
 * 日志器注入键
 */
export const LOGGER_INJECTION_KEY: InjectionKey<VueLogger> = Symbol('vue-logger')

/**
 * useLogger composable 返回类型
 */
export interface UseLoggerReturn {
  /** 日志器实例 */
  logger: VueLogger
  /** 记录 trace 日志 */
  trace: (message: string, data?: unknown) => void
  /** 记录 debug 日志 */
  debug: (message: string, data?: unknown) => void
  /** 记录 info 日志 */
  info: (message: string, data?: unknown) => void
  /** 记录 warn 日志 */
  warn: (message: string, data?: unknown) => void
  /** 记录 error 日志 */
  error: (message: string, error?: Error | unknown, data?: unknown) => void
  /** 记录 fatal 日志 */
  fatal: (message: string, error?: Error | unknown, data?: unknown) => void
  /** 创建带上下文的日志器 */
  withContext: (context: import('@ldesign/logger-core').LogContext) => ILogger
  /** 创建带标签的日志器 */
  withTags: (...tags: string[]) => ILogger
}

/**
 * useErrorTracking composable 返回类型
 */
export interface UseErrorTrackingReturn {
  /** 捕获错误 */
  captureError: (error: Error, extra?: Record<string, unknown>) => void
  /** 捕获消息 */
  captureMessage: (message: string, extra?: Record<string, unknown>) => void
  /** 添加面包屑 */
  addBreadcrumb: (breadcrumb: Omit<import('@ldesign/logger-core').Breadcrumb, 'timestamp'>) => void
  /** 获取面包屑 */
  getBreadcrumbs: () => import('@ldesign/logger-core').Breadcrumb[]
  /** 清空面包屑 */
  clearBreadcrumbs: () => void
}

/**
 * usePerformance composable 返回类型
 */
export interface UsePerformanceReturn {
  /** 启动计时器 */
  startTimer: (name: string) => import('@ldesign/logger-core').Timer
  /** 记录计时 */
  timing: (name: string, duration: number) => void
  /** 增加计数器 */
  increment: (name: string, value?: number) => void
  /** 设置仪表值 */
  gauge: (name: string, value: number) => void
  /** 获取性能报告 */
  getReport: () => Record<string, unknown>
}

/**
 * 错误边界 props
 */
export interface ErrorBoundaryProps {
  /** 错误回调 */
  onError?: (error: Error, info: { componentStack: string }) => void
  /** 是否捕获错误 */
  captureError?: boolean
  /** 回退组件 */
  fallback?: unknown
}

/**
 * 声明 Vue 全局属性
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $logger: VueLogger
  }
}

