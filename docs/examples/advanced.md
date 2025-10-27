# 高级用法

本页面展示 @ldesign/logger 的高级功能和使用技巧。

## 上下文管理

### 全局上下文

```typescript
logger.setContext({
  appVersion: '1.0.0',
  environment: 'production',
  region: 'us-west-1'
})

logger.info('用户操作')  // 自动包含上下文信息
```

### 局部上下文

```typescript
logger.withContext({ requestId: 'abc123' }, () => {
  logger.info('处理请求')  // 包含 requestId
  
  logger.withContext({ userId: '456' }, () => {
    logger.info('用户操作')  // 包含 requestId 和 userId
  })
})
```

### 异步上下文

```typescript
await logger.withContext({ requestId: 'abc123' }, async () => {
  logger.info('开始处理')
  await someAsyncOperation()
  logger.info('处理完成')  // 仍然包含 requestId
})
```

## 过滤器

### 级别过滤

```typescript
import { LevelFilter, LogLevel } from '@ldesign/logger'

logger.addFilter(new LevelFilter({
  minLevel: LogLevel.WARN
}))
```

### 标签过滤

```typescript
import { TagFilter } from '@ldesign/logger'

logger.addFilter(new TagFilter({
  tags: ['api', 'database'],
  mode: 'any'
}))
```

### 模式过滤

```typescript
import { PatternFilter } from '@ldesign/logger'

logger.addFilter(new PatternFilter({
  pattern: /error|fail/i
}))
```

### 组合过滤器

```typescript
import { CompositeFilter, LevelFilter, TagFilter, LogLevel } from '@ldesign/logger'

logger.addFilter(new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: LogLevel.WARN }),
    new TagFilter({ tags: ['critical'] })
  ],
  mode: 'any'
}))
```

## 采样和限流

### 采样器

```typescript
import { Sampler } from '@ldesign/logger'

const logger = createLogger({
  sampler: new Sampler({
    rates: {
      debug: 0.01,  // 1%
      info: 0.1,    // 10%
      warn: 0.5,    // 50%
      error: 1.0,   // 100%
      fatal: 1.0    // 100%
    }
  })
})
```

### 限流器

```typescript
import { RateLimiter } from '@ldesign/logger'

const logger = createLogger({
  rateLimiter: new RateLimiter({
    maxLogs: 100,
    timeWindow: 1000
  })
})
```

### 去重器

```typescript
import { Deduplicator } from '@ldesign/logger'

const logger = createLogger({
  deduplicator: new Deduplicator({
    window: 5000,
    maxCount: 3
  })
})
```

## 日志查询

```typescript
import { LogQuery } from '@ldesign/logger'

const query = new LogQuery(logger)

// 查询错误日志
const errorLogs = query
  .level('error')
  .timeRange(Date.now() - 3600000, Date.now())
  .limit(10)
  .execute()

// 自定义查询
const slowRequests = query
  .custom((entry) => entry.data?.duration > 1000)
  .execute()
```

## 统计分析

```typescript
import { LogStats } from '@ldesign/logger'

const stats = new LogStats(logger)

// 获取统计
const statistics = stats.getStats()

console.log('总日志数:', statistics.total)
console.log('错误数:', statistics.errors)
console.log('级别分布:', statistics.byLevel)
console.log('标签分布:', statistics.byTag)

// 监控错误率
setInterval(() => {
  const stats = logStats.getStats()
  const errorRate = stats.errors / stats.total
  
  if (errorRate > 0.1) {
    console.warn('错误率过高:', errorRate)
  }
}, 60000)
```

## 性能优化

### 对象池

```typescript
const logger = createLogger({
  objectPool: {
    enabled: true,
    maxSize: 1000
  }
})
```

### 循环缓冲区

```typescript
const logger = createLogger({
  circularBuffer: {
    enabled: true,
    size: 1000
  }
})
```

### 批量上传

```typescript
const logger = createLogger({
  transports: [
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 20,
      flushInterval: 5000
    })
  ],
  buffer: {
    size: 100,
    flushInterval: 1000
  }
})
```

## 自定义传输器

```typescript
import { LogTransport, LogEntry, LogLevel } from '@ldesign/logger'

class MyTransport implements LogTransport {
  name = 'my-transport'
  level = LogLevel.INFO
  enabled = true

  log(entry: LogEntry): void {
    // 自定义处理逻辑
    console.log('自定义传输:', entry)
  }

  async flush(): Promise<void> {
    // 刷新缓冲区
  }

  async destroy(): Promise<void> {
    // 清理资源
  }
}

logger.addTransport(new MyTransport())
```

## 自定义格式化器

```typescript
import { LogFormatter, LogEntry, LogLevelNames } from '@ldesign/logger'

class MyFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = LogLevelNames[entry.level]
    return `${timestamp} [${level}] ${entry.message}`
  }
}

// 使用
new ConsoleTransport({
  formatter: new MyFormatter()
})
```

## 自定义过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class MyFilter implements LogFilter {
  name = 'my-filter'
  
  filter(entry: LogEntry): boolean {
    // 自定义过滤逻辑
    return entry.message.includes('important')
  }
}

logger.addFilter(new MyFilter())
```

## 完整的生产环境配置

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
      formatter: new TextFormatter({ colorize: true })
    }),
    // HTTP：批量上传到服务器
    new HttpTransport({
      url: process.env.LOG_SERVER_URL,
      batchSize: 20,
      flushInterval: 5000,
      formatter: new JsonFormatter(),
      retry: {
        maxRetries: 3,
        backoff: 'exponential'
      }
    }),
    // 本地存储：错误日志备份
    new StorageTransport({
      level: LogLevel.ERROR,
      maxSize: 100
    })
  ],
  filters: [
    new LevelFilter({ minLevel: LogLevel.INFO })
  ],
  sampler: new Sampler({
    rates: {
      debug: 0,
      info: 0.1,
      warn: 0.5,
      error: 1.0,
      fatal: 1.0
    }
  }),
  rateLimiter: new RateLimiter({
    maxLogs: 100,
    timeWindow: 1000
  }),
  deduplicator: new Deduplicator({
    window: 5000,
    maxCount: 3
  }),
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

## 下一步

- [性能监控示例](/examples/performance) - 性能监控最佳实践
- [错误追踪示例](/examples/error-tracking) - 错误追踪和上报
- [生产环境配置](/examples/production) - 生产环境配置指南

