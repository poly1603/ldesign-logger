# Logger API

Logger 是日志系统的核心类，负责日志的记录、过滤和分发。

## 创建 Logger

### createLogger(config?)

创建一个新的 Logger 实例。

**参数：**

- `config` (LoggerConfig, 可选) - Logger 配置选项

**返回值：**

- `ILogger` - Logger 实例

**示例：**

```typescript
import { createLogger, LogLevel } from '@ldesign/logger'

// 使用默认配置
const logger = createLogger()

// 自定义配置
const logger = createLogger({
  name: 'my-app',
  level: LogLevel.INFO,
  enabled: true
})
```

## LoggerConfig

Logger 配置选项接口。

```typescript
interface LoggerConfig {
  name?: string
  level?: LogLevel
  enabled?: boolean
  transports?: LogTransport[]
  disableDebugInProduction?: boolean
  userId?: string
  sessionId?: string
  defaultTags?: string[]
}
```

### 配置属性

#### name

- **类型：** `string`
- **默认值：** `'default'`
- **说明：** Logger 名称，用于标识日志来源

#### level

- **类型：** `LogLevel`
- **默认值：** `LogLevel.INFO` (2)
- **说明：** 最低日志级别，低于此级别的日志将被忽略

#### enabled

- **类型：** `boolean`
- **默认值：** `true`
- **说明：** 是否启用 Logger

#### transports

- **类型：** `LogTransport[]`
- **默认值：** `[]`
- **说明：** 日志传输器列表

#### disableDebugInProduction

- **类型：** `boolean`
- **默认值：** `true`
- **说明：** 是否在生产环境禁用 DEBUG 和 TRACE 级别日志

#### userId

- **类型：** `string`
- **可选**
- **说明：** 用户 ID，用于日志追踪

#### sessionId

- **类型：** `string`
- **可选**
- **说明：** 会话 ID，用于日志追踪

#### defaultTags

- **类型：** `string[]`
- **默认值：** `[]`
- **说明：** 默认标签列表

## 日志级别

### LogLevel 枚举

```typescript
enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}
```

级别从低到高：

- `TRACE` (0) - 最详细的调试信息
- `DEBUG` (1) - 调试信息
- `INFO` (2) - 一般信息
- `WARN` (3) - 警告信息
- `ERROR` (4) - 错误信息
- `FATAL` (5) - 致命错误

## 记录日志

### logger.trace(message, data?)

记录 TRACE 级别日志。

**参数：**

- `message` (string) - 日志消息
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
logger.trace('Function called', { 
  function: 'fetchData',
  params: { id: 123 }
})
```

### logger.debug(message, data?)

记录 DEBUG 级别日志。

**参数：**

- `message` (string) - 日志消息
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
logger.debug('User data loaded', { 
  userId: '123',
  count: 5
})
```

### logger.info(message, data?)

记录 INFO 级别日志。

**参数：**

- `message` (string) - 日志消息
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
logger.info('User logged in', { 
  username: 'john',
  ip: '192.168.1.1'
})
```

### logger.warn(message, data?)

记录 WARN 级别日志。

**参数：**

- `message` (string) - 日志消息
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
logger.warn('API rate limit approaching', { 
  usage: 95,
  limit: 100
})
```

### logger.error(message, error?, data?)

记录 ERROR 级别日志。

**参数：**

- `message` (string) - 日志消息
- `error` (Error, 可选) - 错误对象
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
try {
  await riskyOperation()
} catch (err) {
  logger.error('Operation failed', err, { 
    operation: 'riskyOperation'
  })
}
```

### logger.fatal(message, error?, data?)

记录 FATAL 级别日志。

**参数：**

- `message` (string) - 日志消息
- `error` (Error, 可选) - 错误对象
- `data` (any, 可选) - 附加数据

**示例：**

```typescript
logger.fatal('Database connection lost', error, { 
  dbHost: 'localhost',
  dbPort: 5432
})
```

### logger.log(level, message, data?, error?)

通用日志方法，可以指定任意日志级别。

**参数：**

- `level` (LogLevel) - 日志级别
- `message` (string) - 日志消息
- `data` (any, 可选) - 附加数据
- `error` (Error, 可选) - 错误对象

**示例：**

```typescript
logger.log(LogLevel.INFO, 'Custom log', { custom: 'data' })
```

## 子 Logger

### logger.child(config)

创建一个继承当前 Logger 配置的子 Logger。

**参数：**

- `config` (Partial<LoggerConfig>) - 子 Logger 配置，会覆盖父配置

**返回值：**

- `ILogger` - 新的 Logger 实例

**示例：**

```typescript
const logger = createLogger({ 
  name: 'app',
  level: LogLevel.INFO 
})

