/**
 * 日志上下文管理
 * 
 * 提供 Correlation ID 和上下文传播功能
 */

/**
 * 日志上下文数据
 */
export interface LogContextData {
  /**
   * 关联 ID（Correlation ID）
   * 
   * 用于追踪跨服务、跨请求的日志链路
   */
  correlationId?: string

  /**
   * 请求 ID
   */
  requestId?: string

  /**
   * 追踪 ID（Trace ID）
   */
  traceId?: string

  /**
   * 跨度 ID（Span ID）
   * 
   * 用于分布式追踪
   */
  spanId?: string

  /**
   * 父跨度 ID
   */
  parentSpanId?: string

  /**
   * 自定义上下文数据
   */
  [key: string]: any
}

/**
 * 日志上下文管理器
 * 
 * 管理日志的上下文信息，实现跨函数、跨异步调用的上下文传播
 * 
 * 特性：
 * - 自动生成 Correlation ID
 * - 上下文继承
 * - 线程安全（使用 Map 存储）
 * 
 * 使用场景：
 * - 分布式系统日志追踪
 * - HTTP 请求链路追踪
 * - 微服务调用链追踪
 * 
 * 注意：
 * - 浏览器环境使用全局上下文
 * - Node.js 环境建议使用 AsyncLocalStorage（需单独实现）
 * 
 * @example
 * ```ts
 * // 设置上下文
 * LogContext.setContext({
 *   correlationId: 'req-123',
 *   requestId: 'api-456',
 *   userId: 'user-789'
 * })
 * 
 * // 获取上下文
 * const ctx = LogContext.getContext()
 * logger.info('Message', ctx)
 * 
 * // 清除上下文
 * LogContext.clearContext()
 * ```
 */
export class LogContext {
  /** 全局上下文存储 */
  private static globalContext: LogContextData = {}

  /** 上下文栈（支持嵌套） */
  private static contextStack: LogContextData[] = []

  /**
   * 生成 UUID（简化版）
   * 
   * @returns UUID 字符串
   * @private
   */
  private static generateUuid(): string {
    // 简化的 UUID 生成（生产环境建议使用 uuid 库）
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 设置上下文
   * 
   * @param context - 上下文数据
   * 
   * @example
   * ```ts
   * LogContext.setContext({
   *   correlationId: 'req-123',
   *   userId: 'user-456'
   * })
   * ```
   */
  static setContext(context: LogContextData): void {
    this.globalContext = { ...this.globalContext, ...context }
  }

  /**
   * 获取当前上下文
   * 
   * @returns 上下文数据
   * 
   * @example
   * ```ts
   * const ctx = LogContext.getContext()
   * logger.info('Message', ctx)
   * ```
   */
  static getContext(): LogContextData {
    return { ...this.globalContext }
  }

  /**
   * 清除上下文
   * 
   * @example
   * ```ts
   * LogContext.clearContext()
   * ```
   */
  static clearContext(): void {
    this.globalContext = {}
  }

  /**
   * 生成新的 Correlation ID
   * 
   * @returns Correlation ID
   * 
   * @example
   * ```ts
   * const id = LogContext.generateCorrelationId()
   * LogContext.setContext({ correlationId: id })
   * ```
   */
  static generateCorrelationId(): string {
    return this.generateUuid()
  }

  /**
   * 创建带有 Correlation ID 的新上下文
   * 
   * @param additionalData - 额外的上下文数据
   * @returns 新的上下文对象
   * 
   * @example
   * ```ts
   * const ctx = LogContext.createWithCorrelationId({ userId: '123' })
   * LogContext.setContext(ctx)
   * ```
   */
  static createWithCorrelationId(additionalData?: Partial<LogContextData>): LogContextData {
    return {
      correlationId: this.generateCorrelationId(),
      ...additionalData,
    }
  }

  /**
   * 进入新的上下文作用域
   * 
   * 将当前上下文压入栈，创建新的上下文
   * 
   * @param context - 新的上下文数据
   * 
   * @example
   * ```ts
   * LogContext.enter({ requestId: 'req-123' })
   * // ... 一些操作
   * LogContext.exit()
   * ```
   */
  static enter(context: LogContextData): void {
    // 保存当前上下文
    this.contextStack.push({ ...this.globalContext })

    // 设置新上下文（继承当前上下文）
    this.globalContext = { ...this.globalContext, ...context }
  }

  /**
   * 退出当前上下文作用域
   * 
   * 恢复到上一个上下文
   * 
   * @example
   * ```ts
   * LogContext.enter({ requestId: 'req-123' })
   * // ... 一些操作
   * LogContext.exit() // 恢复之前的上下文
   * ```
   */
  static exit(): void {
    if (this.contextStack.length > 0) {
      this.globalContext = this.contextStack.pop()!
    }
  }

  /**
   * 在指定上下文中执行函数
   * 
   * 自动管理上下文的进入和退出
   * 
   * @param context - 上下文数据
   * @param fn - 要执行的函数
   * @returns 函数执行结果
   * 
   * @example
   * ```ts
   * await LogContext.runInContext(
   *   { correlationId: 'req-123' },
   *   async () => {
   *     logger.info('In context')
   *     await doWork()
   *   }
   * )
   * ```
   */
  static async runInContext<T>(
    context: LogContextData,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    this.enter(context)

    try {
      return await fn()
    }
    finally {
      this.exit()
    }
  }

  /**
   * 获取或创建 Correlation ID
   * 
   * 如果当前上下文中已有 Correlation ID，返回现有的；
   * 否则生成新的并保存到上下文中
   * 
   * @returns Correlation ID
   * 
   * @example
   * ```ts
   * const id = LogContext.getOrCreateCorrelationId()
   * logger.info('Request', { correlationId: id })
   * ```
   */
  static getOrCreateCorrelationId(): string {
    if (this.globalContext.correlationId) {
      return this.globalContext.correlationId
    }

    const correlationId = this.generateCorrelationId()
    this.globalContext.correlationId = correlationId
    return correlationId
  }
}

/**
 * 上下文装饰器（实验性）
 * 
 * 自动为方法添加上下文管理
 * 
 * @param contextData - 上下文数据或上下文生成函数
 * 
 * @example
 * ```ts
 * class ApiService {
 *   @withContext({ serviceName: 'api' })
 *   async handleRequest() {
 *     // 此方法内的日志会自动包含上下文
 *     logger.info('Handling request')
 *   }
 * }
 * ```
 */
export function withContext(contextData: LogContextData | (() => LogContextData)) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const context = typeof contextData === 'function' ? contextData() : contextData

      return await LogContext.runInContext(context, () => {
        return originalMethod.apply(this, args)
      })
    }

    return descriptor
  }
}

/**
 * 为 Logger 添加上下文支持
 * 
 * 增强 Logger，使其自动从 LogContext 获取上下文信息
 * 
 * @param logger - Logger 实例
 * @returns 增强后的 Logger
 * 
 * @example
 * ```ts
 * import { createLogger, enhanceLoggerWithContext } from '@ldesign/logger'
 * 
 * const logger = enhanceLoggerWithContext(createLogger())
 * 
 * LogContext.setContext({ correlationId: 'req-123' })
 * logger.info('Message')  // 自动包含 correlationId
 * ```
 */
export function enhanceLoggerWithContext(logger: any): any {
  const originalLog = logger.log.bind(logger)

  logger.log = (level: any, message: string, data?: any, error?: any) => {
    // 合并上下文数据
    const context = LogContext.getContext()
    const mergedData = { ...context, ...data }

    originalLog(level, message, mergedData, error)
  }

  return logger
}

