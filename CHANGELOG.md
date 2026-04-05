# 超级视频Agent - 更新日志

## v1.6.0 - UI 创意活力升级（2026-04-06）

### 🎨 视觉升级

**设计方向**：创意活力 + 升级玻璃态
- 年轻、有趣、创意工作室风格
- 保留玻璃态基调，增强层次和动效
- 霓虹色点缀，不规则视觉元素

**字体系统**：
- Display: **Satoshi Bold** (品牌标题)
- Body: **DM Sans** (正文)
- Mono: **JetBrains Mono** (代码)

**核心差异化**：
1. **渐变气泡**：AI 消息采用紫-蓝-青渐变气泡 + 霓虹边框
2. **光波扩散**：按钮 hover 有光波扩散动画（btn-ripple）
3. **卡片倾斜**：对话卡片 hover 轻微 3D 倾斜（card-tilt）
4. **霓虹聚焦环**：输入框 focus 霓虹光晕效果

### 🎯 组件升级

**Header**：
- Logo 增强霓虹脉冲（从 20px 到 40px 模糊半径）
- 历史按钮 hover 旋转 12° + 渐变背景
- 状态徽章渐变指示器

**ChatMessage**：
- AI 消息：`bubble-gradient` 类（紫-蓝-青渐变 + 霓虹边框）
- 用户消息：三色渐变（purple → violet → blue）
- Avatar hover 光晕增强（从 20px 到 40px）
- 卡片倾斜效果（perspective 1000px）

**ChatInput**：
- 输入框聚焦霓虹环（shadow-glow）
- 附件按钮光波扩散动画
- 发送按钮三色渐变（purple → violet → cyan）
- 所有字体应用 DM Sans

### 🔧 技术细节

**新增 CSS**：
- 字体加载：Satoshi (Fontshare) + DM Sans (Google Fonts)
- 光波扩散动画：`@keyframes ripple` + `.btn-ripple::after`
- 卡片倾斜：`.card-tilt` (perspective + rotateX/Y)
- 渐变气泡：`.bubble-gradient` (多层渐变 + border-image)

**CSS 变量增强**：
- 新增 `--neon-violet`, `--glass-bg-hover`, `--shadow-glow`
- 提升模糊强度：blur(12px) → blur(16px)
- 增加饱和度：`saturate(180%)`

**动画优化**：
- 霓虹脉冲增强：阴影从 3 层到更强烈的 3 层
- 过渡时长统一：300ms cubic-bezier(0.4, 0, 0.2, 1)
- hover 状态优化：scale + shadow 组合

### 📦 文件变更

**修改**：
- `src/app/globals.css` - 字体加载 + 动画 + CSS 变量
- `src/app/page.tsx` - Header 升级
- `src/components/chat/ChatMessage.tsx` - 气泡渐变
- `src/components/chat/ChatInput.tsx` - 霓虹聚焦环
- `CHANGELOG.md` - 本次更新记录

### ✅ 测试

- ✅ 构建成功（TypeScript 编译通过）
- ✅ 字体加载正常
- ✅ 动画流畅（60fps）
- ✅ 响应式兼容

### 🎬 视觉效果

**对比前后**：
- **Before**: 纯玻璃态 + 简单渐变
- **After**: 玻璃态 + 霓虹光晕 + 多重动效

**关键差异**：
- 不再是"千篇一律的紫色渐变卡片"
- 有独特的光波扩散和卡片倾斜交互
- 字体从 Geist 切换到 Satoshi + DM Sans

---

## v1.5.1 - 历史记录系统（2026-04-06）

### 新增功能
- ✅ 历史记录查询 API (/api/history)
- ✅ 支持分页和筛选（类型/状态/搜索）
- ✅ 历史记录侧边栏组件
- ✅ 时间线展示
- ✅ 查看/重新生成/删除操作
- ✅ 从历史恢复分镜状态

---

## v1.5.0 - 多模型路由系统（2026-04-06）

### 🎯 核心功能

**多模型智能路由**
- ✅ 自动分析分镜场景特征（风格、复杂度、运动强度）
- ✅ 智能推荐最优生成模型（Seedance vs Kling）
- ✅ 4种路由策略：质量优先/速度优先/成本优先/平衡模式
- ✅ 无缝集成到视频生成流程（无需用户干预）

### 📊 模型能力矩阵

**Seedance 2.0**
- 擅长：写实风格、静态场景、产品展示、高清质量
- 质量 9/10 | 速度 7/10 | 一致性 8/10 | 成本 1.0x

**可灵 AI**
- 擅长：动态场景、快速动作、角色运动、动画风格
- 质量 8/10 | 速度 6/10 | 一致性 7/10 | 成本 1.2x

### 🔧 技术实现

**新增文件**
- `src/types/index.ts` - 路由类型定义（ModelType, StyleAnalysisResult, ModelRoutingDecision 等）
- `src/lib/ai/model-router.ts` - 核心路由引擎（700+ 行）
- `src/app/api/model-routing/route.ts` - REST API 端点
- `docs/MODEL_ROUTING.md` - 完整使用文档

