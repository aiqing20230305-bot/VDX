# 超级视频Agent - 产品架构全景图

## 📊 整体架构图

```mermaid
graph TB
    subgraph "用户交互层"
        USER[👤 用户]
        UI[🖥️ Next.js Web界面<br/>聊天 + 进度展示]
    end

    subgraph "AI 对话智能层（可进化）"
        CHAT[💬 Claude Chat Agent<br/>意图识别 + 流程编排 + 上下文理解]
        CONTEXT[🧠 上下文系统<br/>图片对齐 + 状态管理]
    end

    subgraph "核心创作流程（01-06）"
        S01[📝 01-script-create<br/>选题/图片 → 脚本]
        S02[🎬 02-storyboard-generate<br/>脚本 → 分镜图]
        S03[🖼️ 03-storyboard-overview<br/>分镜概览合成]
        S04[🎥 04-video-seedance<br/>即梦视频生成]
        S05[🎥 05-video-kling<br/>可灵视频生成]
        S06[🎞️ 06-video-assemble<br/>FFmpeg 拼接]
        S06A[🎬 06-video-remotion<br/>Remotion 程序化渲染<br/>⏳ 规划中]
        
        S01 --> S02 --> S03 --> S04 --> S06
        S02 --> S05 --> S06
        S04 -.-> |未来| S06A
        S05 -.-> |未来| S06A
    end

    subgraph "编辑修改流程（edit-）"
        E01[✏️ edit-storyboard-chat<br/>对话式分镜编辑]
        E02[🔄 edit-video-recreate<br/>视频分析 + 二创]
        
        E02 --> |生成脚本| S02
        E01 --> |修改分镜| S02
    end

    subgraph "辅助工具层（tool-）"
        T01[🎨 tool-image-generate<br/>即梦图片生成]
        T02[🔍 tool-image-classify<br/>图片智能分类]
        T03[👤 tool-character-transform<br/>人物风格转换]
        T04[⚙️ tool-ffmpeg-process<br/>视频处理工具]
        T05[🎭 tool-style-selector<br/>风格选择器]
    end

    subgraph "系统优化层（sys-）"
        Y01[🔒 sys-product-lock<br/>产品特征锁定]
        Y02[📏 sys-prompt-simplify<br/>提示词简化]
        Y03[📊 sys-progress-ui<br/>进度界面]
        Y04[🎯 sys-chat-orchestrator<br/>聊天编排]
    end

    subgraph "底层引擎层（稳定）"
        ENGINE_SCRIPT[🤖 script-engine.ts<br/>脚本生成引擎<br/>JSON 鲁棒性 98%+]
        ENGINE_STORY[🎬 storyboard-engine.ts<br/>分镜引擎 + 图片填充]
        ENGINE_ANALYSIS[🔍 analysis-engine.ts<br/>视频分析引擎]
        ENGINE_ASR[🎤 ASR Manager<br/>多引擎语音识别]
    end

    subgraph "外部服务层"
        CLAUDE[🧠 Claude API<br/>Opus 4.6<br/>PPIO代理]
        DREAMINA[🎨 即梦 Dreamina<br/>图片/视频生成]
        KLING[🎥 可灵 Kling<br/>视频生成]
        WHISPER[🎙️ Whisper.cpp<br/>本地语音识别<br/>Metal GPU]
        FFMPEG[🎞️ FFmpeg<br/>视频拼接<br/>当前使用]
        REMOTION[🎬 Remotion<br/>React程序化渲染<br/>⏳ 规划中]
    end

    %% 用户交互流
    USER --> UI
    UI --> CHAT
    CHAT --> CONTEXT

    %% AI 调度流程
    CHAT --> S01
    CHAT --> E02
    CONTEXT --> S02

    %% 编辑反馈流
    S02 -.-> |用户修改| E01
    
    %% 工具调用
    S02 --> T01
    S02 --> T03
    E02 --> T04
    
    %% 系统优化
    Y04 --> CHAT
    Y02 --> ENGINE_STORY
    Y01 --> ENGINE_STORY
    Y03 --> UI

    %% 引擎层
    S01 --> ENGINE_SCRIPT
    S02 --> ENGINE_STORY
    E02 --> ENGINE_ANALYSIS
    E02 --> ENGINE_ASR

    %% 外部服务
    ENGINE_SCRIPT --> CLAUDE
    ENGINE_STORY --> CLAUDE
    ENGINE_STORY --> DREAMINA
    ENGINE_ANALYSIS --> CLAUDE
    ENGINE_ASR --> WHISPER
    S04 --> DREAMINA
    S05 --> KLING
    S06 --> FFMPEG
    S06A -.-> REMOTION
    T04 --> FFMPEG

    %% 样式
    classDef coreFlow fill:#4CAF50,stroke:#2E7D32,color:#fff
    classDef editFlow fill:#FF9800,stroke:#E65100,color:#fff
    classDef toolFlow fill:#2196F3,stroke:#1565C0,color:#fff
    classDef sysFlow fill:#9C27B0,stroke:#6A1B9A,color:#fff
    classDef engineFlow fill:#607D8B,stroke:#37474F,color:#fff
    classDef serviceFlow fill:#795548,stroke:#4E342E,color:#fff

    class S01,S02,S03,S04,S05,S06 coreFlow
    class E01,E02 editFlow
    class T01,T02,T03,T04,T05 toolFlow
    class Y01,Y02,Y03,Y04 sysFlow
    class ENGINE_SCRIPT,ENGINE_STORY,ENGINE_ANALYSIS,ENGINE_ASR engineFlow
    class CLAUDE,DREAMINA,KLING,WHISPER,FFMPEG serviceFlow
```

