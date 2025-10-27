# Filters API

过滤器（Filter）用于选择性地记录日志。@ldesign/logger 提供了多种内置过滤器，并支持自定义过滤器。

## 过滤器接口

所有过滤器都实现 `LogFilter` 接口：

```typescript
interface LogFilter {
  name: string
  filter(entry: LogEntry): boolean
}
```

## LevelFilter

基于日志级别过滤。

### 构造函数

```typescript
new LevelFilter(options: LevelFilterOptions)
```

### 配置选项

```typescript
interface LevelFilterOptions {
  minLevel?: LogLevel      // 最小级别
  maxLevel?: LogLevel      // 最大级别（可选）
}
```

### 示例

```typescript
import { LevelFilter, LogLevel } from '@ldesign/logger'

// 只记录 WARN 及以上级别
const filter = new LevelFilter({
  minLevel: LogLevel.WARN
})

// 只记录 WARN 到 ERROR 级别
const filter = new LevelFilter({
  minLevel: LogLevel.WARN,
  maxLevel: LogLevel.ERROR
})

// 添加到 Logger
logger.addFilter(filter)
```

---

## TagFilter

基于标签过滤。

### 构造函数

```typescript
new TagFilter(options: TagFilterOptions)
```

### 配置选项

```typescript
interface TagFilterOptions {
  tags: string[]           // 标签列表
  mode?: 'any' | 'all'    // 匹配模式，默认 'any'
  inverse?: boolean        // 是否反向匹配，默认 false
}
```

### 示例

```typescript
import { TagFilter } from '@ldesign/logger'

// 包含任一标签
const filter = new TagFilter({
  tags: ['api', 'database'],
  mode: 'any'
})

// 必须包含所有标签
const filter = new TagFilter({
  tags: ['critical', 'production'],
  mode: 'all'
})

// 排除包含这些标签的日志
const filter = new TagFilter({
  tags: ['debug', 'verbose'],
  inverse: true
})
```

---

## PatternFilter

基于消息模式过滤。

### 构造函数

```typescript
new PatternFilter(options: PatternFilterOptions)
```

### 配置选项

```typescript
interface PatternFilterOptions {
  pattern: RegExp | string      // 匹配模式
  field?: 'message' | 'data'    // 匹配字段，默认 'message'
  inverse?: boolean             // 是否反向匹配，默认 false
}
```

### 示例

```typescript
import { PatternFilter } from '@ldesign/logger'

// 匹配包含 error 或 fail 的消息
const filter = new PatternFilter({
  pattern: /error|fail/i,
  field: 'message'
})

// 排除包含 test 的消息
const filter = new PatternFilter({
  pattern: /test/,
  inverse: true
})

// 字符串模式
const filter = new PatternFilter({
  pattern: 'user login'
})
```

---

## CompositeFilter

组合多个过滤器。

### 构造函数

```typescript
new CompositeFilter(options: CompositeFilterOptions)
```

### 配置选项

```typescript
interface CompositeFilterOptions {
  filters: LogFilter[]     // 过滤器列表
  mode: 'all' | 'any'     // 组合模式
}
```

### 示例

```typescript
import {
  CompositeFilter,
  LevelFilter,
  TagFilter,
  LogLevel
} from '@ldesign/logger'

// 所有过滤器都要通过（AND）
const filter = new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: LogLevel.WARN }),
    new TagFilter({ tags: ['production'] })
  ],
  mode: 'all'
})

// 任一过滤器通过即可（OR）
const filter = new CompositeFilter({
  filters: [
    new LevelFilter({ minLevel: LogLevel.ERROR }),
    new TagFilter({ tags: ['critical'] })
  ],
  mode: 'any'
})
```

---

## 自定义过滤器

实现 `LogFilter` 接口创建自定义过滤器。

### 基础示例

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class MyFilter implements LogFilter {
  name = 'my-filter'
  
  filter(entry: LogEntry): boolean {
    // 自定义过滤逻辑
    return entry.message.includes('important')
  }
}

// 使用
logger.addFilter(new MyFilter())
```

### 高级示例：时间范围过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

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

// 只在工作时间记录日志（9:00 - 18:00）
const filter = new TimeRangeFilter(9, 18)
logger.addFilter(filter)
```

