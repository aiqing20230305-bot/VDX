# Skills 重命名方案

## 命名原则

### 1. 核心流程（数字前缀 01-06）
按视频创作的实际顺序编号，清晰体现流程

### 2. 功能分类（前缀）
- 无前缀：核心流程
- `edit-`：编辑修改类
- `tool-`：工具辅助类
- `sys-`：系统优化类

### 3. 动词命名
使用动作动词，体现实际作用

---

## 重命名映射表

### 📹 核心创作流程

| 现有名称 | 新名称 | 说明 | 用途 |
|---------|--------|------|------|
| `script-generation` | `01-script-create` | 脚本创建 | 根据选题/图片生成创意脚本 |
| `storyboard` | `02-storyboard-generate` | 分镜生成 | 将脚本转为分镜图片 |
| `storyboard-composite` | `03-storyboard-overview` | 分镜概览 | 合成概览图，快速预览 |
| `video-seedance` | `04-video-seedance` | 即梦视频 | 即梦 Seedance 引擎生成 |
| `video-kling` | `05-video-kling` | 可灵视频 | 可灵 API 生成视频 |
| `video-pipeline` | `06-video-assemble` | 视频合成 | FFmpeg 拼接最终视频 |

### ✏️ 编辑修改流程

| 现有名称 | 新名称 | 说明 | 用途 |
|---------|--------|------|------|
| `storyboard-chat-edit` | `edit-storyboard-chat` | 对话式分镜编辑 | 自然语言修改分镜提示词 |
| `video-analysis` | `edit-video-recreate` | 视频二创 | 分析视频元素并改造 |

### 🛠️ 工具辅助类

| 现有名称 | 新名称 | 说明 | 用途 |
|---------|--------|------|------|
| `image-generation` | `tool-image-generate` | 图片生成 | 即梦文生图/图生图 |
| `image-analysis` | `tool-image-classify` | 图片分类 | 识别人物/产品/场景 |
| `character-style` | `tool-character-transform` | 人物风格转换 | 真人照片转动漫/CG |
| `ffmpeg-ops` | `tool-ffmpeg-process` | FFmpeg处理 | 视频裁剪/拼接/转换 |
| `style-selection` | `tool-style-selector` | 风格选择 | 选择视觉风格预设 |

### ⚙️ 系统优化类

| 现有名称 | 新名称 | 说明 | 用途 |
|---------|--------|------|------|
| `product-consistency` | `sys-product-lock` | 产品锁定 | 分析产品特征并锁定 |
| `prompt-optimization` | `sys-prompt-simplify` | 提示词简化 | 优化提示词符合规范 |
| `generation-progress` | `sys-progress-ui` | 进度界面 | 实时进度条和动效 |
| `chat-agent` | `sys-chat-orchestrator` | 聊天编排 | 意图识别和流程协调 |

---

## 重命名优势

### 1. ✅ 流程清晰
```
01 → 02 → 03 → 04/05 → 06
脚本 → 分镜 → 概览 → 视频 → 合成
```

### 2. ✅ 分类明确
- 核心流程：一眼看出创作步骤
- 编辑类：明确是修改现有内容
- 工具类：辅助功能，按需调用
- 系统类：底层优化，自动运行

### 3. ✅ 命名直观
```
create（创建）→ 强调从无到有
generate（生成）→ 强调AI生成
overview（概览）→ 强调全局预览
assemble（合成）→ 强调拼接组合
edit（编辑）→ 强调修改现有
transform（转换）→ 强调风格变化
lock（锁定）→ 强调固定特征
simplify（简化）→ 强调优化简化
orchestrator（编排器）→ 强调协调管理
```

### 4. ✅ 易于扩展
```
07-video-enhance  # 视频增强（未来）
08-audio-sync     # 音频同步（未来）
edit-frame-pick   # 帧选择编辑（未来）
tool-subtitle     # 字幕工具（未来）
sys-cache         # 缓存系统（未来）
```

---

## 执行计划

### Phase 1: 创建新目录结构
```bash
# 核心流程
mkdir -p .claude/skills/01-script-create
mkdir -p .claude/skills/02-storyboard-generate
mkdir -p .claude/skills/03-storyboard-overview
mkdir -p .claude/skills/04-video-seedance
mkdir -p .claude/skills/05-video-kling
mkdir -p .claude/skills/06-video-assemble

# 编辑类
mkdir -p .claude/skills/edit-storyboard-chat
mkdir -p .claude/skills/edit-video-recreate

# 工具类
mkdir -p .claude/skills/tool-image-generate
mkdir -p .claude/skills/tool-image-classify
mkdir -p .claude/skills/tool-character-transform
mkdir -p .claude/skills/tool-ffmpeg-process
mkdir -p .claude/skills/tool-style-selector

# 系统类
mkdir -p .claude/skills/sys-product-lock
mkdir -p .claude/skills/sys-prompt-simplify
mkdir -p .claude/skills/sys-progress-ui
mkdir -p .claude/skills/sys-chat-orchestrator
```

### Phase 2: 移动文件
```bash
# 复制 SKILL.md 并更新内容
# 每个文件需要更新：
# 1. frontmatter 中的 name
# 2. 标题
# 3. 路径引用
```

### Phase 3: 更新引用
- `CLAUDE.md` - Skills 列表
- `.claude/FEATURES_SUMMARY.md` - 功能总览
- 其他文档中的路径引用

### Phase 4: 删除旧目录
```bash
rm -rf .claude/skills/script-generation
rm -rf .claude/skills/storyboard
# ... 等等
```

---

## 文件内容更新示例

### 示例 1：核心流程 Skill

```markdown
---
name: 01-script-create
version: 1.2.0
description: |
  脚本创建。根据选题描述、参考图片、时长、比例生成多个创意脚本。
  触发场景：用户描述选题、上传参考图、要求创作脚本。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 01 - 脚本创建 Skill

## 在流程中的位置
```
→ [01 脚本] → 02 分镜 → 03 概览 → 04/05 视频 → 06 合成
```
...
```

### 示例 2：工具类 Skill

```markdown
---
name: tool-image-generate
version: 1.0.0
description: |
  图片生成工具。即梦文生图和图生图，用于分镜图、参考图、风格转换。
  触发场景：生成分镜图、转换人物风格、产品图生图。
---

# 工具 - 图片生成

## 用途
为其他流程提供图片生成能力...
```

---

## 检查清单

- [ ] 所有新目录已创建
- [ ] 所有 SKILL.md 已迁移并更新
- [ ] CLAUDE.md 已更新
- [ ] FEATURES_SUMMARY.md 已更新
- [ ] 旧目录已删除
- [ ] Build 通过测试