**修改文件**
- `src/app/page.tsx` - 集成自动路由到 `generate_video` 和 `generate_video_with_frames`
- `CLAUDE.md` - 更新进化方向，标记多模型路由已完成

### 🎨 特征分析

**检测维度**
- 风格类型：写实/动画/电影/商业
- 运动强度：静态/缓慢/中等/快速/动态
- 场景复杂度：简单/中等/复杂
- 是否有人物、文字、快速动作、复杂镜头

**决策逻辑**
- 动画 + 快速动作 → Kling (+2分)
- 写实 + 静态产品 → Seedance (-2分)
- 复杂镜头 → Kling (+1分)
- 人物角色 → Kling (+1分)

### 📝 API 使用

```bash
# 路由分析
POST /api/model-routing
{
  "storyboardId": "sb-123",
  "frames": [...],
  "strategy": {
    "prioritize": "balanced",  # quality | speed | cost | balanced
    "allowMixedModels": true,
    "qualityThreshold": 7
  }
}

# 获取模型能力
GET /api/model-routing/capabilities
```

### ✅ 测试验证

- ✅ API 测试通过（混合场景正确推荐）
- ✅ 构建成功（TypeScript 编译无错误）
- ✅ 自动集成测试（前端流程正常）

### 📖 文档

- ✅ 完整使用文档：`docs/MODEL_ROUTING.md`
- ✅ 模型能力对比
- ✅ 4种策略说明
- ✅ API 使用示例
- ✅ 决策示例演示

### 🚀 影响

**开发体验**
- 用户无需手动选择模型，系统自动推荐
- 提供详细的推荐理由和置信度
- 支持策略灵活切换

**视频质量**
- 根据场景特点匹配最优模型
- 提升生成质量和一致性
- 平衡质量、速度、成本

### 📦 Commits

- `50e6b31` - feat: 多模型路由系统 v1.5.0
- `6e40684` - fix: 修复视频未生成就提示下载的问题

---

## v1.4.0 - Remotion文字效果系统（2026-04-05）

### 🎯 核心功能

**Phase 4 Part 3 完成**
- ✅ 端到端文字效果流程打通
- ✅ 科技时尚UI改造（玻璃态设计）
- ✅ 预览功能实现（单帧快速渲染）

**文字效果系统**
- ✅ 字幕：时间轴同步、多轨道、SRT格式、淡入淡出
- ✅ 标题：6种动画（slideIn/fadeIn/zoomIn/bounceIn/rotateIn/typewriter）
- ✅ 弹幕：右向左滚动、碰撞避让、速度可配置

### 🔧 技术实现

**新增文件**
- `src/app/api/video/remotion-preview/route.ts` - 预览API
- `src/components/video/RemotionPreview.tsx` - 预览组件（280行）
- `src/components/editor/TextEffectsEditor.tsx` - 编辑器（520行）
- `src/lib/ai/text-effects-engine.ts` - 文字效果引擎

**Remotion组件**
- `src/lib/video/remotion/subtitles/` - 字幕系统
- `src/lib/video/remotion/titles/` - 标题系统
- `src/lib/video/remotion/bullets/` - 弹幕系统

### ✅ 测试验证

- ✅ TypeScript 编译通过（15+ 错误修复）
- ✅ 构建成功（webpack模式）
- ✅ 预览功能正常

---

## v1.3.0 - Remotion转场效果（2026-04-04）

### 🎯 核心功能

**Phase 4 Part 1-2 完成**
- ✅ 5种转场效果（fade/slide/zoom/rotate/wipe）
- ✅ 7种缓动函数（linear/ease-in/ease-out/ease-in-out/cubic/elastic/bounce）
- ✅ GPU加速渲染

---

## v1.2.0 - Pretext文字动画（2026-04-03）

### 🎯 核心功能

**Pretext集成**
- ✅ 流体文字、粒子文字、ASCII艺术
- ✅ 字符级精确控制
- ✅ 60fps高性能渲染

---

## v1.1.0 - 视频分析与二创（2026-04-02）

### 🎯 核心功能

**视频分析**
- ✅ 语音识别（Whisper.cpp本地引擎）
- ✅ 场景分析（GPT-4V）
- ✅ 关键帧提取

**二创功能**
- ✅ 元素替换（纸船→爱心）
- ✅ 风格转换（写实→动画）
- ✅ 保持角色一致性

---

## v1.0.0 - 基础功能（2026-04-01）

### 🎯 核心功能

**脚本生成**
- ✅ 选题生成脚本
- ✅ 图片生成脚本
- ✅ 多脚本对比

**分镜生成**
- ✅ Text2Image（即梦API）
- ✅ Image2Image（产品锁定）
- ✅ 人物风格转换

**视频生成**
- ✅ Seedance 2.0集成
- ✅ 可灵AI集成
- ✅ FFmpeg合成

**对话系统**
- ✅ Claude Opus 4.6（PPIO代理）
- ✅ 流式对话
- ✅ 上下文管理

---

**维护者**：张经纬  
**最后更新**：2026-04-06 23:20
