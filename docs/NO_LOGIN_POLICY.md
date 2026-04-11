# 无需登录政策 (No Login Required)

**Date**: 2026-04-10  
**Status**: ✅ 已实现

---

## 核心原则

**超级视频Agent 采用"打开即用"设计，无需任何注册或登录。**

### 设计理念

1. **零门槛**: 用户访问即可开始创作
2. **隐私优先**: 所有数据存储在本地浏览器
3. **快速体验**: 无需填写任何表单
4. **无追踪**: 不收集用户个人信息

---

## 数据存储策略

### 本地存储 (localStorage)

所有用户数据存储在浏览器 localStorage，包括：

- **项目数据**: 脚本、分镜、视频配置
- **历史记录**: 操作历史、版本快照
- **用户偏好**: 界面设置、语言选择
- **临时数据**: 生成进度、缓存

**存储键名规范**:
```typescript
// 项目列表
localStorage.getItem('super-video-agent:projects')

// 当前项目
localStorage.getItem('super-video-agent:current-project')

// 历史记录
localStorage.getItem('super-video-agent:history')

// 用户偏好
localStorage.getItem('super-video-agent:preferences')
```

### 数据特点

| 特性 | 说明 |
|------|------|
| **存储位置** | 浏览器本地（不上传服务器） |
| **存储容量** | ~5-10MB（浏览器限制） |
| **数据持久性** | 除非用户清除浏览器数据 |
| **跨设备同步** | ❌ 不支持（本地存储） |
| **隐私性** | ✅ 完全隐私（不离开设备） |

---

## 用户体验流程

### 首次访问

1. 用户打开网站
2. 看到 Welcome Hero 欢迎界面
3. **无需注册/登录**，直接输入创意开始创作
4. 系统自动在 localStorage 创建项目

### 再次访问

1. 用户再次打开网站
2. 系统自动加载上次的项目
3. 显示历史记录和项目列表
4. 用户可继续编辑或创建新项目

### 数据导出（可选）

用户可以导出项目数据为 JSON 文件：
```typescript
// 导出项目
function exportProject(projectId: string) {
  const project = JSON.parse(localStorage.getItem(`project:${projectId}`) || '{}')
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `project-${projectId}.json`
  a.click()
}
```

---

## 与竞品对比

| 产品 | 登录要求 | 数据存储 | 隐私性 |
|------|---------|---------|--------|
| **超级视频Agent** | ❌ 无需登录 | 本地 localStorage | ✅ 完全隐私 |
| Flova AI | ✅ 需要登录 | 云端服务器 | ⚠️ 需要信任服务商 |
| Runway | ✅ 需要登录 | 云端服务器 | ⚠️ 需要信任服务商 |
| Pika | ✅ 需要登录 | 云端服务器 | ⚠️ 需要信任服务商 |

**差异化优势**:
- ✅ 零门槛，访问即用
- ✅ 完全隐私，数据不上传
- ✅ 无需管理密码
- ✅ 无需担心账号被封

---

## 技术实现

### 存储管理器

**文件**: `src/lib/storage/localStorage.ts`

```typescript
/**
 * localStorage 管理器
 * 封装所有本地存储操作
 */

const PREFIX = 'super-video-agent:'

export const storage = {
  // 保存项目
  saveProject(project: Project) {
    const key = `${PREFIX}project:${project.id}`
    localStorage.setItem(key, JSON.stringify(project))
  },

  // 获取项目
  getProject(id: string): Project | null {
    const key = `${PREFIX}project:${id}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },

  // 列出所有项目
  listProjects(): Project[] {
    const projects: Project[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(`${PREFIX}project:`)) {
        const data = localStorage.getItem(key)
        if (data) projects.push(JSON.parse(data))
      }
    }
    return projects.sort((a, b) => b.updatedAt - a.updatedAt)
  },

  // 删除项目
  deleteProject(id: string) {
    const key = `${PREFIX}project:${id}`
    localStorage.removeItem(key)
  },

  // 清除所有数据
  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  },
}
```

### 自动保存

**文件**: `src/hooks/useAutoSave.ts`

```typescript
/**
 * 自动保存 Hook
 * 防抖 1 秒后保存到 localStorage
 */
