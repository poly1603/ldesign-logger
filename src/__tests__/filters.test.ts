import { describe, it, expect } from 'vitest'
import {
  LevelFilter,
  TagFilter,
  PatternFilter,
  CompositeFilter,
} from '../filters'
import { LogLevel } from '../types'
import type { LogEntry } from '../types'

describe('Filters', () => {
  const createEntry = (level: LogLevel, message: string, options?: Partial<LogEntry>): LogEntry => ({
    level,
    message,
    timestamp: Date.now(),
    source: 'test',
    ...options,
  })

  describe('LevelFilter', () => {
    it('应该过滤最小级别', () => {
      const filter = new LevelFilter({ minLevel: LogLevel.WARN })

      expect(filter.filter(createEntry(LogLevel.DEBUG, 'debug'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'info'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.WARN, 'warn'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'error'))).toBe(true)
    })

    it('应该过滤最大级别', () => {
      const filter = new LevelFilter({ maxLevel: LogLevel.WARN })

      expect(filter.filter(createEntry(LogLevel.DEBUG, 'debug'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.WARN, 'warn'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'error'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.FATAL, 'fatal'))).toBe(false)
    })

    it('应该过滤级别范围', () => {
      const filter = new LevelFilter({
        minLevel: LogLevel.INFO,
        maxLevel: LogLevel.ERROR,
      })

      expect(filter.filter(createEntry(LogLevel.DEBUG, 'debug'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'info'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.WARN, 'warn'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'error'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.FATAL, 'fatal'))).toBe(false)
    })

    it('应该精确匹配级别', () => {
      const filter = new LevelFilter({
        exactLevels: [LogLevel.WARN, LogLevel.ERROR],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'info'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.WARN, 'warn'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'error'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.FATAL, 'fatal'))).toBe(false)
    })
  })

  describe('TagFilter', () => {
    it('应该包含指定标签', () => {
      const filter = new TagFilter({
        includeTags: ['auth', 'security'],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['security'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['api'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: [] }))).toBe(false)
    })

    it('应该排除指定标签', () => {
      const filter = new TagFilter({
        excludeTags: ['debug', 'test'],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['debug'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['test'] }))).toBe(false)
    })

    it('应该要求包含所有标签', () => {
      const filter = new TagFilter({
        includeTags: ['auth', 'security'],
        requireAllTags: true,
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth', 'security'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth', 'security', 'api'] }))).toBe(true)
    })

    it('应该同时处理包含和排除', () => {
      const filter = new TagFilter({
        includeTags: ['auth'],
        excludeTags: ['test'],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['test'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['auth', 'test'] }))).toBe(false)
    })
  })

  describe('PatternFilter', () => {
    it('应该匹配消息模式', () => {
      const filter = new PatternFilter({
        pattern: /error|failed/i,
        field: 'message',
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'Operation successful'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'Operation failed'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'An error occurred'))).toBe(true)
    })

    it('应该匹配来源模式', () => {
      const filter = new PatternFilter({
        pattern: /^api\./,
        field: 'source',
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { source: 'api.user' }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { source: 'api.auth' }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { source: 'database' }))).toBe(false)
    })

    it('应该支持反转匹配', () => {
      const filter = new PatternFilter({
        pattern: /debug|test/i,
        field: 'message',
        invert: true,
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'Production log'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.DEBUG, 'Debug log'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.INFO, 'Test log'))).toBe(false)
    })

    it('应该处理字符串模式', () => {
      const filter = new PatternFilter({
        pattern: 'error',
        field: 'message',
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'success'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'error occurred'))).toBe(true)
    })
  })

  describe('CompositeFilter', () => {
    it('应该执行 AND 操作', () => {
      const filter = new CompositeFilter({
        operator: 'AND',
        filters: [
          new LevelFilter({ minLevel: LogLevel.WARN }),
          new TagFilter({ includeTags: ['critical'] }),
        ],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['critical'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'msg', { tags: ['normal'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'msg', { tags: ['critical'] }))).toBe(true)
    })

    it('应该执行 OR 操作', () => {
      const filter = new CompositeFilter({
        operator: 'OR',
        filters: [
          new LevelFilter({ minLevel: LogLevel.ERROR }),
          new TagFilter({ includeTags: ['important'] }),
        ],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'msg'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['important'] }))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'msg', { tags: ['important'] }))).toBe(true)
    })

    it('应该执行 NOT 操作', () => {
      const filter = new CompositeFilter({
        operator: 'NOT',
        filters: [
          new TagFilter({ includeTags: ['exclude'] }),
        ],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['exclude'] }))).toBe(false)
    })

    it('应该支持添加和移除过滤器', () => {
      const filter = new CompositeFilter({
        operator: 'AND',
        filters: [],
      })

      const levelFilter = new LevelFilter({ minLevel: LogLevel.WARN })
      filter.addFilter(levelFilter)

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg'))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.WARN, 'msg'))).toBe(true)

      filter.removeFilter('level')
      expect(filter.filter(createEntry(LogLevel.INFO, 'msg'))).toBe(true)
    })

    it('应该嵌套组合过滤器', () => {
      const filter = new CompositeFilter({
        operator: 'AND',
        filters: [
          new LevelFilter({ minLevel: LogLevel.WARN }),
          new CompositeFilter({
            operator: 'OR',
            filters: [
              new TagFilter({ includeTags: ['critical'] }),
              new PatternFilter({ pattern: /urgent/i, field: 'message' }),
            ],
          }),
        ],
      })

      expect(filter.filter(createEntry(LogLevel.INFO, 'msg', { tags: ['critical'] }))).toBe(false)
      expect(filter.filter(createEntry(LogLevel.WARN, 'urgent issue'))).toBe(true)
      expect(filter.filter(createEntry(LogLevel.ERROR, 'msg', { tags: ['critical'] }))).toBe(true)
    })
  })
})




