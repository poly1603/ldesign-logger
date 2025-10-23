import type { LogEntry } from '../types'

/**
 * 日志过滤器接口
 */
export interface LogFilter {
  /**
   * 过滤器名称
   */
  name: string

  /**
   * 检查日志是否应该被记录
   * @returns true 表示通过过滤，false 表示过滤掉
   */
  filter(entry: LogEntry): boolean
}




