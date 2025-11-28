/**
 * Vue 插件
 * @description 将日志器集成到 Vue 应用
 */

import type { App } from 'vue'
import type { Router } from 'vue-router'
import type { VueLogger, VueLoggerOptions } from '../types'
import { LOGGER_INJECTION_KEY } from '../types'

/**
 * 安装 Vue 日志器插件
 * @description 将日志器安装到 Vue 应用，设置错误处理和全局属性
 * @param app - Vue 应用实例
 * @param logger - 日志器实例
 * @param options - 配置选项
 */
export function installVueLogger(
  app: App,
  logger: VueLogger,
  options: VueLoggerOptions = {},
): void {
  const {
    enableVueErrorHandler = true,
    enableVueWarnHandler = true,
    globalPropertyName = '$logger',
  } = options

  // 提供注入
  app.provide(LOGGER_INJECTION_KEY, logger)

  // 设置全局属性
  app.config.globalProperties[globalPropertyName] = logger

  // 设置 Vue 错误处理器
  if (enableVueErrorHandler) {
    const originalErrorHandler = app.config.errorHandler

    app.config.errorHandler = (err, instance, info) => {
      // 记录错误
      logger.error(`[Vue Error] ${info}`, err as Error, {
        componentName: instance?.$options?.name || 'Anonymous',
        info,
      })

      // 捕获到错误追踪器
      const tracker = logger.getErrorTracker()
      if (tracker) {
        tracker.captureError(err as Error, {
          type: 'vue-error',
          componentName: instance?.$options?.name,
          info,
        })
      }

      // 调用原始处理器
      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info)
      }
    }
  }

  // 设置 Vue 警告处理器
  if (enableVueWarnHandler) {
    const originalWarnHandler = app.config.warnHandler

    app.config.warnHandler = (msg, instance, trace) => {
      logger.warn(`[Vue Warn] ${msg}`, {
        componentName: instance?.$options?.name || 'Anonymous',
        trace,
      })

      // 调用原始处理器
      if (originalWarnHandler) {
        originalWarnHandler(msg, instance, trace)
      }
    }
  }

  logger.info('[VueLogger] 已安装到 Vue 应用')
}

/**
 * 设置路由错误追踪
 * @description 追踪路由导航错误和面包屑
 * @param router - Vue Router 实例
 * @param logger - 日志器实例
 */
export function setupRouterTracking(router: Router, logger: VueLogger): void {
  const tracker = logger.getErrorTracker()

  // 追踪路由导航
  router.beforeEach((to, from) => {
    // 添加导航面包屑
    if (tracker) {
      tracker.addBreadcrumb({
        type: 'navigation',
        category: 'navigation',
        message: `Navigating from ${from.fullPath} to ${to.fullPath}`,
        data: {
          from: from.fullPath,
          to: to.fullPath,
          toName: to.name,
          fromName: from.name,
        },
      })
    }

    logger.debug(`[Router] 导航: ${from.fullPath} -> ${to.fullPath}`)
  })

  // 追踪路由错误
  router.onError((error) => {
    logger.error('[Router] 导航错误', error, {
      type: 'router-error',
    })

    if (tracker) {
      tracker.captureError(error, {
        type: 'router-error',
      })
    }
  })

  logger.info('[VueLogger] 路由追踪已启用')
}

