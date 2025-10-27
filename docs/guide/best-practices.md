# 最佳实践

本指南总结了使用 `@ldesign/logger` 的最佳实践和常见模式。

## 日志级别使用

### 合理选择级别

不同级别的日志有不同的用途，应该合理使用：

```typescript
// ❌ 错误示例
logger.info('数据库连接失败')  // 应该用 error
logger.error('用户点击按钮')   // 应该用 debug 或 info

// ✅ 正确示例
logger.debug('用户点击按钮', { buttonId: 'submit' })
logger.info('用户登录成功', { userId: '123' })
logger.warn('API 响应缓慢', { duration: 3000 })
logger.error('数据库连接失败', { error })
logger.fatal('无法加载关键配置', { error })
```

### 级别指南

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| **DEBUG** | 详细的调试信息，仅开发环境 | 函数参数、变量值、执行流程 |
| **INFO** | 重要的业务流程信息 | 用户登录、订单创建、状态变更 |
| **WARN** | 潜在问题，但不影响主流程 | API 超时、缓存未命中、降级处理 |
| **ERROR** | 错误但应用可继续运行 | 请求失败、数据验证错误、第三方服务异常 |
| **FATAL** | 严重错误，应用无法继续 | 配置加载失败、数据库连接失败、关键服务不可用 |

## 开发环境 vs 生产环境

### 开发环境配置

```typescript
const logger = createLogger({
  level: 'debug',
  transports: [
    new ConsoleTransport({
      formatter: new TextFormatter({
        colorize: true,
        timestamp: true,
        showLevel: true,
        showTags: true
      })
    })
  ]
})
```

### 生产环境配置

```typescript
const logger = createLogger({
  level: 'info',
  transports: [
    // 控制台只输出警告及以上
    new ConsoleTransport({
      level: 'warn',
      formatter: new JsonFormatter()
    }),
    // 所有日志发送到服务器
    new HttpTransport({
      url: process.env.LOG_SERVER_URL,
      batchSize: 20,
      flushInterval: 5000
    }),
    // 错误日志保存到本地
    new StorageTransport({
      storage: window.localStorage,
      key: 'error-logs',
      maxSize: 100
    })
  ],
  // 生产环境采样
  sampler: new Sampler({
    rates: {
      debug: 0,
      info: 0.1,
      warn: 0.5,
      error: 1.0,
      fatal: 1.0
    }
  }),
  // 限流保护
  rateLimiter: new RateLimiter({
    maxLogs: 100,
    timeWindow: 1000
  })
})
```

### 环境检测

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

const logger = createLogger({
  level: isDevelopment ? 'debug' : 'info',
  enableConsole: isDevelopment,
  sampler: isDevelopment ? undefined : new Sampler({ rate: 0.1 })
})
```

## 结构化日志

### 使用一致的数据结构

```typescript
// ❌ 不一致的结构
logger.info('用户登录', { user: '123' })
logger.info('用户登出', { userId: '123' })

// ✅ 一致的结构
logger.info('用户登录', { userId: '123', action: 'login' })
logger.info('用户登出', { userId: '123', action: 'logout' })
```

### 使用有意义的字段名

```typescript
// ❌ 不清晰的字段名
logger.error('请求失败', { e: error, t: 3000, u: '/api/users' })

// ✅ 清晰的字段名
logger.error('请求失败', {
  error,
  duration: 3000,
  url: '/api/users',
  method: 'GET',
  statusCode: 500
})
```

## 错误处理

### 记录错误对象

```typescript
// ❌ 只记录错误消息
try {
  await fetchData()
} catch (error) {
  logger.error(error.message)
}

