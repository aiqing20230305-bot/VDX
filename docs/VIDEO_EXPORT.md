# 视频导出功能文档 (v1.8.2)

**日期**: 2026-04-10  
**功能版本**: v1.8.2  
**优先级**: P0.1 Critical

## 概述

完整的视频导出功能，将 Remotion 渲染引擎集成到 Export Panel，支持实时进度追踪和下载。

## 核心特性

- ✅ **Remotion 渲染集成**：使用 Remotion 程序化渲染引擎生成高质量视频
- ✅ **BullMQ 任务队列**：异步处理渲染任务，支持长时间渲染
- ✅ **实时进度追踪**：通过 SSE (Server-Sent Events) 实时显示渲染进度
- ✅ **多分辨率支持**：720p / 1080p / 4K
- ✅ **可配置帧率**：24 FPS / 30 FPS / 60 FPS
- ✅ **下载和预览**：渲染完成后支持下载和在线预览

## 架构设计

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Export Panel   │─────>│  /api/video/     │─────>│   BullMQ Queue  │
│   (前端 UI)      │ POST │  render          │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                                                   │
         │ SSE                                              │
         │                                                   ▼
         │                                          ┌─────────────────┐
         └──────────────────────────────────────── │  Render Worker  │
           /api/tasks/progress?taskId=xxx          │  (Remotion)     │
                                                    └─────────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │  public/outputs │
                                                    │  /outputs/*.mp4 │
                                                    └─────────────────┘
```

## 文件结构

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/app/api/video/render/route.ts` | 创建渲染任务的 API 端点 |
| `src/app/api/video/download/route.ts` | 下载渲染完成视频的 API 端点 |
| `src/lib/queue/video-render-worker.ts` | Remotion 渲染 Worker |
| `docs/VIDEO_EXPORT.md` | 本文档 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/components/workspace/ExportPanel.tsx` | 集成渲染 API，使用 SSE 实时进度 |
| `scripts/start-workers.ts` | 启动 Render Worker |
| `src/lib/queue/queue-manager.ts` | 添加 engine/aspectRatio 配置 |
| `src/lib/queue/video-generation-worker.ts` | 修复导入错误，使用 runVideoPipeline |

## API 文档

### 1. 创建渲染任务

**POST** `/api/video/render`

**请求体**:
```json
{
  "projectId": "project_1234567890",
  "projectTitle": "我的视频项目",
  "frames": [
    {
      "id": "frame-1",
      "index": 0,
      "imageUrl": "/uploads/image1.png",
      "imagePrompt": "A beautiful sunset",
      "duration": 3,
      "sceneDescription": "场景描述",
      "cameraMove": "推镜"
    },
    ...
  ],
  "config": {
    "resolution": "1080p",
    "fps": 30,
    "format": "mp4",
    "quality": 80
  }
}
```

**响应**:
```json
{
  "taskId": "render_abc123",
  "queueName": "video-generation",
  "status": "created",
  "message": "Video render task created"
}
```

### 2. 订阅进度 (SSE)

**GET** `/api/tasks/progress?taskId={taskId}&queueName={queueName}`

**事件流**:

```
event: progress
data: {"progress":25,"stage":"rendering","message":"渲染进度: 25.0%"}

event: progress
data: {"progress":50,"stage":"rendering","message":"渲染进度: 50.0%"}

event: completed
data: {"videoUrl":"/outputs/remotion_abc123.mp4","fileSize":15728640,"duration":15}

event: failed
data: {"message":"渲染失败: 内存不足"}
```

### 3. 下载视频

**GET** `/api/video/download?url={encodeURIComponent(videoUrl)}`

**请求参数**:
- `url`: 视频 URL，如 `/outputs/remotion_abc123.mp4`

**响应**:
- Content-Type: `video/mp4`
- Content-Disposition: `attachment; filename="remotion_abc123.mp4"`
- 文件流

## 使用方法

### 1. 启动 Worker

在生产环境部署前，需要启动 Worker 进程：

```bash
npm run workers
```

该命令会启动两个 Worker：
- Video Generation Worker (处理 Seedance/Kling 视频生成)
- **Video Render Worker (处理 Remotion 渲染)** ⭐ 新增

### 2. 前端集成示例

```tsx
import { ExportPanel } from '@/components/workspace/ExportPanel'

function MyApp() {
  const [frames, setFrames] = useState([...])

  const handleExport = (config: ExportConfig) => {
    console.log('Export completed with config:', config)
    // 处理导出完成逻辑
  }

  return (
    <ExportPanel
      frames={frames}
      onExport={handleExport}
      onBack={() => console.log('Back to timeline')}
    />
  )
}
```

### 3. 渲染流程

1. 用户在 Export Panel 配置参数（分辨率、帧率）
2. 点击"导出视频"按钮
3. 前端调用 `/api/video/render` 创建任务
4. 前端通过 SSE 订阅 `/api/tasks/progress` 监听进度
5. Worker 调用 Remotion 渲染引擎
6. 渲染完成后，前端显示"下载"和"预览"按钮

## 配置说明

### 分辨率映射

| 用户选项 | 实际分辨率 | Aspect Ratio |
|---------|-----------|--------------|
| 720p    | 1280x720  | 16:9         |
| 1080p   | 1920x1080 | 16:9         |
| 4k      | 3840x2160 | 16:9         |

### Remotion 环境变量

```bash
# .env.local
REMOTION_CONCURRENCY=1  # 渲染并发数（默认 2，建议改为 1）
REMOTION_QUALITY=80     # JPEG 质量 0-100（默认 80）
```

### Worker 并发配置

```typescript
// video-render-worker.ts
{
  concurrency: 1,  // 渲染任务串行处理（CPU/内存密集）
  limiter: {
    max: 3,        // 每分钟最多 3 个任务
    duration: 60000
  }
}
```

## 错误处理

### 常见错误和解决方法

| 错误 | 原因 | 解决方法 |
|------|------|---------|
| `No frames to render` | 帧列表为空 | 确保传入至少 1 帧 |
| `X frames missing image URL` | 部分帧没有图片 | 等待分镜生成完成 |
| `Remotion render failed` | 渲染进程崩溃 | 检查系统资源（CPU/内存） |
| `Connection failed` | SSE 连接断开 | 检查网络，刷新页面重试 |
| `Render timeout` | 渲染超过 10 分钟 | 减少帧数或降低分辨率 |

### 重试策略

- 自动重试 3 次（指数退避：2s → 4s → 8s）
- 失败后任务状态标记为 `failed`
- 可通过 `/api/tasks/status` 查询错误详情

## 性能优化

### 渲染速度估算

| 配置 | 估计时间 | 说明 |
|------|---------|------|
| 720p @ 30fps, 5 帧 | ~30-60 秒 | 轻量级 |
| 1080p @ 30fps, 10 帧 | ~2-3 分钟 | 标准 |
| 4K @ 60fps, 10 帧 | ~5-10 分钟 | 重量级 |

### 优化建议

1. **降低并发**：REMOTION_CONCURRENCY=1（避免 OOM）
2. **分段渲染**：超过 10 帧的视频考虑分段处理
3. **质量平衡**：REMOTION_QUALITY=70~80 足够（不要设置 90+）
4. **缓存复用**：Bundle 结果可缓存（未来优化）

## 测试用例

### 基础功能测试

```bash
# 1. 创建渲染任务
curl -X POST http://localhost:3000/api/video/render \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test_project",
    "projectTitle": "测试视频",
    "frames": [
      {
        "id": "1",
        "index": 0,
        "imageUrl": "/uploads/test.png",
        "imagePrompt": "test scene",
        "duration": 3,
        "sceneDescription": "测试场景"
      }
    ],
    "config": {
      "resolution": "720p",
      "fps": 30,
      "format": "mp4",
      "quality": 80
    }
  }'

# 2. 订阅进度（浏览器中打开）
open "http://localhost:3000/api/tasks/progress?taskId=<TASK_ID>&queueName=video-generation"

# 3. 下载视频
open "http://localhost:3000/api/video/download?url=%2Foutputs%2Fremotion_xxx.mp4"
```

### 端到端测试

1. 打开 `http://localhost:3000`
2. 生成脚本和分镜（至少 3 帧）
3. 进入 Timeline 编辑器
4. 点击"导出"按钮进入 Export Panel
5. 配置参数：1080p @ 30fps
6. 点击"导出视频"
7. 等待进度条完成（约 1-2 分钟）
8. 点击"下载视频"
9. 验证视频可播放

## 监控和日志

### Worker 日志

```bash
npm run workers

# 输出示例：
[RenderWorker] Starting video render: render_abc123 测试视频
[RenderWorker] Config: { resolution: '1080p', fps: 30, frameCount: 5 }
[Remotion] 开始 Bundle...
[Remotion] Bundle 完成: /tmp/remotion-bundle
[Remotion] Composition 已选择: StoryboardVideo
[Remotion] 开始渲染...
[Remotion] 渲染进度: 50.0%
[Remotion] 渲染完成: public/outputs/remotion_abc123.mp4
[RenderWorker] Render job completed: render_abc123
```

### 队列状态查询

```typescript
import { getQueueManager, QueueName } from '@/lib/queue/queue-manager'

const manager = getQueueManager()
const stats = await manager.getQueueStats(QueueName.VIDEO_GENERATION)

console.log(stats)
// {
//   waiting: 0,
//   active: 1,     // 正在渲染
//   completed: 15,
//   failed: 2,
//   delayed: 0,
//   total: 18
// }
```

## 后续优化计划

1. **Bundle 缓存** - 避免重复 Bundle，提升速度 30%
2. **分布式渲染** - 多机并行处理，支持超长视频
3. **增量渲染** - 只重新渲染修改的帧
4. **预览加速** - 低质量快速预览（720p @ 10fps）
5. **云端渲染** - 集成 AWS Lambda / GCP Cloud Run

## 相关文档

- [Remotion 官方文档](https://www.remotion.dev/docs)
- [BullMQ 官方文档](https://docs.bullmq.io/)
- [异步任务队列系统 (ASYNC_TASKS.md)](./ASYNC_TASKS.md)
- [Remotion 程序化渲染 (REMOTION_INTEGRATION.md)](./REMOTION_INTEGRATION.md)

## 更新记录

- **v1.8.2** (2026-04-10): P0.1 完整视频导出功能上线
  - 创建渲染任务 API
  - Render Worker 集成 Remotion
  - Export Panel 实时进度追踪
  - 下载和预览功能
  - 完整文档和测试用例