---

## 🎯 核心创作流程详解

```mermaid
sequenceDiagram
    participant 用户
    participant Claude对话
    participant 脚本引擎
    participant 分镜引擎
    participant 即梦/可灵
    participant FFmpeg

    %% 阶段1：脚本创作
    用户->>Claude对话: 1️⃣ 输入选题或上传图片
    Note over 用户,Claude对话: 确认时长、比例
    Claude对话->>脚本引擎: 生成脚本（JSON鲁棒性98%+）
    脚本引擎-->>Claude对话: 返回2-3个脚本方案
    Claude对话-->>用户: 展示脚本，用户选择

    %% 阶段2：分镜生成
    用户->>Claude对话: 2️⃣ 确认脚本
    Claude对话->>分镜引擎: 生成分镜（text2image + image2image）
    Note over 分镜引擎: 提示词简化<br/>产品特征锁定<br/>图片填充
    分镜引擎->>即梦/可灵: 调用图片生成API
    即梦/可灵-->>分镜引擎: 返回分镜图
    分镜引擎-->>用户: 展示分镜网格

    %% 阶段3：分镜概览
    用户->>Claude对话: 3️⃣ 查看概览
    Claude对话->>FFmpeg: 合成分镜概览图
    FFmpeg-->>用户: 展示完整分镜

    %% 阶段4：视频生成
    用户->>Claude对话: 4️⃣ 生成视频
    Note over 用户,Claude对话: 可选择满意的帧
    Claude对话->>即梦/可灵: 批量生成视频片段
    即梦/可灵-->>Claude对话: 返回视频片段
    Claude对话-->>用户: 展示进度

    %% 阶段5：视频合成
    用户->>Claude对话: 5️⃣ 合成完整视频
    Claude对话->>FFmpeg: 拼接所有片段
    FFmpeg-->>用户: 输出最终视频 🎉
```

---

## 🔄 视频二创流程详解

```mermaid
sequenceDiagram
    participant 用户
    participant Claude对话
    participant 分析引擎
    participant ASR引擎
    participant Whisper.cpp
    participant FFmpeg
    participant 脚本引擎

    %% 上传视频
    用户->>Claude对话: 📤 上传原视频
    Claude对话->>分析引擎: 开始分析

    %% 画面分析
    分析引擎->>FFmpeg: 提取关键帧（每2秒1帧）
    FFmpeg-->>分析引擎: 返回20个关键帧

    %% 口播识别
    分析引擎->>FFmpeg: 提取音频MP3
    FFmpeg-->>分析引擎: 返回音频文件
    分析引擎->>ASR引擎: 转写语音
    ASR引擎->>Whisper.cpp: 本地识别（免费）
    Whisper.cpp-->>ASR引擎: 返回文字+时间轴
    ASR引擎-->>分析引擎: 返回口播内容

    %% 综合分析
    Note over 分析引擎: 画面 + 口播<br/>综合理解
    分析引擎->>Claude对话: 提取元素：<br/>角色/场景/物品/风格/情绪
    Claude对话-->>用户: 展示分析结果

    %% 用户修改
    用户->>Claude对话: 💬 描述修改意图<br/>"把猫换成狗"
    Claude对话->>分析引擎: 解析修改操作
    分析引擎->>脚本引擎: 生成二创脚本
    脚本引擎-->>Claude对话: 返回新脚本
    Claude对话-->>用户: 展示二创方案

    %% 进入标准流程
    Note over 用户,脚本引擎: 进入标准流程：<br/>分镜生成 → 视频生成
```

