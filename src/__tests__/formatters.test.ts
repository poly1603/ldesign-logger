import { describe, it, expect } from 'vitest'
import { JsonFormatter, TextFormatter, CompactFormatter } from '../formatters'
import { LogLevel } from '../types'
import type { LogEntry } from '../types'

describe('Formatters', () => {
  const basicEntry: LogEntry = {
    level: LogLevel.INFO,
    message: 'Test message',
    timestamp: 1700000000000,
    source: 'test',
  }

  const fullEntry: LogEntry = {
    level: LogLevel.ERROR,
    message: 'Error occurred',
    timestamp: 1700000000000,
    source: 'app.service',
    data: { userId: '123' },
    error: new Error('Test error'),
    userId: 'user-123',
    sessionId: 'session-abc',
    tags: ['critical', 'database'],
  }

  describe('JsonFormatter', () => {
    it('应该格式化为 JSON 字符串', () => {
      const formatter = new JsonFormatter()
      const output = formatter.format(basicEntry)
      const parsed = JSON.parse(output)

      expect(parsed.message).toBe('Test message')
      expect(parsed.level).toBe('INFO')
      expect(parsed.source).toBe('test')
    })

    it('应该支持美化输出', () => {
      const formatter = new JsonFormatter({ pretty: true })
      const output = formatter.format(basicEntry)

      expect(output).toContain('\n')
      expect(output).toContain('  ')
    })

    it('应该包含所有字段', () => {
      const formatter = new JsonFormatter()
      const output = formatter.format(fullEntry)
      const parsed = JSON.parse(output)

      expect(parsed.message).toBe('Error occurred')
      expect(parsed.level).toBe('ERROR')
      expect(parsed.data).toEqual({ userId: '123' })
      expect(parsed.error).toBeDefined()
      expect(parsed.userId).toBe('user-123')
      expect(parsed.sessionId).toBe('session-abc')
      expect(parsed.tags).toEqual(['critical', 'database'])
    })

    it('应该支持配置包含的字段', () => {
      const formatter = new JsonFormatter({
        includeTimestamp: false,
        includeSource: false,
      })
      const output = formatter.format(basicEntry)
      const parsed = JSON.parse(output)

      expect(parsed.timestamp).toBeUndefined()
      expect(parsed.source).toBeUndefined()
      expect(parsed.message).toBe('Test message')
    })
  })

  describe('TextFormatter', () => {
    it('应该格式化为可读文本', () => {
      const formatter = new TextFormatter()
      const output = formatter.format(basicEntry)

      expect(output).toContain('[INFO]')
      expect(output).toContain('[test]')
      expect(output).toContain('Test message')
    })

    it('应该格式化完整条目', () => {
      const formatter = new TextFormatter()
      const output = formatter.format(fullEntry)

      expect(output).toContain('[ERROR]')
      expect(output).toContain('Error occurred')
      expect(output).toContain('Data:')
      expect(output).toContain('Error:')
      expect(output).toContain('UserId:')
      expect(output).toContain('SessionId:')
      expect(output).toContain('Tags:')
    })

    it('应该支持不同的时间戳格式', () => {
      const isoFormatter = new TextFormatter({ timestampFormat: 'iso' })
      const localeFormatter = new TextFormatter({ timestampFormat: 'locale' })
      const timeFormatter = new TextFormatter({ timestampFormat: 'time' })

      const isoOutput = isoFormatter.format(basicEntry)
      const localeOutput = localeFormatter.format(basicEntry)
      const timeOutput = timeFormatter.format(basicEntry)

      expect(isoOutput).toContain('T')
      expect(localeOutput).toBeDefined()
      expect(timeOutput).toBeDefined()
    })

    it('应该支持自定义分隔符', () => {
      const formatter = new TextFormatter({ separator: ' | ' })
      const output = formatter.format(basicEntry)

      expect(output).toContain(' | ')
    })
  })

  describe('CompactFormatter', () => {
    it('应该格式化为紧凑文本', () => {
      const formatter = new CompactFormatter()
      const output = formatter.format(basicEntry)

      expect(output).toContain('I') // INFO 的首字母
      expect(output).toContain('test')
      expect(output).toContain('Test message')
      expect(output).toContain('|')
    })

    it('应该截断长消息', () => {
      const formatter = new CompactFormatter({ maxMessageLength: 10 })
      const longEntry: LogEntry = {
        ...basicEntry,
        message: 'This is a very long message that should be truncated',
      }

      const output = formatter.format(longEntry)
      expect(output.length).toBeLessThan(100)
      expect(output).toContain('...')
    })

    it('应该简化显示附加信息', () => {
      const formatter = new CompactFormatter()
      const output = formatter.format(fullEntry)

      expect(output).toContain('+data')
      expect(output).toContain('err:')
      expect(output).toContain('#critical#database')
    })

    it('应该支持可选时间戳', () => {
      const withTimestamp = new CompactFormatter({ includeTimestamp: true })
      const withoutTimestamp = new CompactFormatter({ includeTimestamp: false })

      const output1 = withTimestamp.format(basicEntry)
      const output2 = withoutTimestamp.format(basicEntry)

      expect(output1).toContain(':')
      expect(output2).not.toContain(':')
    })

    it('应该简化来源显示', () => {
      const formatter = new CompactFormatter()
      const nestedEntry: LogEntry = {
        ...basicEntry,
        source: 'app.service.user.module',
      }

      const output = formatter.format(nestedEntry)
      expect(output).toContain('module')
      expect(output).not.toContain('app.service.user')
    })
  })
})




