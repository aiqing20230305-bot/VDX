@AGENTS.md

# 超级视频Agent — 开发指南

## 项目启动
```bash
npm run dev          # http://localhost:3000
npm run build        # 生产构建
dreamina login       # 即梦登录（首次）
```

## Skills（按流程和用途分类）

### 📹 核心创作流程
| Skill | 路径 | 说明 |
|-------|------|------|
| 01-script-create | `.claude/skills/01-script-create/` | 脚本创建（根据选题/图片生成） |
| 02-storyboard-generate | `.claude/skills/02-storyboard-generate/` | 分镜生成（text2image + image2image） |
| 03-storyboard-overview | `.claude/skills/03-storyboard-overview/` | 分镜概览（合成概览图） |
| 04-video-seedance | `.claude/skills/04-video-seedance/` | 即梦视频生成 |
| 05-video-kling | `.claude/skills/05-video-kling/` | 可灵视频生成 |
| 06-video-assemble | `.claude/skills/06-video-assemble/` | 视频合成（FFmpeg 拼接） |

### ✏️ 编辑修改流程
| Skill | 路径 | 说明 |
|-------|------|------|
| edit-storyboard-chat | `.claude/skills/edit-storyboard-chat/` | 对话式分镜编辑 |
| edit-video-recreate | `.claude/skills/edit-video-recreate/` | 视频分析与二创 |

### 🛠️ 工具辅助类
| Skill | 路径 | 说明 |
|-------|------|------|
| tool-image-generate | `.claude/skills/tool-image-generate/` | 即梦图片生成 |
| tool-image-classify | `.claude/skills/tool-image-classify/` | 图片智能分类 |
| tool-character-transform | `.claude/skills/tool-character-transform/` | 人物风格转换 |
| tool-ffmpeg-process | `.claude/skills/tool-ffmpeg-process/` | FFmpeg 视频处理 |
| tool-style-selector | `.claude/skills/tool-style-selector/` | 视频风格选择器 |
| tool-pretext-text | `.claude/skills/tool-pretext-text/` | Pretext 文字动画 ⭐ 新增 |

### ⚙️ 系统优化类
| Skill | 路径 | 说明 |
|-------|------|------|
| sys-product-lock | `.claude/skills/sys-product-lock/` | 产品特征锁定 |
| sys-prompt-simplify | `.claude/skills/sys-prompt-simplify/` | 提示词智能简化 |
| sys-progress-ui | `.claude/skills/sys-progress-ui/` | 进度界面展示 |
| sys-chat-orchestrator | `.claude/skills/sys-chat-orchestrator/` | 聊天流程编排 |

**Skill 文件命名规范：**
- 格式：`<功能描述>.skill.md`（如 `script-generation.skill.md`）
- 使用连字符分隔单词，描述核心用途/场景
- 保持简洁（2-4 个单词）

修改任何流程时，必须同步更新对应 skill 文件的迭代记录。

## 核心架构

```
src/
├── app/
│   ├── page.tsx                 # 主聊天界面
│   └── api/
│       ├── chat/route.ts        # Claude 流式对话
│       ├── script/route.ts      # 脚本生成
│       ├── storyboard/route.ts  # 分镜图生成（含图片填充）
│       ├── analyze/route.ts     # 视频分析（二创）
│       ├── character-style/     # 人物风格转换
│       └── usage/route.ts       # Token 用量统计
├── lib/
│   ├── ai/
│   │   ├── claude.ts            # Claude API（PPIO 代理）
│   │   ├── script-engine.ts     # 脚本生成引擎
│   │   ├── storyboard-engine.ts # 分镜引擎 + 图片填充
│   │   ├── analysis-engine.ts   # 视频分析 + 二创
│   │   ├── chat-agent.ts        # 聊天代理系统提示
│   │   └── chat-actions.ts      # UI 动作（客户端安全）
│   ├── video/
│   │   ├── seedance.ts          # dreamina CLI 封装
│   │   ├── kling.ts             # 可灵 JWT + 直连
│   │   ├── dreamina-image.ts    # 图片生成 + 风格转换
│   │   ├── ffmpeg-utils.ts      # FFmpeg 工具
│   │   ├── remotion-pipeline.ts # Remotion 程序化渲染
│   │   ├── remotion/            # Remotion 组件
│   │   └── pipeline.ts          # 视频 Pipeline
│   └── db/client.ts             # Prisma + LibSQL
└── types/index.ts               # 核心类型
```

## 环境变量（.env.local）

| 变量 | 说明 | 必需 |
|------|------|------|
| ANTHROPIC_API_KEY | Claude API Key | ✅ 必需 |
| ANTHROPIC_BASE_URL | API 代理地址（PPIO） | 可选 |
| KLING_ACCESS_KEY / SECRET_KEY | 可灵 API | 可选 |
| KLING_API_URL | `https://api-beijing.klingai.com` | 可选 |
| JIMENG_API_TOKEN | 即梦 sessionid（dreamina CLI 管理） | 可选 |
| **ASR_ENGINES** | **语音识别引擎（默认 whisper-cpp）** | 可选 |
| WHISPER_CPP_MODEL | Whisper 模型（默认 medium） | 可选 |
| OPENAI_API_KEY | OpenAI API（ASR 备用） | 可选 |
| **REMOTION_ENABLE** | **Remotion 渲染引擎（默认 false）** | 可选 |
| REMOTION_CONCURRENCY | Remotion 并发数（默认 2） | 可选 |
| REMOTION_QUALITY | JPEG 质量 0-100（默认 80） | 可选 |