---

## 🧠 AI 对话智能层架构

```mermaid
graph LR
    subgraph "对话智能层（可进化）"
        INPUT[用户输入]
        
        subgraph "意图识别"
            I1[脚本生成意图?]
            I2[分镜修改意图?]
            I3[视频分析意图?]
            I4[上下文回复?]
        end
        
        subgraph "上下文管理"
            C1[waiting_image_confirmation]
            C2[waiting_style]
            C3[waiting_duration]
        end
        
        subgraph "流程编排"
            O1[调用 script-engine]
            O2[调用 storyboard-engine]
            O3[调用 analysis-engine]
            O4[修改现有分镜]
        end
        
        INPUT --> I1
        INPUT --> I2
        INPUT --> I3
        INPUT --> I4
        
        I4 --> C1
        I4 --> C2
        I4 --> C3
        
        I1 --> O1
        I2 --> O4
        I3 --> O3
        C1 --> O2
    end
    
    subgraph "底层引擎层（稳定）"
        E1[script-engine.ts]
        E2[storyboard-engine.ts]
        E3[analysis-engine.ts]
        E4[parseModificationIntent]
    end
    
    O1 --> E1
    O2 --> E2
    O3 --> E3
    O4 --> E4
```

---

## 🎨 分镜生成引擎详解

```mermaid
graph TB
    START[输入：Script脚本]
    
    subgraph "分镜生成引擎"
        PARSE[解析场景描述]
        SIMPLIFY[提示词简化<br/>sys-prompt-simplify]
        FILTER[违禁词过滤<br/>content-filter]
        LOCK[产品特征锁定<br/>sys-product-lock]
        CLASSIFY[图片分类<br/>tool-image-classify]
        
        subgraph "图片生成策略"
            TEXT2IMG[text2image<br/>纯文字生成]
            IMG2IMG[image2image<br/>参考图生成]
            CHAR_TRANS[character-transform<br/>人物转换]
        end
        
        FILL[图片填充算法<br/>空帧重试3次]
        OUTPUT[输出：完整分镜]
    end
    
    START --> PARSE
    PARSE --> SIMPLIFY
    SIMPLIFY --> FILTER
    FILTER --> LOCK
    LOCK --> CLASSIFY
    
    CLASSIFY --> |无参考图| TEXT2IMG
    CLASSIFY --> |有参考图| IMG2IMG
    CLASSIFY --> |真人照片| CHAR_TRANS
    
    TEXT2IMG --> FILL
    IMG2IMG --> FILL
    CHAR_TRANS --> FILL
    
    FILL --> OUTPUT
    
    style SIMPLIFY fill:#9C27B0,color:#fff
    style FILTER fill:#9C27B0,color:#fff
    style LOCK fill:#9C27B0,color:#fff
    style CLASSIFY fill:#2196F3,color:#fff
    style CHAR_TRANS fill:#2196F3,color:#fff
```

---

## 🎤 ASR 多引擎系统

```mermaid
graph TB
    INPUT[输入：音频文件]
    MANAGER[ASR Manager<br/>引擎管理器]
    
    subgraph "引擎优先级"
        E1[1️⃣ Whisper.cpp<br/>本地免费<br/>Metal GPU]
        E2[2️⃣ 阿里云ASR<br/>¥0.003/分<br/>快速]
        E3[3️⃣ OpenAI Whisper<br/>¥0.042/分<br/>国际]
    end
    
    CHECK1{Whisper.cpp<br/>可用?}
    CHECK2{阿里云<br/>可用?}
    CHECK3{OpenAI<br/>可用?}
    
    SUCCESS[✅ 返回转写结果<br/>+ engine名称]
    FAIL[❌ 所有引擎失败]
    
    INPUT --> MANAGER
    MANAGER --> CHECK1
    
    CHECK1 -->|✅| E1 --> SUCCESS
    CHECK1 -->|❌| CHECK2
    
    CHECK2 -->|✅| E2 --> SUCCESS
    CHECK2 -->|❌| CHECK3
    
    CHECK3 -->|✅| E3 --> SUCCESS
    CHECK3 -->|❌| FAIL
    
    style E1 fill:#4CAF50,color:#fff
    style E2 fill:#FF9800,color:#fff
    style E3 fill:#F44336,color:#fff
```

