/**
 * 日志查看器组件
 * @description 美观的日志查看器，支持过滤、搜索、导出等功能
 */

import { computed, defineComponent, h, onMounted, onUnmounted, ref, watch } from 'vue'
import type { LogEntry, LogLevel, LogLevelName } from '@ldesign/logger-core'
import { LOG_LEVEL_NAMES } from '@ldesign/logger-core'

/** 日志级别颜色映射 */
const LEVEL_COLORS: Record<LogLevelName, string> = {
  trace: '#9ca3af',
  debug: '#06b6d4',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444',
  fatal: '#dc2626',
}

/** 日志级别图标映射 */
const LEVEL_ICONS: Record<LogLevelName, string> = {
  trace: '🔍',
  debug: '🐛',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
  fatal: '💀',
}

/** 组件 Props 类型 */
export interface LogViewerProps {
  /** 日志条目列表 */
  logs: LogEntry[]
  /** 最大显示条数 */
  maxItems?: number
  /** 是否显示过滤器 */
  showFilter?: boolean
  /** 是否显示搜索框 */
  showSearch?: boolean
  /** 是否显示导出按钮 */
  showExport?: boolean
  /** 是否自动滚动到底部 */
  autoScroll?: boolean
  /** 高度 */
  height?: string
  /** 主题 */
  theme?: 'light' | 'dark'
  /** 是否紧凑模式 */
  compact?: boolean
}

/**
 * 日志查看器组件
 */
