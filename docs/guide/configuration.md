# 配置指南

本指南详细介绍 `@ldesign/logger` 的所有配置选项。

## 基础配置

### LoggerOptions

创建日志器时的配置选项：

```typescript
interface LoggerOptions {
  level?: LogLevel                    // 日志级别
  tags?: string[]                     // 默认标签
  context?: LogContext                // 默认上下文
  transports?: Transport[]            // 传输器列表
  formatters?: Formatter[]            // 格式化器列表
  filters?: LogFilter[]               // 过滤器列表
  buffer?: BufferOptions              // 缓冲配置
  sampler?: Sampler                   // 采样器
  rateLimiter?: RateLimiter          // 限流器
  deduplicator?: Deduplicator        // 去重器
  objectPool?: ObjectPoolOptions      // 对象池配置
  circularBuffer?: CircularBufferOptions  // 循环缓冲区配置
  enableConsole?: boolean             // 是否启用控制台输出
  environment?: 'browser' | 'node'    // 运行环境
}
```

### 示例

```typescript
import { createLogger } from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  tags: ['app'],
  enableConsole: true,
  buffer: {
    size: 100,
    flushInterval: 1000
  }
})
```

## 传输器配置

### ConsoleTransport

```typescript
interface ConsoleTransportOptions {
  level?: LogLevel           // 传输器的日志级别
  formatter?: Formatter      // 格式化器
  colors?: boolean           // 是否使用颜色
}
```

**示例：**

```typescript
import { ConsoleTransport, TextFormatter } from '@ldesign/logger'

new ConsoleTransport({
  level: 'debug',
  formatter: new TextFormatter({ colorize: true }),
  colors: true
})
```

### HttpTransport

```typescript
interface HttpTransportOptions {
  url: string                      // 服务器 URL
  method?: 'POST' | 'PUT'         // HTTP 方法
  headers?: Record<string, string> // 请求头
  batchSize?: number              // 批量大小
  flushInterval?: number          // 刷新间隔（毫秒）
  timeout?: number                // 超时时间
  retry?: RetryOptions            // 重试配置
  formatter?: Formatter           // 格式化器
  filter?: LogFilter              // 过滤器
}

interface RetryOptions {
  maxRetries?: number             // 最大重试次数
  retryDelay?: number             // 重试延迟
  backoff?: 'linear' | 'exponential'  // 退避策略
}
```

**示例：**

```typescript
import { HttpTransport } from '@ldesign/logger'

new HttpTransport({
  url: 'https://api.example.com/logs',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  batchSize: 20,
  flushInterval: 5000,
  timeout: 10000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    backoff: 'exponential'
  }
})
```

### StorageTransport

```typescript
interface StorageTransportOptions {
  storage: Storage               // 存储对象（localStorage/sessionStorage）
  key?: string                   // 存储键名
  maxSize?: number              // 最大存储条数
  maxAge?: number               // 最大存储时间（毫秒）
  serialize?: (entry: LogEntry) => string  // 序列化函数
  deserialize?: (data: string) => LogEntry // 反序列化函数
  formatter?: Formatter          // 格式化器
}
```

**示例：**

```typescript
import { StorageTransport } from '@ldesign/logger'

new StorageTransport({
  storage: window.localStorage,
  key: 'app-logs',
  maxSize: 1000,
  maxAge: 86400000,  // 24 小时
  serialize: (entry) => JSON.stringify(entry),
  deserialize: (data) => JSON.parse(data)
})
```

### WebSocketTransport

```typescript
interface WebSocketTransportOptions {
  url: string                    // WebSocket URL
  protocols?: string[]           // 协议
  reconnect?: boolean            // 是否自动重连
  reconnectInterval?: number     // 重连间隔
  maxReconnectAttempts?: number  // 最大重连次数
  formatter?: Formatter          // 格式化器
  filter?: LogFilter             // 过滤器
}
```

**示例：**

```typescript
import { WebSocketTransport } from '@ldesign/logger'

new WebSocketTransport({
  url: 'wss://api.example.com/logs',
  protocols: ['logger-v1'],
  reconnect: true,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10
})
```

## 格式化器配置

### TextFormatter

```typescript
interface TextFormatterOptions {
  colorize?: boolean             // 是否彩色输出
  timestamp?: boolean            // 是否显示时间戳
  showLevel?: boolean            // 是否显示级别
  showTags?: boolean             // 是否显示标签
  showContext?: boolean          // 是否显示上下文
  template?: string              // 自定义模板
  dateFormat?: string            // 日期格式
}
```

