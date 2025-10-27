/**
 * 数据清理工具 - 移除敏感信息
 * 
 * 用于保护日志中的敏感数据，防止密码、令牌等泄露
 * 
 * 特性：
 * - 自动识别常见敏感字段
 * - 支持自定义敏感字段
 * - 递归清理嵌套对象
 * - 保留数据结构
 * 
 * 使用场景：
 * - API 请求日志脱敏
 * - 用户数据日志保护
 * - 合规性要求（GDPR、HIPAA 等）
 */

/**
 * 内置敏感字段名称集合（小写，已移除分隔符）
 * 
 * 包含常见的敏感字段如：
 * - 密码类：password, passwd, pwd
 * - 令牌类：token, apikey, accesstoken
 * - 认证类：authorization, auth, credential
 * - 支付类：creditcard, credit_card
 * - 个人信息：ssn, social_security
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
 * 检查字段名是否为敏感字段
 * 
 * 检查逻辑：
 * 1. 转换为小写
 * 2. 移除分隔符（- 和 _）
 * 3. 在敏感字段集合中查找
 * 
 * @param key - 字段名
 * @returns true 表示敏感字段
 * 
 * @private
 */
function isSensitiveKey(key: string): boolean {
  // 归一化：小写 + 移除分隔符
  const normalizedKey = key.toLowerCase().replace(/[-_]/g, '')
  return SENSITIVE_KEYS.has(normalizedKey)
}

/**
 * 敏感数据替换值
 * 
 * 用此字符串替换所有敏感字段的值
 */
const REDACTED = '[REDACTED]'

/**
 * 清理对象中的敏感数据
 * 
 * 递归遍历对象，将敏感字段的值替换为 '[REDACTED]'
 * 
 * 处理的数据类型：
 * - 对象：递归清理
 * - 数组：递归清理每个元素
 * - 基本类型：直接返回
 * 
 * @param data - 要清理的数据
 * @param customSensitiveKeys - 自定义敏感字段列表（可选）
 * @returns 清理后的数据（新对象，不修改原对象）
 * 
 * @example
 * ```ts
 * const userData = {
 *   username: 'john',
 *   password: '123456',
 *   email: 'john@example.com'
 * }
 * 
 * const cleaned = sanitize(userData)
 * console.log(cleaned)
 * // {
 * //   username: 'john',
 * //   password: '[REDACTED]',
 * //   email: 'john@example.com'
 * // }
 * ```
 * 
 * @example
 * ```ts
 * // 使用自定义敏感字段
 * const data = {
 *   username: 'john',
 *   customSecret: 'secret123'
 * }
 * 
 * const cleaned = sanitize(data, ['customSecret'])
 * // { username: 'john', customSecret: '[REDACTED]' }
 * ```
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
 * 
 * 动态添加敏感字段到全局集合
 * 
 * 注意：此操作会影响所有后续的 `sanitize()` 调用
 * 
 * @param key - 要添加的敏感字段名
 * 
 * @example
 * ```ts
 * // 添加公司特定的敏感字段
 * addSensitiveKey('employeeId')
 * addSensitiveKey('salary')
 * 
 * const data = { name: 'John', salary: 50000 }
 * const cleaned = sanitize(data)
 * // { name: 'John', salary: '[REDACTED]' }
 * ```
 */
export function addSensitiveKey(key: string): void {
  // 归一化后添加
  SENSITIVE_KEYS.add(key.toLowerCase().replace(/[-_]/g, ''))
}

/**
 * 移除自定义敏感字段
 * 
 * 从全局集合中移除指定的敏感字段
 * 
 * 注意：无法移除内置的敏感字段
 * 
 * @param key - 要移除的敏感字段名
 * 
 * @example
 * ```ts
 * // 移除之前添加的字段
 * removeSensitiveKey('employeeId')
 * ```
 */
export function removeSensitiveKey(key: string): void {
  SENSITIVE_KEYS.delete(key.toLowerCase().replace(/[-_]/g, ''))
}

/**
 * 获取所有敏感字段列表
 * 
 * 返回当前所有被识别为敏感的字段名称
 * 
 * @returns 敏感字段名称数组
 * 
 * @example
 * ```ts
 * const keys = getSensitiveKeys()
 * console.log('当前敏感字段:', keys)
 * // ['password', 'token', 'apikey', ...]
 * ```
 */
export function getSensitiveKeys(): string[] {
  return Array.from(SENSITIVE_KEYS)
}

