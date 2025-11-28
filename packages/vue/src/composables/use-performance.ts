/**
 * usePerformance composable
 * @description 在 Vue 组件中使用性能监控功能
 */

import { inject, onMounted, onUnmounted, ref } from 'vue'
import type { Timer } from '@ldesign/logger-core'
import type { UsePerformanceReturn } from '../types'
import { LOGGER_INJECTION_KEY } from '../types'

/**
 * 使用性能监控
 * @description 在 Vue 组件中获取性能监控功能
 * @returns 性能监控方法
 * @throws 如果日志器未安装则抛出错误
 * @example
 * ```vue
 * <script setup>
 * import { usePerformance } from '@ldesign/logger-vue'
 *
 * const { startTimer, timing, increment } = usePerformance()
 *
 * // 使用计时器
 * const timer = startTimer('data-fetch')
 * await fetchData()
 * timer.end()
 *
 * // 记录计时
 * timing('render', 50)
 *
 * // 增加计数器
 * increment('api-calls')
 * </script>
 * ```
 */
export function usePerformance(): UsePerformanceReturn {
  const logger = inject(LOGGER_INJECTION_KEY)

  if (!logger) {
    throw new Error(
      '[usePerformance] 日志器未安装。请确保在 app.use() 中安装了日志器插件。',
    )
  }

  const monitor = logger.getPerformanceMonitor()

  if (!monitor) {
    // 返回空操作
    return {
      startTimer: (name: string) => ({
        name,
        end: () => 0,
        cancel: () => {},
      }),
      timing: () => {},
      increment: () => {},
      gauge: () => {},
      getReport: () => ({}),
    }
  }

  return {
    startTimer: (name: string): Timer => monitor.startTimer(name),
    timing: (name: string, duration: number) => monitor.timing(name, duration),
    increment: (name: string, value?: number) => monitor.increment(name, value),
    gauge: (name: string, value: number) => monitor.gauge(name, value),
    getReport: () => monitor.getReport(),
  }
}

/**
 * 使用组件渲染计时
 * @description 自动测量组件渲染时间
 * @param componentName - 组件名称
 * @returns 渲染时间（响应式）
 * @example
 * ```vue
 * <script setup>
 * import { useRenderTiming } from '@ldesign/logger-vue'
 *
 * const renderTime = useRenderTiming('MyComponent')
 * </script>
 *
 * <template>
 *   <div>渲染时间: {{ renderTime }}ms</div>
 * </template>
 * ```
 */
export function useRenderTiming(componentName: string) {
  const logger = inject(LOGGER_INJECTION_KEY)
  const monitor = logger?.getPerformanceMonitor()
  const renderTime = ref(0)

  const startTime = performance.now()

  onMounted(() => {
    const duration = performance.now() - startTime
    renderTime.value = duration

    if (monitor) {
      monitor.timing(`component.${componentName}.render`, duration)
    }

    if (logger) {
      logger.debug(`[Performance] ${componentName} 渲染耗时: ${duration.toFixed(2)}ms`)
    }
  })

  return renderTime
}

/**
 * 使用异步操作计时
 * @description 创建一个计时的异步操作包装器
 * @param name - 操作名称
 * @returns 包装函数
 * @example
 * ```vue
 * <script setup>
 * import { useAsyncTiming } from '@ldesign/logger-vue'
 *
 * const timedFetch = useAsyncTiming('api-fetch')
 *
 * // 使用包装器
 * const data = await timedFetch(async () => {
 *   return await fetch('/api/data').then(r => r.json())
 * })
 * </script>
 * ```
 */
export function useAsyncTiming(name: string) {
  const { startTimer } = usePerformance()

  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const timer = startTimer(name)
    try {
      return await fn()
    }
    finally {
      timer.end()
    }
  }
}

/**
 * 使用组件生命周期计时
 * @description 测量组件从创建到销毁的时间
 * @param componentName - 组件名称
 * @example
 * ```vue
 * <script setup>
 * import { useLifecycleTiming } from '@ldesign/logger-vue'
 *
 * useLifecycleTiming('MyComponent')
 * </script>
 * ```
 */
export function useLifecycleTiming(componentName: string): void {
  const logger = inject(LOGGER_INJECTION_KEY)
  const monitor = logger?.getPerformanceMonitor()

  const createTime = performance.now()

  onMounted(() => {
    const mountTime = performance.now() - createTime
    if (monitor) {
      monitor.timing(`component.${componentName}.mount`, mountTime)
    }
  })

  onUnmounted(() => {
    const lifetime = performance.now() - createTime
    if (monitor) {
      monitor.timing(`component.${componentName}.lifetime`, lifetime)
    }
    if (logger) {
      logger.debug(`[Performance] ${componentName} 生命周期: ${lifetime.toFixed(2)}ms`)
    }
  })
}

