/**
 * 基础使用示例
 */

import { createLogger, createConsoleTransport, LogLevel } from '@ldesign/logger'

// 创建 logger
const logger = createLogger({
  name: 'app',
  level: LogLevel.DEBUG,
  transports: [
    createConsoleTransport({
      colors: true,
      timestamp: true,
    }),
  ],
})

// 基础日志
logger.trace('This is a trace message')
logger.debug('This is a debug message')
logger.info('Application started')
logger.warn('This is a warning')
logger.error('An error occurred', new Error('Something went wrong'))
logger.fatal('Fatal error!', new Error('Critical failure'))

// 带数据的日志
logger.info('User logged in', { userId: '123', username: 'john' })

// 带标签的日志
const loggerWithTags = createLogger({
  name: 'app',
  defaultTags: ['auth', 'security'],
  transports: [createConsoleTransport()],
})

loggerWithTags.info('User authentication successful')

// 设置用户和会话
const userLogger = createLogger({
  name: 'app',
  userId: 'user-123',
  sessionId: 'session-abc',
  transports: [createConsoleTransport()],
})

userLogger.info('Action performed')




