import type { LogEntry } from '../types'

/**
 * 日志过滤器接口
 * 
 * 过滤器用于在日志记录前进行条件判断，决定是否应该记录该日志
 * 
 * 工作原理：
 * - Logger 在分发日志到传输器前，会先调用所有过滤器
 * - 所有过滤器都返回 true，日志才会被记录
 * - 任一过滤器返回 false，日志将被丢弃
 * 
 * 使用场景：
 * - 级别过滤：只记录特定级别的日志
 * - 标签过滤：只记录包含特定标签的日志
 * - 模式过滤：只记录匹配特定模式的日志
 * - 组合过滤：组合多个过滤器实现复杂规则
 * 
 * 实现建议：
 * - 过滤器应该快速返回，避免阻塞日志流程
 * - 过滤器应该无副作用，不修改日志条目
 * - 过滤器应该是纯函数，相同输入总是返回相同结果
 * 
 * @example
 * ```ts
 * class CustomFilter implements LogFilter {
 *   name = 'custom'
 *   
 *   filter(entry: LogEntry): boolean {
 *     // 只记录包含 userId 的日志
 *     return entry.userId !== undefined
 *   }
 * }
 * 
 * logger.addFilter(new CustomFilter())
 * ```
 */
export interface LogFilter {
  /**
   * 过滤器名称
   * 
   * 唯一标识符，用于添加/移除过滤器
   */
  name: string

  /**
   * 检查日志是否应该被记录
   * 
   * @param entry - 日志条目
   * @returns true 表示通过过滤（记录日志），false 表示过滤掉（丢弃日志）
   */
  filter(entry: LogEntry): boolean
}




