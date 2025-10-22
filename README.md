# @ldesign/logger

> 企业级日志系统 - 分级日志、持久化、远程上报、性能监控

[![npm version](https://img.shields.io/npm/v/@ldesign/logger.svg)](https://www.npmjs.com/package/@ldesign/logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/npm/l/@ldesign/logger.svg)](./LICENSE)

## ✨ 特性

- 📊 **分级日志** - TRACE/DEBUG/INFO/WARN/ERROR/FATAL 六个级别
- 💾 **日志持久化** - 支持 LocalStorage 和 IndexedDB
- 🌐 **远程上报** - HTTP/WebSocket 方式上报日志
- ⚡ **高性能** - 批量发送、异步处理、缓冲优化
- 🎯 **TypeScript** - 完整的类型定义
- 🔍 **日志追踪** - 支持 userId、sessionId 追踪
- 📦 **多传输器** - Console、Storage、HTTP 等
- 🎨 **彩色输出** - 控制台彩色日志
- 🔧 **灵活配置** - 支持子 Logger、自定义传输器

## 📦 安装

```bash
# 使用 pnpm（推荐）
pnpm add @ldesign/logger

# 使用 npm
npm install @ldesign/logger

# 使用 yarn
yarn add @ldesign/logger
```

## 🚀 快速开始

### 基础使用

```typescript
import { logger } from '@ldesign/logger'

// 不同级别的日志
logger.trace('Trace message')
logger.debug('Debug message', { userId: 123 })
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error occurred', new Error('Something went wrong'))
logger.fatal('Fatal error', new Error('Critical failure'))
```

### 创建自定义 Logger

```typescript
import { createLogger, createConsoleTransport, createHttpTransport } from '@ldesign/logger'

const logger = createLogger({
  name: 'my-app',
  level: LogLevel.DEBUG,
  userId: 'user-123',
  sessionId: 'session-456',
  defaultTags: ['frontend', 'production'],
  transports: [
    // Console 传输器
    createConsoleTransport({
      level: LogLevel.DEBUG,
      colors: true,
      timestamp: true,
    }),
    
    // HTTP 传输器
    createHttpTransport({
      level: LogLevel.WARN,
      url: 'https://api.example.com/logs',
      batchSize: 10,
      batchInterval: 5000,
    }),
  ],
})

// 使用
logger.info('User logged in', { username: 'john' })
```

### 子 Logger

```typescript
// 创建子 logger，继承父 logger 的配置
const apiLogger = logger.child({ name: 'api' })
const dbLogger = logger.child({ name: 'database' })

apiLogger.info('API request', { url: '/users', method: 'GET' })
dbLogger.warn('Slow query', { query: 'SELECT * FROM users', duration: 1500 })
```

## 📖 API

### Logger 方法

```typescript
interface ILogger {
  // 日志方法
  trace(message: string, data?: any): void
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error, data?: any): void
  fatal(message: string, error?: Error, data?: any): void
  log(level: LogLevel, message: string, data?: any, error?: Error): void
  
  // 管理方法
  child(config: Partial<LoggerConfig>): ILogger
  addTransport(transport: LogTransport): void
  removeTransport(name: string): void
  setLevel(level: LogLevel): void
  enable(): void
  disable(): void
  flush(): Promise<void>
  destroy(): Promise<void>
}
```

### 传输器

#### ConsoleTransport

输出到浏览器控制台：

```typescript
import { createConsoleTransport } from '@ldesign/logger'

const consoleTransport = createConsoleTransport({
  level: LogLevel.DEBUG,
  colors: true,       // 彩色输出
  timestamp: true,    // 显示时间戳
})
```

#### StorageTransport

持久化到浏览器存储：

```typescript
import { createStorageTransport } from '@ldesign/logger'

const storageTransport = createStorageTransport({
  level: LogLevel.INFO,
  storageKey: 'app-logs',
  maxLogs: 1000,                    // 最多保存 1000 条
  storageType: 'indexedDB',         // 或 'localStorage'
})

// 获取保存的日志
const logs = storageTransport.getLogs()

// 清空日志
storageTransport.clear()
```

#### HttpTransport

上报到远程服务器：

```typescript
import { createHttpTransport } from '@ldesign/logger'

const httpTransport = createHttpTransport({
  level: LogLevel.WARN,             // 只上报 WARN 及以上
  url: 'https://api.example.com/logs',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token',
  },
  batchSize: 10,                    // 10 条批量发送
  batchInterval: 5000,              // 5 秒发送一次
  timeout: 10000,                   // 请求超时 10 秒
  retryCount: 3,                    // 重试 3 次
})
```

## 🎯 使用场景

### 1. 错误追踪

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', error as Error, {
    operation: 'riskyOperation',
    params: { id: 123 },
  })
}
```

### 2. 性能监控

```typescript
const start = Date.now()

await expensiveOperation()

const duration = Date.now() - start
logger.info('Performance metric', {
  operation: 'expensiveOperation',
  duration,
  threshold: 1000,
  exceeded: duration > 1000,
})
```

### 3. 用户行为追踪

```typescript
logger.info('User action', {
  action: 'click',
  target: 'submit-button',
  page: '/checkout',
  timestamp: Date.now(),
})
```

## 🔧 高级用法

### 自定义传输器

```typescript
import type { LogTransport, LogEntry } from '@ldesign/logger'

class CustomTransport implements LogTransport {
  name = 'custom'
  level = LogLevel.INFO
  enabled = true

  log(entry: LogEntry): void {
    // 自定义日志处理逻辑
    console.log('Custom transport:', entry)
  }

  async flush(): Promise<void> {
    // 刷新缓冲区
  }

  async destroy(): Promise<void> {
    // 清理资源
  }
}

logger.addTransport(new CustomTransport())
```

### 日志过滤

```typescript
// 只记录特定标签的日志
const filteredLogger = createLogger({
  name: 'filtered',
  defaultTags: ['important'],
  transports: [
    createConsoleTransport(),
  ],
})
```

## 📊 性能

- ⚡ **批量发送** - 减少网络请求
- 🚀 **异步处理** - 不阻塞主线程
- 💾 **缓冲优化** - 智能缓冲，减少I/O
- 📈 **零依赖** - 核心包无外部依赖

## 🛠️ 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 测试
pnpm test

# 开发模式
pnpm dev
```

## 📄 许可证

MIT © LDesign Team

