/**
 * 过滤器使用示例
 */

import {
  createLogger,
  createConsoleTransport,
  createLevelFilter,
  createTagFilter,
  createPatternFilter,
  createCompositeFilter,
  LogLevel,
} from '@ldesign/logger'

// 创建 logger
const logger = createLogger({
  name: 'app',
  level: LogLevel.TRACE,
  transports: [createConsoleTransport()],
})

// 示例 1: 级别过滤器 - 只记录 WARN 到 ERROR
console.log('=== Level Filter (WARN to ERROR) ===')
const levelFilter = createLevelFilter({
  minLevel: LogLevel.WARN,
  maxLevel: LogLevel.ERROR,
})

logger.addFilter(levelFilter)
logger.debug('This will be filtered out')
logger.info('This will be filtered out')
logger.warn('This will be logged')
logger.error('This will be logged')
logger.removeFilter('level')

// 示例 2: 标签过滤器 - 只记录带特定标签的日志
console.log('\n=== Tag Filter (security tag only) ===')
const tagFilter = createTagFilter({
  includeTags: ['security', 'auth'],
})

const taggedLogger = createLogger({
  name: 'app',
  transports: [createConsoleTransport()],
})

taggedLogger.addFilter(tagFilter)

const securityLogger = taggedLogger.child({
  name: 'security',
  defaultTags: ['security'],
})

const apiLogger = taggedLogger.child({
  name: 'api',
  defaultTags: ['api'],
})

securityLogger.info('Security event logged') // 会被记录
apiLogger.info('API call logged') // 会被过滤掉

// 示例 3: 模式过滤器 - 只记录包含特定文本的日志
console.log('\n=== Pattern Filter (SQL queries) ===')
const patternFilter = createPatternFilter({
  pattern: /SQL|database|query/i,
  field: 'message',
})

const dbLogger = createLogger({
  name: 'app',
  transports: [createConsoleTransport()],
})

dbLogger.addFilter(patternFilter)
dbLogger.info('Executing SQL query') // 会被记录
dbLogger.info('User logged in') // 会被过滤掉
dbLogger.info('Database connection established') // 会被记录

// 示例 4: 组合过滤器 - AND 操作
console.log('\n=== Composite Filter (AND) ===')
const compositeFilter = createCompositeFilter({
  operator: 'AND',
  filters: [
    createLevelFilter({ minLevel: LogLevel.WARN }),
    createTagFilter({ includeTags: ['critical'] }),
  ],
})

const criticalLogger = createLogger({
  name: 'app',
  defaultTags: ['critical'],
  transports: [createConsoleTransport()],
})

criticalLogger.addFilter(compositeFilter)
criticalLogger.info('Info message') // 过滤掉（级别不够）
criticalLogger.error('Critical error') // 会被记录（满足两个条件）

// 示例 5: 组合过滤器 - OR 操作
console.log('\n=== Composite Filter (OR) ===')
const orFilter = createCompositeFilter({
  operator: 'OR',
  filters: [
    createLevelFilter({ minLevel: LogLevel.ERROR }),
    createTagFilter({ includeTags: ['important'] }),
  ],
})

const flexibleLogger = createLogger({
  name: 'app',
  transports: [createConsoleTransport()],
})

flexibleLogger.addFilter(orFilter)

flexibleLogger.info('Regular info') // 过滤掉
flexibleLogger.error('Error message') // 记录（满足级别条件）

const importantLogger = flexibleLogger.child({
  name: 'important',
  defaultTags: ['important'],
})

importantLogger.info('Important info') // 记录（满足标签条件）




