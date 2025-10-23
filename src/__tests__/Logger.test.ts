import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger, createLogger } from '../core/Logger'
import { LogLevel } from '../types'
import type { LogTransport } from '../types'

describe('Logger', () => {
  let mockTransport: LogTransport
  let consoleSpy: any

  beforeEach(() => {
    // 创建模拟传输器
    mockTransport = {
      name: 'mock',
      level: LogLevel.TRACE,
      enabled: true,
      log: vi.fn(),
    }

    // 模拟 console.error
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('基础功能', () => {
    it('应该创建 logger 实例', () => {
      const logger = createLogger()
      expect(logger).toBeInstanceOf(Logger)
    })

    it('应该使用默认配置', () => {
      const logger = createLogger()
      expect(logger).toBeDefined()
    })

    it('应该使用自定义配置', () => {
      const logger = createLogger({
        name: 'test',
        level: LogLevel.ERROR,
        enabled: false,
      })
      expect(logger).toBeDefined()
    })
  })

  describe('日志方法', () => {
    it('应该调用 trace 方法', () => {
      const logger = createLogger({
        level: LogLevel.TRACE,
        transports: [mockTransport],
      })

      logger.trace('test message')
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.TRACE,
          message: 'test message',
        }),
      )
    })

    it('应该调用 debug 方法', () => {
      const logger = createLogger({
        level: LogLevel.DEBUG,
        transports: [mockTransport],
      })

      logger.debug('test message')
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.DEBUG,
          message: 'test message',
        }),
      )
    })

    it('应该调用 info 方法', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      logger.info('test message')
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.INFO,
          message: 'test message',
        }),
      )
    })

    it('应该调用 warn 方法', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      logger.warn('test message')
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.WARN,
          message: 'test message',
        }),
      )
    })

    it('应该调用 error 方法', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const error = new Error('test error')
      logger.error('test message', error)
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.ERROR,
          message: 'test message',
          error,
        }),
      )
    })

    it('应该调用 fatal 方法', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const error = new Error('fatal error')
      logger.fatal('test message', error)
      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.FATAL,
          message: 'test message',
          error,
        }),
      )
    })
  })

  describe('日志级别过滤', () => {
    it('应该过滤低于设置级别的日志', () => {
      const logger = createLogger({
        level: LogLevel.WARN,
        transports: [mockTransport],
      })

      logger.debug('debug message')
      logger.info('info message')
      logger.warn('warn message')
      logger.error('error message')

      expect(mockTransport.log).toHaveBeenCalledTimes(2)
    })

    it('应该允许动态修改日志级别', () => {
      const logger = createLogger({
        level: LogLevel.INFO,
        transports: [mockTransport],
      })

      logger.debug('debug 1')
      expect(mockTransport.log).not.toHaveBeenCalled()

      logger.setLevel(LogLevel.DEBUG)
      logger.debug('debug 2')
      expect(mockTransport.log).toHaveBeenCalledTimes(1)
    })
  })

  describe('传输器管理', () => {
    it('应该添加传输器', () => {
      const logger = createLogger()
      logger.addTransport(mockTransport)

      logger.info('test')
      expect(mockTransport.log).toHaveBeenCalled()
    })

    it('应该移除传输器', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      logger.info('test 1')
      expect(mockTransport.log).toHaveBeenCalledTimes(1)

      logger.removeTransport('mock')
      logger.info('test 2')
      expect(mockTransport.log).toHaveBeenCalledTimes(1)
    })

    it('不应该重复添加同名传输器', () => {
      const logger = createLogger()
      logger.addTransport(mockTransport)
      logger.addTransport(mockTransport)

      logger.info('test')
      expect(mockTransport.log).toHaveBeenCalledTimes(1)
    })
  })

  describe('启用/禁用', () => {
    it('禁用后不应该记录日志', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      logger.disable()
      logger.info('test')
      expect(mockTransport.log).not.toHaveBeenCalled()

      logger.enable()
      logger.info('test')
      expect(mockTransport.log).toHaveBeenCalled()
    })
  })

  describe('子 Logger', () => {
    it('应该创建子 logger', () => {
      const parent = createLogger({
        name: 'parent',
        transports: [mockTransport],
      })

      const child = parent.child({ name: 'child' })
      child.info('test')

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'parent.child',
        }),
      )
    })

    it('子 logger 应该继承父 logger 的传输器', () => {
      const parent = createLogger({
        name: 'parent',
        transports: [mockTransport],
      })

      const child = parent.child({ name: 'child' })
      child.info('test')

      expect(mockTransport.log).toHaveBeenCalled()
    })

    it('子 logger 可以覆盖配置', () => {
      const parent = createLogger({
        name: 'parent',
        level: LogLevel.INFO,
        transports: [mockTransport],
      })

      const child = parent.child({
        name: 'child',
        level: LogLevel.ERROR,
      })

      child.info('info')
      expect(mockTransport.log).not.toHaveBeenCalled()

      child.error('error')
      expect(mockTransport.log).toHaveBeenCalled()
    })
  })

  describe('日志元数据', () => {
    it('应该包含时间戳', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      logger.info('test')

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(Number),
        }),
      )
    })

    it('应该包含附加数据', () => {
      const logger = createLogger({
        transports: [mockTransport],
      })

      const data = { userId: '123' }
      logger.info('test', data)

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          data,
        }),
      )
    })

    it('应该包含用户 ID 和会话 ID', () => {
      const logger = createLogger({
        userId: 'user-123',
        sessionId: 'session-abc',
        transports: [mockTransport],
      })

      logger.info('test')

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          sessionId: 'session-abc',
        }),
      )
    })

    it('应该包含标签', () => {
      const logger = createLogger({
        defaultTags: ['tag1', 'tag2'],
        transports: [mockTransport],
      })

      logger.info('test')

      expect(mockTransport.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2'],
        }),
      )
    })
  })

  describe('异步操作', () => {
    it('应该刷新所有传输器', async () => {
      const flushSpy = vi.fn()
      const transport: LogTransport = {
        name: 'test',
        level: LogLevel.INFO,
        enabled: true,
        log: vi.fn(),
        flush: flushSpy,
      }

      const logger = createLogger({
        transports: [transport],
      })

      await logger.flush()
      expect(flushSpy).toHaveBeenCalled()
    })

    it('应该销毁所有传输器', async () => {
      const destroySpy = vi.fn()
      const transport: LogTransport = {
        name: 'test',
        level: LogLevel.INFO,
        enabled: true,
        log: vi.fn(),
        destroy: destroySpy,
      }

      const logger = createLogger({
        transports: [transport],
      })

      await logger.destroy()
      expect(destroySpy).toHaveBeenCalled()
    })
  })
})




