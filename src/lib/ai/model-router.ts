/**
 * 多模型路由引擎
 * 根据分镜特征智能选择最优生成模型（Seedance vs Kling）
 *
 * 设计理念：
 * - 风格驱动：不同视频风格适合不同模型
 * - 特征分析：场景复杂度、运动强度、人物/文字等
 * - 策略灵活：支持质量优先/速度优先/成本优先/平衡模式
 * - 混合生成：允许同一视频使用不同模型
 *
 * @version 1.5.0
 */

import type {
  ModelType,
  ModelCapabilities,
  StoryboardFrame,
  StyleAnalysisResult,
  ModelRoutingDecision,
  ModelRoutingStrategy,
  ModelRoutingResult,
  VideoStyle,
  SceneComplexity,
  MotionIntensity,
} from '@/types'

// ============================================================
// 模型能力矩阵
// ============================================================

export const MODEL_CAPABILITIES: Record<ModelType, ModelCapabilities> = {
  seedance: {
    model: 'seedance',
    strengths: [
      '写实风格',
      '静态场景',
      '产品展示',
      '风景镜头',
      '简单运镜',
      '高清质量',
    ],
    weaknesses: [
      '快速动作',
      '复杂角色运动',
      '多人物交互',
      '极端镜头运动',
    ],
    bestForStyles: ['realistic', 'documentary', 'commercial', 'cinematic'],
    maxDuration: 10,
    costPerSecond: 1.0,
    qualityScore: 9,
    speedScore: 7,
    consistencyScore: 8,
  },
  kling: {
    model: 'kling',
    strengths: [
      '动态场景',
      '快速动作',
      '角色运动',
      '多人物交互',
      '动画风格',
      '特效镜头',
    ],
    weaknesses: [
      '极致写实',
      '细节纹理',
      '静态产品',
      '长时长稳定性',
    ],
    bestForStyles: ['anime', 'cartoon', 'short-drama', 'music-video'],
    maxDuration: 10,
    costPerSecond: 1.2,
    qualityScore: 8,
    speedScore: 6,
    consistencyScore: 7,
  },
}

// ============================================================
// 风格分析引擎
// ============================================================

/**
 * 分析分镜帧特征，推荐最优模型
 */
export function analyzeFrameStyle(frame: StoryboardFrame): StyleAnalysisResult {
  const { description, imagePrompt, cameraAngle, duration } = frame

  // 合并描述文本
  const fullText = [description, imagePrompt, cameraAngle]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // 特征检测
  const hasCharacters = detectCharacters(fullText)
  const hasText = detectText(fullText)
  const hasFastAction = detectFastAction(fullText)
  const hasComplexCamera = detectComplexCamera(fullText)
  const motionIntensity = analyzeMotionIntensity(fullText, duration)
  const complexity = analyzeComplexity(fullText, hasCharacters, hasComplexCamera)
  const keywords = extractKeywords(fullText)

  // 推荐模型
  const { model, confidence } = recommendModel({
    hasCharacters,
    hasFastAction,
    hasComplexCamera,
    motionIntensity,
    complexity,
    keywords,
  })

  return {
    frameIndex: frame.index,
    style: inferStyle(keywords),
    complexity,
    motionIntensity,
    hasCharacters,
    hasText,
    hasFastAction,
    hasComplexCamera,
    keywords,
    recommendedModel: model,
    confidence,
  }
}

/**
 * 批量分析分镜帧
 */
export function analyzeStoryboard(frames: StoryboardFrame[]): StyleAnalysisResult[] {
  return frames.map(analyzeFrameStyle)
}

// ============================================================
// 模型路由决策
// ============================================================

/**
 * 根据分析结果和策略，生成路由决策
 */
