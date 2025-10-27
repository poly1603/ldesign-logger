# 生产环境配置

展示生产环境的最佳配置实践。

## 完整配置

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  TextFormatter,
  JsonFormatter,
  LevelFilter,
  Sampler,
  RateLimiter,
  Deduplicator,
  LogLevel
} from '@ldesign/logger'

const logger = createLogger({
  name: 'production-app',
  level: LogLevel.INFO,
  
  transports: [
    // 控制台：只输出警告和错误
    new ConsoleTransport({
      level: LogLevel.WARN,
      formatter: new JsonFormatter()
    }),
    
    // HTTP：批量上传到日志服务器
    new HttpTransport({
      url: process.env.LOG_SERVER_URL,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LOG_API_KEY}`,
        'X-App-Version': process.env.APP_VERSION
      },
      batchSize: 20,
      flushInterval: 5000,
      timeout: 10000,
      retryCount: 3,
      formatter: new JsonFormatter()
    }),
    
    // 本地存储：错误日志备份
    new StorageTransport({
      level: LogLevel.ERROR,
      maxSize: 100,
      key: 'error-logs'
    })
  ],
  
  // 采样：减少日志量
  sampler: new Sampler({
    rates: {
      debug: 0,      // 不记录 debug
      info: 0.1,     // info 只记录 10%
      warn: 0.5,     // warn 记录 50%
      error: 1.0,    // error 全部记录
      fatal: 1.0     // fatal 全部记录
    }
  }),
  
  // 限流：防止日志爆炸
  rateLimiter: new RateLimiter({
    maxLogs: 100,
    timeWindow: 1000
  }),
  
  // 去重：避免重复日志
  deduplicator: new Deduplicator({
    window: 5000,
    maxCount: 3
  }),
  
  // 性能优化
  objectPool: {
    enabled: true,
    maxSize: 1000
  },
  
  circularBuffer: {
    enabled: true,
    size: 1000
  }
})
```

## 环境特定配置

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const isStaging = process.env.NODE_ENV === 'staging'
const isProduction = process.env.NODE_ENV === 'production'

const logger = createLogger({
  name: 'app',
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  
  transports: [
    // 开发环境：详细的控制台输出
    ...(isDevelopment ? [
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        formatter: new TextFormatter({ colorize: true })
      })
    ] : []),
    
    // 预发布环境：控制台 + HTTP
    ...(isStaging ? [
      new ConsoleTransport({ level: LogLevel.INFO }),
      new HttpTransport({
        url: process.env.STAGING_LOG_URL,
        level: LogLevel.INFO
      })
    ] : []),
    
    // 生产环境：HTTP + 本地备份
    ...(isProduction ? [
      new ConsoleTransport({ level: LogLevel.ERROR }),
      new HttpTransport({
        url: process.env.PROD_LOG_URL,
        level: LogLevel.WARN
      }),
      new StorageTransport({ level: LogLevel.ERROR })
    ] : [])
  ]
})
```

## 模块化日志

```typescript
// 主 Logger
const mainLogger = createLogger({
  name: 'app',
  level: LogLevel.INFO
})

// 模块专用 Logger
const apiLogger = mainLogger.child({
  name: 'api',
  defaultTags: ['api']
})

const dbLogger = mainLogger.child({
  name: 'database',
  defaultTags: ['database']
})

const authLogger = mainLogger.child({
  name: 'auth',
  defaultTags: ['auth', 'security']
})
```

## 监控和告警

```typescript
import { LogStats } from '@ldesign/logger'

const stats = new LogStats(logger)

// 每分钟检查错误率
setInterval(() => {
  const statistics = stats.getStats()
  const errorRate = statistics.total > 0
    ? (statistics.errors / statistics.total * 100).toFixed(2)
    : '0'
  
  // 错误率告警
  if (parseFloat(errorRate) > 5) {
    logger.warn('错误率过高', {
      errorRate: `${errorRate}%`,
      total: statistics.total,
      errors: statistics.errors
    })
    
    // 发送告警
    sendAlert({
      type: 'high_error_rate',
      rate: errorRate
    })
  }
  
  // 日志量告警
  if (statistics.total > 10000) {
    logger.warn('日志量过大', {
      total: statistics.total
    })
  }
}, 60000)
```

## 优雅关闭

```typescript
async function gracefulShutdown() {
  logger.info('应用关闭中')
  
  // 刷新所有日志
  await logger.flush()
  
  // 销毁 Logger
  await logger.destroy()
  
  logger.info('应用已关闭')
}

// 监听关闭信号
process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
```

## 相关文档

- [配置指南](/guide/configuration)
- [最佳实践](/guide/best-practices)

