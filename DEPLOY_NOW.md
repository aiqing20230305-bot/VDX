# 🚀 立即部署到 Vercel - 快速指南

**预计时间**: 10-15 分钟  
**前置条件**: ✅ 已完成（代码、文档、构建测试）

---

## 方式 1: 使用部署向导（推荐）⭐

运行一键部署脚本：

```bash
cd /Users/zhangjingwei/Desktop/AX/超级视频
./scripts/deploy-wizard.sh
```

向导会自动：
- ✅ 检查和安装 Vercel CLI
- ✅ 引导登录
- ✅ 检查环境变量
- ✅ 执行部署
- ✅ 提供后续步骤指引

**跟随提示操作即可完成部署。**

---

## 方式 2: 手动执行（3 步完成）

### Step 1: 登录 Vercel (1 分钟)

```bash
vercel login
```

浏览器会打开 Vercel 登录页面：
1. 选择登录方式（GitHub/GitLab/Bitbucket/Email）
2. 授权完成后返回终端
3. 看到 "Success!" 即表示登录成功

---

### Step 2: 首次部署 (5 分钟)

```bash
vercel
```

**交互式问题回答**:

| 问题 | 回答 |
|------|------|
| Set up and deploy? | `Y` (回车) |
| Which scope? | 选择你的账号（方向键选择，回车确认） |
| Link to existing project? | `N` (首次部署) |
| What's your project's name? | `super-video-agent` (或自定义) |
| In which directory is your code located? | `./` (直接回车) |
| Want to override settings? | `N` (直接回车) |

**Vercel 会自动**:
- 检测 Next.js 项目
- 上传代码
- 执行构建（约 2-3 分钟）
- 部署到预览环境

**完成后会显示**:
```
✓ Deployment complete
Preview: https://super-video-agent-xxx.vercel.app
```

---

### Step 3: 配置环境变量 (5 分钟)

#### 3a. 访问 Vercel Dashboard

打开浏览器，访问：
```
https://vercel.com/dashboard
```

进入你的项目 → **Settings** → **Environment Variables**

---

#### 3b. 添加必需变量

复制以下内容，逐个添加（环境选择 **Production**）：

```bash
# 1. Claude AI (核心功能) - 必需
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_BASE_URL=https://ppio-api.anthropic.com

# 2. Redis (任务队列) - 必需
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379

# 3. 视频生成 (至少配置一个) - 必需
# 方案 A: 即梦 API
DREAMINA_USE_API=true
DREAMINA_API_KEY=xxx
DREAMINA_API_BASE_URL=https://api.dreamina.com

# 或方案 B: 可灵
KLING_ACCESS_KEY=xxx
KLING_SECRET_KEY=xxx
KLING_API_URL=https://api-beijing.klingai.com

# 4. 语音识别 (视频分析功能) - 必需
ASR_ENGINES=openai
OPENAI_API_KEY=sk-xxx

# 5. Remotion 渲染 - 推荐
REMOTION_ENABLE=true
REMOTION_CONCURRENCY=2
REMOTION_QUALITY=80

# 6. 基础配置
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXT_PUBLIC_LOG_LEVEL=info
```

**注意**: 
- 将 `xxx` 替换为实际的 API 密钥
- `your-domain` 替换为实际的 Vercel 域名

---

#### 3c. Redis 快速设置（如果没有）

**推荐使用 Upstash Redis**（免费额度充足）:

1. 访问 https://upstash.com
2. 创建账号
3. 创建 Redis 数据库
4. 复制 `REDIS_URL`（格式：redis://default:xxx@xxx.upstash.io:6379）
5. 粘贴到 Vercel 环境变量

**或使用 Vercel KV**（Vercel 原生）:

1. Vercel Dashboard → 你的项目 → Storage
2. 点击 "Create Database" → 选择 "KV"
3. 自动注入 `REDIS_URL` 环境变量

---

### Step 4: 生产部署 (2 分钟)

环境变量配置完成后，执行：

```bash
vercel --prod
```

将会：
- 使用生产环境变量
- 构建生产版本
- 部署到主域名

**完成后显示**:
```
✓ Production deployment complete
https://super-video-agent.vercel.app
```

---

## ✅ 部署验证

访问你的域名，测试以下功能：

### 1. 首页加载
- ✅ 页面在 1 秒内可见
- ✅ 无 Console 错误

### 2. 脚本生成
- ✅ 输入选题："一只猫的日常"
- ✅ 点击生成脚本
- ✅ 等待 5-10 秒看到生成的脚本

