# 基础用法

本页面展示 @ldesign/logger 的基础使用方法。

## 安装

```bash
pnpm add @ldesign/logger
```

## 快速开始

### 创建 Logger

```typescript
import { createLogger, LogLevel } from '@ldesign/logger'

const logger = createLogger({
  name: 'app',
  level: LogLevel.INFO
})
```

### 记录日志

```typescript
logger.debug('调试信息')
logger.info('普通信息')
logger.warn('警告信息')
logger.error('错误信息', new Error('出错了'))
logger.fatal('致命错误', new Error('严重错误'))
```

### 带附加数据

```typescript
logger.info('用户登录', {
  userId: '123',
  username: 'john',
  ip: '192.168.1.1'
})
```

## 使用传输器

### 控制台输出

```typescript
import { createLogger, ConsoleTransport } from '@ldesign/logger'

const logger = createLogger({
  name: 'app',
  level: LogLevel.INFO,
  transports: [
    new ConsoleTransport({
      colors: true,
      timestamp: true
    })
  ]
})
```

### 多个传输器

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  LogLevel
} from '@ldesign/logger'

const logger = createLogger({
  name: 'app',
  level: LogLevel.INFO,
  transports: [
    new ConsoleTransport(),
    new HttpTransport({
      url: 'https://api.example.com/logs'
    })
  ]
})
```

## 子 Logger

```typescript
const logger = createLogger({ name: 'app' })

const apiLogger = logger.child({ name: 'api' })
const dbLogger = logger.child({ name: 'database' })

apiLogger.info('API 请求')    // [app.api] API 请求
dbLogger.info('数据库查询')   // [app.database] 数据库查询
```

## 运行时配置

### 动态设置级别

```typescript
// 开发环境
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG)
}

// 生产环境
if (process.env.NODE_ENV === 'production') {
  logger.setLevel(LogLevel.WARN)
}
```

### 启用/禁用

```typescript
logger.enable()   // 启用日志
logger.disable()  // 禁用日志
```

## 完整示例

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  TextFormatter,
  LogLevel
} from '@ldesign/logger'

// 创建 Logger
const logger = createLogger({
  name: 'my-app',
  level: LogLevel.INFO,
  transports: [
    // 控制台输出
    new ConsoleTransport({
      formatter: new TextFormatter({
        colorize: true,
        timestamp: true
      })
    }),
    // HTTP 上传
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 10,
      flushInterval: 5000
    })
  ]
})

// 使用
logger.info('应用启动', { version: '1.0.0' })

try {
  // 业务代码
  throw new Error('示例错误')
} catch (error) {
  logger.error('操作失败', error)
}

// 程序退出前
process.on('exit', async () => {
  await logger.flush()
})
```

## 下一步

- [高级用法](/examples/advanced) - 了解更多高级功能
- [API 文档](/api/logger) - 完整的 API 参考
- [配置指南](/guide/configuration) - 详细配置说明

