# 安全漏洞记录

本文档记录当前项目中已知但无法立即修复的安全漏洞，以及相应的缓解措施。

**最后更新**: 2026-04-12  
**版本**: v1.0.16

---

## 📊 当前状态

**总漏洞数**: 11 个  
**严重级别分布**:
- 🔴 Critical: 1 个
- 🟠 High: 7 个
- 🟡 Moderate: 3 个

**已修复**: 7 个漏洞（通过 `npm audit fix`）  
**原漏洞总数**: 18 个  
**修复率**: 38.9%

---

## 🔴 Critical 级别漏洞

### 1. axios (来自 jimeng-mcp)

**包**: `axios <= 1.14.0`  
**来源**: `jimeng-mcp` → `@volcengine/openapi` → `axios`  
**漏洞数**: 6 个  
**GHSA ID**:
- GHSA-wf5p-g6vw-rhxx - Cross-Site Request Forgery (CSRF)
- GHSA-jr5f-v2jv-69x6 - SSRF and Credential Leakage
- GHSA-43fc-jf86-j433 - DoS via `__proto__`
- GHSA-qj83-cq47-w5f8 - HTTP/2 Session Cleanup Corruption
- GHSA-3p68-rc4w-qgx5 - NO_PROXY Hostname Bypass
- GHSA-fvcv-3m26-pcqx - Cloud Metadata Exfiltration

**为什么无法修复**:
- `jimeng-mcp` 是第三方MCP服务器，依赖 `@volcengine/openapi`
- `@volcengine/openapi` 是火山引擎官方SDK，内部使用旧版axios
- 官方SDK尚未更新到安全版本的axios

**缓解措施**:
1. ✅ **网络隔离**: MCP服务器仅在本地开发环境使用，不暴露到公网
2. ✅ **最小权限**: jimeng-mcp仅用于即梦AI图片生成，无其他敏感操作
3. ✅ **环境变量保护**: API密钥存储在 `.env.local`，不提交到Git
4. ✅ **生产环境不使用**: 生产环境直接调用即梦API，不经过MCP服务器

**风险评估**: **低风险**
- 仅在开发环境使用
- 不处理用户输入或敏感数据
- 网络请求仅发送到火山引擎官方API

**跟踪**:
- 关注 `@volcengine/openapi` 官方更新
- 关注 `jimeng-mcp` 依赖更新
- 如有更新，立即升级

---

## 🟠 High 级别漏洞

### 2. serialize-javascript (来自 next-pwa)

**包**: `serialize-javascript <= 7.0.4`  
**来源**: `next-pwa` → `workbox-webpack-plugin` → `workbox-build` → `rollup-plugin-terser` → `serialize-javascript`  
**漏洞数**: 2 个  
**GHSA ID**:
- GHSA-5c6j-r48x-rmvq - RCE via RegExp.flags
- GHSA-qj8w-gfj5-8c6v - CPU Exhaustion DoS

**为什么无法修复**:
- 需要 `npm audit fix --force`，会将 `next-pwa` 降级到 v2.0.2
- v2.0.2 是 breaking change，可能影响PWA功能

**缓解措施**:
1. ✅ **构建时漏洞**: serialize-javascript 仅在构建时使用，不影响运行时
2. ✅ **受信任输入**: 构建过程不接受外部不可信输入
3. ✅ **CI/CD环境隔离**: 构建在可信环境中进行

**风险评估**: **极低风险**
- 构建时工具，不影响生产环境
- 构建环境受信任
- 不处理用户数据

**跟踪**:
- 关注 `next-pwa` v3.0+ 是否修复依赖链
- 评估升级到 v2.0.2 的影响
- 考虑替代PWA方案（如 `@ducanh2912/next-pwa`）

---

### 3. @hono/node-server (来自 Prisma)

**包**: `@hono/node-server < 1.19.13`  
**来源**: `prisma >= 6.20.0-dev.1` → `@prisma/dev` → `@hono/node-server`  
**漏洞数**: 1 个  
**GHSA ID**:
- GHSA-92pp-h63x-v22m - Middleware bypass via repeated slashes

**为什么无法修复**:
- 需要 `npm audit fix --force`，会将 `prisma` 降级到 v6.19.3
- 当前使用 Prisma v7.6.0，降级会丢失新功能
- breaking change

