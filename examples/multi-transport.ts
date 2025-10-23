/**
 * 多传输器示例
 */

import {
  createLogger,
  createConsoleTransport,
  createStorageTransport,
  createHttpTransport,
  LogLevel,
} from '@ldesign/logger'

// 创建多个传输器的 logger
const logger = createLogger({
  name: 'app',
  level: LogLevel.DEBUG,
  transports: [
    // Console 传输器 - 所有级别
    createConsoleTransport({
      level: LogLevel.DEBUG,
      colors: true,
    }),

    // Storage 传输器 - INFO 及以上
    createStorageTransport({
      level: LogLevel.INFO,
      maxLogs: 500,
      storageType: 'localStorage',
    }),

    // HTTP 传输器 - WARN 及以上
    createHttpTransport({
      level: LogLevel.WARN,
      url: 'https://api.example.com/logs',
      batchSize: 10,
      batchInterval: 5000,
    }),
  ],
})

// 测试不同级别的日志
logger.debug('Debug message - only in console')
logger.info('Info message - console + storage')
logger.warn('Warning - console + storage + HTTP')
logger.error('Error - all transports', new Error('Test error'))

// 动态添加/移除传输器
logger.removeTransport('http')
logger.info('HTTP transport removed')

// 刷新所有传输器
setTimeout(async () => {
  await logger.flush()
  console.log('All transports flushed')
}, 10000)