---

## 📦 技术栈总览

### 前端层
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS
- **状态**: React Hooks + Context
- **流式**: Server-Sent Events (SSE)

### AI 能力层
- **大模型**: Claude Opus 4.6 (via PPIO)
- **图片生成**: 即梦 Dreamina
- **视频生成**: 可灵 Kling + 即梦 Seedance
- **语音识别**: Whisper.cpp (Metal GPU)

### 后端引擎层
- **脚本引擎**: script-engine.ts (JSON鲁棒性98%+)
- **分镜引擎**: storyboard-engine.ts
- **分析引擎**: analysis-engine.ts (画面+口播)
- **ASR引擎**: ASR Manager (多引擎降级)

### 工具链
- **视频处理**: FFmpeg
- **数据库**: Prisma + LibSQL (Turso)
- **文件存储**: 本地 public/uploads

---

## 🎯 设计原则

### 1. 分层架构
```
用户交互层（UI）
     ↓
AI对话智能层（可进化）← 可通过对话调整
     ↓
底层引擎层（稳定）← 标准化API保护
     ↓
外部服务层（第三方）
```

### 2. 智能进化 vs 能力保护
- **对话层**：灵活进化，可通过对话改变逻辑
- **引擎层**：标准化接口，保护核心能力

### 3. 上下文理解
- 记住对话历史
- 理解用户回答是在回应之前的问题
- 图片上传先对齐理解再执行

### 4. 容错设计
- JSON 生成：9步修复策略，成功率98%+
- ASR识别：多引擎自动降级
- 分镜生成：空帧重试3次

---

## 🎬 Remotion 程序化视频渲染（规划中）

### 什么是 Remotion？

Remotion 是一个用 **React + TypeScript** 编写视频的框架，将视频渲染变成编程任务。

```typescript
// 示例：用 React 组件描述视频
<Sequence from={0} durationInFrames={90}>
  <FadeIn>
    <img src={frame1.url} />
    <AbsoluteFill>
      <h1>{script.title}</h1>
    </AbsoluteFill>
  </FadeIn>
</Sequence>
```

### 为什么需要 Remotion？

#### 当前方案（FFmpeg）的局限：
- ❌ 简单拼接，无法精细控制
- ❌ 特效需要复杂的 filter 参数
- ❌ 文字叠加、转场效果编写困难
- ❌ 无法预览，调试周期长

#### Remotion 的优势：
- ✅ **React组件化**：每个镜头是一个组件，可复用
- ✅ **精确控制**：帧级别的动画控制
- ✅ **丰富特效**：淡入淡出、缩放、平移、3D变换
- ✅ **文字动画**：TypewriterEffect、FadeIn、SlideUp
- ✅ **实时预览**：浏览器中实时查看效果
- ✅ **类型安全**：TypeScript全程类型检查
- ✅ **高质量输出**：支持4K、60fps渲染

### 技术架构图

```mermaid
graph LR
    STORYBOARD[分镜数据<br/>JSON]
    
    subgraph "Remotion 渲染引擎"
        TEMPLATE[视频模板<br/>React组件]
        COMPOSITOR[合成器<br/>Composition]
        RENDERER[渲染器<br/>FFmpeg Backend]
    end
    
    OUTPUT[最终视频<br/>MP4/WebM]
    
    STORYBOARD --> TEMPLATE
    TEMPLATE --> COMPOSITOR
    COMPOSITOR --> RENDERER
    RENDERER --> OUTPUT
    
    style TEMPLATE fill:#61DAFB,color:#000
    style COMPOSITOR fill:#61DAFB,color:#000
```

### 实现方案

#### 1. 视频模板组件
```typescript
// src/lib/video/remotion/VideoTemplate.tsx
export const VideoTemplate: React.FC<{
  storyboard: Storyboard
  style: VideoStyle
}> = ({ storyboard, style }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {storyboard.frames.map((frame, i) => (
        <Sequence
          key={i}
          from={i * fps * frame.duration}
          durationInFrames={fps * frame.duration}
        >
          <Frame frame={frame} style={style} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
```

