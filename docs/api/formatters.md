# Formatters API

格式化器（Formatter）控制日志的输出格式。@ldesign/logger 提供了多种内置格式化器，并支持自定义格式化器。

## 格式化器接口

所有格式化器都实现 `LogFormatter` 接口：

```typescript
interface LogFormatter {
  format(entry: LogEntry): string
}
```

## TextFormatter

人类可读的文本格式，适合控制台输出。

### 构造函数

```typescript
new TextFormatter(options?: TextFormatterOptions)
```

### 配置选项

```typescript
interface TextFormatterOptions {
  colorize?: boolean         // 是否彩色输出，默认 false
  timestamp?: boolean        // 是否显示时间戳，默认 true
  showLevel?: boolean        // 是否显示级别，默认 true
  showTags?: boolean         // 是否显示标签，默认 true
  showContext?: boolean      // 是否显示上下文，默认 false
  template?: string          // 自定义模板
  dateFormat?: string        // 日期格式
}
```

### 模板变量

- `{timestamp}` - 时间戳
- `{level}` - 日志级别
- `{message}` - 日志消息
- `{tags}` - 标签列表
- `{data}` - 附加数据
- `{context}` - 上下文信息

### 示例

```typescript
import { TextFormatter } from '@ldesign/logger'

// 基础用法
const formatter = new TextFormatter()

// 彩色输出
const formatter = new TextFormatter({
  colorize: true,
  timestamp: true
})

// 自定义模板
const formatter = new TextFormatter({
  template: '[{timestamp}] {level} [{tags}] {message}'
})
```

### 输出示例

```
[2024-01-01 12:00:00] INFO 用户登录
[2024-01-01 12:00:01] ERROR 请求失败
```

---

## JsonFormatter

JSON 格式，适合机器处理和日志分析。

### 构造函数

```typescript
new JsonFormatter(options?: JsonFormatterOptions)
```

### 配置选项

```typescript
interface JsonFormatterOptions {
  pretty?: boolean           // 是否格式化，默认 false
  indent?: number           // 缩进空格数，默认 2
  includeStack?: boolean    // 是否包含堆栈，默认 true
  excludeFields?: string[]  // 排除字段
}
```

### 示例

```typescript
import { JsonFormatter } from '@ldesign/logger'

// 紧凑格式
const formatter = new JsonFormatter()

// 格式化输出
const formatter = new JsonFormatter({
  pretty: true,
  indent: 2
})

// 排除某些字段
const formatter = new JsonFormatter({
  excludeFields: ['metadata', 'stack']
})
```

### 输出示例

紧凑格式：
```json
{"level":2,"message":"用户登录","timestamp":1704096000000,"data":{"userId":"123"}}
```

格式化输出：
```json
{
  "level": 2,
  "message": "用户登录",
  "timestamp": 1704096000000,
  "data": {
    "userId": "123"
  }
}
```

---

## CompactFormatter

紧凑格式，节省空间。

### 构造函数

```typescript
new CompactFormatter(options?: CompactFormatterOptions)
```

### 配置选项

```typescript
interface CompactFormatterOptions {
  separator?: string        // 字段分隔符，默认 ' '
  kvSeparator?: string     // 键值分隔符，默认 '='
}
```

### 示例

```typescript
import { CompactFormatter } from '@ldesign/logger'

const formatter = new CompactFormatter({
  separator: ' ',
  kvSeparator: '='
})
```

### 输出示例

```
INFO 用户登录 userId=123 ip=192.168.1.1
ERROR 请求失败 url=/api/users code=500
```

---

## 自定义格式化器

实现 `LogFormatter` 接口创建自定义格式化器。

### 基础示例

```typescript
import { LogFormatter, LogEntry, LogLevelNames } from '@ldesign/logger'

class MyFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = LogLevelNames[entry.level]
    const message = entry.message
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    
    return `${timestamp} [${level}] ${message}${data}`
  }
}

// 使用
const formatter = new MyFormatter()
```

### 高级示例：CSV 格式化器

```typescript
import { LogFormatter, LogEntry, LogLevelNames } from '@ldesign/logger'

class CsvFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = LogLevelNames[entry.level]
    const message = this.escape(entry.message)
    const data = entry.data ? this.escape(JSON.stringify(entry.data)) : ''
    const source = entry.source || ''
    
    return `${timestamp},${level},${source},${message},${data}`
  }
  
  private escape(value: string): string {
    // CSV 转义：引号加倍，用引号包裹
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}

// 使用
const formatter = new CsvFormatter()
```

### 高级示例：Markdown 格式化器

```typescript
import { LogFormatter, LogEntry, LogLevelNames } from '@ldesign/logger'

class MarkdownFormatter implements LogFormatter {
  private getIcon(level: number): string {
    const icons = {
      0: '🔍', // TRACE
      1: '🐛', // DEBUG
      2: '📝', // INFO
      3: '⚠️', // WARN
      4: '❌', // ERROR
      5: '💥'  // FATAL
    }
    return icons[level] || '📝'
  }
  
  format(entry: LogEntry): string {
    const icon = this.getIcon(entry.level)
    const timestamp = new Date(entry.timestamp).toLocaleString()
    const level = LogLevelNames[entry.level]
    
    let output = `${icon} **${level}** - ${entry.message}\n`
    output += `> ${timestamp}\n`
    
    if (entry.data) {
      output += `\n\`\`\`json\n${JSON.stringify(entry.data, null, 2)}\n\`\`\`\n`
    }
    
    if (entry.error) {
      output += `\n**Error:** ${entry.error.message}\n`
      if (entry.stack) {
        output += `\n\`\`\`\n${entry.stack}\n\`\`\`\n`
      }
    }
    
    return output
  }
}

// 使用
const formatter = new MarkdownFormatter()
```

## 格式化器与传输器

格式化器通常与传输器一起使用：

```typescript
import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  TextFormatter,
  JsonFormatter
} from '@ldesign/logger'

const logger = createLogger({
  transports: [
    // 控制台使用文本格式
    new ConsoleTransport({
      formatter: new TextFormatter({
        colorize: true,
        timestamp: true
      })
    }),
    
    // HTTP 使用 JSON 格式
    new HttpTransport({
      url: 'https://api.example.com/logs',
      formatter: new JsonFormatter()
    })
  ]
})
```

## 相关文档

- [Logger API](/api/logger) - Logger API 文档
- [Transports API](/api/transports) - 传输器 API 文档
- [示例代码](/examples/custom-formatter) - 自定义格式化器示例

