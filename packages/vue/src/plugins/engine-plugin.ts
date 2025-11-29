/**
 * Logger Engine Plugin
 *
 * 将 Logger 功能集成到 LDesign Engine
 *
 * @example
 * ```ts
 * import { createVueEngine } from '@ldesign/engine-vue3'
 * import { createLoggerEnginePlugin } from '@ldesign/logger-vue/plugins'
 *
 * const engine = createVueEngine({
 *   plugins: [
 *     createLoggerEnginePlugin({
 *       level: 'debug',
 *       enableErrorTracking: true,
 *       enablePerformanceMonitoring: true,
 *     })
 *   ]
 * })
 * ```
 */
import type { App } from 'vue'
import type { VueLogger, VueLoggerOptions } from '../types'
import { createLogger } from '../plugin/create-logger'

/** 引擎类型接口 */
interface EngineLike {
  getApp?: () => App | null
  events?: {
    on: (event: string, handler: (...args: unknown[]) => void) => void
    emit: (event: string, payload?: unknown) => void
    once: (event: string, handler: (...args: unknown[]) => void) => void
  }
  api?: {
    register: (name: string, service: unknown) => void
    get: (name: string) => unknown
  }
  logger?: {
    info: (...args: unknown[]) => void
    debug: (...args: unknown[]) => void
    error: (...args: unknown[]) => void
  }
}

/** 插件上下文 */
interface PluginContext {
  engine?: EngineLike
}

/** 插件接口 */
interface Plugin {
  name: string
  version: string
  dependencies?: string[]
  install: (context: PluginContext | EngineLike) => void | Promise<void>
  uninstall?: (context: PluginContext | EngineLike) => void | Promise<void>
}

/**
 * Logger Engine 插件选项
 */
export interface LoggerEnginePluginOptions extends VueLoggerOptions {
  /** 插件名称（引擎插件标识）@default 'logger' */
  pluginName?: string
  /** 插件版本 @default '1.0.0' */
  pluginVersion?: string
  /** 是否启用调试模式 @default false */
  debug?: boolean
  /** 全局属性名 @default '$logger' */
  globalPropertyName?: string
}

/** 日志器实例缓存 */
let loggerInstance: VueLogger | null = null

/**
 * 创建 Logger Engine 插件
 *
 * @param options - 插件配置选项
 * @returns Engine 插件实例
 */
export function createLoggerEnginePlugin(
  options: LoggerEnginePluginOptions = {},
): Plugin {
  const {
    pluginName = 'logger',
    pluginVersion = '1.0.0',
    debug = false,
    globalPropertyName = '$logger',
    ...loggerOptions
  } = options

  // Vue 插件安装标志
  let vueInstalled = false

  if (debug) {
    console.log('[Logger Plugin] createLoggerEnginePlugin called with options:', options)
  }

  return {
    name: pluginName,
    version: pluginVersion,
    dependencies: [],

    async install(context: PluginContext | EngineLike) {
      const engine = (context as PluginContext).engine || (context as EngineLike)

      if (debug) {
        console.log('[Logger Plugin] install called, engine:', !!engine)
      }

      // 创建日志器实例
      loggerInstance = createLogger({
        ...loggerOptions,
        globalPropertyName,
      })

      // 注册 Logger API 到 API 注册表
      if (engine?.api?.register) {
        const loggerAPI = {
          name: 'logger',
          version: pluginVersion,
          // 代理日志器方法
          trace: (message: string, data?: unknown) => loggerInstance?.trace(message, data),
          debug: (message: string, data?: unknown) => loggerInstance?.debug(message, data),
          info: (message: string, data?: unknown) => loggerInstance?.info(message, data),
          warn: (message: string, data?: unknown) => loggerInstance?.warn(message, data),
          error: (message: string, error?: Error | unknown, data?: unknown) => loggerInstance?.error(message, error, data),
          fatal: (message: string, error?: Error | unknown, data?: unknown) => loggerInstance?.fatal(message, error, data),
          // 获取日志器实例
          getInstance: () => loggerInstance,
        }
        engine.api.register(loggerAPI)
      }

      // 安装 Vue 插件
      const installVuePlugin = (app: App): void => {
        if (vueInstalled) return
        vueInstalled = true

        // 使用日志器的 install 方法
        loggerInstance?.install(app)

        if (debug) {
          console.log('[Logger Plugin] Vue 插件已安装')
        }
      }

      // 尝试立即安装到 Vue
      const vueApp = engine?.getApp?.()
      if (vueApp) {
        installVuePlugin(vueApp)
      }
      else {
        // 等待 Vue 应用创建
        engine?.events?.once?.('app:created', (payload: unknown) => {
          const app = (payload as { app?: App })?.app
          if (app) installVuePlugin(app)
        })
      }
    },

    async uninstall(context: PluginContext | EngineLike) {
      vueInstalled = false

      // 关闭日志器
      if (loggerInstance) {
        await loggerInstance.close()
        loggerInstance = null
      }

      if (debug) {
        console.log('[Logger Plugin] uninstall called')
      }
    },
  }
}

/**
 * 获取当前日志器实例
 */
export function getLoggerInstance(): VueLogger | null {
  return loggerInstance
}

