/**
 * 日志查询示例
 * 
 * 展示如何使用 LogQuery 查询历史日志
 */

import { createLogger, LogQuery, LogLevel, StorageTransport } from '../src'

// 创建带存储的 Logger
const logger = createLogger({
  name: 'query-demo',
  level: LogLevel.DEBUG,
  transports: [
    new StorageTransport({
      storage: typeof window !== 'undefined' ? window.localStorage : undefined as any,
      maxSize: 1000,
      key: 'demo-logs'
    })
  ]
})

// 创建查询实例
const query = new LogQuery(logger)

/**
 * 基础查询示例
 */
function basicQuery() {
  console.log('=== 基础查询 ===\n')

  // 1. 按级别查询
  const errorLogs = query
    .level('error')
    .execute()
  console.log('错误日志数量:', errorLogs.length)

  // 2. 按时间范围查询
  const now = Date.now()
  const oneHourAgo = now - 3600000
  const recentLogs = query
    .timeRange(oneHourAgo, now)
    .execute()
  console.log('最近1小时日志:', recentLogs.length)

  // 3. 按消息内容查询
  const loginLogs = query
    .message(/login/i)
    .execute()
  console.log('登录相关日志:', loginLogs.length)

  // 4. 限制数量
  const latestErrors = query
    .level('error')
    .limit(10)
    .execute()
  console.log('最新10条错误:', latestErrors.length)
}

/**
 * 组合查询示例
 */
function advancedQuery() {
  console.log('\n=== 组合查询 ===\n')

  // 1. 多条件查询
  const criticalLogs = query
    .level('error')
    .tags(['api'], 'any')
    .timeRange(Date.now() - 86400000, Date.now())
    .limit(20)
    .execute()
  console.log('API 错误日志（24小时内）:', criticalLogs.length)

  // 2. 自定义过滤
  const slowRequests = query
    .custom((entry) => {
      if (!entry.data) return false
      return entry.data.duration && entry.data.duration > 1000
    })
    .execute()
  console.log('慢请求日志:', slowRequests.length)

  // 3. 多级别查询
  const importantLogs = query
    .custom((entry) => entry.level >= LogLevel.WARN)
    .execute()
  console.log('警告及以上级别:', importantLogs.length)
}

/**
 * 统计分析示例
 */
function statisticsQuery() {
  console.log('\n=== 统计分析 ===\n')

  // 获取所有日志
  const allLogs = query.execute()

  // 1. 按级别统计
  const byLevel = allLogs.reduce((acc, log) => {
    const levelName = LogLevel[log.level]
    acc[levelName] = (acc[levelName] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log('按级别统计:', byLevel)

  // 2. 按时间段统计
  const byHour = allLogs.reduce((acc, log) => {
    const hour = new Date(log.timestamp).getHours()
    acc[hour] = (acc[hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  console.log('按小时统计:', byHour)

  // 3. 按来源统计
  const bySource = allLogs.reduce((acc, log) => {
    const source = log.source || 'unknown'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  console.log('按来源统计:', bySource)

  // 4. 错误率
  const errorCount = allLogs.filter(log => log.level >= LogLevel.ERROR).length
  const errorRate = (errorCount / allLogs.length * 100).toFixed(2)
  console.log(`错误率: ${errorRate}%`)
}

/**
 * 时间序列分析
 */
function timeSeriesQuery() {
  console.log('\n=== 时间序列分析 ===\n')

  // 按分钟分组
  const logs = query.execute()
  const byMinute = logs.reduce((acc, log) => {
    const minute = Math.floor(log.timestamp / 60000) * 60000
    if (!acc[minute]) {
      acc[minute] = []
    }
    acc[minute].push(log)
    return acc
  }, {} as Record<number, any[]>)

  // 找出日志量最大的分钟
  const maxMinute = Object.entries(byMinute)
    .sort((a, b) => b[1].length - a[1].length)[0]

  if (maxMinute) {
    console.log('日志量最大的时刻:', new Date(Number(maxMinute[0])).toLocaleString())
    console.log('日志数量:', maxMinute[1].length)
  }
}

/**
 * 用户行为分析
 */
function userAnalysis() {
  console.log('\n=== 用户行为分析 ===\n')

  const logs = query.execute()

  // 按用户ID分组
  const byUser = logs.reduce((acc, log) => {
    const userId = log.userId || 'anonymous'
    if (!acc[userId]) {
      acc[userId] = []
    }
    acc[userId].push(log)
    return acc
  }, {} as Record<string, any[]>)

  // 统计每个用户的活动
  Object.entries(byUser).forEach(([userId, userLogs]) => {
    const errorCount = userLogs.filter(log => log.level >= LogLevel.ERROR).length
    console.log(`用户 ${userId}:`)
    console.log(`  - 总日志: ${userLogs.length}`)
    console.log(`  - 错误数: ${errorCount}`)
  })
}

/**
 * 生成测试日志
 */
function generateTestLogs() {
  // 生成一些测试日志
  logger.debug('调试信息')
  logger.info('用户登录', { userId: 'user1', ip: '192.168.1.1' })
  logger.info('用户登录', { userId: 'user2', ip: '192.168.1.2' })
  logger.warn('API 响应缓慢', { duration: 1500, url: '/api/users' })
  logger.error('请求失败', new Error('Network error'), { url: '/api/data', method: 'GET' })
  logger.info('用户登出', { userId: 'user1' })
}

/**
 * 运行示例
 */
function main() {
  console.log('=== 日志查询示例 ===\n')

  // 生成测试日志
  generateTestLogs()

  // 等待日志保存
  setTimeout(() => {
    // 执行各种查询
    basicQuery()
    advancedQuery()
    statisticsQuery()
    timeSeriesQuery()
    userAnalysis()
  }, 1000)
}

// 运行示例
if (require.main === module) {
  main()
}

export { query, logger }

