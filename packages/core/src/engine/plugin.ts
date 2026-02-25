/**
 * @ldesign/logger Engine 插件
 */
import type { LoggerEnginePluginOptions } from './types'
import { Logger } from '../logger/logger'

export const loggerStateKeys = {
  INSTANCE: 'logger:instance' as const,
} as const

export const loggerEventKeys = {
  INSTALLED: 'logger:installed' as const,
  UNINSTALLED: 'logger:uninstalled' as const,
} as const

export function createLoggerEnginePlugin(options: LoggerEnginePluginOptions = {}) {
  let logger: Logger | null = null
  return {
    name: 'logger',
    version: '1.0.0',
    dependencies: options.dependencies ?? [],

    async install(context: any) {
      const engine = context.engine || context
      logger = new Logger(options as any)
      engine.state?.set(loggerStateKeys.INSTANCE, logger)
      engine.events?.emit(loggerEventKeys.INSTALLED, { name: 'logger' })
      engine.logger?.info('[Logger Plugin] installed')
    },

    async uninstall(context: any) {
      const engine = context.engine || context
      logger = null
      engine.state?.delete(loggerStateKeys.INSTANCE)
      engine.events?.emit(loggerEventKeys.UNINSTALLED, {})
      engine.logger?.info('[Logger Plugin] uninstalled')
    },
  }
}
