/**
 * 预设音乐库
 * 使用免费商用音乐（CC0或类似授权）
 */

export interface PresetAudio {
  id: string
  name: string
  duration: number  // 秒
  mood: string      // 情绪标签
  genre: string     // 音乐类型
  bpm: number       // 节拍
  url: string       // 音频文件URL
  preview: string   // 预览片段URL（可选，用于快速试听）
}

/**
 * 预设音乐列表
 *
 * 注意：这些是占位符，实际使用需要替换为真实的免费音乐库资源
 * 推荐免费音乐来源：
 * - YouTube Audio Library (https://www.youtube.com/audiolibrary)
 * - Free Music Archive (https://freemusicarchive.org)
 * - Incompetech (https://incompetech.com)
 * - Bensound (https://www.bensound.com)
 *
 * 部署步骤：
 * 1. 从上述网站下载CC0授权的音乐文件
 * 2. 将音频文件放到 public/audio/presets/ 目录
 * 3. 更新下方URL路径指向实际文件
 * 4. 建议使用MP3格式，码率128-192kbps
 */
export const PRESET_AUDIOS: PresetAudio[] = [
  {
    id: 'energetic-modern-1',
    name: '活力现代',
    duration: 120,
    mood: 'energetic',
    genre: 'electronic',
    bpm: 128,
    url: '/audio/presets/energetic-modern.mp3',
    preview: '/audio/presets/energetic-modern-preview.mp3',
  },
  {
    id: 'corporate-uplifting-1',
    name: '企业励志',
    duration: 150,
    mood: 'uplifting',
    genre: 'corporate',
    bpm: 120,
    url: '/audio/presets/corporate-uplifting.mp3',
    preview: '/audio/presets/corporate-uplifting-preview.mp3',
  },
  {
    id: 'ambient-calm-1',
    name: '氛围舒缓',
    duration: 180,
    mood: 'calm',
    genre: 'ambient',
    bpm: 80,
    url: '/audio/presets/ambient-calm.mp3',
    preview: '/audio/presets/ambient-calm-preview.mp3',
  },
  {
    id: 'cinematic-epic-1',
    name: '电影史诗',
    duration: 140,
    mood: 'epic',
    genre: 'cinematic',
    bpm: 110,
    url: '/audio/presets/cinematic-epic.mp3',
    preview: '/audio/presets/cinematic-epic-preview.mp3',
  },
  {
    id: 'tech-minimal-1',
    name: '科技极简',
    duration: 130,
    mood: 'focused',
    genre: 'electronic',
    bpm: 115,
    url: '/audio/presets/tech-minimal.mp3',
    preview: '/audio/presets/tech-minimal-preview.mp3',
  },
  {
    id: 'acoustic-happy-1',
    name: '吉他欢快',
    duration: 100,
    mood: 'happy',
    genre: 'acoustic',
    bpm: 125,
    url: '/audio/presets/acoustic-happy.mp3',
    preview: '/audio/presets/acoustic-happy-preview.mp3',
  },
  {
    id: 'lofi-chill-1',
    name: 'LoFi悠闲',
    duration: 160,
    mood: 'relaxed',
    genre: 'lofi',
    bpm: 85,
    url: '/audio/presets/lofi-chill.mp3',
    preview: '/audio/presets/lofi-chill-preview.mp3',
  },
  {
    id: 'dramatic-suspense-1',
    name: '悬疑紧张',
    duration: 90,
    mood: 'tense',
    genre: 'cinematic',
    bpm: 100,
    url: '/audio/presets/dramatic-suspense.mp3',
    preview: '/audio/presets/dramatic-suspense-preview.mp3',
  },
]

/**
 * 根据情绪筛选音乐
 */
export function getAudioByMood(mood: string): PresetAudio[] {
  return PRESET_AUDIOS.filter(audio => audio.mood === mood)
}

/**
 * 根据类型筛选音乐
 */
export function getAudioByGenre(genre: string): PresetAudio[] {
  return PRESET_AUDIOS.filter(audio => audio.genre === genre)
}

/**
 * 根据时长筛选音乐（±10秒容差）
 */
export function getAudioByDuration(targetDuration: number, tolerance = 10): PresetAudio[] {
  return PRESET_AUDIOS.filter(audio =>
    Math.abs(audio.duration - targetDuration) <= tolerance
  )
}

/**
 * 获取所有可用的情绪标签
 */
export function getAllMoods(): string[] {
  return [...new Set(PRESET_AUDIOS.map(audio => audio.mood))]
}

/**
 * 获取所有可用的音乐类型
 */
export function getAllGenres(): string[] {
  return [...new Set(PRESET_AUDIOS.map(audio => audio.genre))]
}
