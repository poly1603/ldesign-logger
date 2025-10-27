/**
 * @ldesign/logger - 企业级日志系统
 * 
 * @packageDocumentation
 */

// 导出类型
export type * from './types'

// 导出核心
export { Logger, createLogger, LogBuffer, createLogBuffer } from './core'

// 导出传输器
export * from './transports'

// 导出格式化器
export * from './formatters'

// 导出过滤器
export * from './filters'

// 导出查询和导出
export * from './query'

// 导出采样和限流
export * from './sampling'

// 导出上下文管理
export * from './context'

// 导出统计分析
export * from './stats'

// 导出工具函数
export * from './utils'

// 创建默认 logger 实例
import { createLogger } from './core'
import { createConsoleTransport } from './transports'

/**
 * 默认 Logger 实例
 */
export const logger = createLogger({
  name: 'ldesign',
  transports: [createConsoleTransport()],
})

// 导出便捷方法
export const { trace, debug, info, warn, error, fatal } = logger






