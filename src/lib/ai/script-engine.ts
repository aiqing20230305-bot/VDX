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
import { logger } from '@/lib/utils/logger'

const log = logger.context('ScriptEngine')

const SYSTEM_PROMPT = `你是视频脚本策划师，擅长音乐视频和创意短视频。

基础规则：
1. 返回纯JSON，无额外文字
2. 所有文字简短（标题≤15字，描述≤40字）
3. 严格转义所有特殊字符
4. 确保JSON完整且有效

音频驱动规则（当有音频信息时）：
1. **歌词关键词优先**：将歌词关键词融入画面描述
2. **段落节奏匹配**：
   - Chorus → 快切、动态运镜、高饱和度色彩、视觉冲击
   - Verse → 叙事感、平稳镜头、情感递进
   - Intro → 舒缓渐入、铺垫氛围、静态或缓慢推拉
   - Outro → 渐出收尾、回味留白、镜头远离或淡出
   - Bridge → 转折对比、镜头变化、承上启下
3. **情绪同步**：高能量段落 → 快节奏画面；低能量段落 → 慢节奏画面
4. **时长精确**：确保场景总时长与音频时长一致（±2秒）`

interface RawScript {
  title: string
  logline: string
  theme: string
  style: VideoStyle
  scenes: Array<{
    index: number
    duration: number
    visual: string
    camera_move?: string
  }>
}

