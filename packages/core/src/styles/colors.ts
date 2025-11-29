/**
 * 控制台颜色定义
 * @description 提供浏览器和 Node.js 控制台的颜色样式
 */

import { LogLevel } from '../types'

/**
 * 浏览器控制台颜色样式（CSS 格式）
 */
export const BROWSER_COLORS = {
  /** 红色 - 错误 */
  red: 'color: #ef4444; font-weight: bold',
  /** 黄色 - 警告 */
  yellow: 'color: #f59e0b; font-weight: bold',
  /** 蓝色 - 信息 */
  blue: 'color: #3b82f6',
  /** 绿色 - 成功 */
  green: 'color: #22c55e',
  /** 灰色 - 调试 */
  gray: 'color: #6b7280',
  /** 紫色 - 致命 */
  purple: 'color: #a855f7; font-weight: bold',
  /** 青色 - 追踪 */
  cyan: 'color: #06b6d4',
  /** 橙色 - 标签 */
  orange: 'color: #f97316',
  /** 靛蓝 - 来源 */
  indigo: 'color: #6366f1',
  /** 默认 */
  default: 'color: inherit',
  /** 时间戳 */
  timestamp: 'color: #9ca3af; font-size: 11px',
  /** 重置 */
  reset: '',
} as const

/**
 * Node.js 控制台 ANSI 颜色代码
 */
export const ANSI_COLORS = {
  /** 重置 */
  reset: '\x1B[0m',
  /** 红色 */
  red: '\x1B[31m',
  /** 黄色 */
  yellow: '\x1B[33m',
  /** 蓝色 */
  blue: '\x1B[34m',
  /** 绿色 */
  green: '\x1B[32m',
  /** 灰色 */
  gray: '\x1B[90m',
  /** 紫色 */
  purple: '\x1B[35m',
  /** 青色 */
  cyan: '\x1B[36m',
  /** 白色 */
  white: '\x1B[37m',
  /** 加粗 */
  bold: '\x1B[1m',
  /** 暗淡 */
  dim: '\x1B[2m',
  /** 下划线 */
  underline: '\x1B[4m',
  /** 背景红 */
  bgRed: '\x1B[41m',
  /** 背景黄 */
  bgYellow: '\x1B[43m',
  /** 背景蓝 */
  bgBlue: '\x1B[44m',
  /** 背景绿 */
  bgGreen: '\x1B[42m',
} as const

/**
 * 日志级别对应的浏览器控制台样式
 */
export const LEVEL_BROWSER_STYLES: Record<LogLevel, string> = {
  [LogLevel.TRACE]: 'color: #9ca3af; font-style: italic',
  [LogLevel.DEBUG]: 'color: #06b6d4',
  [LogLevel.INFO]: 'color: #3b82f6; font-weight: 500',
  [LogLevel.WARN]: 'color: #f59e0b; font-weight: bold',
  [LogLevel.ERROR]: 'color: #ef4444; font-weight: bold',
  [LogLevel.FATAL]: 'color: #fff; background: #dc2626; padding: 2px 6px; border-radius: 3px; font-weight: bold',
  [LogLevel.SILENT]: '',
}

/**
 * 日志级别对应的 ANSI 颜色
 */
export const LEVEL_ANSI_COLORS: Record<LogLevel, string> = {
  [LogLevel.TRACE]: ANSI_COLORS.gray,
  [LogLevel.DEBUG]: ANSI_COLORS.cyan,
  [LogLevel.INFO]: ANSI_COLORS.blue,
  [LogLevel.WARN]: ANSI_COLORS.yellow,
  [LogLevel.ERROR]: ANSI_COLORS.red,
  [LogLevel.FATAL]: `${ANSI_COLORS.bgRed}${ANSI_COLORS.white}${ANSI_COLORS.bold}`,
  [LogLevel.SILENT]: '',
}

/**
 * 检测是否为浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

/**
 * 检测是否支持控制台颜色
 */
export function supportsColor(): boolean {
  if (isBrowser()) {
    return true
  }
  // Node.js 环境检测
  if (typeof process !== 'undefined') {
    return process.stdout?.isTTY === true || process.env.FORCE_COLOR !== undefined
  }
  return false
}

/**
 * 获取日志级别对应的颜色样式
 * @param level - 日志级别
 * @param forBrowser - 是否为浏览器环境
 */
export function getLevelStyle(level: LogLevel, forBrowser: boolean = isBrowser()): string {
  return forBrowser ? LEVEL_BROWSER_STYLES[level] : LEVEL_ANSI_COLORS[level]
}

