/**
 * 环境检测工具
 */

/**
 * 检测是否为浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

/**
 * 检测是否为 Node.js 环境
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' 
    && process.versions != null 
    && process.versions.node != null
}

/**
 * 检测是否为生产环境
 */
export function isProduction(): boolean {
  if (isNode()) {
    return process.env.NODE_ENV === 'production'
  }
  
  // 浏览器环境检测
  if (isBrowser()) {
    // 检查常见的构建工具注入的全局变量
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE === 'production' || import.meta.env.PROD === true
    }
    
    // Webpack DefinePlugin
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'production'
    }
  }
  
  // 默认为开发环境
  return false
}

/**
 * 检测是否为开发环境
 */
export function isDevelopment(): boolean {
  return !isProduction()
}

/**
 * 获取当前环境名称
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




