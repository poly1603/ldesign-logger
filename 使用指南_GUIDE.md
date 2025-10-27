# @ldesign/logger 使用指南

## 🚀 快速开始

### 基础使用

```typescript
import { logger } from '@ldesign/logger'

logger.info('Hello World')
logger.error('Something went wrong', new Error('Error details'))
```

### 自定义配置

```typescript
import { createLogger, LogLevel, createConsoleTransport } from '@ldesign/logger'

const logger = createLogger({
  name: 'my-app',
  level: LogLevel.INFO,
  transports: [createConsoleTransport()],
})
```

---

## 📦 功能速查

### 传输器

| 传输器 | 用途 | 导入路径 |
|--------|------|---------|
| Console | 控制台输出 | `@ldesign/logger/transports` |
| Storage | 本地存储 | `@ldesign/logger/transports` |
| HTTP | 远程上报 | `@ldesign/logger/transports` |
| WebSocket | 实时推送 | `@ldesign/logger/transports` |

### 工具模块

| 工具 | 用途 | 导入路径 |
|------|------|---------|
| CircularBuffer | 循环缓冲区 | `@ldesign/logger/utils` |
| ObjectPool | 对象池 | `@ldesign/logger/utils` |
| Performance | 性能监控 | `@ldesign/logger/utils` |
| RateLimiter | 速率限制 | `@ldesign/logger/sampling` |
| Sampler | 采样 | `@ldesign/logger/sampling` |
| Deduplicator | 去重 | `@ldesign/logger/sampling` |
| LogContext | 上下文管理 | `@ldesign/logger/context` |
| LogQuery | 查询导出 | `@ldesign/logger/query` |
| LogStats | 统计分析 | `@ldesign/logger/stats` |

---

## 💡 常见场景

### 1. 生产环境配置

```typescript
const logger = createLogger({
  name: 'prod-app',
  level: LogLevel.WARN,
  transports: [
    createHttpTransport({
      url: process.env.LOG_SERVER_URL,
      maxBufferSize: 1000,
    }),
  ],
})
```

### 2. 性能监控

```typescript
const enhanced = enhanceLoggerWithPerformance(logger)
const timer = enhanced.startTimer('api-call')
await fetchData()
timer.end()
```

### 3. 高频日志优化

```typescript
const limiter = createRateLimiter({ windowMs: 1000, maxLogs: 100 })
if (limiter.allowLog()) {
  logger.info('High frequency message')
}
```

### 4. 日志查询

```typescript
const query = createLogQuery(allLogs)
const errors = query.query({
  levels: [LogLevel.ERROR],
  limit: 100,
})
```

---

## 📚 完整文档

- [README.md](./README.md) - 完整使用文档
- [CHANGELOG.md](./CHANGELOG.md) - 变更日志
- [优化完成最终报告_FINAL.md](./优化完成最终报告_FINAL.md) - 优化详情

---

**版本**：v0.2.0  
**状态**：✅ 生产就绪  
**更新日期**：2025-10-25

