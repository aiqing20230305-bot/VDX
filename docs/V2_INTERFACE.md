# 超级视频Agent v2.0 界面设计

## 🎯 设计目标

参考 SenseTime SEKO，打造对话式 AI 视频创作平台。

## 📐 布局架构

```
┌────────────────────────────────────────────────────────────┐
│                        顶部导航栏                           │
├─────────────┬──────────────────────────────────────────────┤
│             │                                              │
│   左侧栏    │              右侧内容展示区                    │
│  (400px)    │                                              │
│             │                                              │
│  对话区域   │   Empty State / 脚本提纲 / 分镜网格           │
│             │                                              │
│  控制面板   │                                              │
│             │                                              │
│  输入框     │                                              │
│             │                                              │
└─────────────┴──────────────────────────────────────────────┘
```

## 🎨 设计系统

### 颜色方案（Industrial Minimalism）
- **主色**: Cyan (#06b6d4) - 强调色、按钮、状态指示
- **背景**: 
  - 深黑 #0a0a0f (page background)
  - 深灰 #18181b (zinc-900, cards)
  - 中灰 #27272a (zinc-800, borders)
- **文字**:
  - 主文字 #fafafa (zinc-50)
  - 次要文字 #a1a1aa (zinc-400)
  - 辅助文字 #52525b (zinc-600)

### 间距规范
- 页面边距: 32px
- 卡片间距: 24px
- 内容间距: 16px
- 小元素间距: 8px

### 圆角
- 大卡片: 12px (rounded-xl)
- 小卡片: 8px (rounded-lg)
- 按钮: 8-12px
- 输入框: 12px (rounded-xl)

### 阴影
遵循 Industrial Minimalism - **不使用阴影**，改用边框：
- 卡片边框: 1px solid zinc-800
- 激活状态: 1px solid cyan-500

## 📱 区域详解

### 左侧对话区 (400px固定宽度)

**1. Header (64px高)**
- Logo + 标题
- 操作图标: 历史记录、用户设置

**2. Messages (flex-1)**
- 用户消息: 右对齐，cyan背景，圆角气泡
- AI消息: 左对齐，zinc-900背景，圆角气泡
- Empty State: 3个快速开始卡片

**3. Pending Question (动态高度)**
- 显示AI询问的问题
- 选项按钮（垂直排列）

**4. Input (96px高)**
- 输入框: zinc-900背景，focus时cyan边框
- 发送按钮: 右上角，cyan背景
- 提示文字: Shift+Enter换行

### 右侧内容区 (flex-1)

**Empty State**
- 居中显示
- 大icon + 标题 + 描述

**脚本展示**
- 顶部: 状态徽章 + 标题 + 描述
- 内容: 场景列表（zinc-900卡片）
  - 场景序号（cyan圆形）
  - 视觉描述
  - 旁白（斜体）
  - 元数据（时长、镜头）

**分镜网格**
- 顶部: 状态徽章 + 标题
- 3列网格布局
- 每个分镜卡片:
  - 16:9图片区域
  - 序号标签（左上角）
  - 提示词（截断2行）
  - 时间范围

## 🔄 交互流程

### 标准流程
1. **用户输入** → "我想做一个15秒的猫咪视频"
2. **AI思考** → 显示动画点点点
3. **AI调用工具** → 自动生成脚本
4. **右侧展示** → 脚本提纲出现
5. **AI询问** → "选择你喜欢的脚本"
6. **用户选择** → 点击选项按钮
7. **AI执行** → 生成分镜
8. **右侧更新** → 分镜网格出现
9. **AI询问** → "是否开始生成视频？"
10. **用户确认** → 启动视频生成

### 动画效果
- 消息淡入: 200ms fade-in
- 卡片出现: 300ms slide-up + fade-in
- 按钮hover: scale(1.02)
- 思考动画: 3个点依次脉冲

## 🎯 对比SEKO的改进

| 维度 | SEKO | 我们的v2 |
|------|------|---------|
| **布局** | 左窄右宽 | ✅ 相同 |
| **对话区** | 固定宽度 | ✅ 400px固定 |
| **结构化输出** | 独立区域 | ✅ 右侧展示 |
| **深色主题** | ✅ | ✅ Industrial Minimalism |
| **状态指示** | 徽章 | ✅ 绿色脉冲徽章 |
| **玻璃态** | ❌ | ✅ **不使用**（遵循设计系统） |
| **渐变** | 部分使用 | ✅ 仅Logo使用 |

## 🚀 v2 vs v1 对比

| 功能 | v1 (page.tsx) | v2 (v2/page.tsx) |
|------|--------------|-----------------|
| **布局** | 全屏聊天 | 左右分栏 |
| **内容展示** | 混在对话中 | 右侧独立区域 |
| **Agent集成** | ❌ | ✅ useAgentExecutor |
| **快速开始** | 操作按钮 | 3个推荐卡片 |
| **视觉层次** | 中等 | 强（清晰分区） |
| **信息密度** | 低 | 高（结构化） |

## 📋 待优化项

### Phase 1（当前）
- [x] 左右分栏布局
- [x] Agent服务集成
- [x] 脚本/分镜展示
- [ ] 视频播放器集成
- [ ] 进度实时更新

### Phase 2
- [ ] 历史记录侧边栏
- [ ] 用户设置面板
- [ ] 角色库集成
- [ ] 音频控制面板（参考SEKO）
- [ ] 分镜编辑功能

### Phase 3
- [ ] 多会话管理
- [ ] 模板市场
- [ ] 社区探索页面
- [ ] 数字人视频生成

## 🎨 设计细节

### 消息气泡
```css
/* 用户消息 */
.user-message {
  background: #06b6d4;  /* cyan-500 */
  border-radius: 16px;
  border-top-right-radius: 4px;  /* 右上角小圆角 */
  padding: 8px 16px;
  max-width: 85%;
}

/* AI消息 */
.ai-message {
  background: #18181b;  /* zinc-900 */
  border-radius: 16px;
  border-top-left-radius: 4px;  /* 左上角小圆角 */
  padding: 8px 16px;
  max-width: 90%;
}
```

### 状态徽章
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(16, 185, 129, 0.1);  /* green-500/10 */
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 9999px;
  font-size: 14px;
  color: #10b981;  /* green-400 */
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### 分镜卡片hover
```css
.storyboard-card {
  transition: all 200ms ease;
}

.storyboard-card:hover {
  transform: translateY(-2px);
  border-color: #06b6d4;  /* cyan-500 */
}
```

## 🔗 相关文件

- 主界面: `src/app/v2/page.tsx`
- Agent Hook: `src/hooks/useAgentExecutor.ts`
- 设计系统: `DESIGN.md`
- Agent文档: `docs/AGENT_SERVICE.md`

## 📸 界面截图

（待添加实际截图）

### 1. Empty State
- 左侧: Logo + 3个快速开始卡片
- 右侧: 居中的引导文案

### 2. 脚本生成后
- 左侧: 对话历史
- 右侧: 脚本提纲（场景列表）

### 3. 分镜生成后
- 左侧: 对话历史
- 右侧: 3列分镜网格

## 🎯 下一步

1. **集成视频播放器** - 在右侧展示生成的视频
2. **添加进度指示** - 实时显示生成进度
3. **完善音频面板** - 参考SEKO的音频控制
4. **历史记录** - 侧边栏显示历史作品
5. **迁移到主路由** - 将v2替换v1成为主界面

---

**创建时间**: 2026-04-08  
**版本**: v2.0.0-alpha  
**状态**: 开发中 ✨
