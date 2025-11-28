/**
 * useErrorTracking composable
 * @description 在 Vue 组件中使用错误追踪功能
 */

import { inject, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import type { Breadcrumb } from '@ldesign/logger-core'
import type { UseErrorTrackingReturn } from '../types'
import { LOGGER_INJECTION_KEY } from '../types'

/**
 * 使用错误追踪
 * @description 在 Vue 组件中获取错误追踪功能
 * @returns 错误追踪方法
 * @throws 如果日志器未安装则抛出错误
 * @example
 * ```vue
 * <script setup>
 * import { useErrorTracking } from '@ldesign/logger-vue'
 *
 * const { captureError, addBreadcrumb } = useErrorTracking()
 *
 * // 添加面包屑
 * addBreadcrumb({
 *   type: 'click',
 *   category: 'ui',
 *   message: '点击了提交按钮',
 * })
 *
 * // 捕获错误
 * try {
 *   await submitForm()
 * } catch (e) {
 *   captureError(e, { formData: data })
 * }
 * </script>
 * ```
 */
export function useErrorTracking(): UseErrorTrackingReturn {
  const logger = inject(LOGGER_INJECTION_KEY)

  if (!logger) {
    throw new Error(
      '[useErrorTracking] 日志器未安装。请确保在 app.use() 中安装了日志器插件。',
    )
  }

  const tracker = logger.getErrorTracker()

  if (!tracker) {
    // 返回空操作
    return {
      captureError: () => {},
      captureMessage: () => {},
      addBreadcrumb: () => {},
      getBreadcrumbs: () => [],
      clearBreadcrumbs: () => {},
    }
  }

  return {
    captureError: (error: Error, extra?: Record<string, unknown>) => {
      tracker.captureError(error, extra)
    },
    captureMessage: (message: string, extra?: Record<string, unknown>) => {
      tracker.captureMessage(message, extra)
    },
    addBreadcrumb: (breadcrumb: Omit<Breadcrumb, 'timestamp'>) => {
      tracker.addBreadcrumb(breadcrumb)
    },
    getBreadcrumbs: () => tracker.getBreadcrumbs(),
    clearBreadcrumbs: () => tracker.clearBreadcrumbs(),
  }
}

/**
 * 使用组件错误边界
 * @description 在组件中设置错误边界，自动捕获子组件错误
 * @param onError - 错误回调
 * @example
 * ```vue
 * <script setup>
 * import { useErrorBoundary } from '@ldesign/logger-vue'
 *
 * useErrorBoundary((error, info) => {
 *   console.error('子组件错误:', error)
 * })
 * </script>
 * ```
 */
export function useErrorBoundary(
  onError?: (error: Error, info: { componentStack: string }) => void,
): void {
  const logger = inject(LOGGER_INJECTION_KEY)
  const tracker = logger?.getErrorTracker()

  onErrorCaptured((error, instance, info) => {
    // 记录到日志器
    if (logger) {
      logger.error(`[ErrorBoundary] ${info}`, error, {
        componentName: instance?.$options?.name || 'Anonymous',
        info,
      })
    }

    // 捕获到错误追踪器
    if (tracker) {
      tracker.captureError(error, {
        type: 'component-error',
        componentName: instance?.$options?.name,
        info,
      })
    }

    // 调用用户回调
    if (onError) {
      onError(error, { componentStack: info })
    }

    // 返回 false 继续向上传播
    return false
  })
}

/**
 * 使用生命周期面包屑
 * @description 自动记录组件生命周期作为面包屑
 * @param componentName - 组件名称
 * @example
 * ```vue
 * <script setup>
 * import { useLifecycleBreadcrumbs } from '@ldesign/logger-vue'
 *
 * useLifecycleBreadcrumbs('MyComponent')
 * </script>
 * ```
 */
export function useLifecycleBreadcrumbs(componentName: string): void {
  const logger = inject(LOGGER_INJECTION_KEY)
  const tracker = logger?.getErrorTracker()

  if (!tracker) {
    return
  }

  onMounted(() => {
    tracker.addBreadcrumb({
      type: 'lifecycle',
      category: 'vue',
      message: `${componentName} mounted`,
    })
  })

  onUnmounted(() => {
    tracker.addBreadcrumb({
      type: 'lifecycle',
      category: 'vue',
      message: `${componentName} unmounted`,
    })
  })
}

