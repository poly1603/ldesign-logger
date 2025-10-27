# Transports API

传输器（Transport）决定日志的输出位置和方式。@ldesign/logger 提供了多种内置传输器，并支持自定义传输器。

## 传输器接口

所有传输器都实现 `LogTransport` 接口：

```typescript
interface LogTransport {
  name: string                                    // 传输器名称
  level: LogLevel                                 // 最低日志级别
  enabled: boolean                                // 是否启用
  log(entry: LogEntry): void | Promise<void>     // 记录日志
  flush?(): void | Promise<void>                 // 刷新缓冲区（可选）
  destroy?(): void | Promise<void>               // 销毁传输器（可选）
}
```

## ConsoleTransport

将日志输出到浏览器控制台或 Node.js 终端。

### 构造函数

```typescript
new ConsoleTransport(config?: ConsoleTransportConfig)
```

### 配置选项

```typescript
interface ConsoleTransportConfig {
  level?: LogLevel      // 最低日志级别，默认 DEBUG
  enabled?: boolean     // 是否启用，默认 true
  colors?: boolean      // 是否彩色输出，默认 true
  timestamp?: boolean   // 是否显示时间戳，默认 true
}
```

### 特性

- **彩色输出** - 不同级别显示不同颜色
- **时间戳** - 可选显示本地时间
- **智能格式化** - 自动使用合适的 console 方法
- **对象展开** - 附加数据以可读形式展示

### 示例

```typescript
import { ConsoleTransport, LogLevel } from '@ldesign/logger'

// 基础用法
const transport = new ConsoleTransport()

// 自定义配置
const transport = new ConsoleTransport({
  level: LogLevel.INFO,
  colors: true,
  timestamp: true
})

// 只在开发环境使用
const isDev = process.env.NODE_ENV === 'development'
const transport = new ConsoleTransport({
  enabled: isDev,
  level: isDev ? LogLevel.DEBUG : LogLevel.WARN
})
```

### 颜色方案

