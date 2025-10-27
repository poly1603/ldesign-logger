# 核心概念

了解 `@ldesign/logger` 的核心概念，可以帮助你更好地使用这个日志系统。

## 日志级别

日志级别用于区分日志的重要程度，从低到高依次为：

| 级别 | 值 | 用途 |
|------|---|------|
| `DEBUG` | 0 | 详细的调试信息，仅在开发环境使用 |
| `INFO` | 1 | 一般信息性消息 |
| `WARN` | 2 | 警告信息，表示可能出现问题 |
| `ERROR` | 3 | 错误信息，表示发生了错误但应用可以继续运行 |
| `FATAL` | 4 | 致命错误，表示应用无法继续运行 |

### 级别过滤

设置日志级别后，只有该级别及以上的日志会被记录：

```typescript
const logger = createLogger({ level: 'warn' })

logger.debug('不会被记录')
logger.info('不会被记录')
logger.warn('会被记录')
logger.error('会被记录')
logger.fatal('会被记录')
```

## 日志记录

### LogEntry

每条日志都是一个 `LogEntry` 对象，包含以下属性：

```typescript
interface LogEntry {
  level: LogLevel           // 日志级别
  message: string          // 日志消息
  timestamp: number        // 时间戳
  data?: any              // 附加数据
  tags?: string[]         // 标签
  context?: LogContext    // 上下文信息
  metadata?: Metadata     // 元数据（如文件名、行号等）
}
```

### 记录日志

```typescript
// 简单消息
logger.info('用户登录')

// 带附加数据
logger.info('用户登录', { userId: '123', ip: '192.168.1.1' })

// 带错误对象
logger.error('请求失败', { error: new Error('网络错误') })

// 带标签
logger.info('数据库查询', { query: 'SELECT * FROM users' }, ['database', 'slow-query'])
```

## 传输器（Transports）

传输器决定日志的输出位置和方式。

### 内置传输器

#### ConsoleTransport

输出到浏览器控制台或 Node.js 终端：

```typescript
import { ConsoleTransport } from '@ldesign/logger'

new ConsoleTransport({
  level: 'debug',           // 传输器自己的级别过滤
  formatter: new TextFormatter()
})
```

#### HttpTransport

通过 HTTP 发送日志到服务器：

```typescript
import { HttpTransport } from '@ldesign/logger'

new HttpTransport({
  url: 'https://api.example.com/logs',
  method: 'POST',
  batchSize: 10,           // 批量发送，每次 10 条
  flushInterval: 5000,     // 5 秒自动刷新
  headers: {
    'Authorization': 'Bearer token'
  }
})
```

#### StorageTransport

保存到本地存储（localStorage、sessionStorage、IndexedDB）：

```typescript
import { StorageTransport } from '@ldesign/logger'

new StorageTransport({
  storage: window.localStorage,
  key: 'app-logs',
  maxSize: 1000,          // 最多保存 1000 条
  maxAge: 86400000        // 保存 24 小时
})
```

#### WebSocketTransport

通过 WebSocket 实时发送日志：

```typescript
import { WebSocketTransport } from '@ldesign/logger'

new WebSocketTransport({
  url: 'wss://api.example.com/logs',
  reconnect: true,
  reconnectInterval: 5000
})
```

### 自定义传输器

实现 `Transport` 接口创建自定义传输器：

```typescript
import { Transport, LogEntry } from '@ldesign/logger'

class MyTransport implements Transport {
  log(entry: LogEntry): void {
    // 自定义日志处理逻辑
    console.log('自定义输出:', entry)
  }

  flush?(): void {
    // 刷新缓冲区（可选）
  }

  destroy?(): void {
    // 清理资源（可选）
  }
}
```

## 格式化器（Formatters）

格式化器控制日志的输出格式。

### TextFormatter

人类可读的文本格式：

```typescript
import { TextFormatter } from '@ldesign/logger'

new TextFormatter({
  colorize: true,          // 彩色输出
  timestamp: true,         // 显示时间戳
  showLevel: true,         // 显示级别
  showTags: true,          // 显示标签
  template: '[{timestamp}] {level} {message}'
})
```

输出示例：
```
[2024-01-01 12:00:00] INFO 用户登录
[2024-01-01 12:00:01] ERROR 请求失败
```

### JsonFormatter

JSON 格式，适合机器处理：

```typescript
import { JsonFormatter } from '@ldesign/logger'

new JsonFormatter({
  pretty: false,           // 是否格式化
  includeStack: true       // 是否包含堆栈信息
})
```

输出示例：
```json
{"level":"info","message":"用户登录","timestamp":1704096000000,"data":{"userId":"123"}}
```

### CompactFormatter

紧凑格式，节省空间：

```typescript
import { CompactFormatter } from '@ldesign/logger'

new CompactFormatter()
```

输出示例：
```
INFO 用户登录 userId=123
```

### 自定义格式化器

```typescript
import { Formatter, LogEntry } from '@ldesign/logger'

class MyFormatter implements Formatter {
  format(entry: LogEntry): string {
    return `[${entry.level}] ${entry.message}`
  }
}
```

## 过滤器（Filters）

过滤器用于选择性地记录日志。

### LevelFilter

基于级别过滤：

```typescript
import { LevelFilter } from '@ldesign/logger'

new LevelFilter({
  minLevel: 'warn',        // 最低级别
  maxLevel: 'error'        // 最高级别（可选）
})
```

### TagFilter

基于标签过滤：

```typescript
import { TagFilter } from '@ldesign/logger'

new TagFilter({
  tags: ['api', 'database'],  // 必须包含的标签
  mode: 'any'                 // 'any' 或 'all'
})
```

### PatternFilter

基于消息模式过滤：

