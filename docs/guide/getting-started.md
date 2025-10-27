# 快速开始

本指南将帮助你在几分钟内开始使用 `@ldesign/logger`。

## 安装

使用你喜欢的包管理器安装：

::: code-group

```bash [npm]
npm install @ldesign/logger
```

```bash [pnpm]
pnpm add @ldesign/logger
```

```bash [yarn]
yarn add @ldesign/logger
```

:::

## 基础使用

### 创建日志器

最简单的方式是使用 `createLogger` 函数：

```typescript
import { createLogger } from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  enableConsole: true
})
```

### 记录日志

日志器支持五个级别：`debug`、`info`、`warn`、`error`、`fatal`

```typescript
logger.debug('调试信息')
logger.info('普通信息')
logger.warn('警告信息')
logger.error('错误信息')
logger.fatal('致命错误')
```

### 记录附加数据

你可以传递额外的数据作为第二个参数：

```typescript
logger.info('用户登录', { 
  userId: '123', 
  username: 'admin',
  timestamp: Date.now()
})

logger.error('请求失败', { 
  error: new Error('网络错误'),
  url: '/api/users',
  method: 'GET'
})
```

## 配置选项

### 基础配置

```typescript
import { createLogger } from '@ldesign/logger'

const logger = createLogger({
  // 日志级别：只记录此级别及以上的日志
  level: 'info',
  
  // 是否启用控制台输出
  enableConsole: true,
  
  // 自定义标签
  tags: ['app', 'frontend']
})
```

### 使用传输器

传输器决定日志的输出位置：

```typescript
import { 
  createLogger, 
  ConsoleTransport,
  HttpTransport,
  StorageTransport
} from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  transports: [
    // 输出到控制台
    new ConsoleTransport(),
    
    // 发送到服务器
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 10,
      flushInterval: 5000
    }),
    
    // 保存到本地存储
    new StorageTransport({
      storage: window.localStorage,
      maxSize: 1000
    })
  ]
})
```

### 使用格式化器

格式化器控制日志的输出格式：

```typescript
import { 
  createLogger,
  ConsoleTransport,
  JsonFormatter,
  TextFormatter
} from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  transports: [
    new ConsoleTransport({
      formatter: new TextFormatter({
        colorize: true,
        timestamp: true
      })
    })
  ]
})
```

### 使用过滤器

过滤器可以选择性地记录日志：

```typescript
import { 
  createLogger,
  LevelFilter,
  TagFilter,
  PatternFilter
} from '@ldesign/logger'

const logger = createLogger({
  level: 'debug',
  filters: [
    // 只记录 warn 及以上级别
    new LevelFilter({ minLevel: 'warn' }),
    
    // 只记录包含特定标签的日志
    new TagFilter({ tags: ['api', 'database'] }),
    
    // 只记录匹配模式的日志
    new PatternFilter({ pattern: /error|fail/i })
  ]
})
```

## 子日志器

创建具有特定配置的子日志器：

```typescript
const logger = createLogger({ level: 'info' })

// 为不同模块创建子日志器
const apiLogger = logger.child({ tags: ['api'] })
const dbLogger = logger.child({ tags: ['database'] })

apiLogger.info('API 请求')    // 标签: ['api']
dbLogger.info('数据库查询')   // 标签: ['database']
```

## 上下文管理

使用上下文跟踪请求链路：

```typescript
import { createLogger } from '@ldesign/logger'

const logger = createLogger({ level: 'info' })

// 设置全局上下文
logger.setContext({
  appVersion: '1.0.0',
  environment: 'production'
})

// 在特定作用域中添加上下文
async function handleRequest(requestId: string) {
  logger.withContext({ requestId }, () => {
    logger.info('处理请求')  // 自动包含 requestId
    
    // 嵌套上下文
    logger.withContext({ userId: '123' }, () => {
      logger.info('用户操作')  // 包含 requestId 和 userId
    })
  })
}
```

## 性能优化

### 启用缓冲

使用缓冲可以批量处理日志，提升性能：

```typescript
const logger = createLogger({
  level: 'info',
  buffer: {
    size: 100,
    flushInterval: 1000
  }
})
```

### 使用采样

对高频日志进行采样：

```typescript
import { createLogger, Sampler } from '@ldesign/logger'

const logger = createLogger({
  level: 'debug',
  sampler: new Sampler({
    rate: 0.1  // 只记录 10% 的日志
  })
})
```

### 限流

防止日志爆炸：

```typescript
import { createLogger, RateLimiter } from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  rateLimiter: new RateLimiter({
    maxLogs: 100,      // 最多 100 条日志
    timeWindow: 1000   // 1 秒内
  })
})
```

## 错误处理

### 捕获异常

```typescript
try {
  // 业务代码
  throw new Error('业务异常')
} catch (error) {
  logger.error('操作失败', { error })
}
```

### 全局错误处理

```typescript
// 捕获未处理的异常
window.addEventListener('error', (event) => {
  logger.fatal('未捕获的错误', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error('未处理的 Promise 拒绝', {
    reason: event.reason,
    promise: event.promise
  })
})
```

## 日志查询

查询历史日志：

```typescript
import { createLogger, LogQuery } from '@ldesign/logger'

const logger = createLogger({ level: 'info' })
const query = new LogQuery(logger)

// 查询最近的错误日志
const errorLogs = query
  .level('error')
  .last(10)
  .execute()

// 按时间范围查询
const recentLogs = query
  .timeRange(Date.now() - 3600000, Date.now())
  .execute()

// 按内容搜索
const searchResults = query
  .message(/登录/)
  .execute()
```

## 统计信息

获取日志统计：

```typescript
import { createLogger, LogStats } from '@ldesign/logger'

const logger = createLogger({ level: 'info' })
const stats = new LogStats(logger)

// 获取统计信息
const statistics = stats.getStats()

console.log('总日志数:', statistics.total)
console.log('错误数:', statistics.errors)
console.log('级别分布:', statistics.byLevel)
console.log('标签分布:', statistics.byTag)
```

## 下一步

- [核心概念](/guide/concepts) - 深入了解日志系统的核心概念
- [配置指南](/guide/configuration) - 详细的配置选项说明
- [最佳实践](/guide/best-practices) - 生产环境的最佳实践
- [API 文档](/api/logger) - 完整的 API 参考

