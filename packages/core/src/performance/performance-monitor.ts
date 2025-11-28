/**
 * 性能监控器
 * @description 自动收集和监控性能指标
 */

import type { ILogger, Timer } from '../types'
import { MetricsCollector } from './metrics'
import { PerformanceTimer } from './timer'

/**
 * 性能监控器配置
 */
export interface PerformanceMonitorOptions {
  /** 关联的日志器 */
  logger?: ILogger
  /** 是否收集导航计时 */
  collectNavigation?: boolean
  /** 是否收集资源计时 */
  collectResources?: boolean
  /** 是否收集长任务 */
  collectLongTasks?: boolean
  /** 长任务阈值（毫秒） */
  longTaskThreshold?: number
  /** 是否自动记录性能日志 */
  autoLog?: boolean
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 性能监控器
 * @description 提供自动化的性能监控和指标收集
 * @example
 * ```ts
 * const monitor = new PerformanceMonitor({
 *   logger,
 *   collectNavigation: true,
 *   collectResources: true,
 * })
 *
 * monitor.start()
 *
 * // 手动计时
 * const timer = monitor.startTimer('api-call')
 * await fetchData()
 * timer.end() // 自动记录指标
 * ```
 */
export class PerformanceMonitor {
  private options: Required<PerformanceMonitorOptions>
  private metrics: MetricsCollector
  private isStarted = false
  private observer?: PerformanceObserver

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      logger: options.logger as ILogger,
      collectNavigation: options.collectNavigation ?? true,
      collectResources: options.collectResources ?? false,
      collectLongTasks: options.collectLongTasks ?? true,
      longTaskThreshold: options.longTaskThreshold ?? 50,
      autoLog: options.autoLog ?? true,
      enabled: options.enabled ?? true,
    }

    this.metrics = new MetricsCollector()
  }

  /**
   * 启动性能监控
   */
  start(): void {
    if (this.isStarted || !this.options.enabled) {
      return
    }

    if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
      return
    }

    this.isStarted = true

    // 收集导航计时
    if (this.options.collectNavigation) {
      this.collectNavigationTiming()
    }

    // 设置性能观察器
    this.setupObserver()
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    if (!this.isStarted) {
      return
    }

    this.isStarted = false
    this.observer?.disconnect()
    this.observer = undefined
  }

  /**
   * 启动计时器
   * @param name - 计时器名称
   * @returns 计时器实例
   */
  startTimer(name: string): Timer {
    return new PerformanceTimer(name, (duration, timerName) => {
      this.metrics.timing(timerName, duration)

      if (this.options.autoLog && this.options.logger) {
        this.options.logger.debug(`[Performance] ${timerName}: ${duration.toFixed(2)}ms`)
      }
    })
  }

  /**
   * 记录计时
   * @param name - 指标名称
   * @param duration - 持续时间
   */
  timing(name: string, duration: number): void {
    this.metrics.timing(name, duration)
  }

  /**
   * 增加计数器
   * @param name - 计数器名称
   * @param value - 增加的值
   */
  increment(name: string, value?: number): void {
    this.metrics.increment(name, value)
  }

  /**
   * 设置仪表值
   * @param name - 仪表名称
   * @param value - 仪表值
   */
  gauge(name: string, value: number): void {
    this.metrics.gauge(name, value)
  }

  /**
   * 获取指标收集器
   */
  getMetrics(): MetricsCollector {
    return this.metrics
  }

  /**
   * 获取性能报告
   */
  getReport(): Record<string, unknown> {
    const report: Record<string, unknown> = {
      timestamp: Date.now(),
      counters: Object.fromEntries(this.metrics.getAllCounters()),
      gauges: Object.fromEntries(this.metrics.getAllGauges()),
    }

    // 添加 Web Vitals（如果可用）
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        report.navigation = {
          dns: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcp: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.requestStart,
          download: navigation.responseEnd - navigation.responseStart,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          domComplete: navigation.domComplete - navigation.fetchStart,
          load: navigation.loadEventEnd - navigation.fetchStart,
        }
      }
    }

    return report
  }

  /**
   * 收集导航计时
   * @private
   */
  private collectNavigationTiming(): void {
    if (typeof window === 'undefined') {
      return
    }

    // 等待页面加载完成
    if (document.readyState === 'complete') {
      this.recordNavigationTiming()
    }
    else {
      window.addEventListener('load', () => {
        // 延迟一下确保计时完整
        setTimeout(() => this.recordNavigationTiming(), 0)
      })
    }
  }

  /**
   * 记录导航计时
   * @private
   */
  private recordNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (!navigation) {
      return
    }

    this.metrics.timing('navigation.dns', navigation.domainLookupEnd - navigation.domainLookupStart)
    this.metrics.timing('navigation.tcp', navigation.connectEnd - navigation.connectStart)
    this.metrics.timing('navigation.ttfb', navigation.responseStart - navigation.requestStart)
    this.metrics.timing('navigation.domInteractive', navigation.domInteractive - navigation.fetchStart)
    this.metrics.timing('navigation.domComplete', navigation.domComplete - navigation.fetchStart)
    this.metrics.timing('navigation.load', navigation.loadEventEnd - navigation.fetchStart)

    if (this.options.autoLog && this.options.logger) {
      this.options.logger.info('[Performance] Navigation timing recorded', this.getReport())
    }
  }

  /**
   * 设置性能观察器
   * @private
   */
  private setupObserver(): void {
    try {
      const entryTypes: string[] = []

      if (this.options.collectResources) {
        entryTypes.push('resource')
      }
      if (this.options.collectLongTasks) {
        entryTypes.push('longtask')
      }

      if (entryTypes.length === 0) {
        return
      }

      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry)
        }
      })

      this.observer.observe({ entryTypes })
    }
    catch {
      // PerformanceObserver 不支持某些 entryTypes
    }
  }

  /**
   * 处理性能条目
   * @private
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'resource') {
      this.metrics.timing(`resource.${entry.name}`, entry.duration)
    }
    else if (entry.entryType === 'longtask') {
      this.metrics.timing('longtask', entry.duration)
      this.metrics.increment('longtask.count')

      if (this.options.autoLog && this.options.logger) {
        this.options.logger.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`)
      }
    }
  }
}

/**
 * 创建性能监控器
 * @param options - 配置选项
 * @returns 性能监控器实例
 */
export function createPerformanceMonitor(options?: PerformanceMonitorOptions): PerformanceMonitor {
  return new PerformanceMonitor(options)
}

