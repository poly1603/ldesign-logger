/**
 * 计时器
 * @description 用于测量代码执行时间
 */

import type { Timer } from '../types'

/**
 * 计时器实现
 * @description 提供简单的计时功能
 * @example
 * ```ts
 * const timer = new PerformanceTimer('api-call')
 *
 * // 执行一些操作...
 * await fetchData()
 *
 * const duration = timer.end()
 * console.log(`API 调用耗时: ${duration}ms`)
 * ```
 */
export class PerformanceTimer implements Timer {
  /** 计时器名称 */
  readonly name: string
  /** 开始时间 */
  private startTime: number
  /** 是否已结束 */
  private ended = false
  /** 回调函数 */
  private onEnd?: (duration: number, name: string) => void

  /**
   * 创建计时器
   * @param name - 计时器名称
   * @param onEnd - 结束时的回调函数
   */
  constructor(name: string, onEnd?: (duration: number, name: string) => void) {
    this.name = name
    this.startTime = performance.now()
    this.onEnd = onEnd
  }

  /**
   * 结束计时并返回持续时间
   * @returns 持续时间（毫秒）
   */
  end(): number {
    if (this.ended) {
      return 0
    }

    this.ended = true
    const duration = performance.now() - this.startTime

    if (this.onEnd) {
      this.onEnd(duration, this.name)
    }

    return duration
  }

  /**
   * 取消计时
   */
  cancel(): void {
    this.ended = true
  }

  /**
   * 获取当前已用时间
   * @returns 已用时间（毫秒）
   */
  elapsed(): number {
    if (this.ended) {
      return 0
    }
    return performance.now() - this.startTime
  }
}

/**
 * 创建计时器
 * @param name - 计时器名称
 * @param onEnd - 结束时的回调函数
 * @returns 计时器实例
 */
export function createTimer(name: string, onEnd?: (duration: number, name: string) => void): Timer {
  return new PerformanceTimer(name, onEnd)
}

/**
 * 测量函数执行时间
 * @description 测量同步函数的执行时间
 * @param name - 测量名称
 * @param fn - 要测量的函数
 * @returns 函数返回值和执行时间
 * @example
 * ```ts
 * const { result, duration } = measure('calculation', () => {
 *   return heavyCalculation()
 * })
 * ```
 */
export function measure<T>(name: string, fn: () => T): { result: T, duration: number } {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start

  return { result, duration }
}

/**
 * 测量异步函数执行时间
 * @description 测量异步函数的执行时间
 * @param name - 测量名称
 * @param fn - 要测量的异步函数
 * @returns 函数返回值和执行时间
 * @example
 * ```ts
 * const { result, duration } = await measureAsync('api-call', async () => {
 *   return await fetchData()
 * })
 * ```
 */
export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{ result: T, duration: number }> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start

  return { result, duration }
}

