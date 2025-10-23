/**
 * 自定义格式化器示例
 */

import {
  createLogger,
  createConsoleTransport,
  createJsonFormatter,
  createTextFormatter,
  createCompactFormatter,
  LogLevel,
} from '@ldesign/logger'

// 使用 JSON 格式化器
const jsonFormatter = createJsonFormatter({
  pretty: true,
  includeTimestamp: true,
})

console.log('=== JSON Formatter ===')
const entry1 = {
  level: LogLevel.INFO,
  message: 'User logged in',
  timestamp: Date.now(),
  source: 'auth',
  data: { userId: '123' },
}
console.log(jsonFormatter.format(entry1))

// 使用文本格式化器
const textFormatter = createTextFormatter({
  timestampFormat: 'locale',
  includeTimestamp: true,
})

console.log('\n=== Text Formatter ===')
const entry2 = {
  level: LogLevel.ERROR,
  message: 'Database connection failed',
  timestamp: Date.now(),
  source: 'database',
  error: new Error('Connection timeout'),
}
console.log(textFormatter.format(entry2))

// 使用紧凑格式化器
const compactFormatter = createCompactFormatter({
  includeTimestamp: true,
  maxMessageLength: 50,
})

console.log('\n=== Compact Formatter ===')
const entry3 = {
  level: LogLevel.WARN,
  message: 'This is a very long warning message that should be truncated to fit the compact format',
  timestamp: Date.now(),
  source: 'app.service.user',
  tags: ['performance', 'slow'],
}
console.log(compactFormatter.format(entry3))

// 实际使用中，可以创建自定义传输器来使用格式化器
// 或者在传输器中集成格式化器
const logger = createLogger({
  name: 'app',
  transports: [createConsoleTransport()],
})

logger.info('Standard console output')