export const LogViewer = defineComponent({
  name: 'LogViewer',
  props: {
    logs: {
      type: Array as () => LogEntry[],
      required: true,
    },
    maxItems: {
      type: Number,
      default: 500,
    },
    showFilter: {
      type: Boolean,
      default: true,
    },
    showSearch: {
      type: Boolean,
      default: true,
    },
    showExport: {
      type: Boolean,
      default: true,
    },
    autoScroll: {
      type: Boolean,
      default: true,
    },
    height: {
      type: String,
      default: '400px',
    },
    theme: {
      type: String as () => 'light' | 'dark',
      default: 'light',
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['clear', 'export', 'select'],
  setup(props, { emit }) {
    const containerRef = ref<HTMLElement | null>(null)
    const searchQuery = ref('')
    const selectedLevels = ref<LogLevelName[]>(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    const expandedIds = ref<Set<string>>(new Set())
    const selectedEntry = ref<LogEntry | null>(null)

    // 过滤后的日志
    const filteredLogs = computed(() => {
      let result = props.logs

      // 级别过滤
      if (selectedLevels.value.length < 6) {
        result = result.filter(log => selectedLevels.value.includes(log.levelName))
      }

      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter(log =>
          log.message.toLowerCase().includes(query)
          || log.source?.toLowerCase().includes(query)
          || log.tags?.some(t => t.toLowerCase().includes(query)),
        )
      }

      // 限制数量
      if (result.length > props.maxItems) {
        result = result.slice(-props.maxItems)
      }

      return result
    })

    // 自动滚动
    watch(() => props.logs.length, () => {
      if (props.autoScroll && containerRef.value) {
        requestAnimationFrame(() => {
          containerRef.value!.scrollTop = containerRef.value!.scrollHeight
        })
      }
    })

    // 切换级别过滤
    const toggleLevel = (level: LogLevelName) => {
      const index = selectedLevels.value.indexOf(level)
      if (index === -1) {
        selectedLevels.value.push(level)
      }
      else {
        selectedLevels.value.splice(index, 1)
      }
    }

    // 切换展开
    const toggleExpand = (id: string) => {
      if (expandedIds.value.has(id)) {
        expandedIds.value.delete(id)
      }
      else {
        expandedIds.value.add(id)
      }
      expandedIds.value = new Set(expandedIds.value)
    }

    // 选择日志条目
    const selectEntry = (entry: LogEntry) => {
      selectedEntry.value = entry
      emit('select', entry)
    }

    // 清除日志
    const clearLogs = () => {
      emit('clear')
    }

    // 导出日志
    const exportLogs = (format: 'json' | 'csv') => {
      emit('export', { logs: filteredLogs.value, format })
    }

    // 复制到剪贴板
    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text)
    }

    // 格式化时间
    const formatTime = (timestamp: number) => {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      } as Intl.DateTimeFormatOptions)
    }

    // 格式化数据
    const formatData = (data: unknown) => {
      try {
        return JSON.stringify(data, null, 2)
      }
      catch {
        return String(data)
      }
    }

    // 主题样式
    const themeStyles = computed(() => ({
      '--lv-bg': props.theme === 'dark' ? '#1e1e1e' : '#ffffff',
      '--lv-bg-secondary': props.theme === 'dark' ? '#252526' : '#f8f9fa',
      '--lv-bg-hover': props.theme === 'dark' ? '#2d2d2d' : '#f1f3f5',
      '--lv-text': props.theme === 'dark' ? '#e5e5e5' : '#212529',
      '--lv-text-secondary': props.theme === 'dark' ? '#9ca3af' : '#6c757d',
      '--lv-border': props.theme === 'dark' ? '#3e3e3e' : '#dee2e6',
    }))

    return () => {
      const levels: LogLevelName[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

      return h('div', {
        class: ['log-viewer', `log-viewer--${props.theme}`, props.compact && 'log-viewer--compact'],
        style: { ...themeStyles.value, height: props.height },
      }, [
        // 工具栏
        h('div', { class: 'log-viewer__toolbar' }, [
          // 级别过滤器
          props.showFilter && h('div', { class: 'log-viewer__filters' },
            levels.map(level =>
              h('button', {
                class: ['log-viewer__filter-btn', selectedLevels.value.includes(level) && 'active'],
                style: { '--level-color': LEVEL_COLORS[level] },
                onClick: () => toggleLevel(level),
              }, [
                h('span', { class: 'log-viewer__filter-icon' }, LEVEL_ICONS[level]),
                h('span', { class: 'log-viewer__filter-label' }, level.toUpperCase()),
              ]),
            ),
          ),

          // 搜索框
          props.showSearch && h('div', { class: 'log-viewer__search' }, [
            h('input', {
              type: 'text',
              class: 'log-viewer__search-input',
              placeholder: '搜索日志...',
              value: searchQuery.value,
              onInput: (e: Event) => searchQuery.value = (e.target as HTMLInputElement).value,
            }),
          ]),

          // 操作按钮
          h('div', { class: 'log-viewer__actions' }, [
            props.showExport && h('button', {
              class: 'log-viewer__action-btn',
              onClick: () => exportLogs('json'),
              title: '导出 JSON',
            }, '📥 JSON'),
            props.showExport && h('button', {
              class: 'log-viewer__action-btn',
              onClick: () => exportLogs('csv'),
              title: '导出 CSV',
            }, '📥 CSV'),
            h('button', {
              class: 'log-viewer__action-btn log-viewer__action-btn--danger',
              onClick: clearLogs,
              title: '清除日志',
            }, '🗑️ 清除'),
          ]),
        ]),

        // 状态栏
        h('div', { class: 'log-viewer__status' }, [
          h('span', {}, `显示 ${filteredLogs.value.length} / ${props.logs.length} 条日志`),
        ]),

        // 日志列表
        h('div', {
          ref: containerRef,
          class: 'log-viewer__list',
        }, filteredLogs.value.map(log =>
          h('div', {
            key: log.id,
            class: ['log-viewer__item', `log-viewer__item--${log.levelName}`, expandedIds.value.has(log.id) && 'expanded'],
            onClick: () => selectEntry(log),
          }, [
            // 主行
            h('div', { class: 'log-viewer__item-main' }, [
              // 时间
              h('span', { class: 'log-viewer__time' }, formatTime(log.timestamp)),
              // 级别
              h('span', {
                class: 'log-viewer__level',
                style: { color: LEVEL_COLORS[log.levelName] },
              }, `${LEVEL_ICONS[log.levelName]} ${log.levelName.toUpperCase()}`),
              // 来源
              log.source && h('span', { class: 'log-viewer__source' }, `[${log.source}]`),
              // 标签
              log.tags?.length && h('span', { class: 'log-viewer__tags' },
                log.tags.map(tag => h('span', { class: 'log-viewer__tag' }, tag)),
              ),
              // 消息
              h('span', { class: 'log-viewer__message' }, log.message),
              // 展开按钮
              (log.data || log.stack) && h('button', {
                class: 'log-viewer__expand-btn',
                onClick: (e: Event) => {
                  e.stopPropagation()
                  toggleExpand(log.id)
                },
              }, expandedIds.value.has(log.id) ? '▼' : '▶'),
            ]),
            // 详情
            expandedIds.value.has(log.id) && h('div', { class: 'log-viewer__item-details' }, [
              log.data && h('div', { class: 'log-viewer__data' }, [
                h('div', { class: 'log-viewer__data-header' }, [
                  h('span', {}, '📦 数据'),
                  h('button', {
                    class: 'log-viewer__copy-btn',
                    onClick: () => copyToClipboard(formatData(log.data)),
                  }, '复制'),
                ]),
                h('pre', { class: 'log-viewer__data-content' }, formatData(log.data)),
              ]),
              log.stack && h('div', { class: 'log-viewer__stack' }, [
                h('div', { class: 'log-viewer__stack-header' }, '📍 堆栈'),
                h('pre', { class: 'log-viewer__stack-content' }, log.stack),
              ]),
            ]),
          ]),
        )),
      ])
    }
  },
})

