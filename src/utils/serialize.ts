/**
 * 序列化工具函数
 */

/**
 * 循环引用检测器
 */
function createCircularReplacer() {
  const seen = new WeakSet()

  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }
}

/**
 * 安全序列化数据
 */
export function serializeData(data: any, maxDepth = 5): any {
  if (data === null || data === undefined) {
    return data
  }

  // 基本类型直接返回
  if (typeof data !== 'object') {
    return data
  }

  // 处理日期
  if (data instanceof Date) {
    return data.toISOString()
  }

  // 处理错误对象
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    }
  }

  // 处理数组
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item, maxDepth - 1))
  }

  // 处理普通对象
  if (maxDepth <= 0) {
    return '[Max Depth Reached]'
  }

  const result: any = {}
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      try {
        result[key] = serializeData(data[key], maxDepth - 1)
      }
      catch (error) {
        result[key] = '[Serialization Error]'
      }
    }
  }

  return result
}

/**
 * 转换为 JSON 字符串
 */
export function toJSON(data: any, pretty = false): string {
  try {
    if (pretty) {
      return JSON.stringify(data, createCircularReplacer(), 2)
    }
    return JSON.stringify(data, createCircularReplacer())
  }
  catch (error) {
    return '[JSON Serialization Failed]'
  }
}

/**
 * 计算对象大小（粗略估计，字节）
 */
export function estimateSize(data: any): number {
  const str = toJSON(data)
  return new Blob([str]).size
}




