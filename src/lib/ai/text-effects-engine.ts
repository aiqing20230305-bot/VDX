/**
 * 文字效果引擎
 * 根据用户描述生成字幕、标题、弹幕配置
 */
import { generateText } from './claude'
import type {
  Storyboard,
  SubtitleTrack,
  TitleTrack,
  BulletTrack,
} from '@/types'
import { v4 as uuid } from 'uuid'

export interface TextEffectsInput {
  storyboard: Storyboard
  userRequest: string
  effectType?: 'subtitles' | 'titles' | 'bullets' | 'auto'
}

export interface TextEffectsResult {
  storyboard: Storyboard
  summary: string
}

/**
 * 根据用户请求添加文字效果
 */
export async function addTextEffects(
  input: TextEffectsInput
): Promise<TextEffectsResult> {
  const { storyboard, userRequest, effectType = 'auto' } = input

  // 计算视频总时长
  const totalDuration = storyboard.frames.reduce(
    (sum, frame) => sum + frame.duration,
    0
  )

  const systemPrompt = `你是文字效果配置专家，负责根据用户需求为视频添加字幕、标题或弹幕。

视频信息：
- 总时长: ${totalDuration}秒
- 帧数: ${storyboard.frames.length}
- 分镜描述: ${storyboard.frames.map((f, i) => `第${i + 1}帧(${f.duration}秒): ${f.description}`).join('；')}

你需要分析用户请求，然后生成 JSON 配置。输出格式：

{
  "type": "subtitles" | "titles" | "bullets",
  "config": <配置对象>,
  "summary": "简短说明添加了什么"
}

## 字幕配置示例 (type: "subtitles"):
{
  "type": "subtitles",
  "config": {
    "entries": [
      {
        "startTime": 0,
        "endTime": 3,
        "text": "欢迎来到超级视频",
        "position": "bottom"
      }
    ]
  },
  "summary": "添加了底部字幕"
}

## 标题配置示例 (type: "titles"):
{
  "type": "titles",
  "config": {
    "entries": [
      {
        "startTime": 0,
        "endTime": 2,
        "text": "超级视频 v1.3",
        "position": "center",
        "animation": {
          "type": "zoomIn",
          "duration": 30,
          "easing": "ease-out",
          "exitAnimation": true
        }
      }
    ]
  },
  "summary": "添加了标题动画"
}

## 弹幕配置示例 (type: "bullets"):
{
  "type": "bullets",
  "config": {
    "entries": [
      {
        "id": "b1",
        "time": 1,
        "text": "666"
      },
      {
        "id": "b2",
        "time": 2,
        "text": "太酷了！"
      }
    ]
  },
  "summary": "添加了弹幕效果"
}

重要规则：
1. 字幕时间必须在 0 到 ${totalDuration} 秒之间
2. 弹幕 id 必须唯一
3. 根据视频内容合理安排文字出现时机
4. 文字内容要符合视频主题
5. 只输出 JSON，不要其他解释

用户需求类型提示: ${effectType === 'auto' ? '自动判断' : effectType}`

  try {
    const response = await generateText(
      systemPrompt,
      `用户请求：${userRequest}`,
      []
    )

    // 解析 JSON 响应
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法解析 AI 响应')
    }

    const result = JSON.parse(jsonMatch[0])

    // 根据类型添加到 storyboard
    const updatedStoryboard = { ...storyboard }

    if (result.type === 'subtitles') {
      const track: SubtitleTrack = {
        id: uuid(),
        entries: result.config.entries,
        enabled: true,
      }
      updatedStoryboard.subtitles = [
        ...(updatedStoryboard.subtitles || []),
        track,
      ]
    } else if (result.type === 'titles') {
      const track: TitleTrack = {
        id: uuid(),
        entries: result.config.entries,
        enabled: true,
      }
      updatedStoryboard.titles = [...(updatedStoryboard.titles || []), track]
    } else if (result.type === 'bullets') {
      const track: BulletTrack = {
        id: uuid(),
        entries: result.config.entries.map((e: any) => ({
          ...e,
          id: e.id || uuid(),
        })),
        enabled: true,
      }
      updatedStoryboard.bullets = [
        ...(updatedStoryboard.bullets || []),
        track,
      ]
    }

    return {
      storyboard: updatedStoryboard,
      summary: result.summary || '已添加文字效果',
    }
  } catch (err) {
    console.error('[TextEffectsEngine] 处理失败:', err)
    throw new Error('文字效果配置失败，请尝试更具体的描述')
  }
}
