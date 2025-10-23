import { describe, it, expect } from 'vitest'
import {
  formatError,
  formatTimestamp,
  getTimestamp,
  truncate,
  formatStack,
  serializeData,
  toJSON,
  estimateSize,
  sanitize,
  addSensitiveKey,
  removeSensitiveKey,
} from '../utils'

describe('Utils', () => {
  describe('formatError', () => {
    it('应该格式化错误对象', () => {
      const error = new Error('Test error')
      const formatted = formatError(error)

      expect(formatted.name).toBe('Error')
      expect(formatted.message).toBe('Test error')
      expect(formatted.stack).toBeDefined()
    })

    it('应该格式化自定义错误', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }

      const error = new CustomError('Custom error')
      const formatted = formatError(error)

      expect(formatted.name).toBe('CustomError')
      expect(formatted.message).toBe('Custom error')
    })
  })

  describe('formatTimestamp', () => {
    const timestamp = 1700000000000

    it('应该格式化为 ISO 字符串', () => {
      const formatted = formatTimestamp(timestamp, 'iso')
      expect(formatted).toContain('T')
      expect(formatted).toContain('Z')
    })

    it('应该格式化为本地字符串', () => {
      const formatted = formatTimestamp(timestamp, 'locale')
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('应该格式化为时间字符串', () => {
      const formatted = formatTimestamp(timestamp, 'time')
      expect(formatted).toBeDefined()
      expect(typeof formatted).toBe('string')
    })

    it('应该使用默认格式', () => {
      const formatted = formatTimestamp(timestamp)
      expect(formatted).toContain('T')
    })
  })

  describe('getTimestamp', () => {
    it('应该返回当前时间戳', () => {
      const before = Date.now()
      const timestamp = getTimestamp()
      const after = Date.now()

      expect(timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('truncate', () => {
    it('应该截断长字符串', () => {
      const str = 'This is a very long string'
      const truncated = truncate(str, 10)

      expect(truncated.length).toBe(10)
      expect(truncated).toBe('This is...')
    })

    it('不应该截断短字符串', () => {
      const str = 'Short'
      const truncated = truncate(str, 10)

      expect(truncated).toBe(str)
    })
  })

  describe('formatStack', () => {
    it('应该格式化堆栈跟踪', () => {
      const stack = 'Line 1\nLine 2\nLine 3'
      const formatted = formatStack(stack, 10)

      expect(formatted).toBe(stack)
    })

    it('应该截断长堆栈', () => {
      const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`)
      const stack = lines.join('\n')
      const formatted = formatStack(stack, 5)

      expect(formatted).toContain('Line 1')
      expect(formatted).toContain('Line 5')
      expect(formatted).toContain('truncated')
      expect(formatted).not.toContain('Line 20')
    })

    it('应该处理 undefined', () => {
      const formatted = formatStack(undefined)
      expect(formatted).toBeUndefined()
    })
  })

  describe('serializeData', () => {
    it('应该序列化基本类型', () => {
      expect(serializeData(null)).toBe(null)
      expect(serializeData(undefined)).toBe(undefined)
      expect(serializeData(123)).toBe(123)
      expect(serializeData('test')).toBe('test')
      expect(serializeData(true)).toBe(true)
    })

    it('应该序列化日期', () => {
      const date = new Date('2023-01-01T00:00:00.000Z')
      const serialized = serializeData(date)

      expect(serialized).toBe('2023-01-01T00:00:00.000Z')
    })

    it('应该序列化错误对象', () => {
      const error = new Error('Test error')
      const serialized = serializeData(error)

      expect(serialized.name).toBe('Error')
      expect(serialized.message).toBe('Test error')
      expect(serialized.stack).toBeDefined()
    })

    it('应该序列化数组', () => {
      const arr = [1, 'test', { key: 'value' }]
      const serialized = serializeData(arr)

      expect(serialized).toEqual(arr)
    })

    it('应该序列化对象', () => {
      const obj = {
        str: 'test',
        num: 123,
        nested: { key: 'value' },
      }
      const serialized = serializeData(obj)

      expect(serialized).toEqual(obj)
    })

    it('应该限制深度', () => {
      const deep = { l1: { l2: { l3: { l4: { l5: { l6: 'value' } } } } } }
      const serialized = serializeData(deep, 3)

      expect(serialized.l1.l2.l3).toBe('[Max Depth Reached]')
    })
  })

  describe('toJSON', () => {
    it('应该转换为 JSON 字符串', () => {
      const obj = { key: 'value', num: 123 }
      const json = toJSON(obj)

      expect(json).toBe('{"key":"value","num":123}')
    })

    it('应该美化 JSON', () => {
      const obj = { key: 'value' }
      const json = toJSON(obj, true)

      expect(json).toContain('\n')
      expect(json).toContain('  ')
    })

    it('应该处理循环引用', () => {
      const obj: any = { key: 'value' }
      obj.self = obj

      const json = toJSON(obj)
      expect(json).toContain('Circular')
    })
  })

  describe('estimateSize', () => {
    it('应该估算数据大小', () => {
      const small = { key: 'value' }
      const large = { key: 'value'.repeat(100) }

      const smallSize = estimateSize(small)
      const largeSize = estimateSize(large)

      expect(largeSize).toBeGreaterThan(smallSize)
    })
  })

  describe('sanitize', () => {
    it('应该移除敏感字段', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        email: 'john@example.com',
      }

      const sanitized = sanitize(data)

      expect(sanitized.username).toBe('john')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.email).toBe('john@example.com')
    })

    it('应该处理多种敏感字段', () => {
      const data = {
        token: 'abc123',
        apiKey: 'xyz789',
        secret: 'hidden',
        authorization: 'Bearer token',
        creditCard: '1234-5678-9012-3456',
      }

      const sanitized = sanitize(data)

      expect(sanitized.token).toBe('[REDACTED]')
      expect(sanitized.apiKey).toBe('[REDACTED]')
      expect(sanitized.secret).toBe('[REDACTED]')
      expect(sanitized.authorization).toBe('[REDACTED]')
      expect(sanitized.creditCard).toBe('[REDACTED]')
    })

    it('应该递归清理嵌套对象', () => {
      const data = {
        user: {
          name: 'john',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            apiKey: 'hidden',
          },
        },
      }

      const sanitized = sanitize(data)

      expect(sanitized.user.name).toBe('john')
      expect(sanitized.user.password).toBe('[REDACTED]')
      expect(sanitized.user.profile.email).toBe('john@example.com')
      expect(sanitized.user.profile.apiKey).toBe('[REDACTED]')
    })

    it('应该处理数组', () => {
      const data = {
        users: [
          { name: 'john', password: 'secret1' },
          { name: 'jane', password: 'secret2' },
        ],
      }

      const sanitized = sanitize(data)

      expect(sanitized.users[0].name).toBe('john')
      expect(sanitized.users[0].password).toBe('[REDACTED]')
      expect(sanitized.users[1].name).toBe('jane')
      expect(sanitized.users[1].password).toBe('[REDACTED]')
    })

    it('应该支持自定义敏感字段', () => {
      const data = {
        username: 'john',
        customSecret: 'hidden',
      }

      const sanitized = sanitize(data, ['customSecret'])

      expect(sanitized.username).toBe('john')
      expect(sanitized.customSecret).toBe('[REDACTED]')
    })

    it('应该处理基本类型', () => {
      expect(sanitize(null)).toBe(null)
      expect(sanitize(undefined)).toBe(undefined)
      expect(sanitize(123)).toBe(123)
      expect(sanitize('test')).toBe('test')
    })
  })

  describe('sensitive keys management', () => {
    it('应该添加敏感字段', () => {
      addSensitiveKey('mySecret')

      const data = { mySecret: 'hidden' }
      const sanitized = sanitize(data)

      expect(sanitized.mySecret).toBe('[REDACTED]')
    })

    it('应该移除敏感字段', () => {
      addSensitiveKey('tempSecret')
      removeSensitiveKey('tempSecret')

      const data = { tempSecret: 'visible' }
      const sanitized = sanitize(data)

      expect(sanitized.tempSecret).toBe('visible')
    })
  })
})