export function routeModels(
  analyses: StyleAnalysisResult[],
  strategy: ModelRoutingStrategy = {
    prioritize: 'balanced',
    allowMixedModels: true,
    qualityThreshold: 7,
  }
): ModelRoutingDecision[] {
  return analyses.map((analysis) => {
    const { recommendedModel, confidence, frameIndex } = analysis

    // 强制模型
    if (strategy.forceModel) {
      return {
        frameIndex,
        selectedModel: strategy.forceModel,
        reason: '用户指定模型',
        confidence: 1.0,
        estimatedQuality: MODEL_CAPABILITIES[strategy.forceModel].qualityScore,
        estimatedCost: MODEL_CAPABILITIES[strategy.forceModel].costPerSecond,
      }
    }

    // 根据策略调整选择
    let selectedModel = recommendedModel
    let reason = `基于场景特征推荐（${analysis.keywords.slice(0, 3).join('、')}）`

    switch (strategy.prioritize) {
      case 'quality':
        // 质量优先：选择质量更高的模型
        selectedModel =
          MODEL_CAPABILITIES.seedance.qualityScore >
          MODEL_CAPABILITIES.kling.qualityScore
            ? 'seedance'
            : 'kling'
        reason = '质量优先策略'
        break

      case 'speed':
        // 速度优先：选择速度更快的模型
        selectedModel =
          MODEL_CAPABILITIES.seedance.speedScore >
          MODEL_CAPABILITIES.kling.speedScore
            ? 'seedance'
            : 'kling'
        reason = '速度优先策略'
        break

      case 'cost':
        // 成本优先：选择成本更低的模型
        selectedModel =
          MODEL_CAPABILITIES.seedance.costPerSecond <
          MODEL_CAPABILITIES.kling.costPerSecond
            ? 'seedance'
            : 'kling'
        reason = '成本优先策略'
        break

      case 'balanced':
      default:
        // 平衡模式：使用推荐模型
        selectedModel = recommendedModel
        break
    }

    // 不允许混合模型：统一使用第一帧的选择
    if (!strategy.allowMixedModels && frameIndex > 0) {
      // 保持与第一帧一致（在外层处理）
    }

    const capabilities = MODEL_CAPABILITIES[selectedModel]

    return {
      frameIndex,
      selectedModel,
      reason,
      alternativeModel: selectedModel === 'seedance' ? 'kling' : 'seedance',
      confidence,
      estimatedQuality: capabilities.qualityScore,
      estimatedCost: capabilities.costPerSecond,
    }
  })
}

/**
 * 生成完整路由结果
 */
export function generateRoutingResult(
  storyboardId: string,
  frames: StoryboardFrame[],
  strategy: ModelRoutingStrategy
): ModelRoutingResult {
  // 分析分镜
  const analyses = analyzeStoryboard(frames)

  // 生成决策
  let decisions = routeModels(analyses, strategy)

  // 如果不允许混合模型，统一使用主导模型
  if (!strategy.allowMixedModels) {
    const seedanceCount = decisions.filter((d) => d.selectedModel === 'seedance').length
    const klingCount = decisions.filter((d) => d.selectedModel === 'kling').length
    const dominantModel: ModelType = seedanceCount >= klingCount ? 'seedance' : 'kling'

    decisions = decisions.map((d) => ({
      ...d,
      selectedModel: dominantModel,
      reason: `统一使用 ${dominantModel}（保持一致性）`,
    }))
  }

  // 统计
  const seedanceCount = decisions.filter((d) => d.selectedModel === 'seedance').length
  const klingCount = decisions.filter((d) => d.selectedModel === 'kling').length
  const estimatedTotalCost = decisions.reduce((sum, d) => sum + d.estimatedCost, 0)
  const estimatedAverageQuality =
    decisions.reduce((sum, d) => sum + d.estimatedQuality, 0) / decisions.length

  return {
    storyboardId,
    strategy,
    decisions,
    summary: {
      seedanceCount,
      klingCount,
      estimatedTotalCost,
      estimatedAverageQuality,
    },
    createdAt: new Date(),
  }
}

// ============================================================
// 特征检测函数
// ============================================================

function detectCharacters(text: string): boolean {
  const characterKeywords = [
    '人物', '角色', '人', '男', '女', '孩子', '老人', '青年',
    '面部', '表情', '动作', '姿势', '手', '脸',
    'character', 'person', 'people', 'face', 'figure',
  ]
  return characterKeywords.some((kw) => text.includes(kw))
}

function detectText(text: string): boolean {
  const textKeywords = ['文字', '字幕', '标题', '文本', 'text', 'title', 'subtitle']
  return textKeywords.some((kw) => text.includes(kw))
}

function detectFastAction(text: string): boolean {
  const actionKeywords = [
    '快速', '奔跑', '跳跃', '飞行', '追逐', '战斗', '动作',
    '冲击', '爆炸', '加速', '急速',
    'fast', 'run', 'jump', 'fly', 'chase', 'action', 'explosion',
  ]
  return actionKeywords.some((kw) => text.includes(kw))
}

function detectComplexCamera(text: string): boolean {
  const cameraKeywords = [
    '旋转镜头', '环绕', '快速推进', '拉伸', '甩镜头',
    '360度', '螺旋', '俯冲', '升降',
    'rotate', 'orbit', 'zoom', 'spin', 'swirl', 'dolly',
  ]
  return cameraKeywords.some((kw) => text.includes(kw))
}