**模板变量：**
- `{timestamp}` - 时间戳
- `{level}` - 日志级别
- `{message}` - 日志消息
- `{tags}` - 标签列表
- `{data}` - 附加数据
- `{context}` - 上下文

**示例：**

```typescript
import { TextFormatter } from '@ldesign/logger'

new TextFormatter({
  colorize: true,
  timestamp: true,
  showLevel: true,
  showTags: true,
  template: '[{timestamp}] {level} [{tags}] {message}',
  dateFormat: 'yyyy-MM-dd HH:mm:ss'
})
```

### JsonFormatter

```typescript
interface JsonFormatterOptions {
  pretty?: boolean               // 是否格式化输出
  indent?: number               // 缩进空格数
  includeStack?: boolean        // 是否包含堆栈
  excludeFields?: string[]      // 排除字段
}
```

**示例：**

```typescript
import { JsonFormatter } from '@ldesign/logger'

new JsonFormatter({
  pretty: false,
  includeStack: true,
  excludeFields: ['metadata']
})
```

### CompactFormatter

```typescript
interface CompactFormatterOptions {
  separator?: string            // 字段分隔符
  kvSeparator?: string         // 键值分隔符
}
```

**示例：**

```typescript
import { CompactFormatter } from '@ldesign/logger'

new CompactFormatter({
  separator: ' ',
  kvSeparator: '='
})
```

## 过滤器配置

### LevelFilter

```typescript
interface LevelFilterOptions {
  minLevel?: LogLevel           // 最小级别
  maxLevel?: LogLevel           // 最大级别
}
```

**示例：**

```typescript
import { LevelFilter } from '@ldesign/logger'

new LevelFilter({
  minLevel: 'warn',
  maxLevel: 'fatal'
})
```

### TagFilter

```typescript
interface TagFilterOptions {
  tags: string[]                // 标签列表
  mode?: 'any' | 'all'         // 匹配模式
  inverse?: boolean             // 是否反向匹配
}
```

**示例：**

```typescript
import { TagFilter } from '@ldesign/logger'

// 包含任一标签
new TagFilter({
  tags: ['api', 'database'],
  mode: 'any'
})

// 必须包含所有标签
new TagFilter({
  tags: ['critical', 'production'],
  mode: 'all'
})

// 排除包含这些标签的日志
new TagFilter({
  tags: ['debug', 'verbose'],
  inverse: true
})
```

### PatternFilter

```typescript
interface PatternFilterOptions {
  pattern: RegExp | string      // 匹配模式
  field?: 'message' | 'data'    // 匹配字段
  inverse?: boolean             // 是否反向匹配
}
```

**示例：**

```typescript
import { PatternFilter } from '@ldesign/logger'

// 匹配包含 error 或 fail 的消息
new PatternFilter({
  pattern: /error|fail/i,
  field: 'message'
})

// 排除包含 test 的消息
new PatternFilter({
  pattern: /test/,
  inverse: true
})
```

### CompositeFilter

```typescript
interface CompositeFilterOptions {
  filters: LogFilter[]          // 过滤器列表
  mode: 'all' | 'any'          // 组合模式
}
```

**示例：**

```typescript
import { CompositeFilter, LevelFilter, TagFilter } from '@ldesign/logger'

// 所有过滤器都要通过
new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: 'warn' }),
    new TagFilter({ tags: ['production'] })
  ],
  mode: 'all'
})

// 任一过滤器通过即可
new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: 'error' }),
    new TagFilter({ tags: ['critical'] })
  ],
  mode: 'any'
})
```

## 缓冲配置

```typescript
interface BufferOptions {
  size: number                  // 缓冲区大小
  flushInterval?: number        // 自动刷新间隔（毫秒）
  flushOnLevel?: LogLevel      // 遇到此级别立即刷新
  flushOnExit?: boolean        // 退出时刷新
}
```

**示例：**

```typescript
const logger = createLogger({
  level: 'info',
  buffer: {
    size: 100,
    flushInterval: 1000,
    flushOnLevel: 'error',
    flushOnExit: true
  }
})
```

## 采样配置

```typescript
interface SamplerOptions {
  rate?: number                 // 全局采样率 (0-1)
  rates?: Partial<Record<LogLevel, number>>  // 按级别采样率
  algorithm?: 'random' | 'deterministic'     // 采样算法
}
```

**示例：**

