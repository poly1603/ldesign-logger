/**
 * ID 生成器工具
 * @description 生成唯一标识符的工具函数
 */

/** 计数器，用于生成顺序 ID */
let counter = 0

/**
 * 生成唯一 ID
 * @description 使用时间戳和计数器生成唯一标识符
 * @returns 唯一 ID 字符串
 * @example
 * ```ts
 * const id = generateId()
 * // 返回类似 'log_1701234567890_1'
 * ```
 */
export function generateId(): string {
  counter = (counter + 1) % 1000000
  return `log_${Date.now()}_${counter}`
}

/**
 * 生成 UUID v4
 * @description 生成符合 RFC 4122 的 UUID v4
 * @returns UUID 字符串
 * @example
 * ```ts
 * const uuid = generateUUID()
 * // 返回类似 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
 * ```
 */
export function generateUUID(): string {
  // 使用 crypto API 如果可用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 回退到手动生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 生成短 ID
 * @description 生成较短的唯一标识符
 * @param length - ID 长度，默认 8
 * @returns 短 ID 字符串
 * @example
 * ```ts
 * const shortId = generateShortId()
 * // 返回类似 'a1b2c3d4'
 * ```
 */
export function generateShortId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成关联 ID
 * @description 生成用于请求追踪的关联 ID
 * @returns 关联 ID 字符串
 * @example
 * ```ts
 * const correlationId = generateCorrelationId()
 * // 返回类似 'corr_a1b2c3d4e5f6'
 * ```
 */
export function generateCorrelationId(): string {
  return `corr_${generateShortId(12)}`
}

/**
 * 生成追踪 ID
 * @description 生成用于分布式追踪的 ID
 * @returns 追踪 ID 字符串
 * @example
 * ```ts
 * const traceId = generateTraceId()
 * // 返回类似 '1a2b3c4d5e6f7890'
 * ```
 */
export function generateTraceId(): string {
  const hex = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += hex.charAt(Math.floor(Math.random() * 16))
  }
  return result
}

