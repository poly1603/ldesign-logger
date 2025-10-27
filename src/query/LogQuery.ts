/**
 * 日志查询和导出模块
 * 
 * 提供强大的日志查询、过滤和导出功能
 */

import type { LogEntry, LogLevel } from '../types'
import { LogLevelNames } from '../types'

/**
 * 日志查询条件
 */
export interface LogQueryOptions {
  /**
   * 开始时间（毫秒时间戳）
   */
  startTime?: number

  /**
   * 结束时间（毫秒时间戳）
   */
  endTime?: number

  /**
   * 日志级别过滤
   */
  levels?: LogLevel[]

  /**
   * 关键词搜索（消息中包含）
   */
  keyword?: string

  /**
   * 日志来源过滤
   */
  sources?: string[]

  /**
   * 标签过滤
   */
  tags?: string[]

  /**
   * 用户 ID 过滤
   */
  userId?: string

  /**
   * 会话 ID 过滤
   */
  sessionId?: string

  /**
   * 最大返回数量
   */
  limit?: number

  /**
   * 跳过前 N 条（用于分页）
   */
  offset?: number

  /**
   * 排序方式
   * - 'asc': 时间升序（旧到新）
   * - 'desc': 时间降序（新到旧）
   */
  sort?: 'asc' | 'desc'
}

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'text'

/**
 * 日志查询器
 * 
 * 提供灵活的日志查询和导出功能
 * 
 * 特性：
 * - 多条件查询：时间范围、级别、关键词等
 * - 分页支持：limit 和 offset
 * - 排序：升序或降序
 * - 多格式导出：JSON、CSV、TXT
 * 
 * @example
 * ```ts
 * const query = new LogQuery(allLogs)
 * 
 * // 查询最近1小时的错误日志
 * const errors = query.query({
 *   startTime: Date.now() - 3600000,
 *   levels: [LogLevel.ERROR, LogLevel.FATAL]
 * })
 * 
 * // 导出为 JSON
 * const json = query.exportToJson(errors)
 * 
 * // 导出为 CSV
 * const csv = query.exportToCsv(errors)
 * ```
 */
export class LogQuery {
  private logs: LogEntry[]

  /**
   * 构造函数
   * 
   * @param logs - 日志条目数组
   */
  constructor(logs: LogEntry[]) {
    this.logs = logs
  }