```typescript
import { PatternFilter } from '@ldesign/logger'

new PatternFilter({
  pattern: /error|fail/i,    // 正则表达式
  inverse: false             // 是否反向匹配
})
```

### CompositeFilter

组合多个过滤器：

```typescript
import { CompositeFilter, LevelFilter, TagFilter } from '@ldesign/logger'

new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: 'warn' }),
    new TagFilter({ tags: ['api'] })
  ],
  mode: 'all'  // 'all' 所有过滤器都通过，'any' 任一通过
})
```

### 自定义过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class MyFilter implements LogFilter {
  shouldLog(entry: LogEntry): boolean {
    // 自定义过滤逻辑
    return entry.message.includes('important')
  }
}
```

## 上下文（Context）

上下文用于在日志中附加额外的信息，如请求 ID、用户 ID 等。

### 全局上下文

对所有日志生效：

```typescript
logger.setContext({
  appVersion: '1.0.0',
  environment: 'production'
})

logger.info('用户登录')  // 自动包含 appVersion 和 environment
```

### 局部上下文

只在特定作用域内生效：

```typescript
logger.withContext({ requestId: 'abc123' }, () => {
  logger.info('处理请求')  // 包含 requestId
  
  // 嵌套上下文
  logger.withContext({ userId: '456' }, () => {
    logger.info('用户操作')  // 包含 requestId 和 userId
  })
})
```

### 异步上下文

支持异步操作：

```typescript
await logger.withContext({ requestId: 'abc123' }, async () => {
  logger.info('开始处理')
  
  await someAsyncOperation()
  
  logger.info('处理完成')  // 仍然包含 requestId
})
```

## 子日志器（Child Loggers）

子日志器继承父日志器的配置，但可以有自己的特定设置：

```typescript
const rootLogger = createLogger({ level: 'info' })

// 创建子日志器
const apiLogger = rootLogger.child({
  tags: ['api'],
  context: { module: 'api' }
})

const dbLogger = rootLogger.child({
  tags: ['database'],
  context: { module: 'database' }
})

// 子日志器使用
apiLogger.info('API 请求')    // 自动包含 'api' 标签
dbLogger.info('数据库查询')   // 自动包含 'database' 标签
```

## 缓冲（Buffering）

缓冲可以批量处理日志，提升性能：

```typescript
const logger = createLogger({
  level: 'info',
  buffer: {
    size: 100,            // 缓冲区大小
    flushInterval: 1000,  // 自动刷新间隔（毫秒）
    flushOnLevel: 'error' // 遇到此级别立即刷新
  }
})
```

### 手动刷新

```typescript
// 立即刷新所有缓冲的日志
logger.flush()
```

## 采样（Sampling）

采样用于减少日志量，特别是在高流量场景：

### 基础采样

```typescript
import { Sampler } from '@ldesign/logger'

const logger = createLogger({
  level: 'debug',
  sampler: new Sampler({
    rate: 0.1  // 只记录 10% 的日志
  })
})
```

### 级别采样

对不同级别使用不同的采样率：

```typescript
import { Sampler } from '@ldesign/logger'

const logger = createLogger({
  level: 'debug',
  sampler: new Sampler({
    rates: {
      debug: 0.01,  // debug 只记录 1%
      info: 0.1,    // info 记录 10%
      warn: 0.5,    // warn 记录 50%
      error: 1.0,   // error 全部记录
      fatal: 1.0    // fatal 全部记录
    }
  })
})
```

## 限流（Rate Limiting）

防止日志爆炸：

```typescript
import { RateLimiter } from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  rateLimiter: new RateLimiter({
    maxLogs: 100,      // 最多 100 条
    timeWindow: 1000,  // 1 秒内
    strategy: 'drop'   // 'drop' 或 'queue'
  })
})
```

## 去重（Deduplication）

去除重复的日志：

```typescript
import { Deduplicator } from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  deduplicator: new Deduplicator({
    window: 5000,      // 5 秒内的重复日志
    maxCount: 3        // 最多允许 3 次重复
  })
})
```

## 统计（Stats）

实时统计日志信息：

```typescript
import { LogStats } from '@ldesign/logger'

const logger = createLogger({ level: 'info' })
const stats = new LogStats(logger)

// 获取统计
const statistics = stats.getStats()

console.log(statistics)
// {
//   total: 100,
//   byLevel: { debug: 10, info: 50, warn: 20, error: 15, fatal: 5 },
//   byTag: { api: 40, database: 30, frontend: 30 },
//   errors: 20,
//   ...
// }

// 重置统计
stats.reset()
```

## 查询（Query）

查询历史日志：

```typescript
import { LogQuery } from '@ldesign/logger'

const logger = createLogger({ level: 'info' })
const query = new LogQuery(logger)

// 链式查询
const results = query
  .level('error')                    // 错误级别
  .tags(['api'])                     // 包含 api 标签
  .message(/timeout/)                // 消息包含 timeout
  .timeRange(startTime, endTime)     // 时间范围
  .limit(10)                         // 最多 10 条
  .execute()                         // 执行查询
```

## 性能优化

### 对象池

自动复用日志对象，减少 GC 压力：

```typescript
const logger = createLogger({
  level: 'info',
  objectPool: {
    enabled: true,
    maxSize: 1000
  }
})
```

### 循环缓冲区

高效的内存管理：

```typescript
const logger = createLogger({
  level: 'info',
  circularBuffer: {
    enabled: true,
    size: 1000
  }
})
```

## 下一步

- [配置指南](/guide/configuration) - 详细的配置选项
- [最佳实践](/guide/best-practices) - 生产环境的最佳实践
- [API 文档](/api/logger) - 完整的 API 参考

