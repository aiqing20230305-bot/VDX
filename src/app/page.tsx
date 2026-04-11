'use client'

/**
 * 超级视频Agent v3.0 - SEKO完整产品链路
 * 五个状态：Welcome → Chat → Timeline/Grid → Export
 * 三栏布局：左导航 + 中内容 + 右控制
 */
import { WorkspaceContainer } from '@/components/workspace/WorkspaceContainer'

export default function HomePage() {
  return (
    <main role="main" className="h-screen">
      <WorkspaceContainer />
    </main>
  )
}
