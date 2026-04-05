---
name: sys-progress-ui
version: 1.0.0
description: |
  生成进度展示。实时进度条、阶段动效、预估剩余时间、帧计数器。
  用于所有长时间生成任务的用户体验优化。
allowed-tools:
  - Read
  - Edit
  - Write
---

# 生成进度展示

## 阶段

| 阶段 | emoji | 预估时间 |
|------|-------|----------|
| analyzing | 🔍 | 5s |
| scripting | 📝 | 15s |
| storyboarding | 🎬 | 10s |
| generating_images | 🖼️ | 60s |
| generating_video | 🎥 | 120s |
| compositing | 🔧 | 10s |

## 进度计算

1. 有 current/total → `(current / total) * 100%`
2. 无帧数 → 基于估计时间渐进式进度（最多到 95%，永不到 100%）
3. 剩余时间 = 已用时间 / 已完成比例 × 剩余比例

## 视觉效果

- 进度条：violet-to-blue 渐变
- Shimmer 光效：白色光带循环滑动
- 阶段切换：emoji 旋转动画
- 实时计时器

## 使用方式

消息的 `metadata.generation` 字段：
```ts
{ stage: 'scripting', startedAt: Date.now() }
{ stage: 'generating_images', current: 3, total: 9, startedAt: Date.now() }
{ stage: 'done' }
{ stage: 'error', detail: '错误信息' }
```

## 关键代码

- 组件: `src/components/chat/GenerationProgress.tsx`
- CSS: `src/app/globals.css` (shimmer animation)

## 迭代记录

- v1.0.0: 6阶段进度条 + shimmer + 预估时间 + 帧计数
