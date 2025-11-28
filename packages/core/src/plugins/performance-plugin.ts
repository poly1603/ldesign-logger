/**
 * 性能监控插件
 * @description 自动收集性能指标并记录到日志
 */

import type { ILogger, LogEntry, LoggerPlugin, Timer } from '../types'
import { PerformanceMonitor } from '../performance/performance-monitor'

/**
 * 性能插件配置
 */
export interface PerformancePluginOptions {
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
  /** 定期报告间隔（毫秒），0 表示禁用 */
  reportInterval?: number
}

/**
 * 性能监控插件
 * @description 集成性能监控功能到日志器
 * @example
 * ```ts
 * const plugin = new PerformancePlugin({
 *   collectNavigation: true,
 *   collectLongTasks: true,
 *   reportInterval: 60000, // 每分钟报告一次
 * })
 *
 * logger.use(plugin)
 *
 * // 使用计时器
 * const timer = plugin.startTimer('api-call')
 * await fetchData()
 * timer.end()
 * ```
 */
export class PerformancePlugin implements LoggerPlugin {
  readonly name = 'performance'

  private options: Required<PerformancePluginOptions>
  private logger?: ILogger
  private monitor?: PerformanceMonitor
  private reportTimer?: ReturnType<typeof setInterval>

  constructor(options: PerformancePluginOptions = {}) {
    this.options = {
      collectNavigation: options.collectNavigation ?? true,
      collectResources: options.collectResources ?? false,
      collectLongTasks: options.collectLongTasks ?? true,
      longTaskThreshold: options.longTaskThreshold ?? 50,
      autoLog: options.autoLog ?? true,
      reportInterval: options.reportInterval ?? 0,
    }
  }

  /**
   * 初始化插件
   */
  init(logger: ILogger): void {
    this.logger = logger

    this.monitor = new PerformanceMonitor({
      logger,
      collectNavigation: this.options.collectNavigation,
      collectResources: this.options.collectResources,
      collectLongTasks: this.options.collectLongTasks,
      longTaskThreshold: this.options.longTaskThreshold,
      autoLog: this.options.autoLog,
    })

    this.monitor.start()

    // 设置定期报告
    if (this.options.reportInterval > 0) {
      this.reportTimer = setInterval(() => {
        this.report()
      }, this.options.reportInterval)
    }
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
      this.reportTimer = undefined
    }

    this.monitor?.stop()
    this.monitor = undefined
    this.logger = undefined
  }

  /**
   * 日志后钩子 - 记录日志性能
   */
  afterLog(entry: LogEntry): void {
    // 可以在这里记录日志写入的性能指标
    this.monitor?.increment('logs.count')
  }

  /**
   * 启动计时器
   * @param name - 计时器名称
   * @returns 计时器实例
   */
  startTimer(name: string): Timer {
    if (!this.monitor) {
      throw new Error('PerformancePlugin 未初始化')
    }
    return this.monitor.startTimer(name)
  }

  /**
   * 记录计时
   * @param name - 指标名称
   * @param duration - 持续时间
   */
  timing(name: string, duration: number): void {
    this.monitor?.timing(name, duration)
  }

  /**
   * 增加计数器
   * @param name - 计数器名称
   * @param value - 增加的值
   */
  increment(name: string, value?: number): void {
    this.monitor?.increment(name, value)
  }

  /**
   * 设置仪表值
   * @param name - 仪表名称
   * @param value - 仪表值
   */
  gauge(name: string, value: number): void {
    this.monitor?.gauge(name, value)
  }

  /**
   * 获取性能报告
   */
  getReport(): Record<string, unknown> {
    return this.monitor?.getReport() ?? {}
  }

  /**
   * 输出性能报告
   */
  report(): void {
    if (this.logger && this.monitor) {
      this.logger.info('[Performance] Report', this.monitor.getReport())
    }
  }

  /**
   * 获取性能监控器
   */
  getMonitor(): PerformanceMonitor | undefined {
    return this.monitor
  }
}

/**
 * 创建性能插件
 * @param options - 配置选项
 * @returns 性能插件实例
 */
export function createPerformancePlugin(options?: PerformancePluginOptions): PerformancePlugin {
  return new PerformancePlugin(options)
}

