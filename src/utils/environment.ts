/**
 * 环境检测工具
 * 
 * 提供跨平台的环境检测功能，用于适配不同运行环境
 * 
 * 支持的环境：
 * - 浏览器（Chrome、Firefox、Safari 等）
 * - Node.js
 * - Deno（部分支持）
 * 
 * 使用场景：
 * - 根据环境选择不同的存储方式
 * - 生产环境禁用调试日志
 * - 平台特定的功能实现
 */

/**
 * 检测是否为浏览器环境
 * 
 * 通过检查 `window` 和 `window.document` 对象来判断
 * 
 * @returns true 表示浏览器环境
 * 
 * @example
 * ```ts
 * if (isBrowser()) {
 *   // 使用浏览器 API
 *   localStorage.setItem('key', 'value')
 * }
 * ```
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

/**
 * 检测是否为 Node.js 环境
 * 
 * 通过检查 `process.versions.node` 来判断
 * 
 * @returns true 表示 Node.js 环境
 * 
 * @example
 * ```ts
 * if (isNode()) {
 *   // 使用 Node.js API
 *   const fs = require('fs')
 * }
 * ```
 */
export function isNode(): boolean {
  return typeof process !== 'undefined'
    && process.versions != null
    && process.versions.node != null
}

/**
 * 检测是否为生产环境
 * 
 * 检测逻辑：
 * 1. Node.js：检查 `process.env.NODE_ENV === 'production'`
 * 2. Vite：检查 `import.meta.env.PROD` 或 `import.meta.env.MODE === 'production'`
 * 3. Webpack：检查 `process.env.NODE_ENV === 'production'`
 * 4. 默认：false（开发环境）
 * 
 * @returns true 表示生产环境
 * 
 * @example
 * ```ts
 * if (isProduction()) {
 *   // 禁用调试日志
 *   logger.setLevel(LogLevel.WARN)
 * }
 * ```
 */
export function isProduction(): boolean {
  // Node.js 环境检测
  if (isNode()) {
    return process.env.NODE_ENV === 'production'
  }

  // 浏览器环境检测
  if (isBrowser()) {
    // Vite 构建工具（推荐）
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE === 'production' || import.meta.env.PROD === true
    }

    // Webpack DefinePlugin
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production'
    }
  }

  // 默认为开发环境（更安全的选择）
  return false
}

/**
 * 检测是否为开发环境
 * 
 * 与 `isProduction()` 相反
 * 
 * @returns true 表示开发环境
 * 
 * @example
 * ```ts
 * if (isDevelopment()) {
 *   // 启用详细日志
 *   logger.setLevel(LogLevel.DEBUG)
 * }
 * ```
 */
export function isDevelopment(): boolean {
  return !isProduction()
}

/**
 * 获取当前环境名称
 * 
 * @returns 环境类型：'browser' | 'node' | 'unknown'
 * 
 * @example
 * ```ts
 * const env = getEnvironment()
 * console.log(`当前环境：${env}`)
 * ```
 */
export function getEnvironment(): 'browser' | 'node' | 'unknown' {
  if (isBrowser()) {
    return 'browser'
  }
  if (isNode()) {
    return 'node'
  }
  return 'unknown'
}




