# Performance Monitoring (RUM) 文档

## 概述

**Real User Monitoring (RUM)** 系统追踪真实用户的性能指标，帮助识别生产环境中的性能瓶颈。

## 核心指标 (Web Vitals)

| 指标 | 说明 | Good | Needs Improvement | Poor |
|------|------|------|-------------------|------|
| **LCP** | 最大内容渲染时间 | <2.5s | 2.5-4.0s | >4.0s |
| **CLS** | 累积布局偏移 | <0.1 | 0.1-0.25 | >0.25 |
| **FCP** | 首次内容渲染 | <1.8s | 1.8-3.0s | >3.0s |
| **INP** | 交互响应时间 | <200ms | 200-500ms | >500ms |
| **TTFB** | 首字节时间 | <800ms | 800-1800ms | >1800ms |

## 实现架构

```
WebVitalsReporter (Client Component)
  └─> initWebVitals()
       └─> web-vitals 库 (onLCP, onCLS, onFCP, onINP, onTTFB)
            └─> sendToAnalytics()
                 ├─> Sentry Performance (生产环境)
                 └─> Console Log (开发环境)
```

## 文件结构

- **`src/lib/monitoring/web-vitals.ts`** - 核心监控逻辑
- **`src/components/WebVitalsReporter.tsx`** - 客户端初始化组件
- **`src/app/layout.tsx`** - 集成入口

## 配置

### 采样率

```typescript
// src/lib/monitoring/web-vitals.ts
const MONITORING_CONFIG = {
  sampleRate: 0.1,  // 10% 用户采样
}
```

降低采样率可减少数据量和成本。建议值：
- **开发环境**: 1.0 (100%)
- **生产环境**: 0.1-0.3 (10-30%)

### 性能预算

```typescript
const MONITORING_CONFIG = {
  budgets: {
    LCP: 2500,  // 2.5s
    CLS: 0.1,
    FCP: 1800,  // 1.8s
    INP: 200,   // 200ms
    TTFB: 800,  // 800ms
  },
}
```

超出预算时会创建 Sentry 告警事件。

## 数据流

### 开发环境

```
Web Vitals → Console Log
```

示例输出：
```
[Web Vitals] {
  name: 'LCP',
  value: 630,
  rating: 'good',
  id: 'v3-1234567890',
  navigationType: 'navigate'
}
```

### 生产环境

```
Web Vitals → Sentry Performance + Custom Endpoint (可选)
```

#### Sentry 集成

性能数据自动发送到 Sentry，包含：
- 指标名称和值
- 评级（good/needs-improvement/poor）
- 导航类型（navigate/reload/back_forward）
- 是否超出预算

#### 自定义端点 (可选)

取消注释 `sendToCustomEndpoint()` 可发送到自建分析系统：

```typescript
POST /api/analytics/web-vitals
{
  "name": "LCP",
  "value": 630,
  "rating": "good",
  "url": "https://example.com",
  "userAgent": "...",
  "connection": "4g",
  "deviceMemory": 8
}
```

## 查看数据

### Sentry Dashboard

1. 打开 Sentry 项目
2. 进入 **Performance** 页面
3. 查看 **Web Vitals** 指标
4. 按设备类型/地区/浏览器筛选

### 自定义仪表板

如果使用自建端点，可创建可视化面板：
- 时间序列图（趋势）
- 分布直方图（用户分布）
- 设备/地区分组分析

## 性能预算告警

当指标超出预算时，Sentry 会创建事件：

```
Warning: Performance budget exceeded: LCP
  value: 3200ms
  budget: 2500ms
  rating: needs-improvement
```

建议设置 Sentry Alerts：
- LCP > 4.0s → 告警级别：High
- CLS > 0.25 → 告警级别：Medium
- INP > 500ms → 告警级别: Medium

## 优化建议

基于监控数据识别瓶颈：

### LCP 优化
- 图片压缩和 lazy loading
- 字体预加载（font-display: optional）
- 关键 CSS 内联
- CDN 加速

### CLS 优化
- 图片/视频预留空间（width/height）
- 字体加载策略（font-display）
- 动画避免布局变化
- 延迟加载非关键内容

### INP 优化
- 减少主线程阻塞
- 优化 JavaScript 执行
- 使用 Web Workers
- 事件委托

### TTFB 优化
- CDN 配置
- 服务器端缓存
- 数据库查询优化
- Edge Functions

## 最佳实践

1. **持续监控**: 定期查看 RUM 数据，识别趋势
2. **按设备分析**: 移动端和桌面端性能差异大
3. **地区分析**: 不同地区网络环境差异
4. **回归检测**: 每次部署后对比指标
5. **用户分组**: 付费用户 vs 免费用户性能对比

## 成本优化

### 采样策略

```typescript
// 仅采样慢速用户（学习瓶颈）
function shouldSample(): boolean {
  const connection = (navigator as any).connection
  if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
    return true  // 100% 采样慢速连接
  }
  return Math.random() < 0.05  // 5% 采样正常连接
}
```

### 条件上报

```typescript
// 仅上报"需改进"和"差"评级
if (getRating(metric) !== 'good') {
  sendToAnalytics(metric)
}
```

## 故障排查

### 数据未上报

检查：
1. 是否在生产环境（`NODE_ENV=production`）
2. Sentry DSN 是否配置
3. 网络请求是否被拦截（CORS/CSP）
4. 采样率是否过低

### 数据异常

常见原因：
- **LCP 过高**: 首屏图片过大、字体加载慢
- **CLS 过高**: 动态内容未预留空间、字体切换
- **INP 过高**: 长任务阻塞主线程、事件处理器过重

## 下一步

- [ ] 创建 Sentry Performance Dashboard
- [ ] 设置性能预算告警
- [ ] 添加自定义维度（用户类型、A/B 测试分组）
- [ ] 集成到 CI/CD 性能回归检测

## 参考资料

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
