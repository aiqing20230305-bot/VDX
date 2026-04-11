/**
 * Workspace Container - 主工作区状态管理（集成项目持久化）
 * 整合所有视图：Welcome → Chat → Timeline/Grid → Export
 */
'use client'

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
// import { AnimatePresence, motion } from 'framer-motion' // 已移除：不再使用动画以提升性能
import { WorkspaceLayout } from './WorkspaceLayout'
import { WelcomeHero } from './WelcomeHero'
import { ProjectSidebar } from './ProjectSidebar'
import { WorkflowProgress } from '@/components/progress/WorkflowProgress'
import type { WorkspaceState, ViewMode, Frame, Project } from '@/types/workspace'
import type { SubtitleTrack } from '@/types'
import * as ProjectStorage from '@/lib/storage/projects'
import { templateToFrames } from '@/lib/templates'
import type { VideoTemplate } from '@/lib/templates'
import { getFeaturedItems } from '@/lib/inspiration-gallery'
import * as VersionHistory from '@/lib/storage/version-history'
import { useToast } from '@/contexts/ToastContext'
import { Loader2 } from './icons'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsButton } from '@/components/common/KeyboardShortcutsHelp'
import { OnboardingTour, useOnboarding } from '@/components/onboarding/OnboardingTour'
import { workflowTourSteps, timelineTourSteps } from '@/components/onboarding/WelcomeOnboarding'
import { logger } from '@/lib/utils/logger'
import type { FlowStage } from './ChatPanel'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileNavBar } from '@/components/mobile/MobileNavBar'

// 动态导入大型组件，按需加载（非首屏）
const ChatPanel = lazy(() => import('./ChatPanel').then(m => ({ default: m.ChatPanel })))
const TimelineEditor = lazy(() => import('./TimelineEditor').then(m => ({ default: m.TimelineEditor })))
const GridBrowser = lazy(() => import('./GridBrowser').then(m => ({ default: m.GridBrowser })))
const ExportPanel = lazy(() => import('./ExportPanel').then(m => ({ default: m.ExportPanel })))
const VersionHistoryPanel = lazy(() => import('./VersionHistoryPanel').then(m => ({ default: m.VersionHistoryPanel })))
const PreviewModal = lazy(() => import('./PreviewModal').then(m => ({ default: m.PreviewModal })))

// 加载中占位组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      <p className="text-sm text-zinc-500">加载中...</p>
    </div>
  </div>
)