  /**
   * 查询日志
   * 
   * 根据指定条件查询日志，支持多个条件组合
   * 
   * @param options - 查询条件
   * @returns 符合条件的日志数组
   * 
   * @example
   * ```ts
   * // 查询最近1小时的警告和错误
   * const result = query.query({
   *   startTime: Date.now() - 3600000,
   *   levels: [LogLevel.WARN, LogLevel.ERROR],
   *   limit: 100
   * })
   * 
   * // 搜索包含 "API" 的日志
   * const apiLogs = query.query({
   *   keyword: 'API',
   *   sort: 'desc'
   * })
   * ```
   */
  query(options: LogQueryOptions = {}): LogEntry[] {
    let result = [...this.logs]

    // 1. 时间范围过滤
    if (options.startTime !== undefined) {
      result = result.filter(log => log.timestamp >= options.startTime!)
    }

    if (options.endTime !== undefined) {
      result = result.filter(log => log.timestamp <= options.endTime!)
    }

    // 2. 日志级别过滤
    if (options.levels && options.levels.length > 0) {
      const levelSet = new Set(options.levels)
      result = result.filter(log => levelSet.has(log.level))
    }

    // 3. 关键词搜索
    if (options.keyword) {
      const keyword = options.keyword.toLowerCase()
      result = result.filter(log =>
        log.message.toLowerCase().includes(keyword),
      )
    }

    // 4. 来源过滤
    if (options.sources && options.sources.length > 0) {
      const sourceSet = new Set(options.sources)
      result = result.filter(log => log.source && sourceSet.has(log.source))
    }

    // 5. 标签过滤
    if (options.tags && options.tags.length > 0) {
      const tagSet = new Set(options.tags)
      result = result.filter(log =>
        log.tags && log.tags.some(tag => tagSet.has(tag)),
      )
    }

    // 6. 用户 ID 过滤
    if (options.userId) {
      result = result.filter(log => log.userId === options.userId)
    }

    // 7. 会话 ID 过滤
    if (options.sessionId) {
      result = result.filter(log => log.sessionId === options.sessionId)
    }

    // 8. 排序
    const sort = options.sort || 'desc'
    result.sort((a, b) => {
      return sort === 'asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    })

    // 9. 分页
    const offset = options.offset || 0
    const limit = options.limit

    if (offset > 0) {
      result = result.slice(offset)
    }

    if (limit !== undefined && limit > 0) {
      result = result.slice(0, limit)
    }

    return result
  }

  /**
   * 导出为 JSON 字符串
   * 
   * @param logs - 要导出的日志数组（可选，默认使用所有日志）
   * @param pretty - 是否美化输出
   * @returns JSON 字符串
   * 
   * @example
   * ```ts
   * const json = query.exportToJson(logs, true)
   * // 保存到文件或发送到服务器
   * ```
   */
  exportToJson(logs?: LogEntry[], pretty = true): string {
    const data = logs || this.logs
    return JSON.stringify(data, null, pretty ? 2 : 0)
  }

  /**
   * 导出为 CSV 字符串
   * 
   * @param logs - 要导出的日志数组（可选，默认使用所有日志）
   * @returns CSV 字符串
   * 
   * @example
   * ```ts
   * const csv = query.exportToCsv(logs)
   * // 下载为 CSV 文件
   * const blob = new Blob([csv], { type: 'text/csv' })
   * const url = URL.createObjectURL(blob)
   * ```
   */
  exportToCsv(logs?: LogEntry[]): string {
    const data = logs || this.logs

    if (data.length === 0) {
      return ''
    }

    // CSV 标题行
    const headers = [
      'Timestamp',
      'Time',
      'Level',
      'Source',
      'Message',
      'UserId',
      'SessionId',
      'Tags',
      'Error',
      'Data',
    ]

    // 构建 CSV 内容
    const rows: string[] = [headers.join(',')]

    for (const log of data) {
      const row = [
        log.timestamp.toString(),
        new Date(log.timestamp).toISOString(),
        LogLevelNames[log.level],
        this.escapeCsv(log.source || ''),
        this.escapeCsv(log.message),
        this.escapeCsv(log.userId || ''),
        this.escapeCsv(log.sessionId || ''),
        this.escapeCsv(log.tags?.join(';') || ''),
        this.escapeCsv(log.error?.message || ''),
        this.escapeCsv(log.data ? JSON.stringify(log.data) : ''),
      ]

      rows.push(row.join(','))
    }

    return rows.join('\n')
  }

  /**
   * 导出为纯文本字符串
   * 
   * @param logs - 要导出的日志数组（可选，默认使用所有日志）
   * @returns 文本字符串
   * 
   * @example
   * ```ts
   * const text = query.exportToText(logs)
   * console.log(text)
   * ```
   */
  exportToText(logs?: LogEntry[]): string {
    const data = logs || this.logs

    if (data.length === 0) {
      return ''
    }

    const lines: string[] = []

    for (const log of data) {
      const time = new Date(log.timestamp).toISOString()
      const level = LogLevelNames[log.level]
      const source = log.source ? `[${log.source}]` : ''

      let line = `${time} [${level}] ${source} ${log.message}`

      if (log.data) {
        line += `\n  Data: ${JSON.stringify(log.data)}`
      }

      if (log.error) {
        line += `\n  Error: ${log.error.name}: ${log.error.message}`
      }

      if (log.tags && log.tags.length > 0) {
        line += `\n  Tags: ${log.tags.join(', ')}`
      }

      lines.push(line)
      lines.push('') // 空行分隔
    }

    return lines.join('\n')
  }

  /**
   * 统一导出方法
   * 
   * @param format - 导出格式
   * @param logs - 要导出的日志数组（可选）
   * @returns 导出的字符串
   * 
   * @example
   * ```ts
   * const content = query.export('csv', filteredLogs)
   * ```
   */
  export(format: ExportFormat, logs?: LogEntry[]): string {
    switch (format) {
      case 'json':
        return this.exportToJson(logs)
      case 'csv':
        return this.exportToCsv(logs)
      case 'text':
        return this.exportToText(logs)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * 下载日志文件（仅浏览器环境）
   * 
   * @param filename - 文件名
   * @param format - 导出格式
   * @param logs - 要导出的日志（可选）
   * 
   * @example
   * ```ts
   * // 下载为 CSV
   * query.download('logs.csv', 'csv', filteredLogs)
   * 
   * // 下载为 JSON
   * query.download('logs.json', 'json')
   * ```
   */
  download(filename: string, format: ExportFormat, logs?: LogEntry[]): void {
    if (typeof window === 'undefined' || !window.Blob) {
      throw new Error('Download is only available in browser environment')
    }

    const content = this.export(format, logs)

    // 确定 MIME 类型
    const mimeTypes = {
      json: 'application/json',
      csv: 'text/csv',
      text: 'text/plain',
    }

    const blob = new Blob([content], { type: mimeTypes[format] })
    const url = URL.createObjectURL(blob)

    // 创建下载链接
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    // 清理
    URL.revokeObjectURL(url)
  }

  /**
   * CSV 值转义
   * 
   * 转义特殊字符，确保 CSV 格式正确
   * 
   * @param value - 要转义的值
   * @returns 转义后的值
   * 
   * @private
   */
  private escapeCsv(value: string): string {
    if (!value) {
      return ''
    }

    // 如果包含逗号、引号或换行符，需要用引号包裹
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // 双引号转义为两个双引号
      return `"${value.replace(/"/g, '""')}"`
    }

    return value
  }

  /**
   * 获取统计信息
   * 
   * @param logs - 要统计的日志（可选，默认所有日志）
   * @returns 统计对象
   * 
   * @example
   * ```ts
   * const stats = query.getStats()
   * console.log(`总计: ${stats.total}`)
   * console.log(`错误: ${stats.byLevel.ERROR}`)
   * ```
   */
  getStats(logs?: LogEntry[]): {
    total: number
    byLevel: Record<string, number>
    bySources: Record<string, number>
    byTags: Record<string, number>
    timeRange: { start: number, end: number } | null
  } {
    const data = logs || this.logs

    const stats = {
      total: data.length,
      byLevel: {} as Record<string, number>,
      bySources: {} as Record<string, number>,
      byTags: {} as Record<string, number>,
      timeRange: null as { start: number, end: number } | null,
    }

    if (data.length === 0) {
      return stats
    }

    let minTime = Infinity
    let maxTime = -Infinity

    // 统计各项
    for (const log of data) {
      // 统计级别
      const levelName = LogLevelNames[log.level]
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1

      // 统计来源
      if (log.source) {
        stats.bySources[log.source] = (stats.bySources[log.source] || 0) + 1
      }

      // 统计标签
      if (log.tags) {
        for (const tag of log.tags) {
          stats.byTags[tag] = (stats.byTags[tag] || 0) + 1
        }
      }

      // 时间范围
      minTime = Math.min(minTime, log.timestamp)
      maxTime = Math.max(maxTime, log.timestamp)
    }

    stats.timeRange = { start: minTime, end: maxTime }

    return stats
  }
}

/**
 * 创建日志查询器
 * 
 * @param logs - 日志条目数组
 * @returns LogQuery 实例
 * 
 * @example
 * ```ts
 * // 从 StorageTransport 获取日志
 * const logs = storageTransport.getLogs()
 * const query = createLogQuery(logs)
 * 
 * // 查询最近的错误
 * const errors = query.query({
 *   levels: [LogLevel.ERROR, LogLevel.FATAL],
 *   limit: 10
 * })
 * 
 * // 导出
 * query.download('errors.csv', 'csv', errors)
 * ```
 */
export function createLogQuery(logs: LogEntry[]): LogQuery {
  return new LogQuery(logs)
}

/**
 * 快速查询辅助函数
 */

/**
 * 查询指定时间范围内的日志
 * 
 * @param logs - 日志数组
 * @param startTime - 开始时间
 * @param endTime - 结束时间
 * @returns 符合条件的日志
 */
export function queryByTimeRange(
  logs: LogEntry[],
  startTime: number,
  endTime: number,
): LogEntry[] {
  return logs.filter(
    log => log.timestamp >= startTime && log.timestamp <= endTime,
  )
}

/**
 * 查询指定级别的日志
 * 
 * @param logs - 日志数组
 * @param levels - 日志级别数组
 * @returns 符合条件的日志
 */
export function queryByLevel(logs: LogEntry[], levels: LogLevel[]): LogEntry[] {
  const levelSet = new Set(levels)
  return logs.filter(log => levelSet.has(log.level))
}

/**
 * 搜索包含关键词的日志
 * 
 * @param logs - 日志数组
 * @param keyword - 关键词（不区分大小写）
 * @returns 符合条件的日志
 */
export function searchByKeyword(logs: LogEntry[], keyword: string): LogEntry[] {
  const lowerKeyword = keyword.toLowerCase()
  return logs.filter(log => log.message.toLowerCase().includes(lowerKeyword))
}

/**
 * 获取最新的 N 条日志
 * 
 * @param logs - 日志数组
 * @param count - 数量
 * @returns 最新的 N 条日志
 */
export function getLatestLogs(logs: LogEntry[], count: number): LogEntry[] {
  return logs
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, count)
}