// ✅ 记录完整的错误对象
try {
  await fetchData()
} catch (error) {
  logger.error('数据获取失败', {
    error,
    url: '/api/data',
    userId: currentUser.id
  })
}
```

### 全局错误捕获

```typescript
// 浏览器环境
window.addEventListener('error', (event) => {
  logger.fatal('未捕获的错误', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('未处理的 Promise 拒绝', {
    reason: event.reason,
    promise: event.promise
  })
})

// Node.js 环境
process.on('uncaughtException', (error) => {
  logger.fatal('未捕获的异常', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', { reason, promise })
})
```

## 上下文管理

### 全局上下文

为所有日志添加通用信息：

```typescript
logger.setContext({
  appName: 'my-app',
  appVersion: '1.0.0',
  environment: 'production',
  region: 'us-west-1'
})
```

### 请求级别上下文

```typescript
// Express 中间件示例
app.use((req, res, next) => {
  const requestId = generateRequestId()
  
  logger.withContext({ requestId, userId: req.user?.id }, () => {
    logger.info('收到请求', {
      method: req.method,
      url: req.url,
      ip: req.ip
    })
    
    next()
  })
})
```

### 模块级别上下文

```typescript
// 为不同模块创建子日志器
const apiLogger = logger.child({ module: 'api' })
const dbLogger = logger.child({ module: 'database' })
const cacheLogger = logger.child({ module: 'cache' })

// 使用
apiLogger.info('API 请求')     // 自动包含 module: 'api'
dbLogger.info('数据库查询')    // 自动包含 module: 'database'
```

## 性能优化

### 避免昂贵的操作

```typescript
// ❌ 每次都序列化大对象
logger.debug('用户数据', { user: JSON.stringify(largeUserObject) })

// ✅ 只在需要时序列化
if (logger.isLevelEnabled('debug')) {
  logger.debug('用户数据', { user: largeUserObject })
}

// ✅✅ 使用懒加载
logger.debug('用户数据', () => ({
  user: JSON.stringify(largeUserObject)
}))
```

### 使用采样

对高频日志进行采样：

```typescript
// 高频操作
for (let i = 0; i < 10000; i++) {
  // 只采样 1%
  if (Math.random() < 0.01) {
    logger.debug('循环迭代', { index: i })
  }
}

// 或使用内置采样器
const logger = createLogger({
  level: 'debug',
  sampler: new Sampler({ rate: 0.01 })
})
```

### 批量上传

```typescript
const logger = createLogger({
  level: 'info',
  transports: [
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 20,        // 批量发送
      flushInterval: 5000,  // 定期刷新
    })
  ],
  buffer: {
    size: 100,              // 本地缓冲
    flushInterval: 1000
  }
})
```

## 敏感信息处理

### 脱敏处理

```typescript
// 定义脱敏函数
function sanitize(data: any): any {
  if (!data) return data
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard']
  const sanitized = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***'
    }
  }
  
  return sanitized
}

// 使用
logger.info('用户注册', sanitize({
  username: 'admin',
  password: '123456',  // 会被脱敏
  email: 'admin@example.com'
}))
```

### 自定义序列化

```typescript
const logger = createLogger({
  level: 'info',
  transports: [
    new HttpTransport({
      url: 'https://api.example.com/logs',
      formatter: new JsonFormatter({
        replacer: (key, value) => {
          // 过滤敏感字段
          if (['password', 'token', 'secret'].includes(key)) {
            return undefined
          }
          return value
        }
      })
    })
  ]
})
```

## 标签使用

### 一致的标签命名

```typescript
// ❌ 不一致的命名
logger.info('消息', {}, ['api'])
logger.info('消息', {}, ['API'])
logger.info('消息', {}, ['api-request'])

// ✅ 一致的命名规范
logger.info('消息', {}, ['api'])
logger.info('消息', {}, ['database'])
logger.info('消息', {}, ['cache'])
```

### 有意义的标签

```typescript
// ❌ 过于宽泛
logger.info('操作完成', {}, ['success'])

// ✅ 具体明确
logger.info('订单创建成功', {
  orderId: '123',
  amount: 99.99
}, ['order', 'payment', 'success'])
```

## 监控和告警

### 错误率监控

```typescript
const stats = new LogStats(logger)