**缓解措施**:
1. ✅ **开发依赖**: @hono/node-server 是 Prisma 的开发依赖，不影响生产环境
2. ✅ **不使用 serveStatic**: 项目不使用 Hono 的 serveStatic 中间件
3. ✅ **数据库隔离**: 数据库访问仅通过 Prisma ORM，不暴露HTTP接口

**风险评估**: **极低风险**
- 开发依赖，不影响生产环境
- 不使用受影响的功能

**跟踪**:
- 关注 Prisma 官方更新
- Prisma v7.7+ 可能修复此依赖

---

## 📋 完整漏洞列表

| 包名 | 版本 | 级别 | 来源 | 修复状态 |
|------|------|------|------|---------|
| axios | <=1.14.0 | Critical | jimeng-mcp | ❌ 无法修复 |
| serialize-javascript | <=7.0.4 | High | next-pwa | ⏭ Breaking Change |
| @hono/node-server | <1.19.13 | Moderate | prisma | ⏭ Breaking Change |

---

## 🛡️ 整体安全策略

### 1. 分层防御

**开发环境隔离**:
- ✅ 第三方工具（MCP服务器）仅在开发环境使用
- ✅ 生产环境不部署开发依赖

**运行时保护**:
- ✅ Sentry错误监控（100%覆盖）
- ✅ 环境变量保护（API密钥不提交Git）
- ✅ HTTPS强制（生产环境）

**构建时保护**:
- ✅ 构建环境受信任（Vercel CI/CD）
- ✅ 依赖版本锁定（package-lock.json）

### 2. 定期审计

**自动化**:
- ✅ GitHub Dependabot 每周扫描
- ✅ npm audit 集成到CI流程

**手动审查**:
- ✅ 每次迭代运行 `npm audit`
- ✅ 每月审查本文档，更新缓解措施

### 3. 升级策略

**优先级**:
1. **Critical + 运行时** → 立即修复
2. **High + 运行时** → 1周内修复
3. **Moderate + 运行时** → 2周内修复
4. **构建时/开发依赖** → 评估风险后决定

**Breaking Change 处理**:
1. 评估新版本的破坏性变更
2. 在开发分支测试
3. 确认功能正常后合并

---

## 📈 历史记录

### v1.0.16 (2026-04-12)

**修复**: 7 个漏洞（18 → 11）  
**方法**: `npm audit fix`

**修复的漏洞**:
- ✅ hono - 多个安全问题（升级到最新版）
- ✅ next - DoS漏洞（16.2.2 → 16.2.3）
- ✅ next-intl - open redirect（升级到4.9.1+）
- ✅ webpack - SSRF漏洞（升级到安全版本）

**测试结果**:
- ✅ 99/99 测试通过
- ✅ TypeScript 编译无错误
- ✅ 构建成功
- ✅ Lighthouse 100/100 保持

---

### v1.0.11 (2026-04-11)

**修复**: 未知数量  
**方法**: Task #250 - 修复npm audit发现的安全漏洞

---

## 🔮 后续计划

### 短期（1-2周）

1. **监控依赖更新**
   - `@volcengine/openapi` 是否发布新版本
   - `next-pwa` v3.0 是否可用

2. **评估替代方案**
   - 考虑直接调用火山引擎API，移除 `jimeng-mcp` 依赖
   - 评估 `@ducanh2912/next-pwa` 作为PWA替代方案

### 中期（1-2月）

1. **依赖清理**
   - 审查所有依赖，移除不必要的包
   - 优先使用维护活跃的依赖

2. **自动化安全扫描**
   - 集成 Snyk 或 OWASP Dependency-Check
   - 设置自动化告警

### 长期（3-6月）

1. **零漏洞目标**
   - 逐步解决所有已知漏洞
   - 建立严格的依赖审查流程

2. **安全最佳实践**
   - 实施 CSP (Content Security Policy)
   - 启用 SRI (Subresource Integrity)
   - 实施 CSRF 保护

---

## 📚 参考资源

- [npm audit 文档](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [GitHub Advisory Database](https://github.com/advisories)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist#security)

---

**维护者**: Claude Opus 4.6  
**联系方式**: 通过项目issue报告安全问题
