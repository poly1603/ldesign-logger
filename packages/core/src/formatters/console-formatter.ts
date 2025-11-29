/**
 * 控制台格式化器
 * @description 提供美化的控制台日志输出格式化功能
 */

import type { LogEntry, LogFormatter } from '../types'
import { LogLevel } from '../types'
import type { ConsoleTheme } from '../styles/themes'
import { DEFAULT_THEME } from '../styles/themes'
import { getLevelBadge, LEVEL_BADGES } from '../styles/badges'
import { BROWSER_COLORS, isBrowser, LEVEL_BROWSER_STYLES } from '../styles/colors'
import { formatTimestamp } from '../utils/format'

/**
 * 控制台格式化器配置
 */
export interface ConsoleFormatterOptions {
  /** 主题配置 */
  theme?: ConsoleTheme
  /** 是否为开发环境 */
  isDev?: boolean
  /** 最大对象深度 */
  maxDepth?: number
  /** 最大数组长度 */
  maxArrayLength?: number
  /** 最大字符串长度 */
  maxStringLength?: number
}

/**
 * 格式化后的输出结果
 */
export interface FormattedOutput {
  /** 格式字符串（包含 %c 占位符） */
  format: string
  /** 样式参数数组 */
  styles: string[]
  /** 附加数据 */
  data?: unknown
  /** 堆栈信息 */
  stack?: string
}

/**
 * 控制台格式化器
 * @description 将日志条目格式化为带样式的控制台输出
 */
export class ConsoleFormatter implements LogFormatter {
  readonly name = 'console-formatter'
  private theme: ConsoleTheme
  private options: Required<ConsoleFormatterOptions>

  constructor(options: ConsoleFormatterOptions = {}) {
    this.theme = options.theme || DEFAULT_THEME
    this.options = {
      theme: this.theme,
      isDev: options.isDev ?? true,
      maxDepth: options.maxDepth ?? 4,
      maxArrayLength: options.maxArrayLength ?? 100,
      maxStringLength: options.maxStringLength ?? 1000,
    }
  }

  /**
   * 格式化日志条目为字符串（基础实现）
   */
  format(entry: LogEntry): string {
    const timestamp = formatTimestamp(entry.timestamp, this.theme.timeFormat)
    const level = entry.levelName.toUpperCase().padEnd(5)
    const source = entry.source ? `[${entry.source}]` : ''
    return `${timestamp} ${level} ${source} ${entry.message}`
  }

  /**
   * 格式化日志条目为带样式的输出
   * @param entry - 日志条目
   * @returns 格式化后的输出对象
   */
  formatStyled(entry: LogEntry): FormattedOutput {
    const parts: string[] = []
    const styles: string[] = []

    // 时间戳
    if (this.theme.showTimestamp) {
      const time = formatTimestamp(entry.timestamp, this.theme.timeFormat)
      parts.push(`%c${time}`)
      styles.push(BROWSER_COLORS.timestamp)
    }

    // 级别徽章或文本
    if (this.theme.showBadges) {
      const badge = getLevelBadge(entry.level, this.theme.showIcons)
      parts.push(`%c${badge.text}`)
      styles.push(badge.style)
    }
    else {
      const levelText = entry.levelName.toUpperCase().padEnd(5)
      parts.push(`%c${levelText}`)
      styles.push(LEVEL_BROWSER_STYLES[entry.level])
    }

    // 来源
    if (entry.source) {
      parts.push(`%c[${entry.source}]`)
      styles.push(`color: ${this.theme.colors.source}`)
    }

    // 标签
    if (entry.tags?.length) {
      parts.push(`%c{${entry.tags.join(', ')}}`)
      styles.push(`color: ${this.theme.colors.tag}`)
    }

    // 消息
    parts.push(`%c${entry.message}`)
    styles.push(`color: ${this.theme.colors.message}`)

    return {
      format: parts.join(' '),
      styles,
      data: entry.data,
      stack: entry.stack,
    }
  }

  /**
   * 格式化对象为树形结构
   */
  formatObject(obj: unknown, depth: number = 0): string {
    if (depth > this.options.maxDepth) {
      return '[Object]'
    }

    if (obj === null)
      return 'null'
    if (obj === undefined)
      return 'undefined'
    if (typeof obj === 'string') {
      return obj.length > this.options.maxStringLength
        ? `"${obj.slice(0, this.options.maxStringLength)}..." (${obj.length} chars)`
        : `"${obj}"`
    }
    if (typeof obj !== 'object')
      return String(obj)

    if (Array.isArray(obj)) {
      if (obj.length > this.options.maxArrayLength) {
        return `Array(${obj.length}) [...]`
      }
      return `[${obj.map(item => this.formatObject(item, depth + 1)).join(', ')}]`
    }

    const entries = Object.entries(obj as Record<string, unknown>)
    if (entries.length === 0)
      return '{}'

    const indent = '  '.repeat(depth + 1)
    const closing = '  '.repeat(depth)
    const formatted = entries
      .map(([key, value]) => `${indent}${key}: ${this.formatObject(value, depth + 1)}`)
      .join(',\n')

    return `{\n${formatted}\n${closing}}`
  }

  /**
   * 格式化表格数据
   */
  formatTable(data: Record<string, unknown>[] | unknown[][]): void {
    if (!isBrowser()) {
      console.log(data)
      return
    }
    console.table(data)
  }
}