| 级别 | 颜色 | 用途 |
|------|------|------|
| TRACE | 灰色 (#999) | 次要信息 |
| DEBUG | 紫色 (#6366f1) | 调试信息 |
| INFO | 蓝色 (#3b82f6) | 常规信息 |
| WARN | 橙色 (#f59e0b) | 警告 |
| ERROR | 红色 (#ef4444) | 错误 |
| FATAL | 深红色 (#dc2626) | 严重错误 |

---

## HttpTransport

通过 HTTP 请求将日志发送到远程服务器。

### 构造函数

```typescript
new HttpTransport(config: HttpTransportConfig)
```

### 配置选项

```typescript
interface HttpTransportConfig {
  url: string                         // 上报地址（必填）
  level?: LogLevel                    // 最低日志级别，默认 WARN
  enabled?: boolean                   // 是否启用，默认 true
  method?: 'POST' | 'PUT'            // HTTP 方法，默认 POST
  headers?: Record<string, string>    // 自定义请求头
  batchSize?: number                  // 批量大小，默认 10
  batchInterval?: number              // 批量间隔（毫秒），默认 5000
  timeout?: number                    // 超时时间（毫秒），默认 10000
  retryCount?: number                 // 重试次数，默认 3
  maxBufferSize?: number              // 最大缓冲区大小，默认 1000
}
```

### 特性

- **批量发送** - 累积多条日志后批量发送
- **定时发送** - 定期自动发送，避免日志堆积
- **失败重试** - 支持指数退避重试策略
- **缓冲区限制** - 防止内存泄漏
- **请求超时** - 避免长时间等待

### 示例

```typescript
import { HttpTransport, LogLevel } from '@ldesign/logger'

// 基础用法
const transport = new HttpTransport({
  url: 'https://api.example.com/logs'
})

// 完整配置
const transport = new HttpTransport({
  url: 'https://api.example.com/logs',
  level: LogLevel.WARN,
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'X-App-Version': '1.0.0'
  },
  batchSize: 20,
  batchInterval: 5000,
  timeout: 10000,
  retryCount: 3,
  maxBufferSize: 1000
})

// 生产环境配置
const transport = new HttpTransport({
  url: process.env.LOG_SERVER_URL,
  level: LogLevel.ERROR,
  batchSize: 50,
  batchInterval: 10000
})
```

### 请求格式

日志以 JSON 格式发送：

```json
{
  "logs": [
    {
      "level": 4,
      "message": "请求失败",
      "timestamp": 1704096000000,
      "source": "api",
      "data": { "url": "/api/users", "method": "GET" },
      "error": { "message": "Network Error", "stack": "..." }
    }
  ]
}
```

### 重试策略

失败后使用指数退避重试：
- 第 1 次重试：1 秒后
- 第 2 次重试：2 秒后
- 第 3 次重试：4 秒后
- 最大延迟：30 秒

---

## StorageTransport

将日志持久化到浏览器存储（LocalStorage 或 IndexedDB）。

### 构造函数

```typescript
new StorageTransport(config?: StorageTransportConfig)
```

### 配置选项

```typescript
interface StorageTransportConfig {
  level?: LogLevel                              // 最低日志级别，默认 INFO
  enabled?: boolean                             // 是否启用，默认 true
  storageKey?: string                           // 存储键名，默认 'ldesign-logs'
  maxLogs?: number                              // 最大日志条数，默认 1000
  storageType?: 'localStorage' | 'indexedDB'    // 存储类型，默认 localStorage
  saveInterval?: number                         // 批量保存间隔，默认 1000
}
```

### 特性

- **持久化存储** - 刷新页面后日志仍然存在
- **数量限制** - 防止存储空间无限增长
- **批量保存** - 减少存储操作频率
- **异步加载** - 不阻塞主线程

### 示例

```typescript
import { StorageTransport, LogLevel } from '@ldesign/logger'

// 使用 LocalStorage
const transport = new StorageTransport({
  storageType: 'localStorage',
  storageKey: 'app-logs',
  maxLogs: 500
})

// 使用 IndexedDB（推荐大量日志）
const transport = new StorageTransport({
  storageType: 'indexedDB',
  storageKey: 'app-logs',
  maxLogs: 5000
})

// 只保存错误日志
const transport = new StorageTransport({
  level: LogLevel.ERROR,
  maxLogs: 100,
  storageType: 'localStorage'
})
```

### 额外方法

#### getLogs()

获取所有已保存的日志。

```typescript
const logs = transport.getLogs()
console.log('已保存的日志:', logs)
```

#### getLogCount()

获取日志数量。

```typescript
const count = transport.getLogCount()
console.log('日志数量:', count)
```

#### clear()

清空所有日志。

```typescript
await transport.clear()
```

### LocalStorage vs IndexedDB

| 特性 | LocalStorage | IndexedDB |
|------|--------------|-----------|
| 操作方式 | 同步 | 异步 |
| 存储容量 | ~5MB | ~50MB+ |
| 性能 | 适合少量数据 | 适合大量数据 |
| 兼容性 | 更好 | 现代浏览器 |
| 推荐场景 | < 1000 条日志 | > 1000 条日志 |

---

## WebSocketTransport

通过 WebSocket 实时发送日志到服务器。

### 构造函数

```typescript
new WebSocketTransport(config: WebSocketTransportConfig)
```

### 配置选项

```typescript
interface WebSocketTransportConfig {
  url: string                    // WebSocket URL（必填）
  level?: LogLevel              // 最低日志级别
  enabled?: boolean             // 是否启用
  protocols?: string[]          // WebSocket 协议
  reconnect?: boolean           // 是否自动重连，默认 true
  reconnectInterval?: number    // 重连间隔（毫秒），默认 5000
  maxReconnectAttempts?: number // 最大重连次数，默认 10
}
```

### 特性

- **实时传输** - 日志立即发送到服务器
- **自动重连** - 连接断开后自动重连
- **低延迟** - 适合实时监控场景

### 示例

```typescript
import { WebSocketTransport, LogLevel } from '@ldesign/logger'

const transport = new WebSocketTransport({
  url: 'wss://api.example.com/logs',
  level: LogLevel.INFO,
  reconnect: true,
  reconnectInterval: 5000
})
```

---

## 自定义传输器

实现 `LogTransport` 接口创建自定义传输器。

### 基础示例

```typescript
import { LogTransport, LogEntry, LogLevel } from '@ldesign/logger'

class MyTransport implements LogTransport {
  name = 'my-transport'
  level = LogLevel.INFO
  enabled = true

  log(entry: LogEntry): void {
    // 自定义日志处理逻辑
    console.log('自定义传输器:', entry)
  }

  // 可选：刷新缓冲区
  flush?(): void {
    console.log('刷新缓冲区')
  }

  // 可选：销毁传输器
  destroy?(): void {
    console.log('销毁传输器')
  }
}

// 使用
logger.addTransport(new MyTransport())
```

### 高级示例：文件传输器（Node.js）

```typescript
import { LogTransport, LogEntry, LogLevel } from '@ldesign/logger'
import { promises as fs } from 'fs'
import { join } from 'path'

class FileTransport implements LogTransport {
  name = 'file'
  level: LogLevel
  enabled: boolean
  
  private logPath: string
  private buffer: string[] = []
  private maxBufferSize: number
  
  constructor(config: {
    logPath: string
    level?: LogLevel
    maxBufferSize?: number
  }) {
    this.logPath = config.logPath
    this.level = config.level ?? LogLevel.INFO
    this.maxBufferSize = config.maxBufferSize ?? 100
    this.enabled = true
  }

  log(entry: LogEntry): void {
    // 格式化日志
    const line = JSON.stringify(entry) + '\n'
    this.buffer.push(line)

    // 达到缓冲区大小时写入文件
    if (this.buffer.length >= this.maxBufferSize) {
      void this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const content = this.buffer.join('')
    this.buffer = []

    try {
      await fs.appendFile(this.logPath, content, 'utf-8')
    } catch (error) {
      console.error('写入日志文件失败:', error)
    }
  }

  async destroy(): Promise<void> {
    await this.flush()
  }
}

// 使用
const transport = new FileTransport({
  logPath: join(__dirname, 'logs', 'app.log'),
  level: LogLevel.INFO
})

logger.addTransport(transport)
```

## 多传输器配置

可以同时使用多个传输器：

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  LogLevel
} from '@ldesign/logger'

const logger = createLogger({
  level: LogLevel.DEBUG,
  transports: [
    // 控制台：所有日志
    new ConsoleTransport({
      level: LogLevel.DEBUG,
      colors: true
    }),
    
    // HTTP：警告及以上
    new HttpTransport({
      url: 'https://api.example.com/logs',
      level: LogLevel.WARN,
      batchSize: 20
    }),
    
    // 本地存储：错误日志
    new StorageTransport({
      level: LogLevel.ERROR,
      maxLogs: 100
    })
  ]
})
```

## 传输器级别过滤

每个传输器都有自己的级别过滤：

```typescript
const logger = createLogger({
  level: LogLevel.DEBUG,  // Logger 级别
  transports: [
    new ConsoleTransport({
      level: LogLevel.DEBUG  // 控制台显示所有
    }),
    new HttpTransport({
      url: 'https://api.example.com/logs',
      level: LogLevel.ERROR  // 服务器只收集错误
    })
  ]
})

logger.debug('调试信息')  // 只在控制台显示
logger.error('错误信息')  // 控制台和服务器都显示
```

## 相关文档

- [Logger API](/api/logger) - Logger API 文档
- [Formatters API](/api/formatters) - 格式化器 API 文档
- [配置指南](/guide/configuration) - 详细配置说明

