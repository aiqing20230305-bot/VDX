# 超级视频Agent — 开发指南

## 项目启动
```bash
npm run dev          # http://localhost:3000
npm run build        # 生产构建
```

## 核心架构

```
src/
├── app/
│   ├── page.tsx                 # 主聊天界面
│   └── api/
│       ├── chat/route.ts        # Claude 流式对话
│       ├── script/route.ts      # 脚本生成
│       ├── storyboard/route.ts  # 分镜图生成
│       └── analyze/route.ts     # 视频分析（二创）
├── lib/
│   ├── ai/
│   │   ├── claude.ts            # Claude API 封装
│   │   ├── script-engine.ts     # 脚本生成引擎
│   │   ├── storyboard-engine.ts # 分镜图引擎
│   │   ├── analysis-engine.ts   # 视频分析 + 二创
│   │   └── chat-agent.ts        # 聊天代理 + 系统提示
│   ├── video/
│   │   ├── seedance.ts          # Seedance 2.0 API
│   │   ├── kling.ts             # 可灵 Kling API
│   │   ├── ffmpeg-utils.ts      # FFmpeg 工具
│   │   └── pipeline.ts          # 视频生成 Pipeline 编排
│   └── db/client.ts             # Prisma + LibSQL
├── components/
│   ├── chat/                    # ChatMessage, ChatInput, QuickActions
│   ├── storyboard/              # ScriptCard, StoryboardGrid
│   └── video/                   # VideoProgress
└── types/index.ts               # 所有核心类型
```

## 环境变量（.env.local）
- `ANTHROPIC_API_KEY` — Claude API
- `SEEDANCE_API_KEY` / `SEEDANCE_API_URL` — Seedance 2.0
- `KLING_API_KEY` / `KLING_API_URL` — 可灵 AI
- `REDIS_URL` — BullMQ 任务队列（可选）

## 分镜帧数规则
- 15秒 → 12帧
- 每多5秒 → 多4帧
- 公式：`frames = 12 + ceil((duration - 15) / 5) * 4`（duration > 15时）

## 待接入功能
- [ ] Remotion 程序化视频渲染
- [ ] BullMQ 异步任务队列（长视频生成）
- [ ] 图片生成（Flux/SDXL）填充分镜图
- [ ] 视频项目管理页面
- [ ] 进化模块：自动发现新路径/趋势

## 进化方向（Evolution Module）
项目设计为可持续进化。新能力发现点：
1. 多模型路由（根据风格自动选择最优生成模型）
2. 角色一致性系统（IP角色在所有帧保持一致）
3. 音频同步（歌词/节拍驱动分镜节奏）
4. 实时协作（多人同时编辑脚本和分镜）
