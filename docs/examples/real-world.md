# 完整实例

一个完整的 Web 应用日志系统实现示例。

## 应用架构

```
app/
├── logger/
│   ├── index.ts           # Logger 配置
│   ├── error-tracker.ts   # 错误追踪
│   └── performance.ts     # 性能监控
├── services/
│   ├── api.service.ts
│   ├── db.service.ts
│   └── auth.service.ts
└── app.ts                 # 应用入口
```

## Logger 配置

```typescript
// logger/index.ts
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  JsonFormatter,
  Sampler,
  RateLimiter,
  Deduplicator,
  LogLevel
} from '@ldesign/logger'

const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

export const logger = createLogger({
  name: 'app',
  level: isDev ? LogLevel.DEBUG : LogLevel.INFO,
  transports: [
    new ConsoleTransport({
      level: isDev ? LogLevel.DEBUG : LogLevel.WARN
    }),
    ...(isProd ? [
      new HttpTransport({
        url: process.env.LOG_SERVER_URL,
        batchSize: 20
      }),
      new StorageTransport({
        level: LogLevel.ERROR,
        maxSize: 100
      })
    ] : [])
  ],
  ...(isProd && {
    sampler: new Sampler({
      rates: { debug: 0, info: 0.1, warn: 0.5, error: 1.0, fatal: 1.0 }
    }),
    rateLimiter: new RateLimiter({ maxLogs: 100, timeWindow: 1000 }),
    deduplicator: new Deduplicator({ window: 5000, maxCount: 3 })
  })
})

// 模块 Logger
export const apiLogger = logger.child({ name: 'api' })
export const dbLogger = logger.child({ name: 'database' })
export const authLogger = logger.child({ name: 'auth' })
```

## 错误追踪

```typescript
// logger/error-tracker.ts
import { logger } from './index'

export class ErrorTracker {
  static setupGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        logger.fatal('未捕获的错误', event.error, {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        logger.error('未处理的 Promise 拒绝', event.reason)
      })
    }
  }

  static trackError(error: Error, context?: any) {
    logger.error(error.message, error, {
      ...context,
      timestamp: Date.now(),
      url: window.location.href
    })
  }
}
```

## 性能监控

```typescript
// logger/performance.ts
import { logger } from './index'

export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now()

  return Promise.resolve(fn())
    .then((result) => {
      const duration = performance.now() - start
      logger.info(`${name} 完成`, {
        duration: `${duration.toFixed(2)}ms`
      })
      return result
    })
    .catch((error) => {
      const duration = performance.now() - start
      logger.error(`${name} 失败`, error, {
        duration: `${duration.toFixed(2)}ms`
      })
      throw error
    })
}
```

## API 服务

```typescript
// services/api.service.ts
import { apiLogger } from '../logger'
import { measurePerformance } from '../logger/performance'

export class ApiService {
  async request(url: string, options: RequestInit = {}) {
    return measurePerformance(`API请求: ${url}`, async () => {
      apiLogger.info('API 请求开始', { url, method: options.method })

      try {
        const response = await fetch(url, options)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        apiLogger.info('API 请求成功', {
          url,
          status: response.status
        })

        return await response.json()
      } catch (error) {
        apiLogger.error('API 请求失败', error, { url })
        throw error
      }
    })
  }
}
```

## 数据库服务

```typescript
// services/db.service.ts
import { dbLogger } from '../logger'

export class DatabaseService {
  async query(sql: string, params?: any[]) {
    const start = performance.now()

    dbLogger.debug('执行查询', { sql, params })

    try {
      // 查询逻辑
      const result = await executeQuery(sql, params)
      const duration = performance.now() - start

      if (duration > 100) {
        dbLogger.warn('慢查询', { sql, duration })
      }

      return result
    } catch (error) {
      dbLogger.error('查询失败', error, { sql, params })
      throw error
    }
  }
}
```

## 认证服务

```typescript
// services/auth.service.ts
import { authLogger } from '../logger'

export class AuthService {
  async login(username: string, password: string) {
    authLogger.info('用户登录尝试', { username })

    try {
      // 认证逻辑
      const user = await authenticate(username, password)

      authLogger.info('用户登录成功', {
        userId: user.id,
        username: user.username
      })

      return user
    } catch (error) {
      authLogger.warn('用户登录失败', error, { username })
      throw error
    }
  }
}
```

## 应用入口

```typescript
// app.ts
import { logger } from './logger'
import { ErrorTracker } from './logger/error-tracker'
import { LogStats } from '@ldesign/logger'

class Application {
  constructor() {
    ErrorTracker.setupGlobalHandlers()
    this.startMonitoring()
  }

  private startMonitoring() {
    const stats = new LogStats(logger)

    setInterval(() => {
      const statistics = stats.getStats()
      const errorRate = (statistics.errors / statistics.total * 100).toFixed(2)

      if (parseFloat(errorRate) > 5) {
        logger.warn('错误率过高', { errorRate })
      }
    }, 60000)
  }

  async start() {
    logger.info('应用启动', {
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV
    })

    try {
      // 启动逻辑
      await this.initialize()
      logger.info('应用启动完成')
    } catch (error) {
      logger.fatal('应用启动失败', error)
      throw error
    }
  }

  async stop() {
    logger.info('应用停止中')
    await logger.flush()
    await logger.destroy()
  }
}

const app = new Application()
app.start().catch(console.error)
```

## 相关文档

- [最佳实践](/guide/best-practices)
- [生产环境配置](/examples/production)

