/**
 * 日志统计和分析
 * 
 * 提供日志统计、分析和报告功能
 */

import type { LogEntry, LogLevel } from '../types'
import { LogLevelNames } from '../types'

/**
 * 日志统计数据
 */
export interface LogStatsData {
  /**
   * 总日志数
   */
  total: number

  /**
   * 按级别统计
   */
  byLevel: Record<string, number>

  /**
   * 按来源统计
   */
  bySource: Record<string, number>

  /**
   * 按标签统计
   */
  byTag: Record<string, number>

  /**
   * 错误统计
   */
  errors: {
    /** 总错误数（ERROR + FATAL） */
    total: number
    /** 按错误类型统计 */
    byType: Record<string, number>
  }

  /**
   * 时间范围
   */
  timeRange: {
    start: number
    end: number
    duration: number
  } | null

  /**
   * 性能统计（如果日志中包含性能数据）
   */
  performance?: {
    /** 平均耗时 */
    avgDuration: number
    /** 最小耗时 */
    minDuration: number
    /** 最大耗时 */
    maxDuration: number
    /** P50 耗时 */
    p50Duration: number
    /** P95 耗时 */
    p95Duration: number
    /** P99 耗时 */
    p99Duration: number
  }
}

/**
 * 日志统计器
 * 
 * 收集和分析日志数据，生成统计报告
 * 
 * 功能：
 * - 按级别、来源、标签统计日志数量
 * - 错误频率分析
 * - 性能指标统计（P50/P95/P99）
 * - 时间范围分析
 * 
 * 使用场景：
 * - 监控系统健康状况
 * - 分析错误趋势
 * - 性能瓶颈定位
 * - 生成统计报表
 * 
 * @example
 * ```ts
 * const stats = new LogStats()
 * 
 * // 收集日志
 * stats.collect(entry1)
 * stats.collect(entry2)
 * 
 * // 生成报告
 * const report = stats.getStats()
 * console.log(`总计: ${report.total}`)
 * console.log(`错误: ${report.errors.total}`)
 * ```
 */
export class LogStats {
  private logs: LogEntry[] = []
  private maxLogs: number

  /**
   * 构造函数
   * 
   * @param maxLogs - 最多保留的日志数量，默认 10000
   */
  constructor(maxLogs = 10000) {
    this.maxLogs = maxLogs
  }

  /**
   * 收集日志
   * 
   * @param entry - 日志条目
   */
  collect(entry: LogEntry): void {
    // 限制日志数量
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift()
    }

