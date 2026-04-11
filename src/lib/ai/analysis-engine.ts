/**
 * 视频分析引擎 + 二创引擎
 * 分析视频的所有视觉/音频元素，支持描述式修改进行二创
 */
import { generateJSON } from './claude'
import { extractFrames, getVideoInfo } from '../video/ffmpeg-utils'
import { transcribeVideoSpeech, formatTranscription } from '../video/speech-to-text'
import type {
  VideoAnalysis,
  VideoElement,
  SecondaryCreationInput,
  Script,
  AspectRatio,
  VideoStyle,
} from '@/types'
import { v4 as uuid } from 'uuid'
import fs from 'fs/promises'
import { logger } from '@/lib/utils/logger'

const log = logger.context('AnalysisEngine')

const ANALYSIS_SYSTEM_PROMPT = `你是一位专业的视频分析师和内容策略专家，能够：
- 深度分析视频中的所有视觉元素（角色、场景、物品、文字、特效）
- 识别音频元素（配乐风格、音效、人声）
- **理解视频口播内容**：结合画面和语音文字理解视频核心主题和要点
- 判断视频风格、情绪基调、叙事结构
- 提出具体的二创方向和改编建议
请用中文回答所有分析内容。`

interface RawAnalysis {
  style: VideoStyle
  aspect_ratio: AspectRatio
  mood: string
  narrative_structure: string
  elements: Array<{
    type: VideoElement['type']
    description: string
    time_range?: [number, number]
    tags: string[]
  }>
  scene_descriptions: string[]
  mood_board: string[]
  suggested_edits: string[]
}

export async function analyzeVideo(videoPath: string): Promise<VideoAnalysis> {
  // 获取视频基础信息
  const info = await getVideoInfo(videoPath)

  // 提取关键帧（每2秒一帧）
  const framePaths = await extractFrames(videoPath, 0.5)

  // 读取帧图片（base64）
  const frameImages = await Promise.all(
    framePaths.slice(0, 20).map(async (p) => {
      const buf = await fs.readFile(p)
      return `data:image/jpeg;base64,${buf.toString('base64')}`
    })
  )

  // 🎤 提取语音文字（自动选择可用的ASR引擎）
  let transcription: string | null = null
  try {
    log.info('Starting speech recognition')
    const result = await transcribeVideoSpeech(videoPath)
    transcription = formatTranscription(result)
    log.info('Speech recognition completed', {
      engine: result.engine,
      textLength: transcription.length
    })
  } catch (err) {
    log.warn('Speech recognition failed, will analyze visuals only', err)
  }

  const prompt = `请分析以下视频（已提取 ${frameImages.length} 个关键帧）：

视频信息：
- 时长：${info.duration.toFixed(1)} 秒
- 分辨率：${info.width}x${info.height}
- 帧率：${info.fps.toFixed(0)}fps${transcription ? `

**视频口播内容（语音转文字）**：
\`\`\`
${transcription}
\`\`\`

⚠️ **重要**：请结合画面和口播内容进行综合分析，口播是理解视频核心主题的关键。` : ''}

请提取所有视觉和叙事元素，并给出二创建议。

返回 JSON：
{
  "style": "视频风格（cinematic/anime/realistic/cartoon/documentary/commercial/short-drama/vlog/music-video）",
  "aspect_ratio": "画面比例（16:9/9:16/1:1/4:3）",
  "mood": "整体情绪基调",
  "narrative_structure": "叙事结构描述",
  "elements": [
    {
      "type": "character/scene/object/text/audio/effect",
      "description": "元素描述",
      "time_range": [0, 3.5],
      "tags": ["标签1", "标签2"]
    }
  ],
  "scene_descriptions": ["场景1描述", "场景2描述"],
  "mood_board": ["视觉关键词1", "视觉关键词2"],
  "suggested_edits": ["二创建议1：...", "二创建议2：..."]
}`

  const raw = await generateJSON<RawAnalysis>(ANALYSIS_SYSTEM_PROMPT, prompt, {
    maxTokens: 4000,
    source: 'analysis-engine',
  })

  // 清理临时帧文件
  await Promise.allSettled(framePaths.map(p => fs.unlink(p)))

  return {
    id: uuid(),
    sourceVideoUrl: videoPath,
    duration: info.duration,
    aspectRatio: raw.aspect_ratio ?? inferAspectRatio(info.width, info.height),
    style: raw.style ?? 'realistic',
    elements: raw.elements.map(e => ({
      type: e.type,
      description: e.description,
      timeRange: e.time_range,
      tags: e.tags ?? [],
    })),
    sceneDescriptions: raw.scene_descriptions ?? [],
    moodBoard: raw.mood_board ?? [],
    suggestedEdits: raw.suggested_edits ?? [],
    createdAt: new Date(),
  }
}

function inferAspectRatio(width: number, height: number): AspectRatio {
  const ratio = width / height
  if (ratio > 1.7) return '16:9'
  if (ratio < 0.6) return '9:16'
  if (Math.abs(ratio - 1) < 0.1) return '1:1'
  return '4:3'
}

/**
 * 根据分析结果和用户修改指令，生成二创脚本
 */
export async function generateSecondaryCreation(
  analysis: VideoAnalysis,
  input: SecondaryCreationInput
): Promise<Script> {
  const modificationList = input.modifications.map(m =>
    `- ${m.operation} ${m.elementType}：将「${m.originalDescription}」→「${m.newDescription}」`
  ).join('\n')

  const preserveList = input.preserveElements?.join('、') ?? '无'

  const prompt = `基于以下视频分析，生成二创脚本：

原视频信息：
- 风格：${analysis.style}
- 时长：${analysis.duration} 秒
- 情绪：${analysis.moodBoard.join('、')}
- 场景：${analysis.sceneDescriptions.join('；')}

修改要求：
${modificationList}

保留元素：${preserveList}
${input.newDuration ? `新时长：${input.newDuration} 秒` : `保持原时长：${analysis.duration} 秒`}

请生成完整的二创视频脚本（JSON格式）：
{
  "title": "二创作品标题",
  "logline": "一句话概括",
  "theme": "主题",
  "style": "风格",
  "scenes": [
    {
      "index": 0,
      "duration": 3,
      "visual": "画面描述",
      "narration": "解说词",
      "emotion": "情绪",
      "camera_move": "运镜",
      "sound_design": "声音"
    }
  ]
}`

  const raw = await generateJSON<{
    title: string
    logline: string
    theme: string
    style: VideoStyle
    scenes: Array<{
      index: number
      duration: number
      visual: string
      narration?: string
      emotion?: string
      camera_move?: string
      sound_design?: string
    }>
  }>(ANALYSIS_SYSTEM_PROMPT, prompt, { maxTokens: 4000, source: 'analysis-engine' })

  const duration = input.newDuration ?? analysis.duration

  return {
    id: uuid(),
    title: raw.title,
    logline: raw.logline,
    theme: raw.theme,
    style: raw.style,
    duration,
    aspectRatio: analysis.aspectRatio,
    scenes: raw.scenes.map(s => ({
      index: s.index,
      duration: s.duration,
      visual: s.visual,
      narration: s.narration,
      emotion: s.emotion,
      cameraMove: s.camera_move,
      soundDesign: s.sound_design,
    })),
    createdAt: new Date(),
  }
}
