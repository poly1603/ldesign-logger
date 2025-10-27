# 性能监控

展示如何使用 Logger 进行性能监控。

## 基础性能测量

```typescript
function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  
  logger.info(`开始: ${name}`)
  
  try {
    const result = fn()
    const duration = performance.now() - start
    
    logger.info(`完成: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      success: true
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    
    logger.error(`失败: ${name}`, error, {
      duration: `${duration.toFixed(2)}ms`,
      success: false
    })
    
    throw error
  }
}

// 使用
const result = measurePerformance('复杂计算', () => {
  // 计算逻辑
  return sum
})
```

## 装饰器方式

```typescript
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

      logger.error(`执行失败: ${methodName}`, error, {
        duration: `${duration.toFixed(2)}ms`,
        success: false
      })

      throw error
    }
  }

  return descriptor
}

// 使用
class ApiService {
  @measurePerformance
  async fetchUsers() {
    // API 调用
  }
}
```

## 批量操作监控

```typescript
async function batchProcess(items: any[]) {
  const start = performance.now()
  
  logger.info('开始批量处理', { total: items.length })
  
  let successCount = 0
  let errorCount = 0
  
  for (const item of items) {
    try {
      await processItem(item)
      successCount++
    } catch (error) {
      errorCount++
      logger.error('处理失败', error, { item })
    }
  }
  
  const duration = performance.now() - start
  const avgTime = duration / items.length
  
  logger.info('批量处理完成', {
    total: items.length,
    success: successCount,
    error: errorCount,
    totalTime: `${duration.toFixed(2)}ms`,
    avgTime: `${avgTime.toFixed(2)}ms`
  })
}
```

## 内存监控

```typescript
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

// 定期监控
setInterval(monitorMemory, 60000)
```

## API 性能监控

```typescript
class ApiMonitor {
  async request(url: string, options: RequestInit) {
    const start = performance.now()
    const requestId = this.generateId()

    logger.info('API 请求开始', { requestId, url, method: options.method })

    try {
      const response = await fetch(url, options)
      const duration = performance.now() - start

      // 记录慢请求
      if (duration > 1000) {
        logger.warn('慢请求检测', {
          requestId,
          url,
          duration: `${duration.toFixed(2)}ms`
        })
      }

      logger.info('API 请求完成', {
        requestId,
        url,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`
      })

      return response
    } catch (error) {
      const duration = performance.now() - start

      logger.error('API 请求失败', error, {
        requestId,
        url,
        duration: `${duration.toFixed(2)}ms`
      })

      throw error
    }
  }

  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
```

## 相关文档

- [最佳实践](/guide/best-practices)
- [Logger API](/api/logger)

