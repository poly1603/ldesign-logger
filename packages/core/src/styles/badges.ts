/**
 * 控制台徽章样式
 * @description 提供日志徽章的样式定义，用于美化日志输出
 */

import { LogLevel } from '../types'

/**
 * 徽章配置接口
 */
export interface BadgeConfig {
  /** 徽章文本 */
  text: string
  /** 背景颜色 */
  background: string
  /** 文字颜色 */
  color: string
  /** 图标（emoji） */
  icon?: string
}

/**
 * 日志级别对应的徽章配置
 */
export const LEVEL_BADGES: Record<LogLevel, BadgeConfig> = {
  [LogLevel.TRACE]: {
    text: 'TRACE',
    background: '#e5e7eb',
    color: '#4b5563',
    icon: '🔍',
  },
  [LogLevel.DEBUG]: {
    text: 'DEBUG',
    background: '#cffafe',
    color: '#0891b2',
    icon: '🐛',
  },
  [LogLevel.INFO]: {
    text: 'INFO',
    background: '#dbeafe',
    color: '#2563eb',
    icon: 'ℹ️',
  },
  [LogLevel.WARN]: {
    text: 'WARN',
    background: '#fef3c7',
    color: '#d97706',
    icon: '⚠️',
  },
  [LogLevel.ERROR]: {
    text: 'ERROR',
    background: '#fee2e2',
    color: '#dc2626',
    icon: '❌',
  },
  [LogLevel.FATAL]: {
    text: 'FATAL',
    background: '#dc2626',
    color: '#ffffff',
    icon: '💀',
  },
  [LogLevel.SILENT]: {
    text: '',
    background: 'transparent',
    color: 'inherit',
  },
}

/**
 * 生成浏览器徽章样式
 * @param badge - 徽章配置
 * @returns CSS 样式字符串
 */
export function createBadgeStyle(badge: BadgeConfig): string {
  return `
    background: ${badge.background};
    color: ${badge.color};
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
  `.replace(/\s+/g, ' ').trim()
}

/**
 * 获取日志级别的徽章
 * @param level - 日志级别
 * @param showIcon - 是否显示图标
 * @returns 格式化的徽章文本和样式
 */
export function getLevelBadge(level: LogLevel, showIcon: boolean = true): { text: string, style: string } {
  const badge = LEVEL_BADGES[level]
  const text = showIcon && badge.icon ? `${badge.icon} ${badge.text}` : badge.text
  const style = createBadgeStyle(badge)
  return { text, style }
}

/**
 * 预定义的自定义徽章
 */
export const CUSTOM_BADGES = {
  /** 网络请求 */
  network: {
    text: 'NETWORK',
    background: '#fef3c7',
    color: '#92400e',
    icon: '🌐',
  },
  /** 用户操作 */
  user: {
    text: 'USER',
    background: '#e0e7ff',
    color: '#4338ca',
    icon: '👤',
  },
  /** 性能 */
  performance: {
    text: 'PERF',
    background: '#d1fae5',
    color: '#059669',
    icon: '⚡',
  },
  /** 安全 */
  security: {
    text: 'SECURITY',
    background: '#fce7f3',
    color: '#be185d',
    icon: '🔒',
  },
  /** 数据库 */
  database: {
    text: 'DB',
    background: '#fae8ff',
    color: '#a21caf',
    icon: '💾',
  },
  /** 缓存 */
  cache: {
    text: 'CACHE',
    background: '#ecfdf5',
    color: '#047857',
    icon: '📦',
  },
} as const

/**
 * 创建自定义徽章
 * @param config - 徽章配置
 */
export function createCustomBadge(config: Partial<BadgeConfig> & { text: string }): BadgeConfig {
  return {
    background: '#f3f4f6',
    color: '#374151',
    ...config,
  }
}

