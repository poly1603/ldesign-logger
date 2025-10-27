# 多传输器

展示如何同时使用多个传输器，将日志输出到不同的目标。

## 基础配置

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  LogLevel
} from '@ldesign/logger'

const logger = createLogger({
  name: 'multi-transport-app',
  level: LogLevel.DEBUG,
  transports: [
    // 控制台：所有日志
    new ConsoleTransport({
      level: LogLevel.DEBUG
    }),
    // HTTP：警告及以上
    new HttpTransport({
      url: 'https://api.example.com/logs',
      level: LogLevel.WARN
    }),
    // 本地存储：错误日志
    new StorageTransport({
      level: LogLevel.ERROR,
      maxSize: 100
    })
  ]
})

// 使用
logger.debug('调试信息')  // 只在控制台显示
logger.warn('警告信息')   // 控制台 + HTTP
logger.error('错误信息')  // 控制台 + HTTP + 本地存储
```

## 不同环境配置

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

const logger = createLogger({
  name: 'app',
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  transports: [
    // 开发环境：控制台
    ...(isDevelopment ? [
      new ConsoleTransport({
        level: LogLevel.DEBUG,
        colors: true,
        timestamp: true
      })
    ] : []),
    
    // 生产环境：HTTP + 存储
    ...(isProduction ? [
      new HttpTransport({
        url: process.env.LOG_SERVER_URL,
        level: LogLevel.WARN
      }),
      new StorageTransport({
        level: LogLevel.ERROR,
        maxSize: 100
      })
    ] : [])
  ]
})
```

## 分层传输

```typescript
const logger = createLogger({
  name: 'layered-app',
  level: LogLevel.DEBUG,
  transports: [
    // 第1层：实时显示（控制台）
    new ConsoleTransport({
      level: LogLevel.INFO
    }),
    
    // 第2层：实时上报（WebSocket）
    new WebSocketTransport({
      url: 'wss://api.example.com/logs',
      level: LogLevel.WARN
    }),
    
    // 第3层：批量上报（HTTP）
    new HttpTransport({
      url: 'https://api.example.com/logs',
      level: LogLevel.WARN,
      batchSize: 20,
      flushInterval: 5000
    }),
    
    // 第4层：本地备份（存储）
    new StorageTransport({
      level: LogLevel.ERROR,
      maxSize: 200
    })
  ]
})
```

## 动态管理

```typescript
const logger = createLogger({
  name: 'dynamic-app'
})

// 初始只有控制台
logger.addTransport(new ConsoleTransport())

// 运行时添加 HTTP 传输器
if (shouldEnableRemoteLogging()) {
  logger.addTransport(new HttpTransport({
    url: 'https://api.example.com/logs'
  }))
}

// 移除传输器
logger.removeTransport('console')
```

## 相关文档

- [Transports API](/api/transports)
- [配置指南](/guide/configuration)

