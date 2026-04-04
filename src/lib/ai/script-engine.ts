/**
 * 脚本生成引擎
 * 根据选题/图片/时长/比例/数量，生成发散性、创意性的视频脚本
 */
import { generateJSON } from './claude'
import type {
  Script,
  ScriptGenerationInput,
  ScriptScene,
  VideoStyle,
} from '@/types'
import { v4 as uuid } from 'uuid'

const SYSTEM_PROMPT = `你是一个顶尖的视频内容策划师和编剧，拥有以下能力：
- 深度理解各种视频风格：电影级、动漫、纪录片、广告、短剧、音乐MV等
- 能够基于简单选题发散出多个独特的创意方向
- 每个脚本都有独特的叙事结构、镜头语言和情感节奏
- 善于将视觉美学与叙事深度结合

创作原则：
1. 每个脚本创意必须有明显的差异化，不能互相雷同
2. 优先考虑视觉冲击力和情绪共鸣
3. 镜头描述要精准、具体，可直接用于分镜创作
4. 充分考虑时长限制，合理分配场景节奏`

interface RawScript {
  title: string
  logline: string
  theme: string
  style: VideoStyle
  creative_direction: string
  scenes: Array<{
    index: number
    duration: number
    visual: string
    narration?: string
    emotion?: string
    camera_move?: string
    sound_design?: string
  }>
}

export async function generateScripts(input: ScriptGenerationInput): Promise<Script[]> {
  const { topic, images, duration, aspectRatio, count, style, additionalPrompt } = input

  const imageContext = images && images.length > 0
    ? `\n参考图片已上传 ${images.length} 张，请充分融合图片中的视觉元素`
    : ''

  const prompt = `请为以下需求生成 ${count} 个差异化的视频脚本创意：

选题描述：${topic || '（无，根据图片自由发挥）'}${imageContext}
视频时长：${duration} 秒
画面比例：${aspectRatio}
${style ? `风格倾向：${style}` : '风格：不限，请发散创意'}
${additionalPrompt ? `额外要求：${additionalPrompt}` : ''}

场景数量规则：
- 每个场景 3~5 秒，总场景数 = 总时长 / 平均场景时长
- 15秒 → 4~5个场景
- 30秒 → 8~10个场景
- 60秒 → 15~20个场景
- 按节奏灵活分配，重要场景可以更长（5秒），过渡场景可短（2~3秒）
- 所有场景的 duration 总和必须 = ${duration} 秒

请用 JSON 格式返回，结构如下：
{
  "scripts": [
    {
      "title": "脚本标题",
      "logline": "一句话故事概括（≤50字）",
      "theme": "核心主题",
      "style": "视频风格",
      "creative_direction": "创意方向说明（≤100字）",
      "scenes": [
        {
          "index": 0,
          "duration": 3,
          "visual": "具体画面描述，适合生成图片的详细描述",
          "narration": "解说词（可选）",
          "emotion": "情绪基调",
          "camera_move": "推镜/拉镜/摇镜/固定/跟随/俯拍/仰拍",
          "sound_design": "音效/背景音乐描述"
        }
      ]
    }
  ]
}`

  const result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, prompt, {
    maxTokens: 8000,
    source: 'script-engine',
  })

  return result.scripts.map((raw): Script => ({
    id: uuid(),
    title: raw.title,
    logline: raw.logline,
    theme: raw.theme,
    style: raw.style,
    duration,
    aspectRatio,
    scenes: raw.scenes.map((s): ScriptScene => ({
      index: s.index,
      duration: s.duration,
      visual: s.visual,
      narration: s.narration,
      emotion: s.emotion,
      cameraMove: s.camera_move,
      soundDesign: s.sound_design,
    })),
    generationPrompt: topic,
    createdAt: new Date(),
  }))
}

export function calculateFrameCount(durationSeconds: number): number {
  // 每个场景平均 3~4 秒，合理的帧数
  return Math.max(3, Math.round(durationSeconds / 3.5))
}
