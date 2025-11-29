/**
 * @ldesign/logger-vue
 * @description Vue 框架专用的日志记录和错误追踪系统
 * @packageDocumentation
 */

// 类型导出
export * from './types'

// Vue 插件（直接使用）
export * from './plugin'

// 引擎插件（与其他包统一）
export * from './plugins'

// Composables
export * from './composables'

// 组件
export * from './components'

// 从 core 包重新导出常用类型和工具
export {
  // 类型
  LogLevel,
  type LogEntry,
  type LogContext,
  type LoggerOptions,
  type LogTransport,
  type LogFilter,
  type LoggerPlugin,
  type Timer,
  type Breadcrumb,
  type ErrorInfo,
  type PerformanceMetrics,

  // 传输器
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  createConsoleTransport,
  createHttpTransport,
  createStorageTransport,

  // 工具
  createSanitizer,
  formatLogAsText,
  formatLogAsJson,
} from '@ldesign/logger-core'