/**
 * 日志查看器样式
 */
export const logViewerStyles = `
.log-viewer {
  display: flex;
  flex-direction: column;
  background: var(--lv-bg);
  border: 1px solid var(--lv-border);
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', 'Monaco', monospace;
  font-size: 12px;
  overflow: hidden;
}

.log-viewer__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--lv-bg-secondary);
  border-bottom: 1px solid var(--lv-border);
  flex-wrap: wrap;
}

.log-viewer__filters {
  display: flex;
  gap: 4px;
}

.log-viewer__filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: var(--lv-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.log-viewer__filter-btn:hover {
  background: var(--lv-bg-hover);
}

.log-viewer__filter-btn.active {
  border-color: var(--level-color);
  color: var(--level-color);
}

.log-viewer__search {
  flex: 1;
  min-width: 150px;
  max-width: 300px;
}

.log-viewer__search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--lv-border);
  border-radius: 4px;
  background: var(--lv-bg);
  color: var(--lv-text);
  font-size: 12px;
}

.log-viewer__search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.log-viewer__actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.log-viewer__action-btn {
  padding: 4px 8px;
  border: 1px solid var(--lv-border);
  border-radius: 4px;
  background: var(--lv-bg);
  color: var(--lv-text);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.log-viewer__action-btn:hover {
  background: var(--lv-bg-hover);
}

.log-viewer__action-btn--danger:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.log-viewer__status {
  padding: 4px 12px;
  font-size: 11px;
  color: var(--lv-text-secondary);
  background: var(--lv-bg-secondary);
  border-bottom: 1px solid var(--lv-border);
}

.log-viewer__list {
  flex: 1;
  overflow-y: auto;
}

.log-viewer__item {
  border-bottom: 1px solid var(--lv-border);
  transition: background 0.15s;
}

.log-viewer__item:hover {
  background: var(--lv-bg-hover);
}

.log-viewer__item--error,
.log-viewer__item--fatal {
  background: rgba(239, 68, 68, 0.05);
}

.log-viewer__item--warn {
  background: rgba(245, 158, 11, 0.05);
}

.log-viewer__item-main {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
}

.log-viewer__time {
  color: var(--lv-text-secondary);
  font-size: 11px;
  flex-shrink: 0;
}

.log-viewer__level {
  font-weight: 600;
  font-size: 10px;
  flex-shrink: 0;
  min-width: 70px;
}

.log-viewer__source {
  color: #6366f1;
  font-size: 11px;
  flex-shrink: 0;
}

.log-viewer__tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.log-viewer__tag {
  padding: 1px 6px;
  background: rgba(249, 115, 22, 0.1);
  color: #f97316;
  border-radius: 3px;
  font-size: 10px;
}

.log-viewer__message {
  flex: 1;
  color: var(--lv-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-viewer__expand-btn {
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: var(--lv-text-secondary);
  cursor: pointer;
  font-size: 10px;
}

.log-viewer__item-details {
  padding: 8px 12px 12px 90px;
  background: var(--lv-bg-secondary);
}

.log-viewer__data,
.log-viewer__stack {
  margin-top: 8px;
}

.log-viewer__data-header,
.log-viewer__stack-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--lv-text-secondary);
}

.log-viewer__copy-btn {
  padding: 2px 8px;
  border: 1px solid var(--lv-border);
  border-radius: 3px;
  background: var(--lv-bg);
  color: var(--lv-text-secondary);
  font-size: 10px;
  cursor: pointer;
}

.log-viewer__data-content,
.log-viewer__stack-content {
  margin: 0;
  padding: 8px;
  background: var(--lv-bg);
  border: 1px solid var(--lv-border);
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-viewer__stack-content {
  color: #ef4444;
}

/* 紧凑模式 */
.log-viewer--compact .log-viewer__item-main {
  padding: 4px 12px;
}

.log-viewer--compact .log-viewer__toolbar {
  padding: 4px 8px;
}

/* 暗色主题调整 */
.log-viewer--dark .log-viewer__search-input:focus {
  border-color: #60a5fa;
}
`

export default LogViewer