```typescript
import { Sampler } from '@ldesign/logger'

// 全局采样率
new Sampler({
  rate: 0.1,  // 10%
  algorithm: 'random'
})

// 按级别采样
new Sampler({
  rates: {
    debug: 0.01,  // 1%
    info: 0.1,    // 10%
    warn: 0.5,    // 50%
    error: 1.0,   // 100%
    fatal: 1.0    // 100%
  }
})
```

## 限流配置

```typescript
interface RateLimiterOptions {
  maxLogs: number               // 最大日志数
  timeWindow: number            // 时间窗口（毫秒）
  strategy?: 'drop' | 'queue'   // 策略：丢弃或排队
  onLimit?: (entry: LogEntry) => void  // 达到限制时的回调
}
```

**示例：**

```typescript
import { RateLimiter } from '@ldesign/logger'

new RateLimiter({
  maxLogs: 100,
  timeWindow: 1000,  // 1 秒内最多 100 条
  strategy: 'drop',
  onLimit: (entry) => {
    console.warn('日志限流触发:', entry.message)
  }
})
```

## 去重配置

```typescript
interface DeduplicatorOptions {
  window: number                // 时间窗口（毫秒）
  maxCount?: number            // 最大重复次数
  keyFn?: (entry: LogEntry) => string  // 自定义键函数
}
```

**示例：**

```typescript
import { Deduplicator } from '@ldesign/logger'

new Deduplicator({
  window: 5000,      // 5 秒内
  maxCount: 3,       // 最多重复 3 次
  keyFn: (entry) => `${entry.level}:${entry.message}`
})
```

## 对象池配置

```typescript
interface ObjectPoolOptions {
  enabled?: boolean             // 是否启用
  maxSize?: number             // 最大池大小
  initialSize?: number         // 初始大小
}
```

**示例：**

```typescript
const logger = createLogger({
  level: 'info',
  objectPool: {
    enabled: true,
    maxSize: 1000,
    initialSize: 100
  }
})
```

## 循环缓冲区配置

```typescript
interface CircularBufferOptions {
  enabled?: boolean             // 是否启用
  size: number                 // 缓冲区大小
}
```

**示例：**

```typescript
const logger = createLogger({
  level: 'info',
  circularBuffer: {
    enabled: true,
    size: 1000
  }
})
```

## 环境特定配置

### 浏览器环境

```typescript
const logger = createLogger({
  level: 'info',
  environment: 'browser',
  transports: [
    new ConsoleTransport(),
    new StorageTransport({
      storage: window.localStorage
    }),
    new HttpTransport({
      url: 'https://api.example.com/logs'
    })
  ]
})
```

### Node.js 环境

```typescript
const logger = createLogger({
  level: 'info',
  environment: 'node',
  transports: [
    new ConsoleTransport(),
    new HttpTransport({
      url: 'https://api.example.com/logs'
    })
  ]
})
```

## 完整配置示例

### 开发环境

```typescript
import { createLogger, ConsoleTransport, TextFormatter } from '@ldesign/logger'

const logger = createLogger({
  level: 'debug',
  enableConsole: true,
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

### 生产环境

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  JsonFormatter,
  LevelFilter,
  Sampler,
  RateLimiter,
  Deduplicator
} from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  tags: ['production'],
  context: {
    appVersion: '1.0.0',
    environment: 'production'
  },
  transports: [
    new ConsoleTransport({
      formatter: new JsonFormatter(),
      level: 'warn'
    }),
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 20,
      flushInterval: 5000,
      formatter: new JsonFormatter(),
      retry: {
        maxRetries: 3,
        backoff: 'exponential'
      }
    }),
    new StorageTransport({
      storage: window.localStorage,
      key: 'error-logs',
      maxSize: 100,
      maxAge: 86400000
    })
  ],
  filters: [
    new LevelFilter({ minLevel: 'info' })
  ],
  buffer: {
    size: 100,
    flushInterval: 1000,
    flushOnLevel: 'error'
  },
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

## 动态配置

### 运行时修改级别

```typescript
// 修改日志级别
logger.setLevel('debug')

// 获取当前级别
const level = logger.getLevel()
```

### 动态添加传输器

```typescript
const transport = new HttpTransport({
  url: 'https://api.example.com/logs'
})

logger.addTransport(transport)
```

### 动态移除传输器

```typescript
logger.removeTransport(transport)
```

## 下一步

- [最佳实践](/guide/best-practices) - 生产环境的最佳实践
- [API 文档](/api/logger) - 完整的 API 参考
- [示例代码](/examples/production) - 生产环境配置示例

