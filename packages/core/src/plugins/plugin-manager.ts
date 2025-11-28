/**
 * 插件管理器
 * @description 管理日志器插件的生命周期
 */

import type { ILogger, LogEntry, LoggerPlugin } from '../types'

/**
 * 插件管理器
 * @description 负责插件的注册、初始化和生命周期管理
 * @example
 * ```ts
 * const manager = new PluginManager(logger)
 *
 * manager.register(new ConsolePlugin())
 * manager.register(new PerformancePlugin())
 *
 * await manager.initAll()
 * ```
 */
export class PluginManager {
  private plugins: Map<string, LoggerPlugin> = new Map()
  private logger: ILogger

  /**
   * 创建插件管理器
   * @param logger - 关联的日志器
   */
  constructor(logger: ILogger) {
    this.logger = logger
  }

  /**
   * 注册插件
   * @param plugin - 插件实例
   */
  register(plugin: LoggerPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] 插件 "${plugin.name}" 已存在，将被覆盖`)
    }
    this.plugins.set(plugin.name, plugin)
  }

  /**
   * 注销插件
   * @param name - 插件名称
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name)
    if (plugin) {
      await plugin.destroy?.()
      this.plugins.delete(name)
    }
  }

  /**
   * 获取插件
   * @param name - 插件名称
   * @returns 插件实例或 undefined
   */
  get(name: string): LoggerPlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 检查插件是否存在
   * @param name - 插件名称
   * @returns 是否存在
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * 获取所有插件
   * @returns 插件数组
   */
  getAll(): LoggerPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 初始化所有插件
   */
  async initAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.init?.(this.logger)
      }
      catch (error) {
        console.error(`[PluginManager] 插件 "${plugin.name}" 初始化失败:`, error)
      }
    }
  }

  /**
   * 销毁所有插件
   */
  async destroyAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.destroy?.()
      }
      catch (error) {
        console.error(`[PluginManager] 插件 "${plugin.name}" 销毁失败:`, error)
      }
    }
    this.plugins.clear()
  }

  /**
   * 调用所有插件的 beforeLog 钩子
   * @param entry - 日志条目
   * @returns 处理后的日志条目或 null（表示跳过）
   */
  async beforeLog(entry: LogEntry): Promise<LogEntry | null> {
    let currentEntry: LogEntry | null = entry

    for (const plugin of this.plugins.values()) {
      if (!currentEntry) {
        break
      }

      try {
        const result = await plugin.beforeLog?.(currentEntry)
        if (result === null || result === false) {
          return null
        }
        if (typeof result === 'object') {
          currentEntry = result
        }
      }
      catch (error) {
        console.error(`[PluginManager] 插件 "${plugin.name}" beforeLog 失败:`, error)
      }
    }

    return currentEntry
  }

  /**
   * 调用所有插件的 afterLog 钩子
   * @param entry - 日志条目
   */
  async afterLog(entry: LogEntry): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.afterLog?.(entry)
      }
      catch (error) {
        console.error(`[PluginManager] 插件 "${plugin.name}" afterLog 失败:`, error)
      }
    }
  }

  /**
   * 调用所有插件的 onError 钩子
   * @param error - 错误对象
   * @param entry - 相关的日志条目
   */
  async onError(error: Error, entry?: LogEntry): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.onError?.(error, entry)
      }
      catch (err) {
        console.error(`[PluginManager] 插件 "${plugin.name}" onError 失败:`, err)
      }
    }
  }
}

/**
 * 创建插件管理器
 * @param logger - 关联的日志器
 * @returns 插件管理器实例
 */
export function createPluginManager(logger: ILogger): PluginManager {
  return new PluginManager(logger)
}

