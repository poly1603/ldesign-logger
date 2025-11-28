/**
 * 性能指标收集器
 * @description 收集和管理性能指标数据
 */

import type { PerformanceMetrics } from '../types'
import { CircularBuffer } from '../utils/circular-buffer'

/**
 * 性能指标收集器
 * @description 管理计时、计数和仪表盘指标
 * @example
 * ```ts
 * const collector = new MetricsCollector()
 *
 * // 记录计时指标
 * collector.timing('api.response', 150)
 *
 * // 增加计数器
 * collector.increment('api.requests')
 *
 * // 设置仪表值
 * collector.gauge('memory.usage', 75)
 * ```
 */
export class MetricsCollector {
  private metrics: CircularBuffer<PerformanceMetrics>
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()

  /**
   * 创建指标收集器
   * @param maxMetrics - 最大指标数量
   */
  constructor(maxMetrics: number = 1000) {
    this.metrics = new CircularBuffer(maxMetrics)
  }

  /**
   * 记录计时指标
   * @param name - 指标名称
   * @param duration - 持续时间（毫秒）
   * @param data - 附加数据
   */
  timing(name: string, duration: number, data?: Record<string, unknown>): void {
    const now = Date.now()
    this.metrics.push({
      name,
      type: 'timing',
      startTime: now - duration,
      endTime: now,
      duration,
      value: duration,
      data,
    })
  }

  /**
   * 增加计数器
   * @param name - 计数器名称
   * @param value - 增加的值，默认为 1
   */
  increment(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)

    this.metrics.push({
      name,
      type: 'counter',
      startTime: Date.now(),
      value: current + value,
    })
  }

  /**
   * 减少计数器
   * @param name - 计数器名称
   * @param value - 减少的值，默认为 1
   */
  decrement(name: string, value: number = 1): void {
    this.increment(name, -value)
  }

  /**
   * 设置仪表值
   * @param name - 仪表名称
   * @param value - 仪表值
   */
  gauge(name: string, value: number): void {
    this.gauges.set(name, value)

    this.metrics.push({
      name,
      type: 'gauge',
      startTime: Date.now(),
      value,
    })
  }

  /**
   * 获取计数器值
   * @param name - 计数器名称
   * @returns 计数器值
   */
  getCounter(name: string): number {
    return this.counters.get(name) || 0
  }

  /**
   * 获取仪表值
   * @param name - 仪表名称
   * @returns 仪表值
   */
  getGauge(name: string): number | undefined {
    return this.gauges.get(name)
  }

  /**
   * 获取所有指标
   * @returns 指标数组
   */
  getAllMetrics(): PerformanceMetrics[] {
    return this.metrics.toArray()
  }

  /**
   * 获取指定名称的指标
   * @param name - 指标名称
   * @returns 指标数组
   */
  getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.name === name)
  }

  /**
   * 获取指标统计
   * @param name - 指标名称
   * @returns 统计信息
   */
  getStats(name: string): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
  } | null {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) {
      return null
    }

    const values = metrics.map(m => m.value ?? 0)
    const sum = values.reduce((a, b) => a + b, 0)

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  /**
   * 获取所有计数器
   * @returns 计数器映射
   */
  getAllCounters(): Map<string, number> {
    return new Map(this.counters)
  }

  /**
   * 获取所有仪表
   * @returns 仪表映射
   */
  getAllGauges(): Map<string, number> {
    return new Map(this.gauges)
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.metrics.clear()
    this.counters.clear()
    this.gauges.clear()
  }

  /**
   * 重置计数器
   * @param name - 计数器名称，不传则重置所有
   */
  resetCounter(name?: string): void {
    if (name) {
      this.counters.delete(name)
    }
    else {
      this.counters.clear()
    }
  }
}

/**
 * 创建指标收集器
 * @param maxMetrics - 最大指标数量
 * @returns 指标收集器实例
 */
export function createMetricsCollector(maxMetrics?: number): MetricsCollector {
  return new MetricsCollector(maxMetrics)
}

