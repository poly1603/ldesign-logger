/**
 * 敏感信息脱敏工具
 * @description 用于处理日志中的敏感信息
 */

import type { SanitizeConfig } from '../types'

/** 默认敏感字段列表 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'authorization',
  'auth',
  'credit_card',
  'creditCard',
  'card_number',
  'cardNumber',
  'cvv',
  'cvc',
  'ssn',
  'social_security',
  'phone',
  'mobile',
  'email',
  'private_key',
  'privateKey',
]

/** 默认脱敏配置 */
const DEFAULT_CONFIG: Required<SanitizeConfig> = {
  sensitiveFields: DEFAULT_SENSITIVE_FIELDS,
  maskChar: '*',
  keepPrefix: 2,
  keepSuffix: 2,
  customSanitizer: undefined as unknown as (key: string, value: unknown) => unknown,
}

/**
 * 脱敏字符串
 * @description 对字符串进行脱敏处理
 * @param value - 需要脱敏的字符串
 * @param maskChar - 脱敏字符
 * @param keepPrefix - 保留前缀字符数
 * @param keepSuffix - 保留后缀字符数
 * @returns 脱敏后的字符串
 * @example
 * ```ts
 * maskString('password123', '*', 2, 2)
 * // 返回 'pa*******23'
 * ```
 */
export function maskString(
  value: string,
  maskChar: string = '*',
  keepPrefix: number = 2,
  keepSuffix: number = 2,
): string {
  if (value.length <= keepPrefix + keepSuffix) {
    return maskChar.repeat(value.length)
  }

  const prefix = value.slice(0, keepPrefix)
  const suffix = value.slice(-keepSuffix)
  const maskLength = value.length - keepPrefix - keepSuffix

  return `${prefix}${maskChar.repeat(maskLength)}${suffix}`
}

/**
 * 检查是否为敏感字段
 * @description 判断字段名是否在敏感字段列表中
 * @param key - 字段名
 * @param sensitiveFields - 敏感字段列表
 * @returns 是否为敏感字段
 */
export function isSensitiveField(key: string, sensitiveFields: string[]): boolean {
  const lowerKey = key.toLowerCase()
  return sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))
}

/**
 * 脱敏对象
 * @description 递归处理对象中的敏感信息
 * @param obj - 需要脱敏的对象
 * @param config - 脱敏配置
 * @returns 脱敏后的对象
 * @example
 * ```ts
 * const data = { username: 'john', password: 'secret123' }
 * sanitizeObject(data)
 * // 返回 { username: 'john', password: 'se*****23' }
 * ```
 */
export function sanitizeObject(
  obj: unknown,
  config: SanitizeConfig = {},
): unknown {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  const { sensitiveFields, maskChar, keepPrefix, keepSuffix, customSanitizer } = mergedConfig

  // 处理基本类型
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, config))
  }

  // 处理对象
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // 使用自定义脱敏函数
    if (customSanitizer) {
      result[key] = customSanitizer(key, value)
      continue
    }

    // 检查是否为敏感字段
    if (isSensitiveField(key, sensitiveFields!)) {
      if (typeof value === 'string') {
        result[key] = maskString(value, maskChar, keepPrefix, keepSuffix)
      }
      else {
        result[key] = '[REDACTED]'
      }
    }
    else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      result[key] = sanitizeObject(value, config)
    }
    else {
      result[key] = value
    }
  }

  return result
}

/**
 * 创建脱敏处理器
 * @description 创建一个可重用的脱敏处理器
 * @param config - 脱敏配置
 * @returns 脱敏处理函数
 */
export function createSanitizer(config: SanitizeConfig = {}) {
  return (data: unknown): unknown => sanitizeObject(data, config)
}