### 语音识别配置（视频分析功能）

**推荐方案**：Whisper.cpp（本地，免费）

```bash
# 1. 安装 Whisper.cpp（提供 whisper-cli 命令）
brew install whisper-cpp

# 2. 下载模型
bash scripts/download-whisper-model.sh medium

# 3. 配置（可选，默认已启用）
echo "ASR_ENGINES=whisper-cpp" >> .env.local
echo "WHISPER_CPP_MODEL=medium" >> .env.local
```

**备用方案**：多引擎降级

```bash
# 本地优先，失败后云端备份
ASR_ENGINES=whisper-cpp,openai
OPENAI_API_KEY=sk-...
```

## 关键规则

- **生成脚本前必须问询时长和比例**，不要用默认值
- **分镜帧数**：每帧 3~5 秒，`frames = round(duration / 3.5)`
- **视频时长上限**：5 分钟（300 秒）
- **图片格式**：HEIC/BMP/TIFF 等自动转 PNG
- **人物参考**：真人照片 → 风格转换 → 作为视频参考
- **产品颜色**：不要在提示词中描述颜色，让 image2image 完全依赖参考图
- **可灵域名**：必须用 `api-beijing.klingai.com`
- **可灵路径**：`/v1/videos/text2video`（不是 /generation）
- **claude.ts 仅服务端**：`import 'server-only'`，客户端用 chat-actions.ts

## 架构理念：对话智能层 + 底层引擎层

```
对话智能层（可进化）         底层引擎层（稳定）
├─ 意图识别                  ├─ generateStoryboard()
├─ 流程编排                  ├─ fillStoryboardImages()
├─ 上下文理解 ⭐              ├─ parseModificationIntent()
└─ 与用户共创                └─ 图片/视频生成 API
```

**原则**：
- 对话层灵活进化，可通过对话改变生成逻辑和顺序
- 底层引擎标准化，保护核心能力
- 修改意图由系统智能判断，不依赖显式命令
- **上下文关联**：记住对话历史，理解用户回答是在回应之前的问题

## 上下文系统（v1.0）

### 图片上传对齐流程
```
上传图片 → AI分析 → 展示结果 → 用户确认/修正 → 基于对齐的理解推演
```

**关键点**：
- 不直接生成，先展示系统的理解
- 给用户修正机会，提高准确度
- 确认后再执行，避免理解偏差

### 上下文状态管理
```typescript
contextState: {
  type: 'waiting_image_confirmation' | 'waiting_style' | null
  data: { uploadData, userMessage, ... }
}
```

**处理优先级**：
1. 上下文回复（waiting_xxx）
2. 分镜修改意图
3. 脚本生成意图
4. 默认聊天

详见：`.claude/CONTEXT_SYSTEM.md`

## Building Blocks 系统 ⭐ 新增（v2.0）

**目标**：从线性 Skills 升级为可组合、可复用的构建块系统

### 核心概念
- **Block（构建块）**：原子化的功能单元，具有明确的输入输出
- **Workflow（工作流）**：多个 Blocks 的组合，支持 DAG 结构和并行执行
- **WorkflowEngine（执行引擎）**：解析工作流、拓扑排序、智能调度

### 已实现 Blocks（15 个）
**输入类**：input.text, input.image, input.product  
**生成类**：generate.script, generate.prompts, generate.image, generate.video  
**处理类**：process.analyze, process.transform, process.filter  
**合成类**：compose.merge, compose.subtitle, compose.transition  
**输出类**：output.video, output.export

### 预设模板（3 个）
1. `template.product-promo` — 产品宣传片生成（完整流程）
2. `template.simple-text2image` — 简单文生图
3. `template.image-analysis` — 图片分析

### API 路由
- `GET /api/blocks/list` — 列出所有可用 Blocks
- `GET /api/workflow/templates` — 列出模板
- `POST /api/workflow/execute` — 执行工作流（支持流式）

### 测试页面
访问 `http://localhost:3000/test-blocks` 可视化测试

### 文档
详见 `docs/BUILDING_BLOCKS.md`

### 优势对比
| 维度 | Skills | Building Blocks |
|------|--------|----------------|
| 可组合性 | ❌ 固定 | ✅ 自由组合 |
| 并行执行 | ❌ 串行 | ✅ 智能并行 |
| 成本可见 | ❌ 不透明 | ✅ 精确预估 |
| 新功能开发 | 🐌 修改核心 | ⚡ 新增 Block |

---

## 进化方向

