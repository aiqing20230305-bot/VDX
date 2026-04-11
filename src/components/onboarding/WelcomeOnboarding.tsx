/**
 * WelcomeOnboarding - Welcome 页面引导配置
 */
'use client'

import { MessageSquare, Film, Wand2, Download } from 'lucide-react'
import { TourStep } from './OnboardingTour'

/**
 * Welcome 页面的引导步骤
 */
export const welcomeTourSteps: TourStep[] = [
  {
    target: '[data-tour="search-input"]',
    title: '描述你的创意',
    description: '在这里输入你的视频想法，AI 会帮你生成完整的脚本和分镜。支持任何主题：产品宣传、旅行 Vlog、教程视频等。',
    placement: 'bottom',
  },
  {
    target: '[data-tour="template-button"]',
    title: '或使用预设模板',
    description: '不知道从哪开始？试试我们的 7 个专业模板：商业广告、教程、Vlog、MV、短剧、TikTok、Instagram。',
    placement: 'top',
  },
]

/**
 * 工作流程步骤（在 Chat 界面）
 */
export const workflowTourSteps: TourStep[] = [
  {
    target: '[data-tour="chat-area"]',
    title: '对话式创作',
    description: 'AI 会和你对话，询问视频时长、比例、风格等细节，然后自动生成脚本和分镜。整个过程就像和专业视频制作人聊天一样简单。',
    placement: 'right',
  },
  {
    target: '[data-tour="progress-indicator"]',
    title: '实时进度跟踪',
    description: '创作过程完全透明，你可以随时看到 AI 正在做什么：分析创意、生成脚本、创建分镜、生成图片。',
    placement: 'left',
  },
]

/**
 * Timeline 编辑器引导
 */
export const timelineTourSteps: TourStep[] = [
  {
    target: '[data-tour="frame-list"]',
    title: '分镜列表',
    description: '这里是你的视频分镜。每个场景都包含图片、描述、时长和镜头运动。点击可以查看大图预览。',
    placement: 'right',
  },
  {
    target: '[data-tour="preview-area"]',
    title: '实时预览',
    description: '选中任何一个场景，这里会显示高清预览。你可以直接在这里编辑场景描述和时长。',
    placement: 'left',
  },
  {
    target: '[data-tour="timeline-track"]',
    title: '时间轴操作',
    description: '在时间轴上拖拽场景可以重新排序。支持多选（Cmd+点击）和批量操作。按 Delete 删除，按 Cmd+D 复制。',
    placement: 'top',
  },
  {
    target: '[data-tour="export-button"]',
    title: '导出视频',
    description: '完成编辑后，点击这里导出视频。支持多种分辨率（720p/1080p/4K）和帧率（24/30/60 FPS）。',
    placement: 'left',
  },
]

/**
 * 功能亮点卡片（显示在 Welcome 页面）
 */
export const featureHighlights = [
  {
    icon: MessageSquare,
    title: '对话式创作',
    description: 'AI 和你对话，理解创意，自动生成脚本和分镜',
    color: 'cyan',
  },
  {
    icon: Film,
    title: '智能分镜',
    description: '基于脚本自动生成专业分镜，每帧都有精美配图',
    color: 'indigo',
  },
  {
    icon: Wand2,
    title: '实时编辑',
    description: '拖拽重排、内联编辑、批量操作，所见即所得',
    color: 'blue',
  },
  {
    icon: Download,
    title: '一键导出',
    description: '多种分辨率和帧率，高质量视频快速生成',
    color: 'emerald',
  },
]