setInterval(() => {
  const statistics = stats.getStats()
  const errorRate = statistics.errors / statistics.total
  
  if (errorRate > 0.1) {  // 错误率超过 10%
    // 触发告警
    alertService.send('高错误率告警', {
      errorRate,
      total: statistics.total,
      errors: statistics.errors
    })
  }
}, 60000)  // 每分钟检查
```

### 性能监控

```typescript
function measurePerformance<T>(
  name: string,
  fn: () => T,
  logger: Logger
): T {
  const start = performance.now()
  
  try {
    const result = fn()
    const duration = performance.now() - start
    
    logger.info('性能测量', {
      operation: name,
      duration,
      success: true
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    logger.error('性能测量', {
      operation: name,
      duration,
      success: false,
      error
    })
    
    throw error
  }
}

// 使用
const result = measurePerformance('fetchData', () => {
  return fetchData()
}, logger)
```

## 日志查询

### 高效查询

```typescript
const query = new LogQuery(logger)

// ❌ 查询所有日志再过滤
const allLogs = query.execute()
const errorLogs = allLogs.filter(log => log.level === 'error')

// ✅ 使用查询条件
const errorLogs = query
  .level('error')
  .timeRange(startTime, endTime)
  .limit(100)
  .execute()
```

### 定期清理

```typescript
// 定期清理旧日志
setInterval(() => {
  const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000
  
  query
    .timeRange(0, oneWeekAgo)
    .delete()
    
  logger.info('清理旧日志', {
    before: new Date(oneWeekAgo).toISOString()
  })
}, 86400000)  // 每天清理
```

## 测试

### 日志断言

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createLogger } from '@ldesign/logger'

describe('日志测试', () => {
  it('应该记录错误日志', () => {
    const mockTransport = {
      log: vi.fn()
    }
    
    const logger = createLogger({
      level: 'error',
      transports: [mockTransport]
    })
    
    logger.error('测试错误', { code: 500 })
    
    expect(mockTransport.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        message: '测试错误',
        data: { code: 500 }
      })
    )
  })
})
```

### Mock 日志器

```typescript
// 创建 mock 日志器用于测试
function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn()
  }
}

// 使用
const mockLogger = createMockLogger()
const service = new MyService(mockLogger)

service.doSomething()

expect(mockLogger.info).toHaveBeenCalledWith('操作完成')
```

## 常见模式

### 装饰器模式

```typescript
function LogMethod(level: LogLevel = 'info') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: any[]) {
      const logger = this.logger || console
      
      logger[level](`调用 ${propertyKey}`, { args })
      
      try {
        const result = await originalMethod.apply(this, args)
        logger[level](`${propertyKey} 成功`, { result })
        return result
      } catch (error) {
        logger.error(`${propertyKey} 失败`, { error, args })
        throw error
      }
    }
    
    return descriptor
  }
}

// 使用
class UserService {
  constructor(private logger: Logger) {}
  
  @LogMethod('info')
  async createUser(userData: any) {
    // 实现
  }
}
```

### 中间件模式

```typescript
type LogMiddleware = (
  entry: LogEntry,
  next: () => void
) => void

class LoggerWithMiddleware extends Logger {
  private middlewares: LogMiddleware[] = []
  
  use(middleware: LogMiddleware) {
    this.middlewares.push(middleware)
  }
  
  protected processLog(entry: LogEntry) {
    let index = 0
    
    const next = () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++]
        middleware(entry, next)
      } else {
        super.processLog(entry)
      }
    }
    
    next()
  }
}

// 使用
const logger = new LoggerWithMiddleware({ level: 'info' })

// 添加时间戳
logger.use((entry, next) => {
  entry.timestamp = Date.now()
  next()
})

// 添加请求 ID
logger.use((entry, next) => {
  entry.context = {
    ...entry.context,
    requestId: getCurrentRequestId()
  }
  next()
})
```

## 下一步

- [性能优化](/guide/performance) - 深入了解性能优化
- [API 文档](/api/logger) - 完整的 API 参考
- [示例代码](/examples/production) - 生产环境示例

