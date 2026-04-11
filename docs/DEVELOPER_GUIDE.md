# 超级视频Agent 开发者指南

**版本**: v1.11.0  
**更新日期**: 2026-04-10

---

## 目录

1. [项目架构](#项目架构)
2. [技术栈](#技术栈)
3. [本地开发](#本地开发)
4. [代码规范](#代码规范)
5. [测试指南](#测试指南)
6. [部署流程](#部署流程)
7. [贡献指南](#贡献指南)

---

## 项目架构

### 整体架构

```
超级视频Agent (Next.js App Router)
├── 前端 (React 18 + TypeScript)
│   ├── UI 组件 (Tailwind CSS)
│   ├── 状态管理 (React Hooks + localStorage)
│   └── 路由 (App Router)
│
├── API 层 (Next.js API Routes)
│   ├── /api/chat (Claude 流式对话)
│   ├── /api/script (脚本生成)
│   ├── /api/storyboard (分镜生成)
│   ├── /api/analyze (视频分析)
│   └── /api/usage (用量统计)
│
├── AI 引擎
│   ├── Claude API (Anthropic SDK)
│   ├── 即梦 Dreamina (图片生成)
│   ├── Seedance (视频生成)
│   └── Kling (视频生成)
│
├── 视频处理
│   ├── Remotion (程序化视频渲染)
│   ├── FFmpeg (视频合成)
│   └── ASR (字幕生成)
│
└── 任务队列
    ├── BullMQ (任务调度)
    ├── Redis (队列存储)
    └── SSE (实时进度推送)
```

### 目录结构

```
超级视频/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx         # 主页面（WorkspaceContainer）
│   │   ├── layout.tsx       # 全局布局
│   │   ├── globals.css      # 全局样式
│   │   └── api/             # API Routes
│   │       ├── chat/        # 聊天接口
│   │       ├── script/      # 脚本生成
│   │       ├── storyboard/  # 分镜生成
│   │       ├── analyze/     # 视频分析
│   │       └── usage/       # 用量统计
│   │
│   ├── components/          # React 组件
│   │   ├── workspace/       # 工作区组件
│   │   │   ├── WelcomeHero.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── TimelineEditor.tsx
│   │   │   ├── GridBrowser.tsx
│   │   │   └── ExportPanel.tsx
│   │   ├── ui/              # UI 基础组件
│   │   ├── onboarding/      # 用户引导
│   │   └── common/          # 公共组件
│   │
│   ├── lib/                 # 核心逻辑库
│   │   ├── ai/              # AI 引擎
│   │   │   ├── claude.ts    # Claude API 封装
│   │   │   ├── script-engine.ts
│   │   │   ├── storyboard-engine.ts
│   │   │   └── chat-agent.ts
│   │   ├── video/           # 视频处理
│   │   │   ├── seedance.ts
│   │   │   ├── kling.ts
│   │   │   ├── dreamina-image.ts
│   │   │   ├── ffmpeg-utils.ts
│   │   │   └── remotion-pipeline.ts
│   │   ├── storage/         # 数据持久化
│   │   │   ├── projects.ts
│   │   │   └── version-history.ts
│   │   └── utils/           # 工具函数
│   │
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── hooks/               # 自定义 Hooks
│   │   └── useKeyboardShortcuts.ts
│   │
│   └── contexts/            # React Contexts
│       └── ToastContext.tsx
│
├── public/                  # 静态资源
│   └── uploads/            # 上传文件
│
├── docs/                    # 文档
│   ├── USER_GUIDE.md
│   ├── API.md
│   ├── DEVELOPER_GUIDE.md
│   └── FAQ.md
│
├── scripts/                 # 脚本工具
│   └── token-monitor.ts
│
└── package.json
```

---

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.2.2 (Turbopack) | React 全栈框架 |
| **React** | 18.x | UI 框架 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 3.x | 样式系统 |

### AI 和媒体处理

| 技术 | 用途 |
|------|------|
| **Claude API** (Anthropic) | 对话和脚本生成 |
| **即梦 Dreamina** | 图片生成 |
| **Seedance** | 视频生成 |
| **Kling** | 视频生成（备用） |
| **Remotion** | 程序化视频渲染 |
| **FFmpeg** | 视频合成和处理 |
| **Whisper.cpp** | ASR 语音识别 |

### 任务队列和存储

| 技术 | 用途 |
|------|------|
| **BullMQ** | 任务队列 |
| **Redis** | 队列存储 |
| **localStorage** | 前端持久化 |
| **Prisma + LibSQL** | 数据库（可选） |

### 开发工具

| 工具 | 用途 |
|------|------|
| **ESLint** | 代码检查 |
| **Prettier** | 代码格式化 |
| **Husky** | Git Hooks |
| **Jest** | 单元测试 |

---

## 本地开发

### 环境要求

- **Node.js** ≥ 20.x
- **npm** ≥ 10.x
- **Redis** ≥ 7.x（可选，用于任务队列）
- **FFmpeg** ≥ 6.x（可选，用于视频处理）
- **Whisper.cpp**（可选，用于 ASR）

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-org/super-video-agent.git
cd super-video-agent

# 安装依赖
npm install

# 安装 FFmpeg (macOS)
brew install ffmpeg

# 安装 Whisper.cpp (macOS)
brew install whisper-cpp

# 安装 Redis (macOS)
brew install redis
brew services start redis
```

### 配置环境变量

创建 `.env.local` 文件：

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 或 PPIO 代理地址

# 即梦 Dreamina
JIMENG_API_TOKEN=your-sessionid

# 可灵 Kling (可选)
KLING_ACCESS_KEY=your-access-key
KLING_SECRET_KEY=your-secret-key
KLING_API_URL=https://api-beijing.klingai.com

# ASR 配置
ASR_ENGINES=whisper-cpp,openai
WHISPER_CPP_MODEL=medium
OPENAI_API_KEY=sk-...  # 备用

# Remotion 配置
REMOTION_ENABLE=false
REMOTION_CONCURRENCY=2
REMOTION_QUALITY=80

# Redis (可选)
REDIS_URL=redis://localhost:6379
```

### 启动开发服务器

```bash
# 启动 Next.js 开发服务器
npm run dev

# 在新终端启动 Worker（如果使用任务队列）
npm run worker

# 在新终端启动 Redis（如果未自动启动）
redis-server
```

访问 `http://localhost:3000` 查看应用。

### 开发模式特性

- **Hot Module Replacement (HMR)**：代码修改后自动刷新
- **Fast Refresh**：React 组件状态保留
- **TypeScript 类型检查**：实时类型错误提示
- **Turbopack**：极速构建（Next.js 16+）

---

## 代码规范

### TypeScript 风格

**使用接口（Interface）而非类型别名（Type）**：

```typescript
// ✅ 推荐
interface Frame {
  id: string
  imageUrl: string
  duration: number
}

// ❌ 避免（除非需要联合类型）
type Frame = {
  id: string
  imageUrl: string
  duration: number
}
```

**严格类型检查**：

```typescript
// ✅ 推荐
function updateFrame(frame: Frame): Frame {
  return { ...frame, duration: 5 }
}

// ❌ 避免
function updateFrame(frame: any): any {
  return { ...frame, duration: 5 }
}
```

### React 组件规范

**函数组件 + Hooks**：

```typescript
// ✅ 推荐
export function TimelineEditor({ frames, onFrameUpdate }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return <div>...</div>
}

// ❌ 避免类组件
export class TimelineEditor extends React.Component<Props> {
  // ...
}
```

**Props 类型定义**：

```typescript
// ✅ 推荐
interface TimelineEditorProps {
  frames: Frame[]
  selectedFrameId: string | null
  onFrameUpdate: (id: string, updates: Partial<Frame>) => void
}

// ❌ 避免
type Props = {
  frames: any[]
  selectedFrameId?: string
  onFrameUpdate?: Function
}
```

### 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `TimelineEditor.tsx` |
| Hook | camelCase + use 前缀 | `useKeyboardShortcuts.ts` |
| 工具函数 | camelCase | `formatDuration.ts` |
| API 路由 | kebab-case | `api/storyboard/route.ts` |
| 类型定义 | PascalCase | `types/Frame.ts` |

### 注释规范

**文件头注释**：

```typescript
/**
 * TimelineEditor - 时间轴编辑器
 * 
 * 功能：
 * - 拖拽重排场景
 * - 内联编辑时长和描述
 * - 批量操作（多选/删除）
 */
```

**函数注释**：

```typescript
/**
 * 生成分镜图片
 * @param script - 脚本对象
 * @param options - 生成选项
 * @returns 分镜帧数组
 */
export async function generateStoryboard(
  script: Script,
  options: StoryboardOptions
): Promise<Frame[]> {
  // ...
}
```

---

## 测试指南

### 单元测试

使用 Jest + React Testing Library：

```bash
# 运行所有测试
npm test

# 运行单个测试文件
npm test TimelineEditor.test.tsx

# 监听模式
npm test --watch

# 生成覆盖率报告
npm test --coverage
```

**示例测试**：

```typescript
import { render, fireEvent } from '@testing-library/react'
import { TimelineEditor } from './TimelineEditor'

describe('TimelineEditor', () => {
  it('should render frames', () => {
    const frames = [
      { id: '1', imageUrl: 'test.jpg', duration: 3 }
    ]
    const { getByText } = render(<TimelineEditor frames={frames} />)
    expect(getByText('3秒')).toBeInTheDocument()
  })

  it('should select frame on click', () => {
    const onFrameSelect = jest.fn()
    const { getByTestId } = render(
      <TimelineEditor 
        frames={frames} 
        onFrameSelect={onFrameSelect} 
      />
    )
    fireEvent.click(getByTestId('frame-1'))
    expect(onFrameSelect).toHaveBeenCalledWith('1')
  })
})
```

### E2E 测试

使用 Playwright（即将支持）：

```bash
# 安装 Playwright
npx playwright install

# 运行 E2E 测试
npm run test:e2e
```

---

## 部署流程

### 构建生产版本

```bash
# 生产构建
npm run build

# 启动生产服务器
npm run start
```

### Docker 部署（推荐）

```bash
# 构建镜像
docker build -t super-video-agent .

# 运行容器
docker run -p 3000:3000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e JIMENG_API_TOKEN=... \
  super-video-agent
```

**Dockerfile**：

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Vercel 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产部署
vercel --prod
```

---

## 贡献指南

### 提交代码流程

1. **Fork 仓库**
2. **创建功能分支**：
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **提交代码**：
   ```bash
   git commit -m "feat: add new feature"
   ```
4. **推送分支**：
   ```bash
   git push origin feature/your-feature-name
   ```
5. **创建 Pull Request**

### Commit 消息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试相关
chore:    构建/工具配置

# 示例
feat(timeline): add drag-and-drop reordering
fix(api): handle rate limit errors correctly
docs(readme): update installation instructions
```

### 代码审查清单

- [ ] TypeScript 类型完整无 `any`
- [ ] 组件有合理的 Props 验证
- [ ] 函数有 JSDoc 注释
- [ ] 添加了必要的测试
- [ ] 遵循项目代码规范
- [ ] 无明显性能问题
- [ ] 无 console.log 或调试代码

---

## 常见开发问题

### 问题 1：HMR 不生效

**原因**：文件路径别名配置问题

**解决**：检查 `tsconfig.json` 中的 `paths` 配置：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

### 问题 2：TypeScript 类型错误

**原因**：未安装类型定义包

**解决**：
```bash
npm install --save-dev @types/node @types/react @types/react-dom
```

---

### 问题 3：API 请求跨域

**原因**：本地开发时前后端端口不同

**解决**：在 `next.config.js` 中配置代理：

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
}
```

---

## 联系方式

**技术讨论**: dev@tezign.com  
**Bug 反馈**: https://github.com/your-org/super-video-agent/issues  
**贡献指南**: https://github.com/your-org/super-video-agent/blob/main/CONTRIBUTING.md

---

**更新日期**: 2026-04-10  
**文档版本**: v1.0.0
