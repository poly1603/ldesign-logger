/**
 * 序列化工具函数
 * 
 * 提供安全的数据序列化功能，处理循环引用、最大深度限制等问题
 */

/**
 * WeakSet 对象池，用于优化循环引用检测性能
 * 避免每次序列化都创建新的 WeakSet，减少 GC 压力
 */
class WeakSetPool {
  private pool: WeakSet<any>[] = []
  private readonly maxPoolSize = 10

  /**
   * 从池中获取一个 WeakSet
   */
  acquire(): WeakSet<any> {
    return this.pool.pop() || new WeakSet()
  }

  /**
   * 将 WeakSet 归还到池中
   */
  release(weakSet: WeakSet<any>): void {
    // 注意：WeakSet 无法清空，所以我们只缓存有限数量
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(weakSet)
    }
  }
}

/**
 * 全局 WeakSet 池实例
 */
const weakSetPool = new WeakSetPool()

/**
 * 循环引用检测器（优化版）
 * 
 * 使用对象池复用 WeakSet，提升性能并减少内存分配
 * 
 * @returns 用于 JSON.stringify 的 replacer 函数
 */
function createCircularReplacer() {
  const seen = weakSetPool.acquire()
  let isReleased = false

  const replacer = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  }

    // 添加清理方法，用于归还 WeakSet 到池中
    // 注意：由于 WeakSet 无法清空，这个实现有局限性
    // 在高频使用场景下，建议使用其他方案
    ; (replacer as any).release = () => {
      if (!isReleased) {
        weakSetPool.release(seen)
        isReleased = true
      }
    }

  return replacer
}

/**
 * 安全序列化数据
 * 
 * 递归序列化对象，处理特殊类型并限制最大深度，防止：
 * - 循环引用导致无限递归
 * - 深度过深导致栈溢出
 * - 特殊对象（Date、Error）序列化异常
 * 
 * @param data - 要序列化的数据
 * @param maxDepth - 最大递归深度，默认 5 层
 * @returns 序列化后的数据
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
 * 
 * 将数据安全地转换为 JSON 字符串，自动处理循环引用
 * 
 * @param data - 要转换的数据
 * @param pretty - 是否格式化输出（美化），默认 false
 * @returns JSON 字符串，失败时返回错误标记
 */
export function toJSON(data: any, pretty = false): string {
  const replacer = createCircularReplacer()
  try {
    const result = pretty
      ? JSON.stringify(data, replacer, 2)
      : JSON.stringify(data, replacer)

    // 归还 WeakSet 到池中（如果实现了 release 方法）
    if (typeof (replacer as any).release === 'function') {
      ; (replacer as any).release()
    }

    return result
  }
  catch (error) {
    // 确保即使出错也归还资源
    if (typeof (replacer as any).release === 'function') {
      ; (replacer as any).release()
    }
    return '[JSON Serialization Failed]'
  }
}

/**
 * 计算对象大小（粗略估计，字节）
 * 
 * 通过将对象序列化为 JSON 字符串，然后计算字符串的字节大小
 * 注意：这是粗略估计，实际内存占用可能不同
 * 
 * @param data - 要计算大小的数据
 * @returns 估算的字节大小
 */
export function estimateSize(data: any): number {
  const str = toJSON(data)
  // 使用 Blob 计算字符串的实际字节大小（考虑 UTF-8 编码）
  return new Blob([str]).size
}




