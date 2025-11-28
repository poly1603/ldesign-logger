/**
 * 面包屑管理器
 * @description 管理用户操作序列，用于错误追踪
 */

import type { Breadcrumb } from '../types'
import { CircularBuffer } from '../utils/circular-buffer'

/**
 * 面包屑管理器
 * @description 记录和管理用户操作序列
 * @example
 * ```ts
 * const manager = new BreadcrumbManager(50)
 *
 * manager.add({
 *   type: 'click',
 *   category: 'ui',
 *   message: '点击登录按钮',
 * })
 *
 * const all = manager.getAll()
 * ```
 */
export class BreadcrumbManager {
  private buffer: CircularBuffer<Breadcrumb>

  /**
   * 创建面包屑管理器
   * @param maxSize - 最大面包屑数量
   */
  constructor(maxSize: number = 50) {
    this.buffer = new CircularBuffer(maxSize)
  }

  /**
   * 添加面包屑
   * @param breadcrumb - 面包屑数据（不含时间戳）
   */
  add(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    this.buffer.push({
      ...breadcrumb,
      timestamp: Date.now(),
    })
  }

  /**
   * 添加导航面包屑
   * @param from - 来源路径
   * @param to - 目标路径
   */
  addNavigation(from: string, to: string): void {
    this.add({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated from ${from} to ${to}`,
      data: { from, to },
    })
  }

  /**
   * 添加点击面包屑
   * @param element - 元素描述
   * @param data - 附加数据
   */
  addClick(element: string, data?: Record<string, unknown>): void {
    this.add({
      type: 'click',
      category: 'ui',
      message: `Clicked on ${element}`,
      data,
    })
  }

  /**
   * 添加 HTTP 请求面包屑
   * @param method - 请求方法
   * @param url - 请求 URL
   * @param status - 响应状态码
   * @param duration - 请求耗时
   */
  addHttp(method: string, url: string, status?: number, duration?: number): void {
    this.add({
      type: 'http',
      category: 'xhr',
      message: `${method} ${url}`,
      data: { method, url, status, duration },
    })
  }

  /**
   * 添加控制台面包屑
   * @param level - 日志级别
   * @param message - 日志消息
   */
  addConsole(level: string, message: string): void {
    this.add({
      type: 'console',
      category: 'console',
      message: `[${level}] ${message}`,
      data: { level },
    })
  }

  /**
   * 添加自定义面包屑
   * @param category - 类别
   * @param message - 消息
   * @param data - 附加数据
   */
  addCustom(category: string, message: string, data?: Record<string, unknown>): void {
    this.add({
      type: 'custom',
      category,
      message,
      data,
    })
  }

  /**
   * 获取所有面包屑
   * @returns 面包屑数组
   */
  getAll(): Breadcrumb[] {
    return this.buffer.toArray()
  }

  /**
   * 获取最近的面包屑
   * @param count - 数量
   * @returns 面包屑数组
   */
  getLast(count: number): Breadcrumb[] {
    return this.buffer.getLast(count)
  }

  /**
   * 清空面包屑
   */
  clear(): void {
    this.buffer.clear()
  }

  /**
   * 获取面包屑数量
   */
  get length(): number {
    return this.buffer.length
  }
}

/**
 * 创建面包屑管理器
 * @param maxSize - 最大面包屑数量
 * @returns 面包屑管理器实例
 */
export function createBreadcrumbManager(maxSize?: number): BreadcrumbManager {
  return new BreadcrumbManager(maxSize)
}