#### 2. 镜头组件
```typescript
// 单个镜头的渲染
const Frame: React.FC<{ frame: Frame; style: VideoStyle }> = ({ frame, style }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1]) // 淡入
  
  return (
    <AbsoluteFill style={{ opacity }}>
      <Img src={frame.imageUrl} />
      {frame.cameraMove === 'zoom-in' && (
        <ZoomEffect from={1} to={1.2} />
      )}
      {frame.text && <TextOverlay text={frame.text} />}
    </AbsoluteFill>
  )
}
```

#### 3. 渲染接口
```typescript
// src/lib/video/remotion-renderer.ts
export async function renderVideo(storyboard: Storyboard) {
  const composition = await registerComposition({
    id: 'video-template',
    component: VideoTemplate,
    durationInFrames: calculateTotalFrames(storyboard),
    fps: 30,
    width: 1920,
    height: 1080,
  })
  
  const output = await renderMedia({
    composition,
    codec: 'h264',
    outputLocation: `public/outputs/${storyboard.id}.mp4`,
  })
  
  return output
}
```

### 对比：FFmpeg vs Remotion

| 维度 | FFmpeg（当前） | Remotion（未来） |
|------|----------------|------------------|
| **实现方式** | Shell命令拼接 | React组件编程 |
| **学习曲线** | 陡峭（filter语法） | 平缓（React开发者友好） |
| **预览效果** | 无法预览 | 浏览器实时预览 |
| **特效丰富度** | 有限 | 丰富（CSS/Canvas/WebGL） |
| **代码可维护性** | 低 | 高（组件化） |
| **调试难度** | 困难 | 简单（浏览器DevTools） |
| **性能** | 极快 | 较慢（但可分布式） |
| **成熟度** | 极高 | 中等 |

### 使用场景

#### FFmpeg 适用场景（保留）：
- ✅ 简单视频拼接
- ✅ 格式转换、压缩
- ✅ 音频提取、合成
- ✅ 快速处理大量视频

#### Remotion 适用场景（新增）：
- ✅ 精美片头/片尾
- ✅ 文字动画、字幕
- ✅ 复杂转场效果
- ✅ 数据可视化视频
- ✅ 模板化批量生成

### 集成路线图

#### Phase 1: 基础集成（2周）
- [ ] 安装 Remotion 依赖
- [ ] 创建基础视频模板
- [ ] 实现简单的镜头拼接
- [ ] 添加淡入淡出转场

#### Phase 2: 特效增强（4周）
- [ ] 实现 10+ 转场特效
- [ ] 添加文字动画系统
- [ ] 支持缩放、平移、旋转
- [ ] 音频同步

#### Phase 3: 模板系统（6周）
- [ ] 多风格视频模板
- [ ] 用户自定义模板
- [ ] 模板市场

#### Phase 4: 性能优化（8周）
- [ ] 服务端渲染
- [ ] 分布式渲染
- [ ] 渲染缓存

### 技术挑战

1. **渲染性能**：Remotion比FFmpeg慢，需要优化
2. **服务器部署**：需要无头浏览器环境（Puppeteer）
3. **成本控制**：渲染资源消耗较大
4. **兼容性**：需要与现有FFmpeg方案共存

### 预期收益

- 📈 **用户满意度** +30%（更丰富的视频效果）
- ⚡ **开发效率** +50%（组件化开发）
- 🎨 **视频质量** +40%（专业级特效）
- 🔧 **可维护性** +60%（代码结构清晰）

---

## 📈 关键指标

| 指标 | 当前状态 | 目标 |
|------|----------|------|
| JSON生成成功率 | 98%+ | 99%+ |
| 分镜生成成功率 | 95%+ | 98%+ |
| ASR识别准确率 | 95%+ | 97%+ |
| 视频生成成功率 | 90%+ | 95%+ |
| 端到端完成率 | 85%+ | 90%+ |

---

## 🚀 迭代方向

### 短期（1-2周）
1. 完善阿里云ASR引擎
2. 优化分镜生成速度
3. 添加ASR结果缓存
4. 实测完整视频二创流程

### 中期（1-2月）
1. 多模型路由（根据风格自动选择生成模型）
2. 角色一致性系统（IP角色保持一致）
3. 音频同步（歌词/节拍驱动分镜）
4. 异步任务队列（BullMQ）

### 长期（3-6月）
1. Remotion程序化视频渲染
2. 批量视频处理
3. 视频质量自动评分
4. GPU加速优化

---

**此架构图将作为项目的北极星，指导所有后续开发决策。**
