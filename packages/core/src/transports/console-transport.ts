/**
 * 控制台传输器
 * @description 将日志输出到浏览器控制台或 Node.js 控制台，支持美化输出
 */

import type { LogEntry, LogTransport } from '../types'
import { LogLevel } from '../types'
import { formatTimestamp, getLevelName } from '../utils/format'
import type { ConsoleTheme } from '../styles/themes'
import { DEFAULT_THEME, MINIMAL_THEME } from '../styles/themes'
import { getLevelBadge } from '../styles/badges'
import { ANSI_COLORS, isBrowser, LEVEL_ANSI_COLORS, LEVEL_BROWSER_STYLES } from '../styles/colors'

/**
 * 控制台传输器配置
 */
export interface ConsoleTransportOptions {
  /** 最低日志级别 */
  level?: LogLevel
  /** 是否启用 */
  enabled?: boolean
  /** 是否使用颜色 */
  colors?: boolean
  /** 是否显示时间戳 */
  timestamp?: boolean
  /** 是否显示数据 */
  showData?: boolean
  /** 是否显示堆栈 */
  showStack?: boolean
  /** 是否使用分组 */
  useGroup?: boolean
  /** 时间格式 */
  timeFormat?: 'full' | 'time' | 'iso'
  /** 主题配置 */
  theme?: ConsoleTheme
  /** 是否为开发环境 */
  isDev?: boolean
  /** 是否显示徽章 */
  showBadges?: boolean
  /** 是否显示图标 */
  showIcons?: boolean
  /** 是否美化数据输出 */
  prettyData?: boolean
  /** 最大数据展示深度 */
  maxDepth?: number
}

/** 日志级别对应的控制台方法 */
const LEVEL_METHODS: Record<LogLevel, 'log' | 'info' | 'warn' | 'error'> = {
  [LogLevel.TRACE]: 'log',
  [LogLevel.DEBUG]: 'log',
  [LogLevel.INFO]: 'info',
  [LogLevel.WARN]: 'warn',
  [LogLevel.ERROR]: 'error',
  [LogLevel.FATAL]: 'error',
  [LogLevel.SILENT]: 'log',
}

