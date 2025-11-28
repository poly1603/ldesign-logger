/**
 * 错误边界组件
 * @description 捕获子组件错误并显示回退 UI
 * @example
 * ```vue
 * <ErrorBoundary @error="handleError">
 *   <ChildComponent />
 *   <template #fallback="{ error, reset }">
 *     <div>
 *       <p>出错了: {{ error.message }}</p>
 *       <button @click="reset">重试</button>
 *     </div>
 *   </template>
 * </ErrorBoundary>
 * ```
 */

import { defineComponent, h, inject, onErrorCaptured, ref, shallowRef, type PropType, type VNode } from 'vue'
import { LOGGER_INJECTION_KEY } from '../types'

/**
 * 错误边界组件
 */
export const ErrorBoundary = defineComponent({
  name: 'ErrorBoundary',

  props: {
    /** 是否捕获错误到日志器 */
    captureError: {
      type: Boolean as PropType<boolean>,
      default: true,
    },
  },

  emits: {
    /** 错误事件 */
    error: (_error: Error, _info: { componentStack: string }) => true,
  },

  setup(props, { emit, slots }) {
    /** 日志器 */
    const logger = inject(LOGGER_INJECTION_KEY)

    /** 是否有错误 */
    const hasError = ref(false)

    /** 错误对象 */
    const error = shallowRef<Error | null>(null)

    /** 错误信息 */
    const errorInfo = ref<string>('')

    /**
     * 重置错误状态
     */
    function reset(): void {
      hasError.value = false
      error.value = null
      errorInfo.value = ''
    }

    /**
     * 捕获错误
     */
    onErrorCaptured((err, instance, info) => {
      hasError.value = true
      error.value = err
      errorInfo.value = info

      // 发出事件
      emit('error', err, { componentStack: info })

      // 记录到日志器
      if (props.captureError && logger) {
        logger.error(`[ErrorBoundary] ${info}`, err, {
          componentName: instance?.$options?.name || 'Anonymous',
          info,
        })

        // 捕获到错误追踪器
        const tracker = logger.getErrorTracker()
        if (tracker) {
          tracker.captureError(err, {
            type: 'error-boundary',
            componentName: instance?.$options?.name,
            info,
          })
        }
      }

      // 阻止错误继续传播
      return false
    })

    return (): VNode | VNode[] | undefined => {
      if (!hasError.value) {
        return slots.default?.()
      }

      // 使用 fallback 插槽
      if (slots.fallback) {
        return slots.fallback({
          error: error.value,
          errorInfo: errorInfo.value,
          reset,
        })
      }

      // 默认回退 UI 使用 h 函数
      return h('div', { class: 'error-boundary-fallback' }, [
        h('h3', null, '出错了'),
        h('p', null, error.value?.message),
        h('button', { onClick: reset }, '重试'),
      ])
    }
  },
})

export default ErrorBoundary

