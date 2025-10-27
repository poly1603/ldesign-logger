# Context API

上下文（Context）用于在日志中附加额外的信息，如请求 ID、用户 ID、会话 ID 等，方便追踪请求链路。

## 基础用法

### 设置全局上下文

```typescript
logger.setContext({
  appVersion: '1.0.0',
  environment: 'production',
  region: 'us-west-1'
})

// 所有日志自动包含这些信息
logger.info('用户登录')
// 输出包含: { appVersion: '1.0.0', environment: 'production', region: 'us-west-1' }
```

### 局部上下文

```typescript
logger.withContext({ requestId: 'abc123' }, () => {
  logger.info('处理请求')  // 包含 requestId
  
  // 嵌套上下文
  logger.withContext({ userId: '456' }, () => {
    logger.info('用户操作')  // 包含 requestId 和 userId
  })
})
```

### 异步上下文

```typescript
await logger.withContext({ requestId: 'abc123' }, async () => {
  logger.info('开始处理')
  
  await someAsyncOperation()
  
  logger.info('处理完成')  // 仍然包含 requestId
})
```

## LogContext 接口

```typescript
interface LogContext {
  [key: string]: any
}
```

## 相关文档

- [Logger API](/api/logger)
- [快速开始](/guide/getting-started)

