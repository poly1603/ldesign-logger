/**
 * 控制台拦截插件
 * @description 拦截 console 方法并转发到日志器
 */

import type { ILogger, LogEntry, LoggerPlugin } from '../types'
import { LogLevel } from '../types'

/**
 * 控制台插件配置
 */
export interface ConsolePluginOptions {
  /** 是否拦截 console.log */
  interceptLog?: boolean
  /** 是否拦截 console.info */
  interceptInfo?: boolean
  /** 是否拦截 console.warn */
  interceptWarn?: boolean
  /** 是否拦截 console.error */
  interceptError?: boolean
  /** 是否拦截 console.debug */
  interceptDebug?: boolean
  /** 是否保留原始输出 */
  preserveOriginal?: boolean
}

/**
 * 控制台拦截插件
 * @description 拦截浏览器 console 方法，将输出转发到日志器
 * @example
 * ```ts
 * const plugin = new ConsolePlugin({
 *   interceptLog: true,
 *   interceptError: true,
 *   preserveOriginal: true,
 * })
 *
 * logger.use(plugin)
 *
 * // 现在 console.log 会被记录到日志器
 * console.log('Hello') // 同时输出到控制台和日志器
 * ```
 */
export class ConsolePlugin implements LoggerPlugin {
  readonly name = 'console'

  private options: Required<ConsolePluginOptions>
  private logger?: ILogger
  private originalMethods: {
    log?: typeof console.log
    info?: typeof console.info
    warn?: typeof console.warn
    error?: typeof console.error
    debug?: typeof console.debug
  } = {}

  constructor(options: ConsolePluginOptions = {}) {
    this.options = {
      interceptLog: options.interceptLog ?? true,
      interceptInfo: options.interceptInfo ?? true,
      interceptWarn: options.interceptWarn ?? true,
      interceptError: options.interceptError ?? true,
      interceptDebug: options.interceptDebug ?? true,
      preserveOriginal: options.preserveOriginal ?? true,
    }
  }

  /**
   * 初始化插件
   */
  init(logger: ILogger): void {
    this.logger = logger

    if (typeof console === 'undefined') {
      return
    }

    // 保存原始方法
    if (this.options.interceptLog) {
      this.originalMethods.log = console.log
      console.log = this.createInterceptor('log', LogLevel.INFO)
    }

    if (this.options.interceptInfo) {
      this.originalMethods.info = console.info
      console.info = this.createInterceptor('info', LogLevel.INFO)
    }

    if (this.options.interceptWarn) {
      this.originalMethods.warn = console.warn
      console.warn = this.createInterceptor('warn', LogLevel.WARN)
    }

    if (this.options.interceptError) {
      this.originalMethods.error = console.error
      console.error = this.createInterceptor('error', LogLevel.ERROR)
    }

    if (this.options.interceptDebug) {
      this.originalMethods.debug = console.debug
      console.debug = this.createInterceptor('debug', LogLevel.DEBUG)
    }
  }

  /**
   * 销毁插件
   */
  destroy(): void {
    // 恢复原始方法
    if (this.originalMethods.log) {
      console.log = this.originalMethods.log
    }
    if (this.originalMethods.info) {
      console.info = this.originalMethods.info
    }
    if (this.originalMethods.warn) {
      console.warn = this.originalMethods.warn
    }
    if (this.originalMethods.error) {
      console.error = this.originalMethods.error
    }
    if (this.originalMethods.debug) {
      console.debug = this.originalMethods.debug
    }

    this.originalMethods = {}
    this.logger = undefined
  }

  /**
   * 创建拦截器
   * @private
   */
  private createInterceptor(method: keyof typeof this.originalMethods, level: LogLevel) {
    const original = this.originalMethods[method]
    const plugin = this

    return function (this: Console, ...args: unknown[]) {
      // 转发到日志器
      if (plugin.logger) {
        const message = args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg),
        ).join(' ')

        switch (level) {
          case LogLevel.DEBUG:
            plugin.logger.debug(message, { consoleArgs: args })
            break
          case LogLevel.INFO:
            plugin.logger.info(message, { consoleArgs: args })
            break
          case LogLevel.WARN:
            plugin.logger.warn(message, { consoleArgs: args })
            break
          case LogLevel.ERROR:
            plugin.logger.error(message, undefined, { consoleArgs: args })
            break
        }
      }

      // 保留原始输出
      if (plugin.options.preserveOriginal && original) {
        original.apply(this, args)
      }
    }
  }
}

/**
 * 创建控制台插件
 * @param options - 配置选项
 * @returns 控制台插件实例
 */
export function createConsolePlugin(options?: ConsolePluginOptions): ConsolePlugin {
  return new ConsolePlugin(options)
}

