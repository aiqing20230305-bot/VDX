# PWA 配置指南

本项目已集成 PWA（Progressive Web App）支持，提供类原生应用体验。

---

## 🎯 功能特性

- ✅ **可安装** - 可添加到主屏幕，像原生应用一样启动
- ✅ **离线缓存** - 静态资源和API缓存，提升加载速度
- ✅ **推送通知** - 支持Web Push（需后端支持）
- ✅ **自动更新** - Service Worker自动更新
- ✅ **响应式** - 适配所有设备和屏幕尺寸

---

## 📋 配置步骤

### 1. 生成PWA图标

PWA需要不同尺寸的图标，推荐尺寸：
- **192x192** - Android主屏图标
- **512x512** - Android启动画面
- **180x180** - iOS Apple Touch Icon

#### 使用在线工具生成

推荐工具：[PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

```bash
# 安装工具
npm install -g pwa-asset-generator

# 从SVG生成所有需要的图标
pwa-asset-generator public/logo.svg public --scrape false
```

或使用在线服务：
1. [Real Favicon Generator](https://realfavicongenerator.net/)
2. [Favicon.io](https://favicon.io/)

#### 手动创建

如果使用图片编辑工具（Photoshop/Figma/Sketch）:
1. 创建 1024x1024 的原始图标
2. 导出以下尺寸：
   - `icon-192x192.png`
   - `icon-512x512.png`
3. 放置到 `public/` 目录

### 2. 配置Manifest（已完成）

`public/manifest.json` 已配置以下内容：
- ✅ 应用名称和描述
- ✅ 图标和启动画面
- ✅ 主题颜色（cyan #06b6d4）
- ✅ 快捷方式（新建项目、历史记录）

### 3. Service Worker配置（已完成）

`next.config.ts` 中已配置缓存策略：

**字体缓存**（1年）:
- Google Fonts
- Font assets

**图片缓存**（30天）:
- PNG, JPG, SVG, WebP

**API缓存**（5分钟）:
- NetworkFirst策略
- 10秒超时后使用缓存

### 4. 更新layout.tsx（已完成）

已添加PWA相关的meta标签：
- ✅ Manifest链接
- ✅ Apple Touch Icon
- ✅ Theme Color
- ✅ Status Bar样式

---

## 🚀 使用方法

### 本地测试

```bash
# 构建生产版本（开发环境PWA禁用）
npm run build

# 启动生产服务器
npm run start

# 访问 http://localhost:3000
# 打开Chrome DevTools → Application → Service Workers
# 检查Service Worker是否注册成功
```

### 测试安装提示

#### Chrome桌面版
1. 打开 `http://localhost:3000`
2. 地址栏右侧会显示"安装"图标
3. 点击安装，应用会添加到操作系统

#### Chrome移动版
1. 打开 `http://localhost:3000`
2. 点击浏览器菜单 → "添加到主屏幕"
3. 应用图标会出现在主屏幕

#### iOS Safari
1. 打开 `http://localhost:3000`
2. 点击分享按钮
3. 选择"添加到主屏幕"
4. 应用图标会出现在主屏幕

---

## 📱 离线功能

### 已缓存的资源

Service Worker自动缓存以下内容：
- 静态资源（JS, CSS, 图片）
- 字体文件
- API响应（短期缓存）

### 离线fallback

如果用户离线访问未缓存的页面，显示自定义离线页面。

创建 `public/offline.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>离线 - 超级视频Agent</title>
  <style>
    body {
      background: #0a0a0f;
      color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
    }
    h1 {
      color: #06b6d4;
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      color: #a1a1aa;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>离线模式</h1>
    <p>您当前处于离线状态，请连接网络后重试。</p>
  </div>
</body>
</html>
```

---

## 🔧 高级配置

### 自定义缓存策略

修改 `next.config.ts` 中的 `runtimeCaching`:

```typescript
{
  urlPattern: /\/api\/your-endpoint\/.*/i,
  handler: 'NetworkFirst', // 或 'CacheFirst', 'StaleWhileRevalidate'
  options: {
    cacheName: 'your-api-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60, // 1小时
    },
  },
}
```

### 推送通知

添加推送通知需要：
1. 生成VAPID密钥
2. 配置Service Worker
3. 实现后端推送API

详见：[Web Push Notifications](https://web.dev/push-notifications-overview/)

---

## 📊 检查PWA质量

### Lighthouse审计

```bash
# 运行Lighthouse PWA审计
lighthouse http://localhost:3000 --only-categories=pwa --view
```

**目标分数**: 100/100

### PWA检查清单

- ✅ 响应式设计
- ✅ 离线访问（Service Worker）
- ✅ HTTPS（生产环境）
- ✅ 图标和启动画面
- ✅ Meta tags完整
- ✅ Manifest配置正确

---

## 🐛 故障排查

### Service Worker未注册

1. 检查是否在生产环境（开发环境禁用）
2. 打开DevTools → Application → Service Workers
3. 查看错误日志

### 图标未显示

1. 检查图标路径是否正确
2. 确保图标尺寸符合要求
3. 清除浏览器缓存

### 无法安装

1. 确保使用HTTPS（本地localhost除外）
2. 检查Manifest是否可访问（`/manifest.json`）
3. 检查Manifest格式是否正确

---

## 📚 相关资源

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [next-pwa](https://github.com/shadowwalker/next-pwa)

---

## 🎨 品牌资源

### 主题色

```css
--theme-color: #06b6d4 (cyan)
--background-color: #0a0a0f (dark)
```

### 图标要求

- 格式: PNG（带透明度）
- 最小尺寸: 192x192
- 推荐尺寸: 512x512
- 背景: 透明或主题色

---

**配置完成后，您的应用将支持PWA功能，提供类原生应用体验！** 🎉

## ⚙️ 环境变量

无需额外环境变量，PWA功能开箱即用。

---

**Last Updated**: 2026-04-10  
**Version**: v1.0.0
