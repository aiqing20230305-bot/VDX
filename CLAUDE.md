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

## 进化方向

1. 多模型路由（根据风格自动选择最优生成模型）
2. 角色一致性系统（IP 角色在所有帧保持一致）
3. 音频同步（歌词/节拍驱动分镜节奏）
4. ✅ **Remotion 程序化视频渲染**（v1.3.0 已完成 Phase 3 大部分）
   - Phase 1: React 组件描述视频、基础转场
   - Phase 2: 5 种转场效果（fade/slide/zoom/rotate/wipe）
   - Phase 3: 字幕系统 + 标题动画系统
     - 字幕：时间轴同步/多轨道/SRT 格式/淡入淡出
     - 标题：6 种动画/进入退出/打字机效果
   - 7 种缓动函数、GPU 加速
   - 与 FFmpeg/Seedance/Kling 并存
5. ✅ **Pretext 精确文字动画**（v1.2.0 已完成 Phase 1）⭐ 新增
   - 流体文字、粒子文字、ASCII 艺术
   - 字符级精确控制（@chenglou/pretext）
   - 60fps 高性能渲染
   - 与 Remotion 无缝集成
6. 异步任务队列（BullMQ，长视频）
