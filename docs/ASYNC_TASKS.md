# 异步任务队列系统

基于 BullMQ 的异步任务处理系统，支持长视频生成和后台任务处理。

## 架构

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  前端 UI    │─────>│  API Routes  │─────>│   BullMQ    │
│             │<─────│              │<─────│   Queue     │
└─────────────┘ SSE  └──────────────┘      └─────────────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │   Worker    │
                                            │  (后台进程)  │
                                            └─────────────┘
```

## 快速开始

### 1. 启动 Redis（开发环境）

```bash
# 使用 Docker
docker run -d -p 6379:6379 redis:alpine

# 或使用 Homebrew
brew install redis
brew services start redis
```

### 2. 启动 Worker

```bash
npm run workers
```

### 3. 启动开发服务器

```bash
npm run dev
```

## 使用方法

### 前端：创建任务

```tsx
import { useAsyncTask } from '@/hooks/useAsyncTask'

function VideoGenerator() {
  const {
    taskId,
    status,
    progress,
    result,
    error,
    createTask,
  } = useAsyncTask()

  const handleGenerate = async () => {
    await createTask({
      type: 'video',
      data: {
        storyboardId: 'xxx',
        config: {
          resolution: '1080p',
          fps: 30,
        },
      },
    })
  }

  return (
    <div>
      <button onClick={handleGenerate}>生成视频</button>
      <TaskProgressBar
        status={status}
        progress={progress}
        error={error}
      />
    </div>
  )
}
```

### API：创建任务

**POST /api/tasks/create**

```json
{
  "type": "video",
  "data": {
    "storyboardId": "xxx",
    "config": {
      "resolution": "1080p",
      "fps": 30
    }
  },
  "priority": 5
}
```

**Response:**

```json
{
  "taskId": "1234",
  "queueName": "video-generation",
  "status": "created"
}
```

### API：查询任务状态

**GET /api/tasks/status?taskId=xxx&queueName=video-generation**

**Response:**

```json
{
  "id": "1234",
  "status": "active",
  "progress": {
    "progress": 45,
    "stage": "generating_clips",
    "message": "生成第 3/10 个片段",
    "currentStep": 3,
    "totalSteps": 10
  }
}
```

### API：订阅任务进度（SSE）

```typescript
const eventSource = new EventSource('/api/tasks/progress?taskId=xxx&queueName=video-generation')

eventSource.addEventListener('progress', (e) => {
  const progress = JSON.parse(e.data)
  console.log(progress.progress) // 0-100
})

eventSource.addEventListener('completed', (e) => {
  const result = JSON.parse(e.data)
  console.log('完成:', result.videoUrl)
})

eventSource.addEventListener('failed', (e) => {
  const { error } = JSON.parse(e.data)
  console.error('失败:', error)
})
```

## 队列类型

| 队列名称 | 用途 | 优先级 | 并发数 |
|---------|------|--------|--------|
| `video-generation` | 视频生成 | 高 | 2 |
| `image-generation` | 图片生成 | 中 | 5 |
| `storyboard` | 分镜生成 | 中 | 3 |

## 任务状态

| 状态 | 说明 |
|------|------|
| `waiting` | 等待处理 |
| `active` | 正在处理 |
| `completed` | 已完成 |
| `failed` | 失败 |
| `delayed` | 延迟执行 |

## 环境变量

```bash
# .env.local
REDIS_URL=redis://localhost:6379
```

## 长视频支持

对于超过 5 分钟的长视频，系统会：

1. **自动分段**：每段 30 秒
2. **并行生成**：多个片段同时处理
3. **后台合成**：完成后自动合成
4. **进度推送**：实时显示每段进度

```typescript
await createTask({
  type: 'video',
  data: {
    storyboardId: 'xxx',
    segments: 10, // 10 段 = 5 分钟
    config: {
      resolution: '1080p',
      fps: 30,
    },
  },
})
```

## Worker 管理

### 查看队列状态

```typescript
import { getQueueManager, QueueName } from '@/lib/queue/queue-manager'

const manager = getQueueManager()
const stats = await manager.getQueueStats(QueueName.VIDEO_GENERATION)

console.log(stats)
// {
//   waiting: 2,
//   active: 1,
//   completed: 15,
//   failed: 0,
//   delayed: 0,
//   total: 18
// }
```

### 取消任务

```typescript
await manager.cancelTask(QueueName.VIDEO_GENERATION, 'taskId')
```

## 错误处理

任务失败会自动重试 3 次（指数退避策略）：

- 第 1 次失败：2 秒后重试
- 第 2 次失败：4 秒后重试
- 第 3 次失败：8 秒后重试
- 3 次后：标记为 `failed`

## 监控和日志

```bash
# Worker 日志
npm run workers

# 输出示例：
[VideoWorker] Starting video generation: 1234 xxx
[VideoWorker] Job 1234 completed
```

## 生产环境部署

### 1. 配置持久化 Redis

```bash
# .env.production
REDIS_URL=redis://production-redis:6379
```

### 2. 启动多个 Worker 实例

```bash
# 使用 PM2 管理进程
pm2 start npm --name "worker-1" -- run workers
pm2 start npm --name "worker-2" -- run workers
```

### 3. 配置监控

使用 BullMQ Dashboard 或自定义监控：

```typescript
import { Queue } from 'bullmq'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

const serverAdapter = new ExpressAdapter()
createBullBoard({
  queues: [new BullMQAdapter(queue)],
  serverAdapter,
})

app.use('/admin/queues', serverAdapter.getRouter())
```

## 性能优化

1. **批量处理**：合并小任务
2. **优先级队列**：紧急任务优先
3. **限流控制**：避免 API 限流
4. **资源池**：复用 FFmpeg/Chromium 进程

## 故障排查

### Worker 无法启动

```bash
# 检查 Redis 连接
redis-cli ping
# 应返回: PONG

# 检查端口占用
lsof -i :6379
```

### 任务卡住不动

```bash
# 查看活跃任务
redis-cli KEYS bull:video-generation:*
```

### 内存泄漏

```bash
# 限制完成任务保留数量
defaultJobOptions: {
  removeOnComplete: 100,
  removeOnFail: 500,
}
```

## 扩展

### 添加新队列类型

1. 在 `QueueName` 枚举中添加新类型
2. 创建对应的 Worker 文件
3. 在 `start-workers.ts` 中启动 Worker

### 自定义任务数据

```typescript
export interface CustomTaskData {
  // 你的任务数据
}

await createTask({
  type: 'custom',
  data: { ... } as CustomTaskData,
})
```

## 相关文档

- [BullMQ 官方文档](https://docs.bullmq.io/)
- [Redis 配置指南](https://redis.io/docs/manual/config/)
- [视频生成 Pipeline](/docs/VIDEO_PIPELINE.md)
