# 错误追踪

展示如何使用 Logger 进行完整的错误追踪和上报。

## 基础错误追踪

```typescript
const errorLogger = createLogger({
  name: 'error-tracker',
  level: LogLevel.ERROR,
  transports: [
    new HttpTransport({
      url: 'https://api.example.com/errors'
    }),
    new StorageTransport({
      level: LogLevel.ERROR,
      maxSize: 50
    })
  ]
})

// 记录错误
try {
  // 业务代码
} catch (error) {
  errorLogger.error('操作失败', error, {
    userId: currentUser.id,
    action: 'createOrder',
    context: { orderId: '123' }
  })
}
```

## 全局错误处理

```typescript
// 浏览器环境
window.addEventListener('error', (event) => {
  errorLogger.fatal('未捕获的错误', event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  })
})

window.addEventListener('unhandledrejection', (event) => {
  errorLogger.error('未处理的 Promise 拒绝', event.reason)
})

// Node.js 环境
process.on('uncaughtException', (error) => {
  errorLogger.fatal('未捕获的异常', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  errorLogger.error('未处理的 Promise 拒绝', reason)
})
```

## 错误分类

```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM'
}

class ErrorTracker {
  trackError(error: Error, type: ErrorType, context?: any) {
    errorLogger.error(error.message, error, {
      type,
      severity: this.getSeverity(type),
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  trackNetworkError(error: Error, request: any) {
    this.trackError(error, ErrorType.NETWORK, { request })
  }

  trackValidationError(error: Error, field: string) {
    this.trackError(error, ErrorType.VALIDATION, { field })
  }

  private getSeverity(type: ErrorType): string {
    return {
      [ErrorType.NETWORK]: 'high',
      [ErrorType.VALIDATION]: 'low',
      [ErrorType.BUSINESS]: 'medium',
      [ErrorType.SYSTEM]: 'critical'
    }[type]
  }
}
```

## 错误装饰器

```typescript
function catchErrors(errorType: ErrorType = ErrorType.UNKNOWN) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        errorLogger.error(
          `${target.constructor.name}.${propertyKey} 失败`,
          error,
          {
            errorType,
            class: target.constructor.name,
            method: propertyKey,
            args
          }
        )
        throw error
      }
    }

    return descriptor
  }
}

// 使用
class UserService {
  @catchErrors(ErrorType.BUSINESS)
  async createUser(userData: any) {
    // 实现
  }
}
```

## 相关文档

- [最佳实践](/guide/best-practices)
- [Logger API](/api/logger)

