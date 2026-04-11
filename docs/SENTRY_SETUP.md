# Sentry 错误追踪配置指南

本项目已集成 Sentry 错误追踪系统，用于监控生产环境的错误和性能。

---

## 🎯 功能特性

- ✅ **自动错误捕获** - React 错误边界自动捕获组件错误
- ✅ **性能监控** - 追踪 LCP、FCP、CLS 等 Web Vitals
- ✅ **Session Replay** - 录制用户会话，重现错误场景
- ✅ **Source Maps** - 自动上传 Source Maps，还原压缩代码
- ✅ **用户上下文** - 记录用户信息和自定义标签
- ✅ **面包屑追踪** - 记录用户操作路径

---

## 📋 配置步骤

### 1. 创建 Sentry 项目

1. 访问 [sentry.io](https://sentry.io/) 并登录/注册
2. 创建新项目
   - Platform: **Next.js**
   - Alert frequency: 根据需要选择
3. 复制项目的 **DSN**（Data Source Name）

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# 客户端DSN（必需）
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# 服务端DSN（必需）
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id

# 组织和项目名称（可选，用于上传Source Maps）
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name

# 认证Token（可选，用于上传Source Maps）
SENTRY_AUTH_TOKEN=your-auth-token
```

**获取 Auth Token**:
1. 进入 Sentry → Settings → Developer Settings → Auth Tokens
2. 创建新 Token，权限选择 `project:releases` 和 `project:write`
3. 复制 Token 到环境变量

### 3. Vercel 部署配置

在 Vercel 项目设置中添加环境变量：

1. 进入 Vercel 项目 → Settings → Environment Variables
2. 添加以下变量：
   ```
   NEXT_PUBLIC_SENTRY_DSN=...
   SENTRY_DSN=...
   SENTRY_ORG=...
   SENTRY_PROJECT=...
   SENTRY_AUTH_TOKEN=...
   ```
3. 确保 `NEXT_PUBLIC_SENTRY_DSN` 在所有环境（Production, Preview, Development）都启用

---

## 🔧 使用方法

### 自动错误捕获

应用已配置全局错误边界，React 组件错误会自动发送到 Sentry。

### 手动报告错误

```typescript
import { captureError, captureMessage, addBreadcrumb } from '@/lib/sentry'

// 捕获错误
try {
  // 可能出错的代码
} catch (error) {
  captureError(error as Error, {
    context: 'user-action',
    userId: user.id,
  })
}

// 记录警告消息
captureMessage('用户执行了不推荐的操作', 'warning')

// 添加面包屑（追踪用户路径）
addBreadcrumb({
  message: '用户点击了生成按钮',
  category: 'user-action',
  level: 'info',
  data: { sceneCount: 5 },
})
```

### 设置用户上下文

```typescript
import { setUser, clearUser } from '@/lib/sentry'

// 登录时
setUser({
  id: user.id,
  email: user.email,
  username: user.name,
})

// 登出时
clearUser()
```

### 性能追踪

```typescript
import { traceApiCall } from '@/lib/sentry'

// 追踪API调用性能
const result = await traceApiCall('generate-storyboard', async () => {
  const response = await fetch('/api/storyboard', { method: 'POST', body: data })
  return response.json()
})
```

---

## 📊 配置说明

### 采样率

**客户端**（`sentry.client.config.ts`）:
- 性能追踪：生产 10%，开发 100%
- Session Replay：正常会话 10%，错误会话 100%

**服务端**（`sentry.server.config.ts`）:
- 性能追踪：生产 5%，开发 100%

### 忽略的错误

自动忽略以下错误：
- `ResizeObserver loop limit exceeded` - 浏览器扩展引起
- `NetworkError` - 网络问题
- `adsbygoogle` - 广告拦截器

### 隐私保护

Session Replay 已配置：
- ✅ `maskAllText: true` - 隐藏所有文本
- ✅ `blockAllMedia: true` - 屏蔽所有媒体

---

## 🚀 生产部署

### 1. 本地测试

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 触发一个错误，查看 Sentry 是否收到
```

### 2. Vercel 部署

```bash
# 确保环境变量已配置
vercel env ls

# 部署
vercel --prod
```

### 3. 验证配置

1. 访问生产环境 URL
2. 触发一个错误（如访问不存在的页面）
3. 查看 Sentry 项目的 Issues 页面

---

## 📈 监控指标

### 错误监控

- **Issues** - 查看所有错误
- **Releases** - 按版本追踪错误
- **Performance** - 查看性能指标

### Web Vitals

自动追踪以下指标：
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- FID (First Input Delay)
- TTFB (Time to First Byte)

### 告警配置

建议配置以下告警：
1. **Error Rate** - 错误率超过阈值时告警
2. **New Issue** - 新错误出现时告警
3. **Regression** - 已修复的错误再次出现时告警

---

## 🐛 故障排查

### 错误未发送到 Sentry

1. 检查 DSN 是否正确配置
2. 检查网络是否可以访问 sentry.io
3. 打开浏览器控制台，查看是否有错误
4. 开发环境中，错误会同时打印到控制台

### Source Maps 未上传

1. 检查 `SENTRY_AUTH_TOKEN` 是否配置
2. 检查 `SENTRY_ORG` 和 `SENTRY_PROJECT` 是否正确
3. 查看构建日志，确认上传成功

### 性能数据未显示

1. 检查采样率是否太低
2. 确认访问量足够触发采样
3. 等待几分钟，数据有延迟

---

## 📝 最佳实践

1. **不要在开发环境禁用** - 即使不上传，也要测试错误捕获
2. **合理设置采样率** - 生产环境不要 100%，避免超出配额
3. **添加用户上下文** - 帮助重现和修复错误
4. **使用面包屑** - 追踪用户操作路径
5. **定期查看 Sentry** - 及时发现和修复问题

---

## 📚 相关资源

- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry SDK API](https://docs.sentry.io/platforms/javascript/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

---

**配置完成后，您的应用将具备世界级的错误监控能力！** 🎉