/**
 * 控制台传输器
 * @description 将日志美化输出到控制台，支持浏览器和 Node.js 环境
 * @example
 * ```ts
 * const transport = new ConsoleTransport({
 *   level: LogLevel.DEBUG,
 *   colors: true,
 *   timestamp: true,
 *   showBadges: true,
 *   isDev: true,
 * })
 *
 * logger.addTransport(transport)
 * ```
 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console'
  level?: LogLevel
  enabled: boolean

  private options: Required<ConsoleTransportOptions>
  private theme: ConsoleTheme
  private isBrowserEnv: boolean

  constructor(options: ConsoleTransportOptions = {}) {
    const isDev = options.isDev ?? (typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : true)
    this.theme = options.theme ?? (isDev ? DEFAULT_THEME : MINIMAL_THEME)
    this.isBrowserEnv = isBrowser()

    this.options = {
      level: options.level ?? LogLevel.TRACE,
      enabled: options.enabled ?? true,
      colors: options.colors ?? true,
      timestamp: options.timestamp ?? this.theme.showTimestamp,
      showData: options.showData ?? true,
      showStack: options.showStack ?? true,
      useGroup: options.useGroup ?? this.theme.useGroups,
      timeFormat: options.timeFormat ?? this.theme.timeFormat,
      theme: this.theme,
      isDev,
      showBadges: options.showBadges ?? this.theme.showBadges,
      showIcons: options.showIcons ?? this.theme.showIcons,
      prettyData: options.prettyData ?? this.theme.prettyData,
      maxDepth: options.maxDepth ?? 4,
    }

    this.level = this.options.level
    this.enabled = this.options.enabled
  }

  /**
   * 写入日志
   */
  write(entry: LogEntry): void {
    if (!this.enabled) {
      return
    }

    if (this.isBrowserEnv) {
      this.writeBrowser(entry)
    }
    else {
      this.writeNode(entry)
    }
  }

  /**
   * 浏览器环境输出
   * @private
   */
  private writeBrowser(entry: LogEntry): void {
    const method = LEVEL_METHODS[entry.level]
    const parts: string[] = []
    const styles: string[] = []

    // 时间戳
    if (this.options.timestamp) {
      const time = formatTimestamp(entry.timestamp, this.options.timeFormat)
      parts.push(`%c${time}`)
      styles.push('color: #9ca3af; font-size: 11px')
    }

    // 级别徽章或文本
    if (this.options.showBadges) {
      const badge = getLevelBadge(entry.level, this.options.showIcons)
      parts.push(`%c${badge.text}`)
      styles.push(badge.style)
    }
    else {
      const levelName = getLevelName(entry.level).padEnd(5)
      parts.push(`%c${levelName}`)
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

    const format = parts.join(' ')
    const hasExtra = entry.data || entry.stack

    if (this.options.useGroup && hasExtra) {
      console.groupCollapsed(format, ...styles)
      this.outputExtra(entry)
      console.groupEnd()
    }
    else {
      (console[method] as (...args: unknown[]) => void)(format, ...styles)
      if (hasExtra) {
        this.outputExtra(entry)
      }
    }
  }

  /**
   * Node.js 环境输出
   * @private
   */
  private writeNode(entry: LogEntry): void {
    const parts: string[] = []
    const reset = ANSI_COLORS.reset

    // 时间戳
    if (this.options.timestamp) {
      const time = formatTimestamp(entry.timestamp, this.options.timeFormat)
      parts.push(`${ANSI_COLORS.gray}${time}${reset}`)
    }

    // 级别
    const levelColor = LEVEL_ANSI_COLORS[entry.level]
    const levelName = getLevelName(entry.level).padEnd(5)
    parts.push(`${levelColor}${levelName}${reset}`)

    // 来源
    if (entry.source) {
      parts.push(`${ANSI_COLORS.blue}[${entry.source}]${reset}`)
    }

    // 标签
    if (entry.tags?.length) {
      parts.push(`${ANSI_COLORS.yellow}{${entry.tags.join(', ')}}${reset}`)
    }

    // 消息
    parts.push(entry.message)

    console.log(parts.join(' '))

    // 数据和堆栈
    if (this.options.showData && entry.data) {
      console.log(`  ${ANSI_COLORS.cyan}Data:${reset}`, entry.data)
    }
    if (this.options.showStack && entry.stack) {
      console.log(`  ${ANSI_COLORS.red}Stack:${reset}\n${entry.stack}`)
    }
  }

  /**
   * 输出额外信息（数据和堆栈）
   * @private
   */
  private outputExtra(entry: LogEntry): void {
    if (this.options.showData && entry.data) {
      if (this.options.prettyData) {
        console.log('%c📦 Data:', `color: ${this.theme.colors.data}; font-weight: bold`)
        if (Array.isArray(entry.data) && entry.data.length > 0 && typeof entry.data[0] === 'object') {
          console.table(entry.data)
        }
        else {
          console.dir(entry.data, { depth: this.options.maxDepth })
        }
      }
      else {
        console.log('Data:', entry.data)
      }
    }

    if (this.options.showStack && entry.stack) {
      console.log('%c📍 Stack:', `color: ${this.theme.colors.stack}; font-weight: bold`)
      console.log(entry.stack)
    }
  }

  /**
   * 输出表格数据
   * @param data - 表格数据
   */
  table(data: Record<string, unknown>[] | unknown[][]): void {
    if (this.isBrowserEnv) {
      console.table(data)
    }
    else {
      console.log(data)
    }
  }

  /**
   * 输出分组日志
   * @param label - 分组标签
   * @param collapsed - 是否折叠
   */
  group(label: string, collapsed: boolean = false): void {
    if (collapsed) {
      console.groupCollapsed(label)
    }
    else {
      console.group(label)
    }
  }

  /**
   * 结束分组
   */
  groupEnd(): void {
    console.groupEnd()
  }
}

/**
 * 创建控制台传输器
 * @param options - 配置选项
 * @returns 控制台传输器实例
 */
export function createConsoleTransport(options?: ConsoleTransportOptions): ConsoleTransport {
  return new ConsoleTransport(options)
}