    this.logs.push(entry)
  }

  /**
   * 批量收集日志
   * 
   * @param entries - 日志条目数组
   */
  collectBatch(entries: LogEntry[]): void {
    for (const entry of entries) {
      this.collect(entry)
    }
  }

  /**
   * 生成统计数据
   * 
   * @param logs - 要统计的日志（可选，默认使用所有收集的日志）
   * @returns 统计数据
   */
  getStats(logs?: LogEntry[]): LogStatsData {
    const data = logs || this.logs

    const stats: LogStatsData = {
      total: data.length,
      byLevel: {},
      bySource: {},
      byTag: {},
      errors: {
        total: 0,
        byType: {},
      },
      timeRange: null,
    }

    if (data.length === 0) {
      return stats
    }

    let minTime = Infinity
    let maxTime = -Infinity
    const durations: number[] = []

    // 遍历所有日志
    for (const log of data) {
      // 统计级别
      const levelName = LogLevelNames[log.level]
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1

      // 统计来源
      if (log.source) {
        stats.bySource[log.source] = (stats.bySource[log.source] || 0) + 1
      }

      // 统计标签
      if (log.tags) {
        for (const tag of log.tags) {
          stats.byTag[tag] = (stats.byTag[tag] || 0) + 1
        }
      }

      // 统计错误
      if (log.level >= 4) { // ERROR or FATAL
        stats.errors.total++

        if (log.error) {
          const errorType = log.error.name || 'Unknown'
          stats.errors.byType[errorType] = (stats.errors.byType[errorType] || 0) + 1
        }
      }

      // 时间范围
      minTime = Math.min(minTime, log.timestamp)
      maxTime = Math.max(maxTime, log.timestamp)

      // 收集性能数据
      if (log.data && typeof log.data.duration === 'number') {
        durations.push(log.data.duration)
      }
    }

    // 时间范围
    stats.timeRange = {
      start: minTime,
      end: maxTime,
      duration: maxTime - minTime,
    }

    // 性能统计
    if (durations.length > 0) {
      durations.sort((a, b) => a - b)

      stats.performance = {
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p50Duration: this.percentile(durations, 50),
        p95Duration: this.percentile(durations, 95),
        p99Duration: this.percentile(durations, 99),
      }
    }

    return stats
  }

  /**
   * 计算百分位数
   * 
   * @param sortedArray - 已排序的数组
   * @param percentile - 百分位（0-100）
   * @returns 百分位值
   * 
   * @private
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1
    return sortedArray[Math.max(0, index)]
  }

  /**
   * 生成文本报告
   * 
   * @returns 格式化的文本报告
   */
  generateReport(): string {
    const stats = this.getStats()
    const lines: string[] = []

    lines.push('===== 日志统计报告 =====\n')

    // 总览
    lines.push(`总日志数: ${stats.total}`)

    if (stats.timeRange) {
      const startTime = new Date(stats.timeRange.start).toLocaleString()
      const endTime = new Date(stats.timeRange.end).toLocaleString()
      const duration = (stats.timeRange.duration / 1000).toFixed(2)
      lines.push(`时间范围: ${startTime} - ${endTime}`)
      lines.push(`持续时间: ${duration} 秒\n`)
    }

    // 按级别统计
    lines.push('按级别统计:')
    for (const [level, count] of Object.entries(stats.byLevel)) {
      const percentage = ((count / stats.total) * 100).toFixed(2)
      lines.push(`  ${level}: ${count} (${percentage}%)`)
    }
    lines.push('')

    // 错误统计
    if (stats.errors.total > 0) {
      lines.push(`错误统计: ${stats.errors.total}`)
      for (const [type, count] of Object.entries(stats.errors.byType)) {
        lines.push(`  ${type}: ${count}`)
      }
      lines.push('')
    }

    // 来源统计（Top 10）
    if (Object.keys(stats.bySource).length > 0) {
      lines.push('热门来源 (Top 10):')
      const topSources = Object.entries(stats.bySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      for (const [source, count] of topSources) {
        lines.push(`  ${source}: ${count}`)
      }
      lines.push('')
    }

    // 性能统计
    if (stats.performance) {
      const perf = stats.performance
      lines.push('性能统计:')
      lines.push(`  平均耗时: ${perf.avgDuration.toFixed(2)} ms`)
      lines.push(`  最小耗时: ${perf.minDuration.toFixed(2)} ms`)
      lines.push(`  最大耗时: ${perf.maxDuration.toFixed(2)} ms`)
      lines.push(`  P50: ${perf.p50Duration.toFixed(2)} ms`)
      lines.push(`  P95: ${perf.p95Duration.toFixed(2)} ms`)
      lines.push(`  P99: ${perf.p99Duration.toFixed(2)} ms`)
      lines.push('')
    }

    lines.push('========================')

    return lines.join('\n')
  }

  /**
   * 打印统计报告到控制台
   */
  printReport(): void {
    console.log(this.generateReport())
  }

  /**
   * 清空统计数据
   */
  clear(): void {
    this.logs = []
  }

  /**
   * 获取所有日志
   * 
   * @returns 日志数组（副本）
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 获取日志数量
   * 
   * @returns 日志数量
   */
  getLogCount(): number {
    return this.logs.length
  }
}

/**
 * 创建日志统计器
 * 
 * @param maxLogs - 最大保留日志数量
 * @returns LogStats 实例
 * 
 * @example
 * ```ts
 * const stats = createLogStats(10000)
 * 
 * // 收集日志
 * logger.addTransport({
 *   name: 'stats',
 *   level: LogLevel.TRACE,
 *   enabled: true,
 *   log: (entry) => stats.collect(entry)
 * })
 * 
 * // 定期生成报告
 * setInterval(() => {
 *   stats.printReport()
 * }, 60000)
 * ```
 */
export function createLogStats(maxLogs?: number): LogStats {
  return new LogStats(maxLogs)
}

