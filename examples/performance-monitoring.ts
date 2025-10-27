/**
 * 性能监控示例
 * 
 * 展示如何使用 Logger 进行性能监控和追踪
 */

import { createLogger, LogLevel } from '../src'

const logger = createLogger({
  name: 'performance',
  level: LogLevel.INFO
})

/**
 * 性能测量装饰器
 */
function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = async function (...args: any[]) {
    const start = performance.now()
    const methodName = `${target.constructor.name}.${propertyKey}`

    logger.info(`开始执行: ${methodName}`, { args })

    try {
      const result = await originalMethod.apply(this, args)
      const duration = performance.now() - start

      logger.info(`执行完成: ${methodName}`, {
        duration: `${duration.toFixed(2)}ms`,
        success: true
      })

      return result
    } catch (error) {
      const duration = performance.now() - start

      logger.error(`执行失败: ${methodName}`, error as Error, {
        duration: `${duration.toFixed(2)}ms`,
        success: false
      })

      throw error
    }
  }

  return descriptor
}

/**
 * 性能测量函数
 */
function measure<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now()

  logger.info(`开始: ${name}`)

  return Promise.resolve(fn())
    .then((result) => {
      const duration = performance.now() - start
      logger.info(`完成: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        success: true
      })
      return result
    })
    .catch((error) => {
      const duration = performance.now() - start
      logger.error(`失败: ${name}`, error, {
        duration: `${duration.toFixed(2)}ms`,
        success: false
      })
      throw error
    })
}

/**
 * API 服务示例
 */
class ApiService {
  @measurePerformance
  async fetchUsers() {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 100))
    return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
  }

  @measurePerformance
  async createUser(userData: any) {
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 150))
    return { id: 3, ...userData }
  }
}

/**
 * 批量操作性能监控
 */
async function batchProcessing() {
  const items = Array.from({ length: 100 }, (_, i) => i)

  await measure('批量处理', async () => {
    const start = performance.now()

    for (const item of items) {
      // 模拟处理
      await new Promise(resolve => setTimeout(resolve, 1))
    }

    const duration = performance.now() - start
    const avgTime = duration / items.length

    logger.info('批量处理统计', {
      total: items.length,
      totalTime: `${duration.toFixed(2)}ms`,
      avgTime: `${avgTime.toFixed(2)}ms`
    })
  })
}

/**
 * 内存使用监控
 */
function monitorMemory() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()

    logger.info('内存使用情况', {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
      rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`
    })
  }
}

/**
 * 运行示例
 */
async function main() {
  console.log('=== 性能监控示例 ===\n')

  // 1. 使用装饰器监控
  const api = new ApiService()
  await api.fetchUsers()
  await api.createUser({ name: 'Bob', email: 'bob@example.com' })

  // 2. 使用 measure 函数
  await measure('复杂计算', async () => {
    let sum = 0
    for (let i = 0; i < 1000000; i++) {
      sum += i
    }
    return sum
  })

  // 3. 批量操作监控
  await batchProcessing()

  // 4. 内存监控
  monitorMemory()
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export { measure, measurePerformance, monitorMemory }