export async function generateScripts(input: ScriptGenerationInput): Promise<Script[]> {
  const { topic, images, duration, aspectRatio, count, style, additionalPrompt, audioAnalysis } = input

  const imageContext = images && images.length > 0
    ? `\n参考图片 ${images.length} 张`
    : ''

  // 🎵 音频驱动的场景规划
  let sceneCount = Math.max(3, Math.round(duration / 3.5))
  let audioContext = ''

  if (audioAnalysis) {
    const analysis = audioAnalysis as any

    // 提取歌词关键词（前10个最重要的）
    const allLyrics = (analysis.lyrics || [])
    const keywordsSet = new Set<string>()
    allLyrics.forEach((lyric: any) => {
      (lyric.keywords || []).forEach((kw: string) => keywordsSet.add(kw))
    })
    const lyricsKeywords = Array.from(keywordsSet).slice(0, 10)

    // 计算段落场景分配和风格指导
    const segmentsGuide = (analysis.segments || []).map((seg: any) => {
      const segDuration = seg.endTime - seg.startTime
      const segScenes = Math.max(1, Math.round(segDuration / 3.5))

      // 根据段落类型提供视觉风格指导
      let styleGuide = ''
      switch (seg.type) {
        case 'chorus':
          styleGuide = '【高潮】快切、动态、视觉冲击、色彩鲜艳'
          break
        case 'intro':
          styleGuide = '【开场】舒缓、渐入、铺垫氛围'
          break
        case 'outro':
          styleGuide = '【结尾】渐出、收尾、回味悠长'
          break
        case 'verse':
          styleGuide = '【主歌】叙事、平稳、情感递进'
          break
        case 'bridge':
          styleGuide = '【过渡】转折、情绪变化、承上启下'
          break
      }

      return `${seg.type}(${segScenes}场景, ${styleGuide})`
    })

    sceneCount = Math.round(duration / 3) // 音频驱动时稍微增加场景密度

    // 构建音频上下文提示
    const lyricsContext = lyricsKeywords.length > 0
      ? `\n- 歌词关键词：${lyricsKeywords.join('、')}（用这些词作为画面主题）`
      : ''

    audioContext = `
音频驱动指南：
- BPM: ${analysis.beat.bpm}（${analysis.mood[0]?.tempo || 'medium'} tempo）
- 段落结构：${segmentsGuide.join(' → ')}${lyricsContext}
- 重要：严格按段落类型调整场景节奏和视觉风格`
  }

  // 限制生成数量，避免输出过长
  const safeCount = Math.min(count, 2)  // 最多2个脚本

  // 构建场景生成指导（根据音频段落）
  let sceneGuide = `场景：${sceneCount}个${audioAnalysis ? '（跟随音乐节奏）' : '，每个3-5秒'}`
  if (audioAnalysis) {
    const analysis = audioAnalysis as any
    const segments = analysis.segments || []
    // 为每个段落生成场景分配指导
    const sceneDistribution = segments.map((seg: any, idx: number) => {
      const segDuration = seg.endTime - seg.startTime
      const segScenes = Math.max(1, Math.round(segDuration / 3.5))
      return `段落${idx + 1}（${seg.type}）：${segScenes}个场景`
    }).join(', ')
    sceneGuide = `场景分配：${sceneDistribution}`
  }

  const prompt = `生成${safeCount}个${duration}秒${audioAnalysis ? '音乐' : ''}视频脚本。

主题：${topic || '创意'}${imageContext}${audioContext}
风格：${style || 'cinematic'}
比例：${aspectRatio}
${sceneGuide}

${audioAnalysis ? `
⭐ 音频驱动规则：
1. 歌词关键词必须体现在场景画面中
2. Chorus段落：画面更动态、色彩更鲜艳、镜头运动更快
3. Intro/Outro段落：画面舒缓、镜头固定或缓慢推拉
4. 每个音频段落至少1个场景，确保场景与段落情绪匹配
` : ''}
JSON格式（保持简短）：
{"scripts":[{"title":"标题≤15字","logline":"概括≤20字","theme":"主题≤10字","style":"${style || 'cinematic'}","scenes":[{"index":0,"duration":3,"visual":"画面≤40字","camera_move":"推/拉/摇/固定"}]}]}`

  // 🔄 重试机制：如果 JSON 解析失败，用更简短的提示词重试
  let result: { scripts: RawScript[] }
  try {
    result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, prompt, {
      maxTokens: 3000,  // 降低 token 上限，减少截断风险
      source: 'script-engine',
    })
  } catch (err) {
    log.warn('Initial generation failed, retrying with simplified prompt', err)

    // 极简版提示词（只保留核心信息，单脚本）
    const simplePrompt = `生成1个${duration}秒脚本（${sceneCount}场景）。
主题：${topic || '创意'}

JSON：{"scripts":[{"title":"标题","logline":"概括","theme":"主题","style":"${style || 'cinematic'}","scenes":[{"index":0,"duration":3,"visual":"画面","camera_move":"固定"}]}]}`

    result = await generateJSON<{ scripts: RawScript[] }>(SYSTEM_PROMPT, simplePrompt, {
      maxTokens: 2000,
      source: 'script-engine-retry',
    })
  }

  // ✅ 验证和清理脚本数据
  const scripts = result.scripts || []
  if (scripts.length === 0) {
    throw new Error('生成的脚本数量为0，请重试')
  }

  return scripts.map((raw): Script => {
    // 验证场景数据
    const scenes = (raw.scenes || []).filter(s => s && s.visual)
    if (scenes.length === 0) {
      throw new Error(`脚本"${raw.title}"没有有效场景`)
    }

    // 确保场景总时长接近目标时长（允许±3秒误差）
    const totalDuration = scenes.reduce((sum, s) => sum + (s.duration || 3), 0)
    if (Math.abs(totalDuration - duration) > 3) {
      log.warn('Script duration mismatch', {
        title: raw.title,
        actualDuration: totalDuration,
        targetDuration: duration,
      })
    }

    return {
      id: uuid(),
      title: raw.title || '未命名脚本',
      logline: raw.logline || '',
      theme: raw.theme || '',
      style: raw.style || style || 'cinematic',
      duration,
      aspectRatio,
      scenes: scenes.map((s, i): ScriptScene => ({
        index: i,
        duration: s.duration || 3,
        visual: s.visual,
        narration: undefined,  // 简化：不再生成解说词
        emotion: undefined,     // 简化：不再生成情绪
        cameraMove: s.camera_move || '固定',
        soundDesign: undefined, // 简化：不再生成音效
      })),
      generationPrompt: topic,
      createdAt: new Date(),
    }
  })
}

export function calculateFrameCount(durationSeconds: number): number {
  // 每个场景平均 3~4 秒，合理的帧数
  return Math.max(3, Math.round(durationSeconds / 3.5))
}
