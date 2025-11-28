/**
 * useLogger composable
 * @description 在 Vue 组件中使用日志器
 */

import { getCurrentInstance, inject } from 'vue'
import type { UseLoggerReturn, VueLogger } from '../types'
import { LOGGER_INJECTION_KEY } from '../types'

/**
 * 使用日志器
 * @description 在 Vue 组件中获取日志器实例和便捷方法
 * @returns 日志器实例和便捷方法
 * @throws 如果日志器未安装则抛出错误
 * @example
 * ```vue
 * <script setup>
 * import { useLogger } from '@ldesign/logger-vue'
 *
 * const { info, error, withContext } = useLogger()
 *
 * // 记录日志
 * info('组件已挂载')
 *
 * // 记录错误
 * try {
 *   await fetchData()
 * } catch (e) {
 *   error('获取数据失败', e)
 * }
 *
 * // 使用上下文
 * const userLogger = withContext({ userId: '123' })
 * userLogger.info('用户操作')
 * </script>
 * ```
 */
export function useLogger(): UseLoggerReturn {
  const logger = inject(LOGGER_INJECTION_KEY)

  if (!logger) {
    throw new Error(
      '[useLogger] 日志器未安装。请确保在 app.use() 中安装了日志器插件。',
    )
  }

  return {
    logger,
    trace: (message: string, data?: unknown) => logger.trace(message, data),
    debug: (message: string, data?: unknown) => logger.debug(message, data),
    info: (message: string, data?: unknown) => logger.info(message, data),
    warn: (message: string, data?: unknown) => logger.warn(message, data),
    error: (message: string, error?: Error | unknown, data?: unknown) =>
      logger.error(message, error, data),
    fatal: (message: string, error?: Error | unknown, data?: unknown) =>
      logger.fatal(message, error, data),
    withContext: context => logger.withContext(context),
    withTags: (...tags) => logger.withTags(...tags),
  }
}

/**
 * 使用组件日志器
 * @description 创建一个带有组件名称上下文的日志器
 * @param componentName - 组件名称，如果不提供则自动获取
 * @returns 日志器实例和便捷方法
 * @example
 * ```vue
 * <script setup>
 * import { useComponentLogger } from '@ldesign/logger-vue'
 *
 * const { info, error } = useComponentLogger()
 *
 * // 日志会自动包含组件名称
 * info('组件已挂载') // [MyComponent] 组件已挂载
 * </script>
 * ```
 */
export function useComponentLogger(componentName?: string): UseLoggerReturn {
  const { logger, ...methods } = useLogger()

  // 获取组件名称
  const instance = getCurrentInstance()
  const name = componentName || instance?.type?.name || instance?.type?.__name || 'Anonymous'

  // 创建带组件上下文的日志器
  const componentLogger = logger.withContext({ source: name }) as VueLogger

  return {
    logger: componentLogger,
    trace: (message: string, data?: unknown) => componentLogger.trace(message, data),
    debug: (message: string, data?: unknown) => componentLogger.debug(message, data),
    info: (message: string, data?: unknown) => componentLogger.info(message, data),
    warn: (message: string, data?: unknown) => componentLogger.warn(message, data),
    error: (message: string, err?: Error | unknown, data?: unknown) =>
      componentLogger.error(message, err, data),
    fatal: (message: string, err?: Error | unknown, data?: unknown) =>
      componentLogger.fatal(message, err, data),
    withContext: context => componentLogger.withContext(context),
    withTags: (...tags) => componentLogger.withTags(...tags),
  }
}

/**
 * 尝试使用日志器
 * @description 安全地获取日志器，如果未安装则返回 undefined
 * @returns 日志器实例或 undefined
 */
export function tryUseLogger(): VueLogger | undefined {
  return inject(LOGGER_INJECTION_KEY)
}

