/**
 * 音频分析模块
 * 功能：节拍检测、歌词识别、情绪分析
 */

export interface BeatInfo {
  bpm: number              // 每分钟节拍数
  beats: number[]          // 节拍位置（秒）
  bars: number[]           // 小节位置（秒）
  timeSignature: string    // 拍号（如 "4/4"）
}

export interface LyricLine {
  startTime: number        // 开始时间（秒）
  endTime: number          // 结束时间（秒）
  text: string             // 歌词文本
  keywords: string[]       // 关键词（用于画面生成）
}

export interface AudioMood {
  timestamp: number        // 时间点（秒）
  energy: number           // 能量 0-1
  valence: number          // 情感倾向 -1(sad) to 1(happy)
  tempo: 'slow' | 'medium' | 'fast'
  intensity: 'low' | 'medium' | 'high'
}

export interface AudioAnalysisResult {
  duration: number         // 总时长（秒）
  beat: BeatInfo           // 节拍信息
  lyrics: LyricLine[]      // 歌词时间轴
  mood: AudioMood[]        // 情绪曲线（每秒采样）
  segments: AudioSegment[] // 音频段落（verse/chorus/bridge）
}

export interface AudioSegment {
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro'
  startTime: number
  endTime: number
  energy: number           // 该段落平均能量
}

/**
 * 分析音频文件
 * @param audioPath - 音频文件路径
 * @returns 音频分析结果
 */
export async function analyzeAudio(audioPath: string): Promise<AudioAnalysisResult> {
  // TODO: 实现音频分析
  // Phase 1: 使用简单的假数据
  // Phase 2: 集成真实的音频分析库（如 music-metadata, node-audiocontext）

  console.log('[Audio Analyzer] Analyzing:', audioPath)

  // 获取音频时长（使用 ffprobe）
  const duration = await getAudioDuration(audioPath)

  // 节拍检测（Phase 1: 简单估计，Phase 2: 真实检测）
  const beat = await detectBeat(audioPath, duration)

  // 歌词识别（使用现有的 Whisper）
  const lyrics = await recognizeLyrics(audioPath)

  // 情绪分析（Phase 1: 基于BPM估计，Phase 2: 音频特征分析）
  const mood = generateMoodCurve(duration, beat.bpm)

  // 段落检测（Phase 1: 基于能量变化，Phase 2: 结构分析）
  const segments = detectSegments(duration, beat, mood)

  return {
    duration,
    beat,
    lyrics,
    mood,
    segments,
  }
}

/**
 * 获取音频时长（使用 ffprobe）
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)

  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      audioPath,
    ])
    return parseFloat(stdout.trim())
  } catch (error) {
    console.error('[Audio Analyzer] Failed to get duration:', error)
    return 60 // 默认60秒
  }
}

/**
 * 节拍检测
 * Phase 1: 简单估计（假设常见的120 BPM）
 * Phase 2: 真实检测（使用 audio analysis 库）
 */
async function detectBeat(audioPath: string, duration: number): Promise<BeatInfo> {
  // Phase 1: 简单实现
  const bpm = 120 // 假设120 BPM（常见流行音乐速度）
  const beatInterval = 60 / bpm // 每拍间隔（秒）

  const beats: number[] = []
  for (let t = 0; t < duration; t += beatInterval) {
    beats.push(parseFloat(t.toFixed(3)))
  }

  // 小节（4拍一个小节）
  const bars: number[] = []
  for (let i = 0; i < beats.length; i += 4) {
    bars.push(beats[i])
  }

  return {
    bpm,
    beats,
    bars,
    timeSignature: '4/4',
  }
}

/**
 * 歌词识别（使用现有的 Whisper）
 */
async function recognizeLyrics(audioPath: string): Promise<LyricLine[]> {
  // TODO: 集成现有的 ASR 引擎（analysis-engine.ts 中的 transcribeAudio）
  // 暂时返回空数组
  return []
}

/**
 * 生成情绪曲线
 * Phase 1: 基于BPM简单估计
 */
