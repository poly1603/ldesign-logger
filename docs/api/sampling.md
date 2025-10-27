# Sampling API

采样、限流和去重功能，用于控制日志量。

## Sampler - 采样器

对日志进行采样，减少日志量。

### 基础采样

```typescript
import { Sampler } from '@ldesign/logger'

const sampler = new Sampler({
  rate: 0.1  // 只记录 10% 的日志
})

const logger = createLogger({
  sampler
})
```

### 按级别采样

```typescript
const sampler = new Sampler({
  rates: {
    debug: 0.01,  // debug 只记录 1%
    info: 0.1,    // info 记录 10%
    warn: 0.5,    // warn 记录 50%
    error: 1.0,   // error 全部记录
    fatal: 1.0    // fatal 全部记录
  }
})
```

## RateLimiter - 限流器

防止日志爆炸。

```typescript
import { RateLimiter } from '@ldesign/logger'

const rateLimiter = new RateLimiter({
  maxLogs: 100,      // 最多 100 条
  timeWindow: 1000,  // 1 秒内
  strategy: 'drop'   // 'drop' 或 'queue'
})

const logger = createLogger({
  rateLimiter
})
```

## Deduplicator - 去重器

去除重复的日志。

```typescript
import { Deduplicator } from '@ldesign/logger'

const deduplicator = new Deduplicator({
  window: 5000,      // 5 秒内
  maxCount: 3        // 最多允许 3 次重复
})

const logger = createLogger({
  deduplicator
})
```

## 完整示例

```typescript
const logger = createLogger({
  level: LogLevel.INFO,
  sampler: new Sampler({
    rates: {
      info: 0.1,
      error: 1.0
    }
  }),
  rateLimiter: new RateLimiter({
    maxLogs: 100,
    timeWindow: 1000
  }),
  deduplicator: new Deduplicator({
    window: 5000,
    maxCount: 3
  })
})
```

## 相关文档

- [配置指南](/guide/configuration)
- [性能优化](/guide/performance)