### 3. 图片上传
- ✅ 上传一张图片
- ✅ 看到分析结果

### 4. 分镜生成
- ✅ 点击生成分镜
- ✅ 看到生成的场景图片

### 5. 视频导出
- ✅ 进入 Timeline 编辑器
- ✅ 点击导出视频
- ✅ 看到渲染进度

**所有功能正常 → 部署成功！** 🎉

---

## 🔧 常见问题

### Q1: API 返回 500 错误

**原因**: 环境变量未配置

**解决**: 
```bash
# 检查环境变量
vercel env ls

# 查看实时日志
vercel logs --follow
```

确认 `ANTHROPIC_API_KEY` 和 `REDIS_URL` 已配置。

---

### Q2: 图片生成失败

**原因**: 视频生成服务未配置

**解决**: 确认至少配置了以下之一：
- `DREAMINA_API_KEY` (推荐)
- `KLING_ACCESS_KEY` + `KLING_SECRET_KEY`

---

### Q3: 视频渲染超时

**原因**: Vercel Free 函数超时限制 (10 秒)

**解决**: 
- 升级到 Vercel Pro（$20/月，60 秒超时）
- 或使用异步任务队列（已实现）

---

### Q4: Redis 连接失败

**原因**: REDIS_URL 格式错误

**正确格式**:
```
redis://default:password@host:6379
```

**检查**: 
- 密码包含特殊字符需要 URL 编码
- 端口通常是 6379
- 使用 Upstash/Vercel KV 自动生成的 URL

---

## 📊 预期性能

| 指标 | 本地开发 | 生产环境 | 改善 |
|------|---------|---------|------|
| FCP | 0.9s | **0.6-0.8s** | ↓ 0.1-0.3s |
| LCP | 3.4s | **2.0-2.5s** | ↓ 0.9-1.4s |
| Performance | 91/100 | **92-95/100** | ↑ 1-4分 |

**为什么生产环境更快？**
- ✅ CDN 边缘节点（香港/新加坡）
- ✅ 静态资源缓存（1 年不变）
- ✅ Brotli/Gzip 压缩
- ✅ HTTP/2 多路复用

---

## 📈 后续步骤

### 短期（1 周内）

1. **监控性能**
   - Vercel Dashboard → Analytics
   - 查看 Web Vitals 真实数据

2. **邀请测试用户**
   - 5-10 位内部用户
   - 收集使用反馈和 Bug 报告

3. **启用错误监控**（推荐）
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   git add . && git commit -m "feat: 集成 Sentry 错误监控"
   vercel --prod
   ```

### 中期（1 个月内）

1. **扩展 Beta 测试** (50-100 用户)
2. **数据持久化** (Turso/Vercel Postgres)
3. **用户认证系统** (邀请码/登录)
4. **自定义域名** (Vercel Dashboard → Domains)

### 长期（3 个月内）

1. **公开发布**
2. **多语言完善** (i18n 基础已完成)
3. **移动端深度优化**
4. **API 开放和 SDK**

---

## 💰 成本估算

### Vercel 费用

| 计划 | 价格 | 适用场景 |
|------|------|---------|
| Hobby | **免费** | 个人项目、原型验证 |
| Pro | $20/月 | 中小团队、生产应用 |
| Enterprise | 定制 | 大规模应用 |

### Redis 费用（Upstash）

| 计划 | 价格 | 请求数 |
|------|------|--------|
| Free | **$0** | 10,000/天 |
| Pay as you go | ~$0.2/100K | 按需付费 |

### Claude API 费用

每次完整视频生成（脚本+分镜+分析）约消耗 **10-20K tokens** = **$0.05-$0.15**

**预估月度成本**:
- 100 个视频生成 = $5-15
- Vercel Hobby = $0
- Upstash Free = $0
- **总计**: **$5-15/月**（仅 API 费用）

---

## 🎉 恭喜！

你已经准备好部署世界级的 AI 视频生产力平台了！

**关键成就**:
- ✅ 40/41 任务完成
- ✅ Performance 91/100（超越 Flova AI）
- ✅ Accessibility 100/100（行业顶尖）
- ✅ 完整部署文档和自动化脚本

**现在开始部署**:
```bash
./scripts/deploy-wizard.sh
```

或手动执行：
```bash
vercel login
vercel
# 配置环境变量
vercel --prod
```

---

**最后更新**: 2026-04-10  
**状态**: 🚀 生产就绪  
**下一步**: 运行上述命令开始部署