function analyzeMotionIntensity(text: string, duration: number): MotionIntensity {
  const staticKeywords = ['静止', '静态', '固定', 'static', 'still', 'fixed']
  const slowKeywords = ['缓慢', '平稳', '慢镜头', 'slow', 'smooth', 'gentle']
  const fastKeywords = ['快速', '急速', '迅速', 'fast', 'rapid', 'quick']
  const dynamicKeywords = ['动态', '激烈', '剧烈', 'dynamic', 'intense', 'violent']

  if (staticKeywords.some((kw) => text.includes(kw))) return 'static'
  if (dynamicKeywords.some((kw) => text.includes(kw))) return 'dynamic'
  if (fastKeywords.some((kw) => text.includes(kw))) return 'fast'
  if (slowKeywords.some((kw) => text.includes(kw))) return 'slow'

  // 根据时长推断：短时长通常运动更快
  if (duration <= 3) return 'medium'
  if (duration >= 6) return 'slow'
  return 'medium'
}

function analyzeComplexity(
  text: string,
  hasCharacters: boolean,
  hasComplexCamera: boolean
): SceneComplexity {
  const complexKeywords = [
    '复杂', '多', '密集', '细节',
    'complex', 'multiple', 'detailed', 'intricate',
  ]
  const simpleKeywords = [
    '简单', '单一', '纯色', '极简',
    'simple', 'single', 'minimal', 'plain',
  ]

  if (complexKeywords.some((kw) => text.includes(kw))) return 'complex'
  if (simpleKeywords.some((kw) => text.includes(kw))) return 'simple'

  // 综合判断
  let score = 0
  if (hasCharacters) score += 1
  if (hasComplexCamera) score += 1
  if (text.length > 100) score += 1

  if (score >= 2) return 'complex'
  if (score === 1) return 'medium'
  return 'simple'
}

function extractKeywords(text: string): string[] {
  const keywords = new Set<string>()

  // 风格关键词
  const styleMap: Record<string, string[]> = {
    写实: ['写实', '真实', 'realistic', 'real'],
    动画: ['动画', '卡通', 'anime', 'cartoon'],
    电影: ['电影', '影视', 'cinematic', 'film'],
    商业: ['产品', '商业', 'commercial', 'product'],
  }

  // 场景关键词
  const sceneMap: Record<string, string[]> = {
    室内: ['室内', '房间', 'indoor', 'room'],
    室外: ['室外', '户外', 'outdoor', 'outside'],
    自然: ['自然', '风景', 'nature', 'landscape'],
    城市: ['城市', '街道', 'city', 'urban'],
  }

  // 检测关键词
  Object.entries({ ...styleMap, ...sceneMap }).forEach(([key, values]) => {
    if (values.some((v) => text.includes(v))) {
      keywords.add(key)
    }
  })

  return Array.from(keywords)
}

function inferStyle(keywords: string[]): VideoStyle {
  if (keywords.includes('动画') || keywords.includes('卡通')) return 'anime'
  if (keywords.includes('电影')) return 'cinematic'
  if (keywords.includes('商业') || keywords.includes('产品')) return 'commercial'
  if (keywords.includes('自然')) return 'documentary'
  return 'realistic'
}

function recommendModel(features: {
  hasCharacters: boolean
  hasFastAction: boolean
  hasComplexCamera: boolean
  motionIntensity: MotionIntensity
  complexity: SceneComplexity
  keywords: string[]
}): { model: ModelType; confidence: number } {
  let score = 0 // 正值倾向 Kling，负值倾向 Seedance

  // 动作和运动
  if (features.hasFastAction) score += 2
  if (features.motionIntensity === 'dynamic') score += 2
  if (features.motionIntensity === 'fast') score += 1
  if (features.motionIntensity === 'static') score -= 2
  if (features.motionIntensity === 'slow') score -= 1

  // 场景复杂度
  if (features.complexity === 'complex') score += 1
  if (features.complexity === 'simple') score -= 1

  // 人物
  if (features.hasCharacters) score += 1

  // 镜头运动
  if (features.hasComplexCamera) score += 1

  // 风格关键词
  if (features.keywords.includes('动画') || features.keywords.includes('卡通')) {
    score += 2
  }
  if (features.keywords.includes('写实') || features.keywords.includes('商业')) {
    score -= 2
  }

  // 决策
  const model: ModelType = score > 0 ? 'kling' : 'seedance'
  const confidence = Math.min(Math.abs(score) / 10, 1.0)

  return { model, confidence }
}