export function WorkspaceContainer() {
  const [state, setState] = useState<WorkspaceState>('welcome')
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null)
  const [selectedFrameIds, setSelectedFrameIds] = useState<string[]>([])
  const [initialQuery, setInitialQuery] = useState<string>('')
  const [projects, setProjects] = useState<ProjectStorage.StoredProject[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([])
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const toast = useToast()

  // Onboarding tours for different states
  const [showChatOnboarding, setShowChatOnboarding] = useState(false)
  const [showTimelineOnboarding, setShowTimelineOnboarding] = useState(false)

  // FlowStage 追踪（用于精确的workflow步骤显示）
  const [flowStage, setFlowStage] = useState<FlowStage>(null)

  // 移动端检测
  const isMobile = useIsMobile()

  // 初始化：加载项目列表和当前项目
  useEffect(() => {
    const allProjects = ProjectStorage.getAllProjects()
    setProjects(allProjects)

    const currentProjectId = ProjectStorage.getCurrentProjectId()
    if (currentProjectId) {
      const project = ProjectStorage.getProject(currentProjectId)
      if (project) {
        setCurrentProject(project)
        setFrames(project.frames)
        if (project.frames.length > 0) {
          setState('timeline')
          setSelectedFrameId(project.frames[0].id)
        }
      }
    }
  }, [])

  // 自动保存：frames 变化时延迟保存
  useEffect(() => {
    if (!currentProject || frames.length === 0) return

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 1秒后保存（防抖）
    autoSaveTimerRef.current = setTimeout(() => {
      ProjectStorage.autoSaveProject(currentProject.id, frames)
      logger.debug('[AutoSave] Project saved:', currentProject.id)
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [frames, currentProject])

  // 监听导出事件
  useEffect(() => {
    const handleExport = () => {
      if (frames.length > 0) {
        setState('export')
      } else {
        alert('请先生成分镜图')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('workspace:export', handleExport)
      return () => window.removeEventListener('workspace:export', handleExport)
    }
  }, [frames])

  // 状态变化时触发对应的引导
  useEffect(() => {
    // 延迟显示引导，确保 DOM 已渲染
    const timer = setTimeout(() => {
      if (state === 'chat' && !localStorage.getItem('chat-onboarding-completed')) {
        setShowChatOnboarding(true)
      } else if (state === 'timeline' && !localStorage.getItem('timeline-onboarding-completed')) {
        setShowTimelineOnboarding(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [state])

  const handleCompleteChatOnboarding = () => {
    localStorage.setItem('chat-onboarding-completed', 'true')
    setShowChatOnboarding(false)
  }

  const handleSkipChatOnboarding = () => {
    localStorage.setItem('chat-onboarding-completed', 'true')
    setShowChatOnboarding(false)
  }

  const handleCompleteTimelineOnboarding = () => {
    localStorage.setItem('timeline-onboarding-completed', 'true')
    setShowTimelineOnboarding(false)
  }

  const handleSkipTimelineOnboarding = () => {
    localStorage.setItem('timeline-onboarding-completed', 'true')
    setShowTimelineOnboarding(false)
  }

  // Welcome → Chat
  const handleStartProject = useCallback((query: string) => {
    // 创建新项目
    const newProject = ProjectStorage.createProject({
      title: query || '新项目',
    })
    setCurrentProject(newProject)
    setFrames([])
    setProjects(ProjectStorage.getAllProjects())

    setInitialQuery(query)
    setState('chat')
  }, [])

  // Welcome → Timeline（从模板开始）
  const handleStartFromTemplate = useCallback((template: VideoTemplate) => {
    // 将模板转换为实际帧
    const templateFrames = templateToFrames(template)

    // 创建新项目
    const newProject = ProjectStorage.createProject({
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      frames: templateFrames,
    })

    setCurrentProject(newProject)
    setFrames(templateFrames)
    setProjects(ProjectStorage.getAllProjects())

    // 直接跳转到 Timeline 编辑
    if (templateFrames.length > 0) {
      setSelectedFrameId(templateFrames[0].id)
      setState('timeline')
    }
  }, [])

  // FlowStage 回调（从 ChatPanel 接收）
  const handleFlowStageChange = useCallback((stage: FlowStage) => {
    setFlowStage(stage)
  }, [])

  // Chat → Timeline/Grid
  const handleGenerationComplete = useCallback((generatedFrames: Frame[]) => {
    setFrames(generatedFrames)
    if (generatedFrames.length > 0) {
      setSelectedFrameId(generatedFrames[0].id)
    }
    setState('timeline')
  }, [])

  // Frame 操作
  const handleFrameSelect = useCallback((frameId: string, multi = false) => {
    if (multi) {
      setSelectedFrameIds(prev =>
        prev.includes(frameId)
          ? prev.filter(id => id !== frameId)
          : [...prev, frameId]
      )
    } else {
      setSelectedFrameId(frameId)
      setSelectedFrameIds([frameId])
    }
  }, [])

  const handleFrameAdd = useCallback(() => {
    const newFrame: Frame = {
      id: `frame-new-${Date.now()}`,
      index: frames.length,
      imagePrompt: '新场景（待编辑）',
      sceneDescription: '点击编辑场景描述...',
      duration: 3,
      cameraMove: '静止',
      imageUrl: 'https://placehold.co/1920x1080/3b82f6/ffffff?text=New+Scene',
    }
    setFrames(prev => [...prev, newFrame])
    setSelectedFrameId(newFrame.id)
  }, [frames])

  const handleFrameDelete = useCallback((frameId: string) => {
    // 保存快照
    if (currentProject) {
      VersionHistory.saveSnapshot(
        currentProject.id,
        frames,
        `删除场景 #${frames.findIndex(f => f.id === frameId) + 1}`,
        'delete'
      )
    }

    const frameIndex = frames.findIndex(f => f.id === frameId)
    const newFrames = frames.filter(f => f.id !== frameId)

    setFrames(newFrames.map((f, i) => ({ ...f, index: i })))

    // 选择删除帧的前一个或后一个
    if (newFrames.length > 0) {
      const nextIndex = Math.min(frameIndex, newFrames.length - 1)
      setSelectedFrameId(newFrames[nextIndex].id)
    } else {
      setSelectedFrameId(null)
    }
  }, [frames, currentProject])

  const handleFrameDuplicate = useCallback((frameId: string) => {
    const frame = frames.find(f => f.id === frameId)
    if (!frame) return

    const newFrame: Frame = {
      ...frame,
      id: `${frame.id}-copy-${Date.now()}`,
      index: frames.length,
    }
    setFrames(prev => [...prev, newFrame])
  }, [frames])

  const handleFrameReorder = useCallback((fromIndex: number, toIndex: number) => {
    // 保存快照
    if (currentProject) {
      VersionHistory.saveSnapshot(
        currentProject.id,
        frames,
        `重排场景 #${fromIndex + 1} → #${toIndex + 1}`,
        'reorder'
      )
    }

    setFrames(prev => {
      const newFrames = [...prev]
      const [moved] = newFrames.splice(fromIndex, 1)
      newFrames.splice(toIndex, 0, moved)
      return newFrames.map((f, i) => ({ ...f, index: i }))
    })
  }, [frames, currentProject])

  const handleFrameUpdate = useCallback((frameId: string, updates: Partial<Frame>) => {
    setFrames(prev => prev.map(f =>
      f.id === frameId ? { ...f, ...updates } : f
    ))
  }, [])

  const handleBatchDelete = useCallback((frameIds: string[]) => {
    // 保存快照
    if (currentProject) {
      VersionHistory.saveSnapshot(
        currentProject.id,
        frames,
        `批量删除 ${frameIds.length} 个场景`,
        'batch_delete'
      )
    }

    setFrames(prev => {
      const newFrames = prev.filter(f => !frameIds.includes(f.id))
      return newFrames.map((f, i) => ({ ...f, index: i }))
    })
    // 清空选中状态
    setSelectedFrameIds([])
    setSelectedFrameId(null)
  }, [frames, currentProject])

  // 生成字幕
  const handleGenerateSubtitles = useCallback(async () => {
    if (!currentProject) {
      toast.showWarning('无法生成字幕', '请先创建项目')
      return
    }

    // 检查是否有导出的视频或音频
    // 注意：实际应用中，用户应该先上传音频或指定视频路径
    // 这里简化为演示，实际需要弹出对话框让用户选择音频源

    toast.showInfo('字幕生成', '请从导出面板选择音频源，然后生成字幕')

    /**
     * Audio Source Selection Dialog Implementation
     *
     * 功能: 让用户选择音频源以生成自动字幕
     *
     * 实现建议:
     * 1. 对话框选项:
     *    - 上传音频文件（MP3/WAV/M4A）
     *    - 使用当前项目的视频音轨
     *    - 使用配乐音频（如果已添加）
     *    - 从导出视频提取音轨
     *
     * 2. UI 设计:
     *    - 使用 Dialog 或 Modal 组件
     *    - 显示选项列表（单选）
     *    - 显示音频时长和格式信息
     *    - 支持预览播放（可选）
     *
     * 3. 字幕生成流程:
     *    Step 1: 用户选择音频源
     *    Step 2: 上传到服务器（/api/upload）
     *    Step 3: 调用 ASR API（/api/subtitle/generate）
     *      - 使用 Whisper.cpp（本地）或 OpenAI（云端）
     *      - 返回时间轴对齐的字幕数据
     *    Step 4: 解析 SRT/VTT 格式
     *    Step 5: 创建 SubtitleTrack 并添加到项目
     *
     * 4. 代码示例:
     *    const handleSelectAudio = async (audioFile: File) => {
     *      // 上传音频
     *      const formData = new FormData()
     *      formData.append('audio', audioFile)
     *      const { audioPath } = await fetch('/api/upload', {
     *        method: 'POST',
     *        body: formData
     *      }).then(r => r.json())
     *
     *      // 生成字幕
     *      const { entries } = await fetch('/api/subtitle/generate', {
     *        method: 'POST',
     *        body: JSON.stringify({ audioPath, language: 'zh' })
     *      }).then(r => r.json())
     *
     *      // 创建字幕轨道
     *      const newTrack: SubtitleTrack = {
     *        id: `track_${Date.now()}`,
     *        name: `字幕 - ${audioFile.name}`,
     *        language: 'zh',
     *        entries, // 自动生成的字幕条目
     *        style: defaultSubtitleStyle
     *      }
     *
     *      setCurrentProject({
     *        ...currentProject,
     *        subtitles: [...(currentProject.subtitles || []), newTrack]
     *      })
     *    }
     *
     * 5. 错误处理:
     *    - 音频格式不支持 → 提示转换
     *    - ASR 失败 → 创建空轨道供手动编辑
     *    - 音频时长超限 → 提示分段处理
     *
     * 参考:
     * - src/app/api/subtitle/generate/route.ts（ASR API）
     * - src/lib/audio/audio-analyzer.ts（音频分析）
     * - Task #125（字幕自动生成系统）
     */
    // 临时解决方案：直接创建一个空的字幕轨道供用户手动编辑
    const newTrack: SubtitleTrack = {
      id: `track_${Date.now()}`,
      name: '字幕轨道 1',
      language: 'zh',
      entries: [],
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#FFFFFF',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
      },
    }

    setSubtitleTracks(prev => [...prev, newTrack])
    toast.showSuccess('字幕轨道已创建', '请手动添加字幕或上传音频文件')
  }, [currentProject, toast])

  // 项目管理函数
  const handleProjectSelect = useCallback((projectId: string) => {
    const project = ProjectStorage.getProject(projectId)
    if (project) {
      setCurrentProject(project)
      setFrames(project.frames)
      ProjectStorage.setCurrentProjectId(projectId)

      if (project.frames.length > 0) {
        setState('timeline')
        setSelectedFrameId(project.frames[0].id)
      } else {
        setState('welcome')
      }
    }
  }, [])

  const handleProjectDelete = useCallback((projectId: string) => {
    if (confirm('确定要删除这个项目吗？此操作无法撤销！')) {
      const deletedProject = ProjectStorage.getProject(projectId)
      ProjectStorage.deleteProject(projectId)
      setProjects(ProjectStorage.getAllProjects())

      // 显示删除成功提示
      toast.showInfo('项目已删除', deletedProject?.title || '项目已从列表中移除')

      // 如果删除的是当前项目，清空状态
      if (currentProject?.id === projectId) {
        setCurrentProject(null)
        setFrames([])
        setState('welcome')
      }
    }
  }, [currentProject, toast])

  const handleProjectRename = useCallback((projectId: string, newTitle: string) => {
    ProjectStorage.updateProject(projectId, { title: newTitle })
    setProjects(ProjectStorage.getAllProjects())

    if (currentProject?.id === projectId) {
      setCurrentProject(prev => prev ? { ...prev, title: newTitle } : null)
    }
  }, [currentProject])

  const handleNewProject = useCallback(() => {
    const newProject = ProjectStorage.createProject()
    setCurrentProject(newProject)
    setFrames([])
    setProjects(ProjectStorage.getAllProjects())
    setState('welcome')
  }, [])

  const handleFrameOpen = useCallback((frameId: string) => {
    setSelectedFrameId(frameId)
    setViewMode('timeline')
  }, [])

  const handleRestoreVersion = useCallback((restoredFrames: Frame[]) => {
    setFrames(restoredFrames.map((f, i) => ({ ...f, index: i })))
    if (restoredFrames.length > 0) {
      setSelectedFrameId(restoredFrames[0].id)
    }

    // 显示恢复成功提示
    toast.showSuccess('版本已恢复', `已恢复到包含 ${restoredFrames.length} 个场景的版本`)
  }, [toast])

  // 键盘快捷键
  useKeyboardShortcuts([
    // 保存项目 (Cmd/Ctrl + S)
    {
      ...SHORTCUTS.SAVE,
      handler: () => {
        if (currentProject && frames.length > 0) {
          ProjectStorage.autoSaveProject(currentProject.id, frames)
          toast.showSuccess('已保存', '项目已成功保存')
        }
      },
      disabled: !currentProject || frames.length === 0,
    },
    // 切换到 Timeline 视图 (Cmd/Ctrl + 1)
    {
      ...SHORTCUTS.TOGGLE_TIMELINE,
      handler: () => {
        if (state === 'timeline' || state === 'grid' || state === 'export') {
          setViewMode('timeline')
        }
      },
      disabled: !(state === 'timeline' || state === 'grid' || state === 'export'),
    },
    // 切换到 Grid 视图 (Cmd/Ctrl + 2)
    {
      ...SHORTCUTS.TOGGLE_GRID,
      handler: () => {
        if (state === 'timeline' || state === 'grid' || state === 'export') {
          setViewMode('grid')
        }
      },
      disabled: !(state === 'timeline' || state === 'grid' || state === 'export'),
    },
    // 删除选中的帧 (Delete/Backspace)
    {
      ...SHORTCUTS.DELETE,
      handler: () => {
        if (selectedFrameId && frames.length > 0) {
          handleFrameDelete(selectedFrameId)
        }
      },
      disabled: !selectedFrameId || frames.length === 0,
    },
    // 复制选中的帧 (Cmd/Ctrl + D)
    {
      ...SHORTCUTS.DUPLICATE,
      handler: () => {
        if (selectedFrameId && frames.length > 0) {
          handleFrameDuplicate(selectedFrameId)
          toast.showSuccess('已复制', '场景已复制到末尾')
        }
      },
      disabled: !selectedFrameId || frames.length === 0,
    },
    // 全选 (Cmd/Ctrl + A) - 仅在 Timeline/Grid 视图
    {
      ...SHORTCUTS.SELECT_ALL,
      handler: () => {
        if (frames.length > 0) {
          const allFrameIds = frames.map(f => f.id)
          allFrameIds.forEach(id => handleFrameSelect(id, true))
          toast.showInfo('已全选', `选中了 ${frames.length} 个场景`)
        }
      },
      disabled: frames.length === 0 || (state !== 'timeline' && state !== 'grid'),
    },
    // Escape - 取消选择或返回
    {
      ...SHORTCUTS.ESCAPE,
      handler: () => {
        if (selectedFrameIds.length > 0) {
          // 取消所有选择
          selectedFrameIds.forEach(id => handleFrameSelect(id, false))
        } else if (state === 'export') {
          // 从 Export 返回 Timeline
          setState('timeline')
        }
      },
    },
  ], { enabled: state !== 'welcome' && state !== 'chat' }) // 仅在工作区视图启用快捷键

  // 页面切换动画已完全移除以提升性能

  // 渲染当前状态
  const renderContent = () => {
    switch (state) {
      case 'welcome':
        return (
          <div className="h-full">
            <WelcomeHero
              onStartProject={handleStartProject}
              onStartFromTemplate={handleStartFromTemplate}
              inspirationGallery={getFeaturedItems(8)}
            />
          </div>
        )

      case 'chat':
        // Chat阶段的精确步骤：understanding(0) → scripting(1) → storyboarding(2)
        const chatStep = flowStage === 'understanding' ? 0
          : flowStage === 'scripting' ? 1
          : flowStage === 'storyboarding' ? 2
          : 0 // completing或null默认显示步骤0

        return (
          <div className="h-full flex flex-col">
            <WorkflowProgress currentStep={chatStep} />
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <ChatPanel
                  initialQuery={initialQuery}
                  onGenerationComplete={handleGenerationComplete}
                  onBackToWelcome={() => setState('welcome')}
                  onFlowStageChange={handleFlowStageChange}
                />
              </Suspense>
            </div>
          </div>
        )

      case 'timeline':
      case 'grid':
      case 'export':
        // 计算工作流步骤：timeline/grid表示分镜已生成（步骤2），export表示视频合成（步骤3）
        const workflowStep = state === 'export' ? 3 : 2

        return (
          <div className="h-full">
            <WorkspaceLayout
            state={state}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            header={<WorkflowProgress currentStep={workflowStep} />}
            onPreview={() => setShowPreview(true)}
            leftSidebar={
              <ProjectSidebar
                frames={frames}
                selectedFrameId={selectedFrameId}
                onFrameSelect={handleFrameSelect}
                projects={projects}
                currentProject={currentProject}
                onProjectSelect={handleProjectSelect}
                onProjectDelete={handleProjectDelete}
                onProjectRename={handleProjectRename}
                onNewProject={handleNewProject}
              />
            }
            rightSidebar={
              state === 'export' ? (
                <Suspense fallback={<LoadingFallback />}>
                  <ExportPanel
                    frames={frames}
                    subtitleTracks={subtitleTracks}
                    onExport={(config) => {
                      logger.info('Export completed:', config)
                      // 导出完成后可以选择返回Timeline或显示成功消息
                    }}
                    onBack={() => setState('timeline')}
                  />
                </Suspense>
              ) : undefined
            }
          >
            {viewMode === 'timeline' ? (
              <Suspense fallback={<LoadingFallback />}>
                <TimelineEditor
                  frames={frames}
                  selectedFrameId={selectedFrameId}
                  selectedFrameIds={selectedFrameIds}
                  onFrameSelect={handleFrameSelect}
                  onFrameAdd={handleFrameAdd}
                  onFrameDelete={handleFrameDelete}
                  onFrameDuplicate={handleFrameDuplicate}
                  onFrameReorder={handleFrameReorder}
                  onFrameUpdate={handleFrameUpdate}
                  onBatchDelete={handleBatchDelete}
                  subtitleTracks={subtitleTracks}
                  onSubtitleTracksChange={setSubtitleTracks}
                  onGenerateSubtitles={handleGenerateSubtitles}
                  isGeneratingSubtitles={isGeneratingSubtitles}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<LoadingFallback />}>
                <GridBrowser
                  frames={frames}
                  selectedFrameIds={selectedFrameIds}
                  onFrameSelect={handleFrameSelect}
                  onFrameOpen={handleFrameOpen}
                  onBatchDelete={handleBatchDelete}
                />
              </Suspense>
            )}
          </WorkspaceLayout>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={isMobile ? 'has-bottom-nav' : ''}>
      {renderContent()}

      {/* 版本历史面板 */}
      {showVersionHistory && currentProject && (
        <Suspense fallback={null}>
          <VersionHistoryPanel
            projectId={currentProject.id}
            currentFrames={frames}
            onRestore={handleRestoreVersion}
            onClose={() => setShowVersionHistory(false)}
          />
        </Suspense>
      )}

      {/* 视频预览模态框 */}
      {showPreview && frames.length > 0 && (
        <Suspense fallback={null}>
          <PreviewModal
            frames={frames}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
          />
        </Suspense>
      )}

      {/* 键盘快捷键帮助按钮 - 仅在工作区显示（桌面端） */}
      {!isMobile && (state === 'timeline' || state === 'grid' || state === 'export') && (
        <KeyboardShortcutsButton />
      )}

      {/* 移动端底部导航栏 */}
      {isMobile && (
        <MobileNavBar
          currentState={state}
          onNavigate={(newState) => setState(newState)}
        />
      )}

      {/* Chat 引导 */}
      {state === 'chat' && (
        <OnboardingTour
          steps={workflowTourSteps}
          onComplete={handleCompleteChatOnboarding}
          onSkip={handleSkipChatOnboarding}
          isVisible={showChatOnboarding}
        />
      )}

      {/* Timeline 引导 */}
      {(state === 'timeline' || state === 'grid') && (
        <OnboardingTour
          steps={timelineTourSteps}
          onComplete={handleCompleteTimelineOnboarding}
          onSkip={handleSkipTimelineOnboarding}
          isVisible={showTimelineOnboarding}
        />
      )}
    </div>
  )
}
