---
layout: home

hero:
  name: "@ldesign/logger"
  text: "企业级日志系统"
  tagline: "强大、灵活、高性能的 TypeScript 日志库"
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 文档
      link: /api/logger
    - theme: alt
      text: GitHub
      link: https://github.com/ldesign/ldesign

features:
  - icon: 📝
    title: 分级日志
    details: 支持 DEBUG、INFO、WARN、ERROR、FATAL 五个日志级别，方便开发和生产环境区分
  
  - icon: 🚀
    title: 高性能
    details: 采用对象池、循环缓冲区等优化技术，最小化内存分配和垃圾回收压力
  
  - icon: 🔌
    title: 多种传输器
    details: 内置控制台、HTTP、存储、WebSocket 传输器，支持自定义传输器
  
  - icon: 🎨
    title: 灵活格式化
    details: 提供文本、JSON、紧凑等格式化器，支持自定义格式化逻辑
  
  - icon: 🎯
    title: 智能过滤
    details: 基于级别、标签、模式的多维度过滤，支持组合过滤器
  
  - icon: 💾
    title: 日志持久化
    details: 支持 localStorage、sessionStorage、IndexedDB 等存储方式
  
  - icon: 📊
    title: 统计分析
    details: 实时统计日志数量、级别分布、性能指标，便于监控和分析
  
  - icon: 🔍
    title: 日志查询
    details: 支持按时间、级别、标签、内容等多维度查询历史日志
  
  - icon: ⚡
    title: 采样与限流
    details: 内置采样器、限流器、去重器，防止日志爆炸
  
  - icon: 🌍
    title: 上下文管理
    details: 支持全局和局部上下文，方便追踪请求链路
  
  - icon: 🧩
    title: 子日志器
    details: 创建带有特定配置的子日志器，实现模块化日志管理
  
  - icon: 📦
    title: TypeScript 优先
    details: 完整的类型定义，提供最佳的开发体验
---

## 快速上手

### 安装

```bash
npm install @ldesign/logger
# 或
pnpm add @ldesign/logger
# 或
yarn add @ldesign/logger
```

### 基础使用

```typescript
import { createLogger } from '@ldesign/logger'

// 创建日志器
const logger = createLogger({
  level: 'info',
  enableConsole: true
})

// 记录日志
logger.info('应用启动成功')
logger.warn('这是一个警告')
logger.error('发生错误', { error: new Error('示例错误') })
```

### 生产环境配置

```typescript
import { 
  createLogger, 
  HttpTransport, 
  StorageTransport,
  JsonFormatter,
  LevelFilter
} from '@ldesign/logger'

const logger = createLogger({
  level: 'info',
  transports: [
    // 发送到服务器
    new HttpTransport({
      url: 'https://api.example.com/logs',
      batchSize: 10,
      flushInterval: 5000
    }),
    // 本地存储
    new StorageTransport({
      storage: window.localStorage,
      maxSize: 1000
    })
  ],
  formatters: [new JsonFormatter()],
  filters: [new LevelFilter({ minLevel: 'warn' })]
})

// 使用日志器
try {
  // 业务代码
} catch (error) {
  logger.error('业务处理失败', { error })
}
```

## 特性亮点

### 🎯 智能日志管理

- **自动批量上传**：日志自动批量上传到服务器，减少网络请求
- **智能采样**：自动对高频日志进行采样，防止日志爆炸
- **去重处理**：自动去除重复日志，节省存储空间

### ⚡ 极致性能

- **对象池技术**：复用日志对象，减少 GC 压力
- **循环缓冲区**：高效的内存管理，避免频繁分配
- **异步处理**：日志记录不阻塞主线程

### 🔧 易于扩展

- **插件化设计**：所有组件都可自定义
- **中间件支持**：可在日志流程中插入自定义逻辑
- **事件系统**：监听日志生命周期事件

## 为什么选择 @ldesign/logger？

| 特性 | @ldesign/logger | 其他日志库 |
|------|----------------|-----------|
| TypeScript 支持 | ✅ 完整类型定义 | ⚠️ 部分支持 |
| 性能优化 | ✅ 对象池 + 循环缓冲 | ❌ 基础实现 |
| 传输器 | ✅ 多种内置 + 可扩展 | ⚠️ 有限支持 |
| 过滤器 | ✅ 多维度组合 | ⚠️ 简单过滤 |
| 日志查询 | ✅ 强大的查询 API | ❌ 不支持 |
| 采样限流 | ✅ 内置支持 | ❌ 需自行实现 |
| 统计分析 | ✅ 实时统计 | ❌ 不支持 |
| 上下文管理 | ✅ 全局 + 局部 | ⚠️ 有限支持 |

## 下一步

- [快速开始](/guide/getting-started) - 5 分钟快速上手
- [核心概念](/guide/concepts) - 了解日志系统的核心概念
- [API 文档](/api/logger) - 完整的 API 参考
- [示例代码](/examples/basic) - 丰富的示例代码

