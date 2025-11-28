/**
 * 错误追踪器
 * @description 自动捕获和追踪各类错误
 */

import type { Breadcrumb, ErrorInfo, ILogger } from '../types'
import { BreadcrumbManager } from './breadcrumb'
import { parseStack } from './stack-parser'

/**
 * 错误追踪器配置
 */
export interface ErrorTrackerOptions {
  /** 关联的日志器 */
  logger?: ILogger
  /** 是否捕获未处理异常 */
  captureUnhandled?: boolean
  /** 是否捕获未处理的 Promise 拒绝 */
  captureUnhandledRejections?: boolean
  /** 是否捕获控制台错误 */
  captureConsoleErrors?: boolean
  /** 是否捕获资源加载错误 */
  captureResourceErrors?: boolean
  /** 最大面包屑数量 */
  maxBreadcrumbs?: number
  /** 错误回调 */
  onError?: (error: ErrorInfo) => void
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 错误追踪器
 * @description 提供全局错误捕获和追踪功能
 * @example
 * ```ts
 * const tracker = new ErrorTracker({
 *   logger,
 *   captureUnhandled: true,
 *   captureUnhandledRejections: true,
 * })
 *
 * tracker.start()
 *
 * // 手动捕获错误
 * tracker.captureError(new Error('Something went wrong'))
 * ```
 */
export class ErrorTracker {
  private options: Required<ErrorTrackerOptions>
  private breadcrumbs: BreadcrumbManager
  private originalOnError?: OnErrorEventHandler
  private originalOnUnhandledRejection?: ((event: PromiseRejectionEvent) => void)
  private isStarted = false

  constructor(options: ErrorTrackerOptions = {}) {
    this.options = {
      logger: options.logger as ILogger,
      captureUnhandled: options.captureUnhandled ?? true,
      captureUnhandledRejections: options.captureUnhandledRejections ?? true,
      captureConsoleErrors: options.captureConsoleErrors ?? false,
      captureResourceErrors: options.captureResourceErrors ?? true,
      maxBreadcrumbs: options.maxBreadcrumbs ?? 50,
      onError: options.onError ?? (() => {}),
      enabled: options.enabled ?? true,
    }

    this.breadcrumbs = new BreadcrumbManager(this.options.maxBreadcrumbs)
  }

  /**
   * 启动错误追踪
   */
  start(): void {
    if (this.isStarted || !this.options.enabled) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    this.isStarted = true

    // 捕获未处理异常
    if (this.options.captureUnhandled) {
      this.originalOnError = window.onerror
      window.onerror = (message, source, lineno, colno, error) => {
        this.handleWindowError(message, source, lineno, colno, error)
        return this.originalOnError?.(message, source, lineno, colno, error) ?? false
      }
    }

    // 捕获未处理的 Promise 拒绝
    if (this.options.captureUnhandledRejections) {
      this.originalOnUnhandledRejection = window.onunhandledrejection as any
      window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        this.handleUnhandledRejection(event)
        this.originalOnUnhandledRejection?.(event)
      }
    }

    // 捕获资源加载错误
    if (this.options.captureResourceErrors) {
      window.addEventListener('error', this.handleResourceError.bind(this), true)
    }
  }

  /**
   * 停止错误追踪
   */
  stop(): void {
    if (!this.isStarted) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    this.isStarted = false

    if (this.options.captureUnhandled && this.originalOnError) {
      window.onerror = this.originalOnError
    }

    if (this.options.captureUnhandledRejections && this.originalOnUnhandledRejection) {
      window.onunhandledrejection = this.originalOnUnhandledRejection as any
    }
  }

  /**
   * 手动捕获错误
   */
  captureError(error: Error, extra?: Record<string, unknown>): ErrorInfo {
    const errorInfo = this.createErrorInfo(error, 'custom', extra)
    this.reportError(errorInfo)
    return errorInfo
  }

  /**
   * 捕获消息
   */
  captureMessage(message: string, extra?: Record<string, unknown>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      name: 'Message',
      message,
      type: 'custom',
      breadcrumbs: this.breadcrumbs.getAll(),
      extra,
    }
    this.reportError(errorInfo)
    return errorInfo
  }

  /**
   * 添加面包屑
   */
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.breadcrumbs.add(breadcrumb)
  }

  /**
   * 获取所有面包屑
   */
  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.getAll()
  }

  /**
   * 清空面包屑
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs.clear()
  }

  /**
   * 处理 window.onerror
   * @private
   */
  private handleWindowError(
    message: string | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): void {
    const errorInfo = this.createErrorInfo(
      error || new Error(String(message)),
      'error',
      undefined,
      { filename: source, lineno, colno },
    )
    this.reportError(errorInfo)
  }

  /**
   * 处理未处理的 Promise 拒绝
   * @private
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason
    const error = reason instanceof Error ? reason : new Error(String(reason))
    const errorInfo = this.createErrorInfo(error, 'unhandledRejection')
    this.reportError(errorInfo)
  }

  /**
   * 处理资源加载错误
   * @private
   */
  private handleResourceError(event: ErrorEvent): void {
    const target = event.target as HTMLElement
    if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK' || target.tagName === 'IMG')) {
      const errorInfo: ErrorInfo = {
        name: 'ResourceError',
        message: `Failed to load ${target.tagName.toLowerCase()}: ${(target as HTMLScriptElement).src || (target as HTMLLinkElement).href}`,
        type: 'resourceError',
        source: target.tagName,
        breadcrumbs: this.breadcrumbs.getAll(),
      }
      this.reportError(errorInfo)
    }
  }

  /**
   * 创建错误信息
   * @private
   */
  private createErrorInfo(
    error: Error,
    type: ErrorInfo['type'],
    extra?: Record<string, unknown>,
    location?: ErrorInfo['location'],
  ): ErrorInfo {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      type,
      location: location || parseStack(error.stack),
      breadcrumbs: this.breadcrumbs.getAll(),
      extra,
    }
  }

  /**
   * 上报错误
   * @private
   */
  private reportError(errorInfo: ErrorInfo): void {
    // 调用回调
    this.options.onError(errorInfo)

    // 记录到日志器
    if (this.options.logger) {
      this.options.logger.error(errorInfo.message, new Error(errorInfo.message), {
        errorInfo,
      })
    }
  }
}

/**
 * 创建错误追踪器
 * @param options - 配置选项
 * @returns 错误追踪器实例
 */
export function createErrorTracker(options?: ErrorTrackerOptions): ErrorTracker {
  return new ErrorTracker(options)
}