function generateMoodCurve(duration: number, bpm: number): AudioMood[] {
  const mood: AudioMood[] = []
  const sampleRate = 1 // 每秒采样一次

  // 根据BPM判断tempo
  let tempo: AudioMood['tempo']
  if (bpm < 90) tempo = 'slow'
  else if (bpm < 130) tempo = 'medium'
  else tempo = 'fast'

  for (let t = 0; t < duration; t += sampleRate) {
    // 简单的正弦波模拟能量变化
    const normalizedTime = t / duration
    const energy = 0.5 + 0.3 * Math.sin(normalizedTime * Math.PI * 2)
    const valence = Math.sin(normalizedTime * Math.PI * 4) * 0.5

    mood.push({
      timestamp: t,
      energy,
      valence,
      tempo,
      intensity: energy > 0.7 ? 'high' : energy > 0.4 ? 'medium' : 'low',
    })
  }

  return mood
}

/**
 * 段落检测（Intro/Verse/Chorus/Bridge/Outro）
 */
function detectSegments(duration: number, beat: BeatInfo, mood: AudioMood[]): AudioSegment[] {
  // Phase 1: 简单的经验规则
  // 典型歌曲结构：Intro(8s) → Verse(20s) → Chorus(20s) → Verse(20s) → Chorus(20s) → Bridge(10s) → Chorus(20s) → Outro(8s)

  const segments: AudioSegment[] = []
  let currentTime = 0

  // Intro（前8秒）
  if (duration > 8) {
    segments.push({
      type: 'intro',
      startTime: 0,
      endTime: 8,
      energy: 0.3,
    })
    currentTime = 8
  }

  // 主歌和副歌交替
  const remainingTime = duration - currentTime - 8 // 减去outro
  const numSections = Math.floor(remainingTime / 40) // 每个 verse+chorus 约40秒

  for (let i = 0; i < numSections; i++) {
    // Verse
    if (currentTime + 20 <= duration - 8) {
      segments.push({
        type: 'verse',
        startTime: currentTime,
        endTime: currentTime + 20,
        energy: 0.5,
      })
      currentTime += 20
    }

    // Chorus
    if (currentTime + 20 <= duration - 8) {
      segments.push({
        type: 'chorus',
        startTime: currentTime,
        endTime: currentTime + 20,
        energy: 0.8,
      })
      currentTime += 20
    }
  }

  // Outro（最后8秒）
  if (duration - currentTime >= 8) {
    segments.push({
      type: 'outro',
      startTime: currentTime,
      endTime: duration,
      energy: 0.3,
    })
  }

  return segments
}

/**
 * 根据音频分析结果调整分镜时长分配
 * @param totalDuration - 视频总时长
 * @param frameCount - 分镜帧数
 * @param analysis - 音频分析结果
 * @returns 每帧的时长分配（秒）
 */
export function adjustFrameDurations(
  totalDuration: number,
  frameCount: number,
  analysis: AudioAnalysisResult
): number[] {
  const durations: number[] = []

  // 根据段落类型调整帧密度
  // Chorus（高潮）段落 → 更多帧（快切）
  // Verse（主歌）段落 → 正常帧密度
  // Intro/Outro → 较少帧（慢节奏）

  const segmentFrameDensity: Record<AudioSegment['type'], number> = {
    intro: 0.7,    // 较慢
    verse: 1.0,    // 正常
    chorus: 1.5,   // 快切
    bridge: 1.2,   // 稍快
    outro: 0.7,    // 较慢
  }

  // 为每个segment分配帧数
  let remainingFrames = frameCount
  let remainingDuration = totalDuration

  for (let i = 0; i < analysis.segments.length; i++) {
    const segment = analysis.segments[i]
    const segmentDuration = segment.endTime - segment.startTime
    const density = segmentFrameDensity[segment.type]

    // 该segment应分配的帧数
    const framesForSegment = Math.round(
      (segmentDuration / remainingDuration) * remainingFrames * density
    )

    // 平均每帧时长
    const avgFrameDuration = segmentDuration / framesForSegment

    for (let j = 0; j < framesForSegment && durations.length < frameCount; j++) {
      durations.push(parseFloat(avgFrameDuration.toFixed(2)))
    }

    remainingFrames -= framesForSegment
    remainingDuration -= segmentDuration
  }

  // 如果还有剩余帧，均匀分配
  while (durations.length < frameCount) {
    durations.push(3.5) // 默认3.5秒/帧
  }

  // 确保总时长匹配
  const totalAllocated = durations.reduce((sum, d) => sum + d, 0)
  if (Math.abs(totalAllocated - totalDuration) > 0.1) {
    const scale = totalDuration / totalAllocated
    for (let i = 0; i < durations.length; i++) {
      durations[i] = parseFloat((durations[i] * scale).toFixed(2))
    }
  }

  return durations
}
