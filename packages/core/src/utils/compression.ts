/**
 * 日志压缩工具
 * @description 提供日志数据的压缩和解压缩功能
 */

import type { CompressionOptions, LogEntry } from '../types'

/**
 * LZ 字符串压缩（轻量级，浏览器友好）
 * @description 基于 LZ 算法的字符串压缩实现
 */
class LZString {
  private static keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  private static keyStrUriSafe = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$'
  private static baseReverseDic: Record<string, Record<string, number>> = {}

  private static getBaseValue(alphabet: string, character: string): number {
    if (!this.baseReverseDic[alphabet]) {
      this.baseReverseDic[alphabet] = {}
      for (let i = 0; i < alphabet.length; i++) {
        this.baseReverseDic[alphabet][alphabet.charAt(i)] = i
      }
    }
    return this.baseReverseDic[alphabet][character]
  }

  /**
   * 压缩字符串
   */
  static compress(uncompressed: string): string {
    if (uncompressed === null || uncompressed === '') {
      return ''
    }

    let i: number
    let value: number
    const context_dictionary: Record<string, number> = {}
    const context_dictionaryToCreate: Record<string, boolean> = {}
    let context_c = ''
    let context_wc = ''
    let context_w = ''
    let context_enlargeIn = 2
    let context_dictSize = 3
    let context_numBits = 2
    const context_data: string[] = []
    let context_data_val = 0
    let context_data_position = 0
    let ii: number

    for (ii = 0; ii < uncompressed.length; ii++) {
      context_c = uncompressed.charAt(ii)
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++
        context_dictionaryToCreate[context_c] = true
      }

      context_wc = context_w + context_c
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc
      }
      else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1)
              if (context_data_position === 15) {
                context_data_position = 0
                context_data.push(String.fromCharCode(context_data_val))
                context_data_val = 0
              }
              else {
                context_data_position++
              }
            }
            value = context_w.charCodeAt(0)
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | (value & 1)
              if (context_data_position === 15) {
                context_data_position = 0
                context_data.push(String.fromCharCode(context_data_val))
                context_data_val = 0
              }
              else {
                context_data_position++
              }
              value = value >> 1
            }
          }
          else {
            value = 1
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value
              if (context_data_position === 15) {
                context_data_position = 0
                context_data.push(String.fromCharCode(context_data_val))
                context_data_val = 0
              }
              else {
                context_data_position++
              }
              value = 0
            }
            value = context_w.charCodeAt(0)
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | (value & 1)
              if (context_data_position === 15) {
                context_data_position = 0
                context_data.push(String.fromCharCode(context_data_val))
                context_data_val = 0
              }
              else {
                context_data_position++
              }
              value = value >> 1
            }
          }
          context_enlargeIn--
          if (context_enlargeIn === 0) {
            context_enlargeIn = 2 ** context_numBits
            context_numBits++
          }
          delete context_dictionaryToCreate[context_w]
        }
        else {
          value = context_dictionary[context_w]
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === 15) {
              context_data_position = 0
              context_data.push(String.fromCharCode(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn === 0) {
          context_enlargeIn = 2 ** context_numBits
          context_numBits++
        }
        context_dictionary[context_wc] = context_dictSize++
        context_w = context_c
      }
    }

    if (context_w !== '') {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1)
            if (context_data_position === 15) {
              context_data_position = 0
              context_data.push(String.fromCharCode(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === 15) {
              context_data_position = 0
              context_data.push(String.fromCharCode(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        else {
          value = 1
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position === 15) {
              context_data_position = 0
              context_data.push(String.fromCharCode(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position === 15) {
              context_data_position = 0
              context_data.push(String.fromCharCode(context_data_val))
              context_data_val = 0
            }
            else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn === 0) {
          context_enlargeIn = 2 ** context_numBits
          context_numBits++
        }
        delete context_dictionaryToCreate[context_w]
      }
      else {
        value = context_dictionary[context_w]
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position === 15) {
            context_data_position = 0
            context_data.push(String.fromCharCode(context_data_val))
            context_data_val = 0
          }
          else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn === 0) {
        context_numBits++
      }
    }

    // 标记结束
    value = 2
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1)
      if (context_data_position === 15) {
        context_data_position = 0
        context_data.push(String.fromCharCode(context_data_val))
        context_data_val = 0
      }
      else {
        context_data_position++
      }
      value = value >> 1
    }

    // 刷新最后一个字符
    while (true) {
      context_data_val = (context_data_val << 1)
      if (context_data_position === 15) {
        context_data.push(String.fromCharCode(context_data_val))
        break
      }
      else {
        context_data_position++
      }
    }

    return context_data.join('')
  }

  /**
   * 解压缩字符串
   */
  static decompress(compressed: string): string | null {
    if (compressed === null || compressed === '') {
      return ''
    }

    const dictionary: string[] = []
    let enlargeIn = 4
    let dictSize = 4
    let numBits = 3
    let entry = ''
    const result: string[] = []
    let i: number
    let w: string
    let bits: number
    let resb: number
    let maxpower: number
    let power: number
    let c: string

    const data = {
      val: compressed.charCodeAt(0),
      position: 32768,
      index: 1,
    }

    for (i = 0; i < 3; i++) {
      dictionary[i] = String(i)
    }

    bits = 0
    maxpower = 4
    power = 1
    while (power !== maxpower) {
      resb = data.val & data.position
      data.position >>= 1
      if (data.position === 0) {
        data.position = 32768
        data.val = compressed.charCodeAt(data.index++)
      }
      bits |= (resb > 0 ? 1 : 0) * power
      power <<= 1
    }

    switch (bits) {
      case 0:
        bits = 0
        maxpower = 256
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = 32768
            data.val = compressed.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = String.fromCharCode(bits)
        break
      case 1:
        bits = 0
        maxpower = 65536
        power = 1
        while (power !== maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position === 0) {
            data.position = 32768
            data.val = compressed.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = String.fromCharCode(bits)
        break
      case 2:
        return ''
      default:
        return null
    }

    dictionary[3] = c
    w = c
    result.push(c)

    while (true) {
      if (data.index > compressed.length) {
        return ''
      }

      bits = 0
      maxpower = 2 ** numBits
      power = 1
      while (power !== maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position === 0) {
          data.position = 32768
          data.val = compressed.charCodeAt(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }

      switch (bits) {
        case 0:
          bits = 0
          maxpower = 256
          power = 1
          while (power !== maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position === 0) {
              data.position = 32768
              data.val = compressed.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }
          dictionary[dictSize++] = String.fromCharCode(bits)
          bits = dictSize - 1
          enlargeIn--
          break
        case 1:
          bits = 0
          maxpower = 65536
          power = 1
          while (power !== maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position === 0) {
              data.position = 32768
              data.val = compressed.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }
          dictionary[dictSize++] = String.fromCharCode(bits)
          bits = dictSize - 1
          enlargeIn--
          break
        case 2:
          return result.join('')
      }

      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits
        numBits++
      }

      if (dictionary[bits]) {
        entry = dictionary[bits]
      }
      else {
        if (bits === dictSize) {
          entry = w + w.charAt(0)
        }
        else {
          return null
        }
      }
      result.push(entry)

      dictionary[dictSize++] = w + entry.charAt(0)
      enlargeIn--

      w = entry

      if (enlargeIn === 0) {
        enlargeIn = 2 ** numBits
        numBits++
      }
    }
  }

  /**
   * 压缩为 Base64
   */
  static compressToBase64(input: string): string {
    if (input === null || input === '') {
      return ''
    }
    const compressed = this.compress(input)
    return this.encodeBase64(compressed)
  }

  /**
   * 从 Base64 解压缩
   */
  static decompressFromBase64(input: string): string | null {
    if (input === null || input === '') {
      return ''
    }
    const decoded = this.decodeBase64(input)
    return this.decompress(decoded)
  }

  private static encodeBase64(input: string): string {
    let output = ''
    let chr1: number, chr2: number, chr3: number
    let enc1: number, enc2: number, enc3: number, enc4: number
    let i = 0

    while (i < input.length * 2) {
      if (i % 2 === 0) {
        chr1 = input.charCodeAt(i / 2) >> 8
        chr2 = input.charCodeAt(i / 2) & 255
        if (i / 2 + 1 < input.length) {
          chr3 = input.charCodeAt(i / 2 + 1) >> 8
        }
        else {
          chr3 = Number.NaN
        }
      }
      else {
        chr1 = input.charCodeAt((i - 1) / 2) & 255
        if ((i + 1) / 2 < input.length) {
          chr2 = input.charCodeAt((i + 1) / 2) >> 8
          chr3 = input.charCodeAt((i + 1) / 2) & 255
        }
        else {
          chr2 = Number.NaN
          chr3 = Number.NaN
        }
      }
      i += 3

      enc1 = chr1 >> 2
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      enc4 = chr3 & 63

      if (Number.isNaN(chr2)) {
        enc3 = enc4 = 64
      }
      else if (Number.isNaN(chr3)) {
        enc4 = 64
      }

      output = output
        + this.keyStrBase64.charAt(enc1)
        + this.keyStrBase64.charAt(enc2)
        + this.keyStrBase64.charAt(enc3)
        + this.keyStrBase64.charAt(enc4)
    }

    return output
  }

  private static decodeBase64(input: string): string {
    let output = ''
    let chr1: number, chr2: number, chr3: number
    let enc1: number, enc2: number, enc3: number, enc4: number
    let i = 0

    input = input.replace(/[^A-Za-z0-9+/=]/g, '')

    while (i < input.length) {
      enc1 = this.getBaseValue(this.keyStrBase64, input.charAt(i++))
      enc2 = this.getBaseValue(this.keyStrBase64, input.charAt(i++))
      enc3 = this.getBaseValue(this.keyStrBase64, input.charAt(i++))
      enc4 = this.getBaseValue(this.keyStrBase64, input.charAt(i++))

      chr1 = (enc1 << 2) | (enc2 >> 4)
      chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
      chr3 = ((enc3 & 3) << 6) | enc4

      output = output + String.fromCharCode(chr1)

      if (enc3 !== 64) {
        output = output + String.fromCharCode(chr2)
      }
      if (enc4 !== 64) {
        output = output + String.fromCharCode(chr3)
      }
    }

    return output
  }
}

