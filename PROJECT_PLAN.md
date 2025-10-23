# @ldesign/logger 完整项目计划书

<div align="center">

# 📝 @ldesign/logger v0.1.0

**企业级日志系统 - 分级日志、持久化、远程上报、性能监控**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](./tsconfig.json)
[![Performance](https://img.shields.io/badge/performance-high-green.svg)](#性能目标)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](#技术栈)

</div>

---

## 🚀 快速导航

| 想要... | 查看章节 | 预计时间 |
|---------|---------|---------|
| 📖 了解日志系统 | [项目概览](#项目概览) | 3 分钟 |
| 🔍 查看参考项目 | [参考项目分析](#参考项目深度分析) | 12 分钟 |
| ✨ 查看功能清单 | [功能清单](#功能清单) | 15 分钟 |
| 🏗️ 了解架构 | [架构设计](#架构设计) | 10 分钟 |
| 🗺️ 查看路线图 | [开发路线图](#开发路线图) | 8 分钟 |

---

## 📊 项目全景图

```
┌──────────────────────────────────────────────────────────────┐
│              @ldesign/logger - 日志系统全景                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🎯 核心能力                                                  │
│  ├─ 📊 6级日志（TRACE/DEBUG/INFO/WARN/ERROR/FATAL）         │
│  ├─ 🚀 3种传输器（Console/Storage/HTTP）                    │
│  ├─ 📦 批量发送（性能优化）                                  │
│  ├─ 🔒 安全上报（加密传输）                                  │
│  └─ 👥 用户追踪（userId + sessionId）                       │
│                                                              │
│  ⚡ 性能特性                                                  │
│  ├─ 🚄 异步日志（不阻塞主线程）                              │
│  ├─ 💾 智能缓冲（减少 I/O）                                  │
│  ├─ 📉 低开销（<1ms/log）                                    │
│  └─ 🎯 采样策略（生产环境优化）                              │
│                                                              │
│  🔧 高级功能                                                  │
│  ├─ 🌐 WebSocket 实时上报                                   │
│  ├─ 💾 IndexedDB 大数据存储                                 │
│  ├─ 🗜️  日志压缩（gzip）                                     │
│  ├─ 🔍 日志查询和过滤                                        │
│  ├─ 📊 日志聚合统计                                          │
│  └─ 🎨 彩色控制台输出                                        │
│                                                              │
│  🛠️ 扩展功能                                                 │
│  ├─ 📱 可视化日志面板                                        │
│  ├─ 🔔 日志告警系统                                          │
│  ├─ 📈 日志分析仪表板                                        │
│  └─ 🔄 日志回放功能                                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 项目概览

### 核心价值主张

@ldesign/logger 是一个**生产级日志系统**，提供：

1. **完善的日志分级** - 6 级日志系统，精确控制
2. **灵活的传输机制** - Console/Storage/HTTP/WebSocket 多种传输器
3. **强大的性能** - 异步处理、批量发送、智能缓冲
4. **可靠的持久化** - LocalStorage/IndexedDB 本地存储
5. **实时远程上报** - HTTP/WebSocket 上报到服务器
6. **完整的追踪** - userId/sessionId/tags 追踪能力

### 解决的问题

- ❌ **console.log 不够用** - 缺少日志级别、无法持久化
- ❌ **日志难以追踪** - 缺少用户和会话信息
- ❌ **生产环境调试难** - 无法查看历史日志
- ❌ **性能问题** - 大量日志影响性能
- ❌ **日志分散** - 前端日志无法集中管理

### 我们的解决方案

- ✅ **专业日志系统** - 6 级日志，精确控制
- ✅ **完整追踪能力** - 用户、会话、标签
- ✅ **本地持久化** - 浏览器存储，随时查看
- ✅ **高性能设计** - 异步、批量、采样
- ✅ **集中化管理** - 远程上报，统一查看

---

## 📚 参考项目深度分析

### 1. winston (★★★★★)

**项目信息**:
- GitHub: https://github.com/winstonjs/winston
- Stars: 22,000+
- 定位: Node.js 日志标杆
- 下载量: 30M+/week

**核心特点**:
- ✅ 传输器（Transport）架构
- ✅ 多级日志系统
- ✅ 格式化器（Formatter）
- ✅ 异常处理
- ✅ 子 Logger 支持
- ✅ 极其灵活的配置

**借鉴要点**:
1. **Transport 架构** - 可插拔传输器系统
2. **日志级别** - error/warn/info/http/verbose/debug/silly
3. **格式化器** - 自定义日志格式
4. **子 Logger** - 模块化日志
5. **异常处理** - handleExceptions/handleRejections

**功能借鉴**:
- [x] Transport 系统（已实现 3 个）
- [x] 多级日志（已实现 6 级）
- [x] 子 Logger（已实现）
- [ ] 格式化器系统
- [ ] 异常处理

**改进方向**:
- ➕ 浏览器优化（winston 主要for Node.js）
- ➕ 更好的 TypeScript 支持
- ➕ 更轻量（winston 较重）
- ➕ 内置可视化面板

### 2. pino (★★★★★)

**项目信息**:
- GitHub: https://github.com/pinojs/pino
- Stars: 13,000+
- 定位: 高性能日志库
- 特色: 极致性能

**核心特点**:
- ✅ 极致性能（异步日志）
- ✅ 低开销设计
- ✅ JSON 日志
- ✅ 子进程日志
- ✅ 日志流（Streams）
- ✅ 最小化内存占用

**借鉴要点**:
1. **异步日志** - 不阻塞主线程
2. **性能优化** - 对象池、字符串拼接优化
3. **JSON 格式** - 结构化日志
4. **低开销** - 最小化性能影响
5. **子进程** - 日志处理独立进程

**功能借鉴**:
- [ ] 异步日志处理
- [ ] 对象池优化
- [ ] JSON 格式化
- [ ] 性能监控
- [ ] 低开销设计

**改进方向**:
- ➕ 浏览器适配
- ➕ 可视化支持
- ➕ 更易用的 API

### 3. log4js (★★★★☆)

**项目信息**:
- GitHub: https://github.com/log4js-node/log4js-node
- Stars: 5,700+
- 定位: 传统日志框架
- 特色: 配置丰富

**核心特点**:
- ✅ Appender 系统（类似 Transport）
- ✅ Layout 布局系统
- ✅ 日志滚动（文件大小/时间）
- ✅ 日志过滤器
- ✅ 配置文件支持
- ✅ 日志分类

**借鉴要点**:
1. **Appender** - 日志输出目标
2. **Layout** - 日志布局格式
3. **日志滚动** - 文件管理策略
4. **过滤器** - 日志过滤规则
5. **配置系统** - 灵活的配置

**功能借鉴**:
- [ ] 日志过滤器
- [ ] 日志布局系统
- [ ] 配置文件支持
- [ ] 日志滚动（浏览器存储）

**改进方向**:
- ➕ 简化配置
- ➕ 更好的性能
- ➕ 现代化 API

### 4. consola (★★★★☆)

**项目信息**:
- GitHub: https://github.com/unjs/consola
- Stars: 5,000+
- 团队: UnJS
- 特色: 优雅输出

**核心特点**:
- ✅ 彩色输出
- ✅ 图标/Emoji 支持
- ✅ 漂亮的错误堆栈
- ✅ 进度条集成
- ✅ 浏览器友好
- ✅ 简洁 API

**借鉴要点**:
1. **彩色输出** - ANSI 颜色码（浏览器用 CSS）
2. **图标支持** - 日志级别对应图标
3. **错误美化** - 更易读的堆栈信息
4. **浏览器适配** - 浏览器和 Node.js 双支持
5. **用户体验** - 开发者友好

**功能借鉴**:
- [x] 彩色输出（已实现）
- [ ] 图标/Emoji
- [ ] 错误堆栈美化
- [ ] 进度条集成

**改进方向**:
- ➕ 远程上报（consola 没有）
- ➕ 持久化（consola 没有）
- ➕ 更强大的过滤

### 5. loglevel (★★★★☆)

**项目信息**:
- GitHub: https://github.com/pimterry/loglevel
- Stars: 2,600+
- 定位: 浏览器轻量日志
- 特色: 极简

**核心特点**:
- ✅ 极简 API
- ✅ 浏览器优化
- ✅ 日志级别控制
- ✅ 持久化配置
- ✅ 插件系统
- ✅ 零依赖

**借鉴要点**:
1. **简洁 API** - 易学易用
2. **浏览器优化** - 专为浏览器设计
3. **插件系统** - 可扩展架构
4. **持久化** - localStorage 保存配置
5. **零依赖** - 轻量级

**功能借鉴**:
- [x] 简洁 API
- [ ] 插件系统
- [ ] 持久化配置
- [x] 零运行时依赖

**改进方向**:
- ➕ 远程上报
- ➕ 更多传输器
- ➕ 可视化面板

### 参考项目功能对比

| 功能 | winston | pino | log4js | consola | loglevel | **@ldesign/logger** |
|------|---------|------|--------|---------|----------|---------------------|
| 日志级别 | 7 级 | 8 级 | 6 级 | 5 级 | 5 级 | **6 级** ✅ |
| 传输器 | ✅ 多种 | ✅ | ✅ | 有限 | ❌ | ✅ **4种+** 🎯 |
| 浏览器支持 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Node.js 支持 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 性能 | 中 | ✅ 极高 | 中 | 高 | 高 | ✅ **高** 🎯 |
| TypeScript | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| 彩色输出 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 远程上报 | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| 可视化面板 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ **内置** 🎯 |
| Bundle 大小 | 大 | 中 | 大 | 小 | 极小 | **<30KB** 🎯 |

**总结**: @ldesign/logger 结合了高性能（pino）+ 浏览器支持（loglevel）+ 可视化（独家）。

---

## ✨ 功能清单

### P0 核心功能（18项）

#### 日志核心

- [x] **6 级日志系统**（参考: winston）
  - ✅ TRACE (0) - 最详细的调试信息
  - ✅ DEBUG (1) - 调试信息
  - ✅ INFO (2) - 一般信息
  - ✅ WARN (3) - 警告信息
  - ✅ ERROR (4) - 错误信息
  - ✅ FATAL (5) - 严重错误

- [x] **Logger 类**（参考: winston）
  - ✅ trace/debug/info/warn/error/fatal 方法
  - ✅ log(level, message, data) 通用方法
  - ✅ 日志级别控制
  - ✅ enable/disable 控制

- [x] **子 Logger**（参考: winston）
  - ✅ child(config) - 创建子 Logger
  - ✅ 继承父 Logger 配置
  - ✅ 独立配置覆盖
  - ✅ 层级命名（app.api.user）

#### 传输器系统

- [x] **Console 传输器**（参考: winston + consola）
  - ✅ 彩色输出（CSS 样式）
  - ✅ 时间戳显示
  - ✅ 日志级别图标
  - ✅ 格式化输出
  - ✅ 浏览器控制台适配

- [x] **Storage 传输器**（参考: log4js）
  - ✅ LocalStorage 存储
  - ✅ IndexedDB 存储（可选）
  - ✅ 日志数量限制（maxLogs）
  - ✅ 延迟批量保存
  - ✅ getLogs() 查询
  - ✅ clear() 清空

- [x] **HTTP 传输器**（参考: winston）
  - ✅ POST/PUT 请求
  - ✅ 批量发送（batchSize）
  - ✅ 定时发送（batchInterval）
  - ✅ 失败重试（retryCount）
  - ✅ 请求超时控制
  - ✅ 自定义请求头

#### 日志增强

- [x] **日志元数据**（参考: winston）
  - ✅ timestamp - 时间戳
  - ✅ level - 日志级别
  - ✅ message - 日志消息
  - ✅ source - 日志来源（模块名）
  - ✅ userId - 用户ID
  - ✅ sessionId - 会话ID
  - ✅ tags - 标签数组
  - ✅ data - 附加数据
  - ✅ error - 错误对象
  - ✅ stack - 堆栈跟踪

- [x] **传输器管理**（参考: winston）
  - ✅ addTransport() - 添加传输器
  - ✅ removeTransport() - 移除传输器
  - ✅ 多传输器同时使用

- [ ] **日志级别过滤**（参考: 所有）
  - ✅ Logger 级别控制
  - ✅ Transport 级别控制
  - [ ] 动态级别调整
  - [ ] 环境变量控制

#### 性能优化

- [ ] **批量发送**（参考: pino）
  - [x] HTTP 批量发送（已实现）
  - [ ] 批量写入 Storage
  - [ ] 批量处理优化

- [ ] **日志缓冲**（参考: pino）
  - [ ] 内存缓冲队列
  - [ ] 缓冲大小控制
  - [ ] 定时刷新

- [ ] **生产优化**（参考: winston）
  - [x] 禁用 debug/trace（已实现）
  - [ ] 日志采样
  - [ ] 性能监控

### P1 高级功能（15项）

#### 高级传输器

- [ ] **WebSocket 传输器**（参考: winston-transport）
  - 实时日志上报
  - 自动重连
  - 消息队列
  - 断线重传

- [ ] **IndexedDB 传输器**（参考: log4js）
  - 大数据存储
  - 结构化查询
  - 数据导出
  - 集成 @ldesign/cache

#### 日志处理

- [ ] **日志压缩**（参考: pino）
  - gzip 压缩
  - 减少传输量
  - 减少存储空间

- [ ] **日志查询 API**（参考: log4js）
  - 按级别查询
  - 按时间范围查询
  - 按用户查询
  - 按标签查询
  - 全文搜索

- [ ] **日志过滤器**（参考: log4js）
  - 自定义过滤规则
  - 正则表达式过滤
  - 链式过滤
  - 过滤器组合

- [ ] **日志采样**（参考: pino）
  - 采样率控制
  - 智能采样
  - 重要日志保留

#### 日志聚合

- [ ] **日志聚合**（参考: winston）
  - 多个 Logger 聚合
  - 统一查询
  - 统一导出

- [ ] **性能日志**（参考: pino）
  - 专用性能日志接口
  - 性能指标采集
  - 性能报告生成

#### 美化和增强

- [ ] **错误堆栈美化**（参考: consola）
  - 高亮关键信息
  - 隐藏无关堆栈
  - Source Map 支持

- [ ] **日志上下文**（参考: winston）
  - context 对象
  - 上下文继承
  - 自动注入上下文

- [ ] **日志级别映射**（参考: log4js）
  - 自定义级别
  - 级别别名
  - 级别颜色自定义

### P2 扩展功能（10项）

#### 可视化工具

- [ ] **日志可视化面板**（独家功能）
  - Web 应用
  - 实时日志流
  - 日志搜索
  - 日志过滤
  - 日志统计
  - 日志导出

- [ ] **实时日志流**（参考: SSE）
  - Server-Sent Events
  - WebSocket 实时流
  - 日志订阅

- [ ] **日志分析工具**
  - 错误率统计
  - 日志量趋势
  - Top 错误
  - 用户活跃度

#### 告警系统

- [ ] **日志告警**
  - 错误阈值告警
  - 自定义告警规则
  - 告警通知（邮件/钉钉/飞书）
  - 告警聚合

#### 数据处理

- [ ] **日志统计仪表板**
  - 可视化图表
  - 实时统计
  - 历史趋势
  - 数据钻取

- [ ] **日志导出**
  - CSV 导出
  - JSON 导出
  - Excel 导出
  - 自定义格式

- [ ] **日志回放**
  - 时间轴回放
  - 用户行为重现
  - 问题复现

#### 高级功能

- [ ] **日志搜索引擎**
  - 全文搜索
  - 高级查询语法
  - 搜索结果高亮
  - 搜索历史

---

## 🏗️ 架构设计

### 整体架构

```
┌────────────────────────────────────────────────────────┐
│                  @ldesign/logger                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐      ┌──────────┐     ┌──────────┐     │
│  │  Logger  │ ────▶│ Transport│────▶│  Output  │     │
│  │  Core    │      │  System  │     │  Target  │     │
│  └──────────┘      └──────────┘     └──────────┘     │
│       │                  │                │           │
│       │                  │                │           │
│       ▼                  ▼                ▼           │
│  日志条目创建        传输器处理        实际输出        │
│  - 级别判断          - Console         - 控制台       │
│  - 元数据添加        - Storage         - 存储         │
│  - 格式化            - HTTP            - 服务器       │
│                      - WebSocket       - 实时流       │
│                                                        │
│  ┌─────────────────────────────────────────────┐     │
│  │            辅助系统                          │     │
│  ├─ Formatter（格式化器）                       │     │
│  ├─ Filter（过滤器）                            │     │
│  ├─ Buffer（缓冲器）                            │     │
│  └─ Monitor（性能监控）                         │     │
│  └─────────────────────────────────────────────┘     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 核心类设计

#### Logger 类

```typescript
class Logger {
  private config: LoggerConfig
  private transports: LogTransport[]
  
  // 日志方法
  trace(message: string, data?: any): void
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: Error, data?: any): void
  fatal(message: string, error?: Error, data?: any): void
  log(level: LogLevel, message: string, data?: any, error?: Error): void
  
  // 管理方法
  child(config: Partial<LoggerConfig>): Logger
  addTransport(transport: LogTransport): void
  removeTransport(name: string): void
  setLevel(level: LogLevel): void
  flush(): Promise<void>
  destroy(): Promise<void>
}
```

#### Transport 接口

```typescript
interface LogTransport {
  name: string
  level: LogLevel
  enabled: boolean
  
  log(entry: LogEntry): void | Promise<void>
  flush?(): void | Promise<void>
  destroy?(): void | Promise<void>
}
```

### 数据流

```
用户代码
  │
  ▼
logger.info('User logged in', { userId: 123 })
  │
  ▼
Logger 类
  ├─→ 检查日志级别
  ├─→ 创建 LogEntry
  ├─→ 添加元数据（timestamp, source, userId）
  │
  ▼
遍历所有 Transport
  ├─→ Console Transport → 控制台输出
  ├─→ Storage Transport → 延迟批量保存
  └─→ HTTP Transport → 批量上报服务器
```

---

## 🛠️ 技术栈

### 核心技术

- **TypeScript 5.7+** - 类型安全
- **ES2020** - 编译目标
- **Fetch API** - HTTP 请求
- **Web Storage API** - 本地存储
- **IndexedDB API** - 大数据存储

### 内部依赖

```json
{
  "dependencies": {
    "@ldesign/cache": "workspace:*",  // Storage 传输器
    "@ldesign/http": "workspace:*",   // HTTP 传输器
    "@ldesign/shared": "workspace:*"  // 工具函数
  }
}
```

### 外部依赖

**运行时**: 无 ✅

**开发依赖**:
```json
{
  "devDependencies": {
    "@ldesign/builder": "workspace:*",
    "typescript": "^5.7.3",
    "vitest": "^2.0.0"
  }
}
```

---

## 🗺️ 开发路线图

### v0.1.0 - MVP（当前）✅

**已完成**:
- [x] Logger 核心类
- [x] 6 级日志系统
- [x] Console/Storage/HTTP 传输器
- [x] 子 Logger
- [x] 批量发送（HTTP）
- [x] TypeScript 类型
- [x] 基础文档

**Bundle**: ~25KB

### v0.2.0 - 增强（3-4周）

**功能**:
- [ ] WebSocket 传输器
- [ ] 日志压缩
- [ ] 日志过滤器
- [ ] 错误堆栈美化
- [ ] Source Map 支持
- [ ] 完整 API 文档

**性能目标**: <1ms/log

### v0.3.0 - 高级（4-5周）

**功能**:
- [ ] IndexedDB 传输器
- [ ] 日志查询 API
- [ ] 日志聚合
- [ ] 性能日志
- [ ] 日志采样
- [ ] 插件系统

**性能目标**: 10,000 logs/sec

### v1.0.0 - 完整（8-10周）

**功能**:
- [ ] 可视化日志面板
- [ ] 实时日志流
- [ ] 日志分析工具
- [ ] 告警系统
- [ ] 统计仪表板
- [ ] 完整文档和示例

**性能目标**: Bundle <30KB, 100,000 logs/sec

---

## 📋 详细任务分解

### Week 1-2: v0.1.0 完善

#### Week 1
- [ ] 优化 Console 传输器（2天）
  - 图标支持
  - 更好的格式化
  - 浏览器兼容性

- [ ] 优化 Storage 传输器（2天）
  - IndexedDB 集成 @ldesign/cache
  - 查询优化
  - 性能测试

- [ ] 文档（1天）
  - 完善 README
  - API 文档

#### Week 2
- [ ] 单元测试（3天）
- [ ] 性能测试（2天）

### Week 3-6: v0.2.0 开发

#### Week 3
- [ ] WebSocket 传输器（5天）
  - 实时连接
  - 自动重连
  - 消息队列

#### Week 4
- [ ] 日志压缩（3天）
- [ ] 日志过滤器（2天）

#### Week 5
- [ ] 错误美化（3天）
- [ ] Source Map（2天）

#### Week 6
- [ ] 测试和文档（5天）

### Week 7-11: v0.3.0 开发

（类似详细分解）

### Week 12-20: v1.0.0 开发

（类似详细分解）

---

## 🧪 测试策略

### 单元测试

**覆盖率目标**: >90%

**测试内容**:
- Logger 核心方法
- 所有传输器
- 日志格式化
- 过滤器
- 子 Logger

**示例**:
```typescript
describe('Logger', () => {
  it('logs at correct level', () => {
    const logger = createLogger({ level: LogLevel.INFO })
    const spy = vi.spyOn(console, 'info')
    
    logger.debug('debug') // 不应该输出
    logger.info('info')   // 应该输出
    
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
```

### 性能测试

**基准**:
- 单条日志: <0.5ms
- 1000条日志: <50ms
- 批量发送: <10ms
- 内存占用: <10MB（1000条）

---

## 📊 性能目标

| 版本 | 单条日志 | 批量（100） | Bundle 大小 |
|------|---------|------------|------------|
| v0.1.0 | <2ms | <50ms | ~25KB |
| v0.2.0 | <1ms | <30ms | <25KB |
| v0.3.0 | <0.5ms | <20ms | <28KB |
| v1.0.0 | **<0.3ms** | **<10ms** | **<30KB** |

---

**文档版本**: 1.0  
**创建时间**: 2025-10-22  
**作者**: LDesign Team






