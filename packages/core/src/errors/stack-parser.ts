/**
 * 堆栈解析器
 * @description 解析错误堆栈信息
 */

/**
 * 堆栈帧信息
 */
export interface StackFrame {
  /** 函数名 */
  functionName?: string
  /** 文件名 */
  filename?: string
  /** 行号 */
  lineno?: number
  /** 列号 */
  colno?: number
  /** 原始行 */
  raw?: string
}

/** Chrome/Edge 堆栈正则 */
const CHROME_REGEX = /^\s*at (?:(.+?) ?\()?(?:(.+?):(\d+):(\d+)|native)\)?$/

/** Firefox 堆栈正则 */
const FIREFOX_REGEX = /^(?:(.*)@)?(.+?):(\d+)(?::(\d+))?$/

/** Safari 堆栈正则 */
const SAFARI_REGEX = /^(?:(.*)@)?(\S+):(\d+)(?::(\d+))?$/

/**
 * 解析堆栈字符串
 * @description 将错误堆栈解析为结构化的堆栈帧数组
 * @param stack - 错误堆栈字符串
 * @returns 堆栈帧数组
 * @example
 * ```ts
 * const frames = parseStackFrames(error.stack)
 * console.log(frames[0].filename, frames[0].lineno)
 * ```
 */
export function parseStackFrames(stack?: string): StackFrame[] {
  if (!stack) {
    return []
  }

  const lines = stack.split('\n').slice(1) // 跳过第一行（错误消息）
  const frames: StackFrame[] = []

  for (const line of lines) {
    const frame = parseStackLine(line)
    if (frame) {
      frames.push(frame)
    }
  }

  return frames
}

/**
 * 解析单行堆栈
 * @description 解析单行堆栈字符串
 * @param line - 堆栈行
 * @returns 堆栈帧或 null
 */
export function parseStackLine(line: string): StackFrame | null {
  // 尝试 Chrome/Edge 格式
  let match = line.match(CHROME_REGEX)
  if (match) {
    return {
      functionName: match[1] || undefined,
      filename: match[2] || undefined,
      lineno: match[3] ? Number.parseInt(match[3], 10) : undefined,
      colno: match[4] ? Number.parseInt(match[4], 10) : undefined,
      raw: line,
    }
  }

  // 尝试 Firefox 格式
  match = line.match(FIREFOX_REGEX)
  if (match) {
    return {
      functionName: match[1] || undefined,
      filename: match[2] || undefined,
      lineno: match[3] ? Number.parseInt(match[3], 10) : undefined,
      colno: match[4] ? Number.parseInt(match[4], 10) : undefined,
      raw: line,
    }
  }

  // 尝试 Safari 格式
  match = line.match(SAFARI_REGEX)
  if (match) {
    return {
      functionName: match[1] || undefined,
      filename: match[2] || undefined,
      lineno: match[3] ? Number.parseInt(match[3], 10) : undefined,
      colno: match[4] ? Number.parseInt(match[4], 10) : undefined,
      raw: line,
    }
  }

  return null
}

/**
 * 解析堆栈获取位置信息
 * @description 从堆栈字符串提取第一个有效的位置信息
 * @param stack - 错误堆栈字符串
 * @returns 位置信息
 */
export function parseStack(stack?: string): { filename?: string, lineno?: number, colno?: number } | undefined {
  const frames = parseStackFrames(stack)
  if (frames.length === 0) {
    return undefined
  }

  const firstFrame = frames[0]
  return {
    filename: firstFrame.filename,
    lineno: firstFrame.lineno,
    colno: firstFrame.colno,
  }
}

/**
 * 格式化堆栈帧
 * @description 将堆栈帧格式化为可读字符串
 * @param frame - 堆栈帧
 * @returns 格式化后的字符串
 */
export function formatStackFrame(frame: StackFrame): string {
  const parts: string[] = []

  if (frame.functionName) {
    parts.push(`at ${frame.functionName}`)
  }
  else {
    parts.push('at <anonymous>')
  }

  if (frame.filename) {
    let location = frame.filename
    if (frame.lineno !== undefined) {
      location += `:${frame.lineno}`
      if (frame.colno !== undefined) {
        location += `:${frame.colno}`
      }
    }
    parts.push(`(${location})`)
  }

  return parts.join(' ')
}

/**
 * 格式化堆栈帧数组
 * @description 将堆栈帧数组格式化为可读字符串
 * @param frames - 堆栈帧数组
 * @returns 格式化后的字符串
 */
export function formatStackFrames(frames: StackFrame[]): string {
  return frames.map(formatStackFrame).join('\n')
}

