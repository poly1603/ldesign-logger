# Query API

LogQuery 提供强大的日志查询功能。

## 基础用法

```typescript
import { LogQuery } from '@ldesign/logger'

const query = new LogQuery(logger)

// 链式查询
const results = query
  .level('error')
  .tags(['api'])
  .message(/timeout/)
  .timeRange(startTime, endTime)
  .limit(10)
  .execute()
```

## API 方法

### level(level)

按日志级别筛选。

```typescript
query.level('error')
query.level(LogLevel.ERROR)
```

### tags(tags, mode?)

按标签筛选。

```typescript
// 包含任一标签
query.tags(['api', 'database'])

// 包含所有标签
query.tags(['critical', 'production'], 'all')
```

### message(pattern)

按消息内容筛选。

```typescript
query.message(/timeout/)
query.message('user login')
```

### timeRange(start, end)

按时间范围筛选。

```typescript
const now = Date.now()
const oneHourAgo = now - 3600000

query.timeRange(oneHourAgo, now)
```

### limit(count)

限制返回数量。

```typescript
query.limit(100)
```

### execute()

执行查询并返回结果。

```typescript
const logs = query.execute()
```

## 完整示例

```typescript
// 查询最近 1 小时的错误日志
const errorLogs = query
  .level('error')
  .timeRange(Date.now() - 3600000, Date.now())
  .limit(50)
  .execute()

// 查询特定用户的日志
const userLogs = query
  .custom((entry) => entry.userId === 'user123')
  .execute()
```

## 相关文档

- [Logger API](/api/logger)
- [示例代码](/examples/advanced)