1. ✅ **多模型路由**（v1.5.0 已完成）⭐ 新增
   - 风格分析引擎（SceneComplexity/MotionIntensity）
   - 智能路由决策（Seedance vs Kling）
   - 4 种策略（质量/速度/成本/平衡）
   - 自动集成到生成流程
   - 详见：`docs/MODEL_ROUTING.md`
2. ✅ **音频同步（歌词/节拍驱动分镜节奏）**（v1.0.10 已完成）⭐ 新增
   - Phase 1-2.2: 音频分析 + 前端集成 ✅
   - Phase 2.3: 脚本引擎音频驱动（歌词关键词 + 段落情绪映射）✅
   - Phase 2.4: 分镜引擎节奏同步（Chorus 1.5x密度 + 提示词节奏修饰）✅
   - 自动识别Intro/Verse/Chorus/Bridge/Outro段落
   - 根据BPM和能量级别调整画面节奏
   - 歌词关键词融入场景视觉主题
3. ✅ **角色一致性系统**（v1.0.12 已完成）⭐ 新增
   - ✅ 数据库模式（Character + CharacterFeatures 表）
   - ✅ Claude Vision API 自动特征提取
   - ✅ 角色 CRUD API（/api/character + /api/character/extract-features）
   - ✅ 分镜引擎集成（characterId → 提示词增强）
   - ✅ UI 组件（CharacterLibrary, CharacterCreateModal, CharacterSelector）
   - ✅ 端到端测试和文档完善（Task #243）
   - IP 角色在所有帧中保持视觉一致性
   - 详见：`docs/CHARACTER_CONSISTENCY.md` (用户) 和 `docs/dev/CHARACTER_SYSTEM_API.md` (开发者)
4. ✅ **Remotion 程序化视频渲染**（v1.7.0 已完成 Phase 4 全部）⭐
   - Phase 1: React 组件描述视频、基础转场 ✅
   - Phase 2: 5 种转场效果（fade/slide/zoom/rotate/wipe） ✅
   - Phase 3: 完整文字系统 ✅
     - 字幕：时间轴同步/多轨道/SRT 格式/淡入淡出
     - 标题：6 种动画/进入退出/打字机效果
     - 弹幕：右向左滚动/碰撞避让/速度可配置
   - Phase 4: UI 集成与优化 ✅
     - Part 1: 文字效果 API 和引擎 ✅
     - Part 2: 科技时尚 UI 改造 ✅
     - Part 3: 端到端流程打通 ✅
     - Part 4: 预览和编辑器 ✅
   - Phase 5: 高级转场效果库 ✅（v2.1.0 新增）⭐⭐⭐
     - 3个3D转场：Flip（翻转）、Cube（立方体）、PageCurl（翻页）
     - 4个创意转场：Blur（模糊）、Pixelate（像素化）、Glitch（故障艺术）、Ripple（水波纹）
     - **总计12种转场**（5基础 + 7高级）
     - 显著提升视频质量和视觉冲击力
   - 7 种缓动函数、GPU 加速
   - 与 FFmpeg/Seedance/Kling 并存
5. ✅ **Pretext 精确文字动画**（v1.2.0 已完成 Phase 1）⭐ 新增
   - 流体文字、粒子文字、ASCII 艺术
   - 字符级精确控制（@chenglou/pretext）
   - 60fps 高性能渲染
   - 与 Remotion 无缝集成
6. ✅ **异步任务队列**（v1.8.0 已完成）⭐ 新增
   - BullMQ + Redis 任务队列系统
   - 视频生成、图片生成、分镜生成队列
   - SSE 实时进度推送
   - 长视频分段生成支持（30秒/段）
   - Worker 进程管理
   - 自动重试（指数退避）
   - 详见：`docs/ASYNC_TASKS.md`
7. ✅ **完整视频导出功能**（v1.8.2 已完成 P0.1）⭐ 新增
   - Remotion 渲染集成到 Export Panel
   - 实时进度追踪（SSE）
   - 多分辨率支持（720p/1080p/4K）
   - 可配置帧率（24/30/60 FPS）
   - 下载和预览功能
   - Render Worker 管理
   - 详见：`docs/VIDEO_EXPORT.md`


## 设计系统 (Design System)
**Always read DESIGN.md before making any visual or UI decisions.**

All font choices, colors, spacing, and aesthetic direction are defined in DESIGN.md.
Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match DESIGN.md.

### 核心原则
- **Industrial Minimalism**: 工业极简，功能优先
- **Cyan Accent**: 使用 `#06b6d4` (cyan) 作为主色调，not purple
- **No Glass/Neon**: 禁止使用 backdrop-filter blur 和霓虹效果
- **High Contrast**: 深色背景 + 高对比度文字
- **Instrument Serif + DM Sans**: 品牌用 serif，UI 用 sans

### 实现优先级
1. **Phase 1 (Critical)**: 更新 globals.css CSS 变量，移除 glass/neon 效果
2. **Phase 2 (High)**: 将主色调从紫色改为 cyan
3. **Phase 3 (Medium)**: Logo/品牌字体更新为 Instrument Serif
4. **Phase 4 (Low)**: 优化间距，提高信息密度

