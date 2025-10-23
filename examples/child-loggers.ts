/**
 * 子 Logger 示例
 */

import { createLogger, createConsoleTransport, LogLevel } from '@ldesign/logger'

// 创建根 logger
const rootLogger = createLogger({
  name: 'app',
  level: LogLevel.DEBUG,
  defaultTags: ['production'],
  transports: [
    createConsoleTransport({
      colors: true,
    }),
  ],
})

rootLogger.info('Root logger initialized')

// 创建 API 模块的子 logger
const apiLogger = rootLogger.child({
  name: 'api',
  defaultTags: ['api'],
})

apiLogger.info('API module started') // [app.api] API module started

// 创建用户服务的子 logger
const userServiceLogger = apiLogger.child({
  name: 'user',
})

userServiceLogger.info('User service ready') // [app.api.user] User service ready
userServiceLogger.debug('Loading user data', { userId: '123' })

// 创建数据库模块的子 logger
const dbLogger = rootLogger.child({
  name: 'database',
  level: LogLevel.WARN, // 只记录警告及以上
})

dbLogger.debug('This won\'t be logged') // 被过滤掉
dbLogger.warn('Database connection slow') // 会被记录
dbLogger.error('Database connection failed', new Error('Connection timeout'))

// 每个子 logger 可以有独立的用户上下文
const user1Logger = rootLogger.child({
  name: 'session',
  userId: 'user-123',
  sessionId: 'session-abc',
})

const user2Logger = rootLogger.child({
  name: 'session',
  userId: 'user-456',
  sessionId: 'session-def',
})

user1Logger.info('User action')
user2Logger.info('User action')