// 为不同模块创建子 Logger
const apiLogger = logger.child({ name: 'api' })
const dbLogger = logger.child({ name: 'database' })

apiLogger.info('Request received')  // [app.api] Request received
dbLogger.info('Query executed')     // [app.database] Query executed
```

## 传输器管理

### logger.addTransport(transport)

动态添加传输器。

**参数：**

- `transport` (LogTransport) - 传输器实例

**示例：**

```typescript
import { HttpTransport } from '@ldesign/logger'

const transport = new HttpTransport({
  url: 'https://api.example.com/logs'
})

logger.addTransport(transport)
```

### logger.removeTransport(name)

根据名称移除传输器。

**参数：**

- `name` (string) - 传输器名称

**示例：**

```typescript
logger.removeTransport('http')
```

## 过滤器管理

### logger.addFilter(filter)

动态添加过滤器。

**参数：**

- `filter` (LogFilter) - 过滤器实例

**示例：**

```typescript
import { LevelFilter } from '@ldesign/logger'

logger.addFilter(new LevelFilter({ minLevel: LogLevel.WARN }))
```

### logger.removeFilter(name)

根据名称移除过滤器。

**参数：**

- `name` (string) - 过滤器名称

**示例：**

```typescript
logger.removeFilter('level')
```

## 运行时配置

### logger.setLevel(level)

动态设置日志级别。

**参数：**

- `level` (LogLevel) - 新的日志级别

**示例：**

```typescript
// 开发环境显示所有日志
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.TRACE)
}

// 生产环境只显示警告和错误
if (process.env.NODE_ENV === 'production') {
  logger.setLevel(LogLevel.WARN)
}
```

### logger.enable()

启用 Logger。

**示例：**

```typescript
logger.enable()
```

### logger.disable()

禁用 Logger，禁用后所有日志都不会记录。

**示例：**

```typescript
logger.disable()
```

## 资源管理

### logger.flush()

刷新所有传输器的缓冲区。

**返回值：**

- `Promise<void>` - 所有传输器刷新完成后 resolve

**示例：**

```typescript
// 程序退出前刷新日志
process.on('exit', async () => {
  await logger.flush()
})
```

### logger.destroy()

销毁 Logger，刷新并销毁所有传输器，释放资源。

**返回值：**

- `Promise<void>` - 销毁完成后 resolve

**示例：**

```typescript
// 应用关闭时清理资源
await logger.destroy()
```

## LogEntry 接口

日志条目的数据结构。

```typescript
interface LogEntry {
  level: LogLevel         // 日志级别
  message: string        // 日志消息
  timestamp: number      // 时间戳（毫秒）
  source?: string        // 日志来源
  data?: any            // 附加数据
  error?: Error         // 错误对象
  stack?: string        // 堆栈跟踪
  userId?: string       // 用户 ID
  sessionId?: string    // 会话 ID
  tags?: string[]       // 标签列表
}
```

## 完整示例

```typescript
import { 
  createLogger,
  LogLevel,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  TextFormatter,
  LevelFilter
} from '@ldesign/logger'

// 创建 Logger
const logger = createLogger({
  name: 'my-app',
  level: LogLevel.DEBUG,
  userId: 'user-123',
  sessionId: 'session-456',
  defaultTags: ['production'],
  transports: [
    // 控制台输出
    new ConsoleTransport({
      formatter: new TextFormatter({ colorize: true })
    }),
    // HTTP 上传
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 10
    }),
    // 本地存储
    new StorageTransport({
      storage: window.localStorage,
      maxSize: 1000
    })
  ]
})

// 添加过滤器
logger.addFilter(new LevelFilter({ minLevel: LogLevel.INFO }))

// 记录日志
logger.info('应用启动', { version: '1.0.0' })
logger.warn('缓存未命中', { key: 'user-data' })
logger.error('请求失败', new Error('网络错误'), { url: '/api/users' })

// 创建子 Logger
const apiLogger = logger.child({ name: 'api' })
apiLogger.info('API 请求', { method: 'GET', path: '/users' })

// 程序退出前清理
process.on('exit', async () => {
  await logger.flush()
  await logger.destroy()
})
```

## 相关文档

- [Transports API](/api/transports) - 传输器 API 文档
- [Formatters API](/api/formatters) - 格式化器 API 文档
- [Filters API](/api/filters) - 过滤器 API 文档
- [快速开始](/guide/getting-started) - 快速开始指南
- [配置指南](/guide/configuration) - 详细配置说明

