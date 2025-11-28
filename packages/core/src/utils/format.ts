/**
 * 日志格式化工具
 * @description 提供日志格式化相关的工具函数
 */

import type { LogEntry } from '../types'
import { LogLevel } from '../types'

/** 日志级别名称映射 */
const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'TRACE',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
  [LogLevel.SILENT]: 'SILENT',
}

/** 日志级别颜色映射（控制台用） */
const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.TRACE]: '\x1B[90m', // 灰色
  [LogLevel.DEBUG]: '\x1B[36m', // 青色
  [LogLevel.INFO]: '\x1B[32m', // 绿色
  [LogLevel.WARN]: '\x1B[33m', // 黄色
  [LogLevel.ERROR]: '\x1B[31m', // 红色
  [LogLevel.FATAL]: '\x1B[35m', // 紫色
  [LogLevel.SILENT]: '',
}

/** 颜色重置 */
const RESET = '\x1B[0m'

/**
 * 格式化时间戳
 * @description 将时间戳格式化为可读的日期时间字符串
 * @param timestamp - 时间戳（毫秒）
 * @param format - 格式化模式
 * @returns 格式化后的时间字符串
 * @example
 * ```ts
 * formatTimestamp(Date.now())
 * // 返回 '2024-01-15 10:30:45.123'
 * ```
 */
export function formatTimestamp(
  timestamp: number,
  format: 'full' | 'time' | 'iso' = 'full',
): string {
  const date = new Date(timestamp)

  switch (format) {
    case 'iso':
      return date.toISOString()
    case 'time': {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      const ms = String(date.getMilliseconds()).padStart(3, '0')
      return `${hours}:${minutes}:${seconds}.${ms}`
    }
    default: {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      const ms = String(date.getMilliseconds()).padStart(3, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
    }
  }
}

/**
 * 获取日志级别名称
 * @description 获取日志级别的字符串表示
 * @param level - 日志级别
 * @returns 级别名称
 */
export function getLevelName(level: LogLevel): string {
  return LEVEL_NAMES[level] || 'UNKNOWN'
}

/**
 * 获取日志级别颜色
 * @description 获取日志级别对应的控制台颜色代码
 * @param level - 日志级别
 * @returns 颜色代码
 */
export function getLevelColor(level: LogLevel): string {
  return LEVEL_COLORS[level] || ''
}

/**
 * 格式化日志为文本
 * @description 将日志条目格式化为可读的文本格式
 * @param entry - 日志条目
 * @param options - 格式化选项
 * @returns 格式化后的文本
 * @example
 * ```ts
 * formatLogAsText(entry, { colors: true })
 * // 返回带颜色的日志文本
 * ```
 */
export function formatLogAsText(
  entry: LogEntry,
  options: { colors?: boolean, showData?: boolean, showStack?: boolean } = {},
): string {
  const { colors = false, showData = true, showStack = true } = options

  const timestamp = formatTimestamp(entry.timestamp, 'full')
  const levelName = getLevelName(entry.level).padEnd(5)
  const source = entry.source ? `[${entry.source}]` : ''
  const tags = entry.tags?.length ? `{${entry.tags.join(',')}}` : ''

  let line = `${timestamp} ${levelName} ${source}${tags} ${entry.message}`

  // 添加颜色
  if (colors) {
    const color = getLevelColor(entry.level)
    line = `${color}${line}${RESET}`
  }

  // 添加数据
  if (showData && entry.data) {
    line += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`
  }

  // 添加堆栈
  if (showStack && entry.stack) {
    line += `\n  Stack:\n${entry.stack.split('\n').map(l => `    ${l}`).join('\n')}`
  }

  return line
}

/**
 * 格式化日志为 JSON
 * @description 将日志条目格式化为 JSON 字符串
 * @param entry - 日志条目
 * @param pretty - 是否美化输出
 * @returns JSON 字符串
 */
export function formatLogAsJson(entry: LogEntry, pretty: boolean = false): string {
  return JSON.stringify(entry, null, pretty ? 2 : 0)
}

/**
 * 格式化日志为 CSV 行
 * @description 将日志条目格式化为 CSV 格式的一行
 * @param entry - 日志条目
 * @returns CSV 行字符串
 */
export function formatLogAsCsvRow(entry: LogEntry): string {
  const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`

  return [
    entry.id,
    entry.timestamp,
    getLevelName(entry.level),
    escapeCsv(entry.message),
    escapeCsv(entry.source || ''),
    escapeCsv(entry.tags?.join(';') || ''),
    escapeCsv(entry.data ? JSON.stringify(entry.data) : ''),
  ].join(',')
}

/**
 * 获取 CSV 头部
 * @returns CSV 头部行
 */
export function getCsvHeader(): string {
  return 'id,timestamp,level,message,source,tags,data'
}

