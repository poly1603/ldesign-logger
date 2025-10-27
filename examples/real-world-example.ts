/**
 * 完整的实际应用场景示例
 * 
 * 展示一个完整的 Web 应用中如何使用 Logger
 */

import {
  createLogger,
  ConsoleTransport,
  HttpTransport,
  StorageTransport,
  TextFormatter,
  JsonFormatter,
  LevelFilter,
  TagFilter,
  Sampler,
  RateLimiter,
  Deduplicator,
  LogStats,
  LogLevel
} from '../src'

/**
 * 环境配置
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * 创建主 Logger
 */
const mainLogger = createLogger({
  name: 'app',
  level: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  transports: [
    // 控制台输出
    new ConsoleTransport({
      level: isDevelopment ? LogLevel.DEBUG : LogLevel.WARN,
      formatter: new TextFormatter({
        colorize: true,
        timestamp: true,
        showLevel: true,
        showTags: true
      })
    }),

    // 生产环境：发送到日志服务器
    ...(isProduction ? [
      new HttpTransport({
        url: process.env.LOG_SERVER_URL || 'https://api.example.com/logs',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.LOG_API_KEY}`,
          'X-App-Version': process.env.APP_VERSION || '1.0.0'
        },
        batchSize: 20,
        batchInterval: 5000,
        timeout: 10000,
        retryCount: 3,
        formatter: new JsonFormatter()
      })
    ] : []),

    // 错误日志本地备份
    new StorageTransport({
      level: LogLevel.ERROR,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined as any,
      maxSize: 100,
      key: 'error-logs'
    })
  ],

  // 生产环境过滤和优化
  ...(isProduction && {
    sampler: new Sampler({
      rates: {
        debug: 0,
        info: 0.1,
        warn: 0.5,
        error: 1.0,
        fatal: 1.0
      }
    }),
    rateLimiter: new RateLimiter({
      maxLogs: 100,
      timeWindow: 1000
    }),
    deduplicator: new Deduplicator({
      window: 5000,
      maxCount: 3
    })
  })
})

/**
 * 创建模块专用 Logger
 */
const apiLogger = mainLogger.child({ name: 'api', defaultTags: ['api'] })
const dbLogger = mainLogger.child({ name: 'database', defaultTags: ['database'] })
const authLogger = mainLogger.child({ name: 'auth', defaultTags: ['auth', 'security'] })

/**
 * 创建统计实例
 */
const stats = new LogStats(mainLogger)

/**
 * API 服务
 */
class ApiService {
  async request(url: string, options: RequestInit = {}) {
    const requestId = this.generateRequestId()
    const startTime = performance.now()

    apiLogger.info('API 请求开始', {
      requestId,
      url,
      method: options.method || 'GET'
    })

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-Request-ID': requestId
        }
      })

      const duration = performance.now() - startTime

      if (!response.ok) {
        apiLogger.warn('API 请求失败', {
          requestId,
          url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration.toFixed(2)}ms`
        })
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      apiLogger.info('API 请求成功', {
        requestId,
        url,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`
      })

      return await response.json()
    } catch (error) {
      const duration = performance.now() - startTime

      apiLogger.error('API 请求异常', error as Error, {
        requestId,
        url,
        duration: `${duration.toFixed(2)}ms`
      })

      throw error
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 数据库服务
 */
class DatabaseService {
  async query(sql: string, params?: any[]) {
    const queryId = this.generateQueryId()
    const startTime = performance.now()

    dbLogger.debug('执行数据库查询', {
      queryId,
      sql,
      params
    })

    try {
      // 模拟数据库查询
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100))

      const duration = performance.now() - startTime
      const result = { rows: [], rowCount: 0 }

      // 记录慢查询
      if (duration > 50) {
        dbLogger.warn('慢查询检测', {
          queryId,
          sql,
          duration: `${duration.toFixed(2)}ms`
        })
      } else {
        dbLogger.debug('查询完成', {
          queryId,
          rowCount: result.rowCount,
          duration: `${duration.toFixed(2)}ms`
        })
      }

      return result
    } catch (error) {
      dbLogger.error('查询失败', error as Error, {
        queryId,
        sql,
        params
      })
      throw error
    }
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 认证服务
 */
class AuthService {
  async login(username: string, password: string) {
    authLogger.info('用户登录尝试', {
      username,
      ip: this.getClientIp()
    })

    try {
      // 验证逻辑
      if (!username || !password) {
        authLogger.warn('登录失败：缺少凭证', { username })
        throw new Error('Username and password are required')
      }

      // 模拟登录
      const user = { id: '123', username, role: 'user' }
      const token = this.generateToken(user)

      authLogger.info('用户登录成功', {
        userId: user.id,
        username: user.username,
        ip: this.getClientIp()
      })

      return { user, token }
    } catch (error) {
      authLogger.error('登录异常', error as Error, {
        username,
        ip: this.getClientIp()
      })
      throw error
    }
  }

  async logout(userId: string) {
    authLogger.info('用户登出', {
      userId,
      ip: this.getClientIp()
    })
  }

  private generateToken(user: any): string {
    return `token_${user.id}_${Date.now()}`
  }

  private getClientIp(): string {
    return '192.168.1.1' // 模拟
  }
}

/**
 * 应用类
 */
class Application {
  private api: ApiService
  private db: DatabaseService
  private auth: AuthService

  constructor() {
    this.api = new ApiService()
    this.db = new DatabaseService()
    this.auth = new AuthService()

    this.setupErrorHandlers()
    this.startMonitoring()
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandlers() {
    // 全局错误处理
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        mainLogger.fatal('未捕获的错误', event.error, {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        mainLogger.error('未处理的 Promise 拒绝', event.reason)
      })
    }
  }

  /**
   * 启动监控
   */
  private startMonitoring() {
    // 每分钟输出统计信息
    setInterval(() => {
      const statistics = stats.getStats()

      mainLogger.info('系统统计', {
        total: statistics.total,
        errors: statistics.errors,
        warnings: statistics.warnings,
        byLevel: statistics.byLevel
      })

      // 检查错误率
      const errorRate = statistics.total > 0
        ? (statistics.errors / statistics.total * 100).toFixed(2)
        : '0'

      if (parseFloat(errorRate) > 5) {
        mainLogger.warn('错误率过高', {
          errorRate: `${errorRate}%`,
          total: statistics.total,
          errors: statistics.errors
        })
      }
    }, 60000)
  }

  /**
   * 启动应用
   */
  async start() {
    mainLogger.info('应用启动', {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    })

    try {
      // 模拟一些操作
      await this.auth.login('admin', 'password123')
      await this.db.query('SELECT * FROM users WHERE id = ?', ['123'])
      await this.api.request('https://api.example.com/data')

      mainLogger.info('应用启动完成')
    } catch (error) {
      mainLogger.fatal('应用启动失败', error as Error)
      throw error
    }
  }

  /**
   * 停止应用
   */
  async stop() {
    mainLogger.info('应用停止中')

    // 刷新所有日志
    await mainLogger.flush()

    mainLogger.info('应用已停止')
  }
}

/**
 * 运行示例
 */
async function main() {
  console.log('=== 完整应用示例 ===\n')

  const app = new Application()

  try {
    await app.start()

    // 运行一段时间
    await new Promise(resolve => setTimeout(resolve, 5000))

    await app.stop()
  } catch (error) {
    console.error('应用错误:', error)
    process.exit(1)
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error)
}

export { Application, ApiService, DatabaseService, AuthService }

