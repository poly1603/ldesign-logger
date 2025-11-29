/**
 * 控制台主题配置
 * @description 提供不同的控制台输出主题，支持开发/生产模式切换
 */

import type { LogLevel } from '../types'

/**
 * 主题颜色配置接口
 */
export interface ThemeColors {
  /** 追踪级别颜色 */
  trace: string
  /** 调试级别颜色 */
  debug: string
  /** 信息级别颜色 */
  info: string
  /** 警告级别颜色 */
  warn: string
  /** 错误级别颜色 */
  error: string
  /** 致命级别颜色 */
  fatal: string
  /** 时间戳颜色 */
  timestamp: string
  /** 来源颜色 */
  source: string
  /** 标签颜色 */
  tag: string
  /** 消息颜色 */
  message: string
  /** 数据颜色 */
  data: string
  /** 堆栈颜色 */
  stack: string
}

/**
 * 主题配置接口
 */
export interface ConsoleTheme {
  /** 主题名称 */
  name: string
  /** 颜色配置 */
  colors: ThemeColors
  /** 是否显示图标 */
  showIcons: boolean
  /** 是否显示徽章 */
  showBadges: boolean
  /** 是否显示时间戳 */
  showTimestamp: boolean
  /** 时间格式 */
  timeFormat: 'full' | 'time' | 'iso'
  /** 是否使用分组 */
  useGroups: boolean
  /** 是否美化数据输出 */
  prettyData: boolean
  /** 是否显示文件链接 */
  showFileLinks: boolean
}

/**
 * 默认主题 - 适合开发环境
 */
export const DEFAULT_THEME: ConsoleTheme = {
  name: 'default',
  colors: {
    trace: '#9ca3af',
    debug: '#06b6d4',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626',
    timestamp: '#9ca3af',
    source: '#6366f1',
    tag: '#f97316',
    message: 'inherit',
    data: '#8b5cf6',
    stack: '#ef4444',
  },
  showIcons: true,
  showBadges: true,
  showTimestamp: true,
  timeFormat: 'time',
  useGroups: true,
  prettyData: true,
  showFileLinks: true,
}

/**
 * 精简主题 - 适合生产环境
 */
export const MINIMAL_THEME: ConsoleTheme = {
  name: 'minimal',
  colors: {
    trace: '#9ca3af',
    debug: '#06b6d4',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626',
    timestamp: '#9ca3af',
    source: '#6366f1',
    tag: '#f97316',
    message: 'inherit',
    data: '#8b5cf6',
    stack: '#ef4444',
  },
  showIcons: false,
  showBadges: false,
  showTimestamp: false,
  timeFormat: 'time',
  useGroups: false,
  prettyData: false,
  showFileLinks: false,
}

/**
 * 暗色主题
 */
export const DARK_THEME: ConsoleTheme = {
  name: 'dark',
  colors: {
    trace: '#6b7280',
    debug: '#22d3ee',
    info: '#60a5fa',
    warn: '#fbbf24',
    error: '#f87171',
    fatal: '#f87171',
    timestamp: '#6b7280',
    source: '#a5b4fc',
    tag: '#fb923c',
    message: '#e5e7eb',
    data: '#c4b5fd',
    stack: '#fca5a5',
  },
  showIcons: true,
  showBadges: true,
  showTimestamp: true,
  timeFormat: 'time',
  useGroups: true,
  prettyData: true,
  showFileLinks: true,
}

/**
 * 预定义主题集合
 */
export const THEMES: Record<string, ConsoleTheme> = {
  default: DEFAULT_THEME,
  minimal: MINIMAL_THEME,
  dark: DARK_THEME,
}

/**
 * 获取主题
 * @param name - 主题名称
 */
export function getTheme(name: string): ConsoleTheme {
  return THEMES[name] || DEFAULT_THEME
}

/**
 * 根据环境自动选择主题
 * @param isDev - 是否为开发环境
 */
export function getAutoTheme(isDev: boolean = true): ConsoleTheme {
  return isDev ? DEFAULT_THEME : MINIMAL_THEME
}

/**
 * 创建自定义主题
 * @param overrides - 覆盖的配置
 */
export function createTheme(overrides: Partial<ConsoleTheme>): ConsoleTheme {
  return {
    ...DEFAULT_THEME,
    ...overrides,
    colors: {
      ...DEFAULT_THEME.colors,
      ...overrides.colors,
    },
  }
}

