/**
 * 错误追踪示例
 * 
 * 展示如何使用 Logger 进行完整的错误追踪和上报
 */

import { createLogger, HttpTransport, StorageTransport, LogLevel } from '../src'

// 创建错误追踪 Logger
const errorLogger = createLogger({
  name: 'error-tracker',
  level: LogLevel.ERROR,
  transports: [
    // 发送到错误追踪服务
    new HttpTransport({
      url: 'https://api.example.com/errors',
      batchSize: 5,
      flushInterval: 3000
    }),
    // 本地存储备份
    new StorageTransport({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined as any,
      maxSize: 50,
      key: 'error-logs'
    })
  ]
})

/**
 * 错误类型
 */
enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误元数据
 */
interface ErrorMetadata {
  type: ErrorType
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  sessionId?: string
  url?: string
  userAgent?: string
  timestamp: number
  stack?: string
  context?: Record<string, any>
}

/**
 * 错误追踪器
 */
class ErrorTracker {
  private static instance: ErrorTracker

  private constructor() {
    this.setupGlobalHandlers()
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  /**
   * 设置全局错误处理
   */
  private setupGlobalHandlers() {
    // 浏览器环境
    if (typeof window !== 'undefined') {
      // 捕获未处理的错误
      window.addEventListener('error', (event) => {
        this.trackError(event.error || new Error(event.message), {
          type: ErrorType.SYSTEM,
          severity: 'high',
          url: window.location.href,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      })

      // 捕获未处理的 Promise 拒绝
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          {
            type: ErrorType.SYSTEM,
            severity: 'high',
            url: window.location.href,
            context: {
              promise: 'unhandled rejection'
            }
          }
        )
      })
    }

    // Node.js 环境
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.trackError(error, {
          type: ErrorType.SYSTEM,
          severity: 'critical'
        })
      })

      process.on('unhandledRejection', (reason) => {
        this.trackError(
          reason instanceof Error ? reason : new Error(String(reason)),
          {
            type: ErrorType.SYSTEM,
            severity: 'critical'
          }
        )
      })
    }
  }

  /**
   * 追踪错误
   */
  trackError(error: Error, metadata: Partial<ErrorMetadata> = {}) {
    const errorData: ErrorMetadata = {
      type: metadata.type || ErrorType.UNKNOWN,
      severity: metadata.severity || 'medium',
      timestamp: Date.now(),
      stack: error.stack,
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      url: metadata.url,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      context: metadata.context
    }

    errorLogger.error(error.message, error, errorData)
  }

  /**
   * 追踪网络错误
   */
  trackNetworkError(error: Error, request: {
    url: string
    method: string
    status?: number
    statusText?: string
  }) {
    this.trackError(error, {
      type: ErrorType.NETWORK,
      severity: 'high',
      context: {
        ...request,
        errorType: 'network'
      }
    })
  }

  /**
   * 追踪验证错误
   */
  trackValidationError(error: Error, field?: string, value?: any) {
    this.trackError(error, {
      type: ErrorType.VALIDATION,
      severity: 'low',
      context: {
        field,
        value,
        errorType: 'validation'
      }
    })
  }

  /**
   * 追踪业务错误
   */
  trackBusinessError(error: Error, operation: string, details?: any) {
    this.trackError(error, {
      type: ErrorType.BUSINESS,
      severity: 'medium',
      context: {
        operation,
        details,
        errorType: 'business'
      }
    })
  }
}

/**
 * Try-Catch 装饰器
 */
function catchErrors(
  errorType: ErrorType = ErrorType.UNKNOWN,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        ErrorTracker.getInstance().trackError(error as Error, {
          type: errorType,
          severity,
          context: {
            class: target.constructor.name,
            method: propertyKey,
            args
          }
        })
        throw error
      }
    }

    return descriptor
  }
}

/**
 * 示例：用户服务
 */
class UserService {
  @catchErrors(ErrorType.BUSINESS, 'high')
  async createUser(userData: any) {
    // 验证
    if (!userData.email) {
      throw new Error('Email is required')
    }

    // 模拟 API 调用
    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  @catchErrors(ErrorType.VALIDATION, 'low')
  validateEmail(email: string) {
    if (!email.includes('@')) {
      throw new Error('Invalid email format')
    }
    return true
  }
}

/**
 * 示例：API 调用
 */
async function apiExample() {
  const tracker = ErrorTracker.getInstance()

  try {
    const response = await fetch('https://api.example.com/data')

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    tracker.trackNetworkError(error as Error, {
      url: 'https://api.example.com/data',
      method: 'GET',
      status: (error as any).status,
      statusText: (error as any).statusText
    })
    throw error
  }
}

/**
 * 运行示例
 */
async function main() {
  console.log('=== 错误追踪示例 ===\n')

  const tracker = ErrorTracker.getInstance()
  const userService = new UserService()

  // 1. 手动追踪错误
  try {
    throw new Error('Something went wrong')
  } catch (error) {
    tracker.trackError(error as Error, {
      type: ErrorType.UNKNOWN,
      severity: 'medium',
      context: {
        location: 'main function',
        action: 'demo error'
      }
    })
  }

  // 2. 追踪网络错误
  tracker.trackNetworkError(new Error('Network timeout'), {
    url: 'https://api.example.com/users',
    method: 'GET',
    status: 0,
    statusText: 'Timeout'
  })

  // 3. 追踪验证错误
  try {
    userService.validateEmail('invalid-email')
  } catch (error) {
    // 已被装饰器捕获
  }

  // 4. 追踪业务错误
  tracker.trackBusinessError(
    new Error('Insufficient balance'),
    'purchase',
    { orderId: '12345', amount: 100 }
  )

  // 等待日志上传
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export { ErrorTracker, ErrorType, catchErrors }

