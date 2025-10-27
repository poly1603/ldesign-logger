# 自定义格式化器

展示如何创建和使用自定义格式化器。

## 基础自定义

```typescript
import { LogFormatter, LogEntry, LogLevelNames } from '@ldesign/logger'

class SimpleFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const level = LogLevelNames[entry.level]
    return `[${level}] ${entry.message}`
  }
}

// 使用
const logger = createLogger({
  transports: [
    new ConsoleTransport({
      formatter: new SimpleFormatter()
    })
  ]
})
```

## 带时间戳的格式化器

```typescript
class TimestampFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = LogLevelNames[entry.level]
    const message = entry.message
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : ''
    
    return `${timestamp} [${level}] ${message}${data}`
  }
}
```

## CSV 格式化器

```typescript
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
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}
```

## Markdown 格式化器

```typescript
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
```

## HTML 格式化器

```typescript
class HtmlFormatter implements LogFormatter {
  private getColor(level: number): string {
    const colors = {
      0: '#999',     // TRACE
      1: '#6366f1',  // DEBUG
      2: '#3b82f6',  // INFO
      3: '#f59e0b',  // WARN
      4: '#ef4444',  // ERROR
      5: '#dc2626'   // FATAL
    }
    return colors[level] || '#3b82f6'
  }
  
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleString()
    const level = LogLevelNames[entry.level]
    const color = this.getColor(entry.level)
    
    let html = `<div class="log-entry">`
    html += `<span class="timestamp">${timestamp}</span>`
    html += `<span class="level" style="color: ${color}">[${level}]</span>`
    html += `<span class="message">${this.escapeHtml(entry.message)}</span>`
    
    if (entry.data) {
      html += `<pre class="data">${this.escapeHtml(JSON.stringify(entry.data, null, 2))}</pre>`
    }
    
    html += `</div>`
    
    return html
  }
  
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}
```

## 彩色格式化器

```typescript
class ColorFormatter implements LogFormatter {
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
  
  private getLevelColor(level: number): string {
    const levelColors = {
      0: this.colors.dim,     // TRACE
      1: this.colors.cyan,    // DEBUG
      2: this.colors.blue,    // INFO
      3: this.colors.yellow,  // WARN
      4: this.colors.red,     // ERROR
      5: this.colors.magenta  // FATAL
    }
    return levelColors[level] || this.colors.white
  }
  
  format(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const level = LogLevelNames[entry.level]
    const color = this.getLevelColor(entry.level)
    
    let output = `${this.colors.dim}[${timestamp}]${this.colors.reset} `
    output += `${color}${this.colors.bright}[${level}]${this.colors.reset} `
    output += entry.message
    
    if (entry.data) {
      output += `\n  ${this.colors.dim}${JSON.stringify(entry.data)}${this.colors.reset}`
    }
    
    return output
  }
}
```

## 使用示例

```typescript
// 不同传输器使用不同格式化器
const logger = createLogger({
  transports: [
    // 控制台：彩色格式
    new ConsoleTransport({
      formatter: new ColorFormatter()
    }),
    
    // HTTP：JSON 格式
    new HttpTransport({
      url: 'https://api.example.com/logs',
      formatter: new JsonFormatter()
    }),
    
    // 文件：CSV 格式（自定义传输器）
    new FileTransport({
      path: '/var/log/app.csv',
      formatter: new CsvFormatter()
    })
  ]
})
```

## 相关文档

- [Formatters API](/api/formatters)
- [Transports API](/api/transports)