### 高级示例：采样过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class SamplingFilter implements LogFilter {
  name = 'sampling'
  
  constructor(private sampleRate: number) {
    if (sampleRate < 0 || sampleRate > 1) {
      throw new Error('sampleRate must be between 0 and 1')
    }
  }
  
  filter(entry: LogEntry): boolean {
    return Math.random() < this.sampleRate
  }
}

// 只记录 10% 的日志
const filter = new SamplingFilter(0.1)
logger.addFilter(filter)
```

### 高级示例：内容过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class ContentFilter implements LogFilter {
  name = 'content'
  
  constructor(private blocklist: string[]) {}
  
  filter(entry: LogEntry): boolean {
    // 检查消息
    if (this.containsBlockedContent(entry.message)) {
      return false
    }
    
    // 检查数据
    if (entry.data) {
      const dataString = JSON.stringify(entry.data)
      if (this.containsBlockedContent(dataString)) {
        return false
      }
    }
    
    return true
  }
  
  private containsBlockedContent(text: string): boolean {
    return this.blocklist.some(blocked => 
      text.toLowerCase().includes(blocked.toLowerCase())
    )
  }
}

// 过滤包含敏感词的日志
const filter = new ContentFilter(['password', 'token', 'secret'])
logger.addFilter(filter)
```

### 高级示例：用户过滤器

```typescript
import { LogFilter, LogEntry } from '@ldesign/logger'

class UserFilter implements LogFilter {
  name = 'user'
  
  constructor(private allowedUserIds: Set<string>) {}
  
  filter(entry: LogEntry): boolean {
    // 没有用户 ID，允许通过
    if (!entry.userId) {
      return true
    }
    
    // 检查用户 ID 是否在允许列表中
    return this.allowedUserIds.has(entry.userId)
  }
}

// 只记录特定用户的日志
const filter = new UserFilter(new Set(['user1', 'user2', 'user3']))
logger.addFilter(filter)
```

## 过滤器链

多个过滤器按添加顺序依次执行，所有过滤器都通过才会记录日志：

```typescript
// 添加多个过滤器
logger.addFilter(new LevelFilter({ minLevel: LogLevel.INFO }))
logger.addFilter(new TagFilter({ tags: ['production'] }))
logger.addFilter(new PatternFilter({ pattern: /important/i }))

// 只有同时满足以下条件的日志才会被记录：
// 1. 级别 >= INFO
// 2. 包含 'production' 标签
// 3. 消息包含 'important'
```

## 动态过滤器

可以在运行时添加或移除过滤器：

```typescript
// 添加过滤器
const filter = new LevelFilter({ minLevel: LogLevel.WARN })
logger.addFilter(filter)

// 移除过滤器
logger.removeFilter('level')

// 条件性添加过滤器
if (process.env.NODE_ENV === 'production') {
  logger.addFilter(new LevelFilter({ minLevel: LogLevel.WARN }))
}
```

## 过滤器 vs Logger 级别

Logger 级别和过滤器的区别：

| 特性 | Logger 级别 | 过滤器 |
|------|------------|--------|
| 执行时机 | 最早 | Logger 级别之后 |
| 性能 | 最快 | 稍慢 |
| 灵活性 | 只能按级别 | 支持多维度 |
| 使用场景 | 基础过滤 | 复杂过滤 |

**最佳实践：**

1. 使用 Logger 级别进行基础过滤
2. 使用过滤器进行复杂的条件过滤

```typescript
const logger = createLogger({
  level: LogLevel.INFO,  // 基础过滤：忽略 DEBUG
  filters: [
    // 复杂过滤：生产环境只记录特定标签
    new TagFilter({ tags: ['critical', 'error'] })
  ]
})
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

// 创建复杂的过滤策略
const logger = createLogger({
  level: LogLevel.DEBUG
})

// 生产环境过滤器
if (process.env.NODE_ENV === 'production') {
  logger.addFilter(
    new CompositeFilter({
      filters: [
        // 只记录 WARN 及以上
        new LevelFilter({ minLevel: LogLevel.WARN }),
        // 或者包含 critical 标签
        new TagFilter({ tags: ['critical'] })
      ],
      mode: 'any'
    })
  )
}

// 排除测试相关日志
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

- [Logger API](/api/logger) - Logger API 文档
- [配置指南](/guide/configuration) - 详细配置说明
- [示例代码](/examples/filters) - 过滤器示例

