/**
 * 数据清理工具 - 移除敏感信息
 */

/**
 * 敏感字段名称（小写）
 */
const SENSITIVE_KEYS = new Set([
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'authorization',
  'auth',
  'credential',
  'creditcard',
  'credit_card',
  'ssn',
  'social_security',
])

/**
 * 检查字段名是否敏感
 */
function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase().replace(/[-_]/g, '')
  return SENSITIVE_KEYS.has(lowerKey)
}

/**
 * 替换值
 */
const REDACTED = '[REDACTED]'

/**
 * 清理对象中的敏感数据
 */
export function sanitize(data: any, customSensitiveKeys?: string[]): any {
  if (data === null || data === undefined) {
    return data
  }

  // 基本类型直接返回
  if (typeof data !== 'object') {
    return data
  }

  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item, customSensitiveKeys))
  }

  // 处理对象
  const result: any = {}

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // 检查是否为敏感字段（包括自定义字段）
      const isCustomSensitive = customSensitiveKeys?.some(
        customKey => key.toLowerCase().replace(/[-_]/g, '') === customKey.toLowerCase().replace(/[-_]/g, ''),
      )

      if (isSensitiveKey(key) || isCustomSensitive) {
        result[key] = REDACTED
      }
      else {
        // 递归清理
        result[key] = sanitize(data[key], customSensitiveKeys)
      }
    }
  }

  return result
}

/**
 * 添加自定义敏感字段
 */
export function addSensitiveKey(key: string): void {
  SENSITIVE_KEYS.add(key.toLowerCase().replace(/[-_]/g, ''))
}

/**
 * 移除自定义敏感字段
 */
export function removeSensitiveKey(key: string): void {
  SENSITIVE_KEYS.delete(key.toLowerCase().replace(/[-_]/g, ''))
}

/**
 * 获取所有敏感字段
 */
export function getSensitiveKeys(): string[] {
  return Array.from(SENSITIVE_KEYS)
}

