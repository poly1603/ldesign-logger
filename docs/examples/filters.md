# 过滤器使用

展示如何使用过滤器选择性地记录日志。

## 级别过滤

```typescript
import { LevelFilter, LogLevel } from '@ldesign/logger'

// 只记录 WARN 及以上级别
logger.addFilter(new LevelFilter({
  minLevel: LogLevel.WARN
}))

// 只记录 WARN 到 ERROR 级别
logger.addFilter(new LevelFilter({
  minLevel: LogLevel.WARN,
  maxLevel: LogLevel.ERROR
}))
```

## 标签过滤

```typescript
import { TagFilter } from '@ldesign/logger'

// 包含任一标签
logger.addFilter(new TagFilter({
  tags: ['api', 'database'],
  mode: 'any'
}))

// 必须包含所有标签
logger.addFilter(new TagFilter({
  tags: ['critical', 'production'],
  mode: 'all'
}))

// 排除标签
logger.addFilter(new TagFilter({
  tags: ['debug', 'verbose'],
  inverse: true
}))
```

## 模式过滤

```typescript
import { PatternFilter } from '@ldesign/logger'

// 匹配包含 error 或 fail 的消息
logger.addFilter(new PatternFilter({
  pattern: /error|fail/i
}))

// 排除测试相关日志
logger.addFilter(new PatternFilter({
  pattern: /test|mock/i,
  inverse: true
}))
```

## 组合过滤器

```typescript
import { CompositeFilter, LevelFilter, TagFilter, LogLevel } from '@ldesign/logger'

// 所有过滤器都要通过（AND）
logger.addFilter(new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: LogLevel.WARN }),
    new TagFilter({ tags: ['production'] })
  ],
  mode: 'all'
}))

// 任一过滤器通过即可（OR）
logger.addFilter(new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: LogLevel.ERROR }),
    new TagFilter({ tags: ['critical'] })
  ],
  mode: 'any'
}))
```

## 自定义过滤器

### 时间范围过滤器

```typescript
class TimeRangeFilter implements LogFilter {
  name = 'time-range'
  
  constructor(
    private startHour: number,
    private endHour: number
  ) {}
  
  filter(entry: LogEntry): boolean {
    const hour = new Date(entry.timestamp).getHours()
    return hour >= this.startHour && hour < this.endHour
  }
}

// 只在工作时间记录日志
logger.addFilter(new TimeRangeFilter(9, 18))
```

### 用户过滤器

```typescript
class UserFilter implements LogFilter {
  name = 'user'
  
  constructor(private allowedUserIds: Set<string>) {}
  
  filter(entry: LogEntry): boolean {
    if (!entry.userId) return true
    return this.allowedUserIds.has(entry.userId)
  }
}

// 只记录特定用户的日志
logger.addFilter(new UserFilter(new Set(['user1', 'user2'])))
```

### 采样过滤器

```typescript
class SamplingFilter implements LogFilter {
  name = 'sampling'
  
  constructor(private rate: number) {}
  
  filter(entry: LogEntry): boolean {
    return Math.random() < this.rate
  }
}

// 只记录 10% 的日志
logger.addFilter(new SamplingFilter(0.1))
```

## 动态过滤

```typescript
// 添加过滤器
const filter = new LevelFilter({ minLevel: LogLevel.WARN })
logger.addFilter(filter)

// 移除过滤器
logger.removeFilter('level')

// 条件性添加
if (process.env.NODE_ENV === 'production') {
  logger.addFilter(new LevelFilter({ minLevel: LogLevel.WARN }))
}
```

## 完整示例

```typescript
import {
  createLogger,
  LevelFilter,
  TagFilter,
  PatternFilter,
  CompositeFilter,
  LogLevel
} from '@ldesign/logger'

const logger = createLogger({
  name: 'filtered-app',
  level: LogLevel.DEBUG
})

// 生产环境过滤
if (process.env.NODE_ENV === 'production') {
  logger.addFilter(
    new CompositeFilter({
      filters: [
        new LevelFilter({ minLevel: LogLevel.WARN }),
        new TagFilter({ tags: ['critical'] })
      ],
      mode: 'any'
    })
  )
}

// 排除测试日志
logger.addFilter(
  new PatternFilter({
    pattern: /test|mock|fake/i,
    inverse: true
  })
)

// 使用
logger.info('正常日志', {}, ['critical'])  // 会被记录
logger.debug('调试日志')  // 在生产环境不会被记录
logger.warn('测试警告')  // 会被 pattern 过滤器排除
```

## 相关文档

- [Filters API](/api/filters)
- [配置指南](/guide/configuration)

