/**
 * 生产环境配置示例
 */

import {
  createLogger,
  createConsoleTransport,
  createStorageTransport,
  createHttpTransport,
  LogLevel,
} from '@ldesign/logger'
import { isProduction } from '@ldesign/logger'

// 生产环境配置
const logger = createLogger({
  name: 'app',
  // 生产环境只记录 INFO 及以上
  level: isProduction() ? LogLevel.INFO : LogLevel.DEBUG,
  // 自动禁用生产环境的 debug/trace
  disableDebugInProduction: true,
  transports: [
    // Console - 开发环境彩色，生产环境简洁
    createConsoleTransport({
      level: isProduction() ? LogLevel.WARN : LogLevel.DEBUG,
      colors: !isProduction(),
      timestamp: true,
    }),

    // Storage - 只在浏览器环境
    createStorageTransport({
      level: LogLevel.INFO,
      maxLogs: 1000,
      storageType: 'indexedDB',
    }),

    // HTTP - 只上报错误
    createHttpTransport({
      level: LogLevel.ERROR,
      url: 'https://api.example.com/logs',
      batchSize: 20,
      batchInterval: 10000,
      timeout: 5000,
      retryCount: 3,
      headers: {
        'X-API-Key': 'your-api-key',
      },
    }),
  ],
})

// 全局错误处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'promise',
    })
  })
}

// 应用关闭时刷新日志
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', async () => {
    await logger.flush()
  })
}

// 使用
logger.info('Application started', {
  version: '1.0.0',
  environment: isProduction() ? 'production' : 'development',
})

logger.debug('This will only show in development')
logger.info('This will show in both environments')
logger.error('This will be sent to the server', new Error('Critical error'))

export default logger