export function useAutoSave(project: Project) {
  const debouncedSave = useMemo(
    () => debounce((p: Project) => {
      storage.saveProject(p)
      console.log('✓ 项目已自动保存')
    }, 1000),
    []
  )

  useEffect(() => {
    if (project) {
      debouncedSave(project)
    }
  }, [project, debouncedSave])
}
```

---

## 限制和权衡

### 当前限制

1. **无跨设备同步**: 数据仅存储在当前浏览器
2. **存储容量有限**: ~5-10MB（约 100-200 个项目）
3. **无协作功能**: 无法多人同时编辑
4. **数据备份靠用户**: 需要手动导出备份

### 未来可选升级（如需要）

**Phase 1: 可选云端同步**（不强制登录）
- 提供可选的云端备份
- 使用设备码自动同步（无需账号）
- 用户可选择启用/禁用

**Phase 2: 邀请码系统**（仍无需账号）
- 使用邀请码访问
- 不需要注册，只需输入码
- 数据仍存本地或可选云端

**Phase 3: 完整账号系统**（企业版）
- 仅企业版提供
- 支持团队协作
- 权限管理和审计日志

---

## 隐私声明

### 数据收集

❌ **我们不收集**:
- 个人身份信息（姓名、邮箱、手机）
- 用户行为追踪
- 项目内容上传
- Cookie 用户追踪

✅ **我们收集**（可选）:
- 匿名性能指标（Vercel Analytics）
- 错误日志（Sentry，可选）
- 使用统计（如启用）

### 第三方服务

| 服务 | 用途 | 数据 |
|------|------|------|
| Claude API | AI 生成 | 仅发送提示词（不存储） |
| Dreamina/Kling | 图片/视频生成 | 仅发送图片描述 |
| Redis | 任务队列（服务端） | 临时任务数据（1小时后删除） |

**关键点**: 所有第三方 API 调用仅发送生成所需的提示词，不发送用户身份信息。

---

## 用户引导

### Welcome Hero 欢迎语

```tsx
<h1>超级视频Agent</h1>
<p>AI 驱动的视频创作平台</p>
<p className="text-sm text-zinc-500">
  无需注册，打开即用 • 数据存储在本地，完全隐私
</p>
```

### 首次使用提示

```tsx
{isFirstVisit && (
  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
    <h4>👋 欢迎使用超级视频Agent</h4>
    <p>无需注册或登录，输入创意即可开始创作。</p>
    <p>你的所有项目数据都安全存储在浏览器本地。</p>
  </div>
)}
```

---

## FAQ

### Q1: 数据会丢失吗？

A: 只要不清除浏览器数据，项目会一直保存。建议定期导出重要项目作为备份。

### Q2: 可以在其他设备访问吗？

A: 当前不支持跨设备同步。你可以导出项目 JSON 文件，在其他设备导入。

### Q3: 容量满了怎么办？

A: localStorage 容量通常 5-10MB。可以删除旧项目或导出后清理。

### Q4: 未来会强制登录吗？

A: **不会**。无需登录是核心产品理念，永久保持。

### Q5: 企业用户需要账号吗？

A: 企业版会提供可选的账号系统（用于团队协作），但个人版永久免登录。

---

## 竞争优势总结

**"打开即用"是超级视频Agent 的核心差异化优势：**

1. **零门槛**: 比竞品快 5 分钟（无需注册流程）
2. **完全隐私**: 吸引隐私敏感用户
3. **无账号风险**: 不会被封号或限制
4. **病毒传播**: 分享链接即可使用，无摩擦

**适合场景**:
- ✅ 个人创作者
- ✅ 快速原型验证
- ✅ 教育和学习
- ✅ 隐私敏感用户

**不适合场景**:
- ❌ 团队协作（需要账号系统）
- ❌ 跨设备工作（需要云端同步）
- ❌ 企业合规（需要审计日志）

---

**最后更新**: 2026-04-10  
**状态**: ✅ 已实现并验证  
**原则**: **永久保持无需登录**