/**
 * 日志压缩器
 * @description 提供日志数据的压缩和解压缩功能
 * @example
 * ```ts
 * const compressor = new LogCompressor({ threshold: 1024 })
 *
 * const compressed = compressor.compress(logs)
 * const decompressed = compressor.decompress(compressed)
 * ```
 */
export class LogCompressor {
  private options: Required<CompressionOptions>

  constructor(options: CompressionOptions = {}) {
    this.options = {
      algorithm: options.algorithm ?? 'lz-string',
      threshold: options.threshold ?? 1024, // 1KB
      level: options.level ?? 6,
    }
  }

  /**
   * 压缩日志数据
   * @param data - 要压缩的数据
   * @returns 压缩后的字符串
   */
  compress(data: LogEntry | LogEntry[] | string): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data)

    // 小于阈值不压缩
    if (str.length < this.options.threshold) {
      return JSON.stringify({ compressed: false, data: str })
    }

    let compressed: string

    switch (this.options.algorithm) {
      case 'lz-string':
        compressed = LZString.compressToBase64(str)
        break
      case 'gzip':
      case 'deflate':
        // 浏览器原生 CompressionStream API
        compressed = this.compressNative(str)
        break
      default:
        compressed = LZString.compressToBase64(str)
    }

    return JSON.stringify({
      compressed: true,
      algorithm: this.options.algorithm,
      data: compressed,
    })
  }

  /**
   * 解压缩日志数据
   * @param data - 压缩的数据
   * @returns 解压后的数据
   */
  decompress<T = LogEntry[]>(data: string): T {
    try {
      const parsed = JSON.parse(data)

      if (!parsed.compressed) {
        return JSON.parse(parsed.data)
      }

      let decompressed: string | null

      switch (parsed.algorithm) {
        case 'lz-string':
          decompressed = LZString.decompressFromBase64(parsed.data)
          break
        case 'gzip':
        case 'deflate':
          decompressed = this.decompressNative(parsed.data)
          break
        default:
          decompressed = LZString.decompressFromBase64(parsed.data)
      }

      if (decompressed === null) {
        throw new Error('解压缩失败')
      }

      return JSON.parse(decompressed)
    }
    catch (error) {
      console.error('[LogCompressor] 解压缩失败:', error)
      throw error
    }
  }

  /**
   * 压缩日志条目数组
   * @param entries - 日志条目数组
   * @returns 压缩后的字符串
   */
  compressEntries(entries: LogEntry[]): string {
    return this.compress(entries)
  }

  /**
   * 解压缩为日志条目数组
   * @param data - 压缩的数据
   * @returns 日志条目数组
   */
  decompressEntries(data: string): LogEntry[] {
    return this.decompress<LogEntry[]>(data)
  }

  /**
   * 获取压缩比
   * @param original - 原始数据
   * @param compressed - 压缩后数据
   * @returns 压缩比（0-1）
   */
  getCompressionRatio(original: string, compressed: string): number {
    return 1 - compressed.length / original.length
  }

  /**
   * 使用原生 API 压缩
   * @private
   */
  private compressNative(data: string): string {
    // 浏览器原生 CompressionStream 暂不支持同步，回退到 LZ
    return LZString.compressToBase64(data)
  }

  /**
   * 使用原生 API 解压缩
   * @private
   */
  private decompressNative(data: string): string | null {
    return LZString.decompressFromBase64(data)
  }
}

/**
 * 创建日志压缩器
 * @param options - 配置选项
 * @returns 日志压缩器实例
 */
export function createLogCompressor(options?: CompressionOptions): LogCompressor {
  return new LogCompressor(options)
}

/**
 * 快速压缩字符串
 * @param data - 要压缩的字符串
 * @returns 压缩后的字符串
 */
export function compressString(data: string): string {
  return LZString.compressToBase64(data)
}

/**
 * 快速解压缩字符串
 * @param data - 压缩的字符串
 * @returns 解压后的字符串
 */
export function decompressString(data: string): string | null {
  return LZString.decompressFromBase64(data)
}
