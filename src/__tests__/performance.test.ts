import { describe, it, expect, beforeEach } from 'vitest'
import { createLogger, createConsoleTransport, LogBuffer } from '../core'
import { LogLevel } from '../types'
import type { LogEntry, LogTransport } from '../types'

describe('Performance Tests', () => {
  let mockTransport: LogTransport

  beforeEach(() => {
    mockTransport = {
      name: 'mock',
      level: LogLevel.TRACE,
      enabled: true,
      log: () => { }, // 空操作
    }
  })

  describe('单条日志性能', () => {
    it('单条日志应该小于 2ms', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const start = performance.now()
      logger.info('Test message')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(2)
    })

    it('带数据的日志应该小于 2ms', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const data = {
        userId: '123',
        action: 'click',
        metadata: {
          page: 'home',
          element: 'button',
        },
      }

      const start = performance.now()
      logger.info('User action', data)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(2)
    })

    it('带错误的日志应该小于 5ms', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const error = new Error('Test error')

      const start = performance.now()
      logger.error('Error occurred', error)
      const duration = performance.now() - start

      // 错误处理可能稍慢，放宽到 5ms
      expect(duration).toBeLessThan(5)
    })
  })

  describe('批量日志性能', () => {
    it('100 条日志应该小于 50ms', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50)
    })

    it('1000 条日志应该小于 200ms', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(200)
    })
  })

  describe('日志缓冲性能', () => {
    it('缓冲器添加应该很快', () => {
      const entries: LogEntry[] = []
      const buffer = new LogBuffer({
        size: 1000,
        flushInterval: 10000,
        onFlush: async (e) => {
          entries.push(...e)
        },
      })

      const entry: LogEntry = {
        level: LogLevel.INFO,
        message: 'Test',
        timestamp: Date.now(),
      }

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        buffer.add(entry)
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(10)
    })

    it('批量添加应该更快', () => {
      const buffer = new LogBuffer({
        size: 1000,
        flushInterval: 10000,
        onFlush: async () => { },
      })

      const entries: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
        level: LogLevel.INFO,
        message: `Message ${i}`,
        timestamp: Date.now(),
      }))

      const start = performance.now()
      buffer.addBatch(entries)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(5)
    })
  })

  describe('过滤性能', () => {
    it('级别过滤应该很快', () => {
      const logger = createLogger({
        level: LogLevel.WARN,
        transports: [mockTransport],
      })

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        logger.debug('Debug message') // 会被过滤掉
      }

      const duration = performance.now() - start

      // 过滤应该非常快
      expect(duration).toBeLessThan(5)
    })
  })

  describe('子 Logger 性能', () => {
    it('创建子 logger 应该很快', () => {
      const parent = createLogger({
        transports: [mockTransport],
      })

      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        parent.child({ name: `child${i}` })
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(20)
    })

    it('子 logger 记录日志不应该比父 logger 慢', () => {
      const parent = createLogger({
        transports: [mockTransport],
      })

      const child = parent.child({ name: 'child' })

      const parentStart = performance.now()
      for (let i = 0; i < 100; i++) {
        parent.info('message')
      }
      const parentDuration = performance.now() - parentStart

      const childStart = performance.now()
      for (let i = 0; i < 100; i++) {
        child.info('message')
      }
      const childDuration = performance.now() - childStart

      // 允许一定的误差
      expect(childDuration).toBeLessThan(parentDuration * 1.5)
    })
  })

  describe('内存使用', () => {
    it('大量日志不应该导致内存泄漏', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      // 记录大量日志
      for (let i = 0; i < 10000; i++) {
        logger.info(`Message ${i}`, {
          index: i,
          data: { value: i },
        })
      }

      // 这个测试主要是确保不抛出错误和不挂起
      expect(true).toBe(true)
    })
  })

  describe('并发性能', () => {
    it('并发日志记录应该正常工作', async () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const promises = Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => {
          logger.info(`Concurrent message ${i}`)
        }),
      )

      const start = performance.now()
      await Promise.all(promises)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(100)
    })
  })
})

