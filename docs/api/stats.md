# Stats API

LogStats 提供实时的日志统计功能。

## 基础用法

```typescript
import { LogStats } from '@ldesign/logger'

const stats = new LogStats(logger)

// 获取统计信息
const statistics = stats.getStats()

console.log(statistics)
```

## 统计信息

```typescript
interface LogStatistics {
  total: number                          // 总日志数
  byLevel: Record<LogLevel, number>      // 按级别统计
  byTag: Record<string, number>          // 按标签统计
  errors: number                         // 错误数
  warnings: number                       // 警告数
  startTime: number                      // 统计开始时间
  lastLogTime: number                    // 最后一条日志时间
}
```

## API 方法

### getStats()

获取当前统计信息。

```typescript
const stats = logStats.getStats()

console.log('总日志数:', stats.total)
console.log('错误数:', stats.errors)
console.log('级别分布:', stats.byLevel)
```

### reset()

重置统计信息。

```typescript
logStats.reset()
```

## 完整示例

```typescript
import { createLogger, LogStats, LogLevel } from '@ldesign/logger'

const logger = createLogger({ level: LogLevel.INFO })
const stats = new LogStats(logger)

// 记录一些日志
logger.info('信息 1')
logger.info('信息 2')
logger.warn('警告 1')
logger.error('错误 1')

// 获取统计
const statistics = stats.getStats()

console.log('统计信息:')
console.log('- 总计:', statistics.total)        // 4
console.log('- 信息:', statistics.byLevel[LogLevel.INFO])   // 2
console.log('- 警告:', statistics.byLevel[LogLevel.WARN])   // 1
console.log('- 错误:', statistics.byLevel[LogLevel.ERROR])  // 1

// 监控错误率
setInterval(() => {
  const stats = logStats.getStats()
  const errorRate = stats.errors / stats.total
  
  if (errorRate > 0.1) {
    console.warn('错误率过高:', errorRate)
  }
}, 60000)
```

## 相关文档

- [Logger API](/api/logger)
- [最佳实践](/guide/best-practices)

