/**
 * TechnicalExecutor Agent - 技术执行专家
 *
 * 角色：技术总监 + 制作管家
 * 职责：分析技术可行性、选择最佳链路、优化生成参数
 */

import type { ChatMessage } from '@/types'
import type { ContentDirectorOutput } from './content-director'

// Agent定义
export const TECHNICAL_EXECUTOR_AGENT = {
  id: 'technical-executor',
  name: '技术执行专家',
  role: '技术总监 + 制作管家',
  avatar: '⚙️',
  description: '我负责将创意方案转化为技术实现，选择最佳工具链路，优化生成效果',

  capabilities: [
    '技术可行性分析',
    '工具链路选择',
    '参数优化配置',
    '质量控制',
    '成本预估',
    '风险管理',
  ],

  systemPrompt: `你是「技术执行专家」，一位经验丰富的视频制作技术总监。

🎯 核心能力：
1. **技术评估** - 分析创意需求，判断技术可行性和难度
2. **链路设计** - 选择最佳工具组合（Seedance/Kling/Remotion/FFmpeg）
3. **参数优化** - 调整生成参数，平衡质量、速度、成本
4. **质量保证** - 预测潜在问题，提供降级方案

⚙️ 技术栈掌握：
**AI生成引擎**：
- Seedance (即梦) - 适合风格化、艺术表达、角色一致性
- Kling (可灵) - 适合写实、运动复杂、长时长
- Dreamina (即梦) - 图片生成，支持风格转换

**视频处理**：
- Remotion - 程序化视频合成，适合字幕/特效/转场
- FFmpeg - 底层视频处理，拼接/转码/滤镜

**智能路由**：
- 4种策略：质量优先/速度优先/成本优先/平衡模式
- 自动分析场景复杂度和运动强度

🤝 协作模式：
- 接收内容架构师的创意方案
- 分析每个场景的技术需求
- 提出可行的实现方案（含备选）
- 预估时间和成本
- 执行生成任务，监控质量
- 遇到问题时，与内容架构师沟通调整方案

📊 决策框架：
**选择Seedance场景**：
- 艺术风格强烈（动漫/插画/概念艺术）
- 需要角色一致性（IP视频）
- 时长较短（5-15秒）
- 运动简单（镜头缓慢/静态）

**选择Kling场景**：
- 写实风格（真人/纪实）
- 复杂运动（快速/多物体）
- 时长较长（15-30秒）
- 需要高质量（4K）

**选择Remotion场景**：
- 文字动画（标题/字幕/弹幕）
- 程序化效果（转场/特效）
- 精确控制（逐帧操作）

⚠️ 技术限制：
- Seedance: 最长15秒，艺术风格，运动简单
- Kling: 最长30秒，写实风格，成本较高
- 当前无音频生成能力（可接入外部音乐）

回复风格：
- 用技术人员能懂的专业术语
- 明确说明"为什么选这个工具"
- 提供量化指标（时间/成本/质量评分）
- 主动提出备选方案和风险`,
}

// Agent输入输出类型
export interface TechnicalExecutorInput {
  // 来自ContentDirector的创意方案
  creativeProposal: ContentDirectorOutput

  // 技术约束
  constraints?: {
    maxDuration?: number // 最大时长（秒）
    budget?: 'low' | 'medium' | 'high' // 成本预算
    quality?: 'draft' | 'standard' | 'premium' // 质量要求
    deadline?: number // 交付时间（小时）
  }

  // 用户设备
  userContext?: {
    device: 'mobile' | 'desktop'
    network: 'slow' | 'fast'
    storageAvailable: number // MB
  }
}

export interface TechnicalExecutorOutput {
  // 技术方案
  executionPlan: {
    // 总体策略
    strategy: 'quality' | 'speed' | 'cost' | 'balanced'
    estimatedTime: number // 分钟
    estimatedCost: number // 相对成本（1-10）

    // 场景级执行计划
    scenes: {
      sceneNumber: number
      description: string

      // 生成方案
      generationPlan: {
        engine: 'seedance' | 'kling' | 'remotion' | 'static'
        reason: string // 选择这个引擎的原因

        // 参数配置
        parameters: {
          resolution?: '720p' | '1080p' | '4K'
          fps?: 24 | 30 | 60
          duration: number
          style?: string
          motion?: 'static' | 'slow' | 'medium' | 'fast'
        }

        // 备选方案
        fallback?: {
          engine: 'seedance' | 'kling' | 'static'
          reason: string
        }
      }

      // 预期质量
      expectedQuality: {
        visual: number // 0-10
        motion: number // 0-10
        consistency: number // 0-10
      }

      // 风险评估
      risks: {
        level: 'low' | 'medium' | 'high'
        issues: string[]
        mitigation: string[]
      }
    }[]

    // 后处理计划
    postProcessing: {
      tasks: ('concat' | 'transition' | 'subtitle' | 'audio' | 'filter')[]
      tool: 'remotion' | 'ffmpeg'
      estimatedTime: number // 分钟
    }
  }

  // 给内容架构师的反馈
  feedbackToDirector?: {
    infeasibleRequirements: string[] // 无法实现的需求
    suggestedAdjustments: string[] // 建议调整
    alternativeApproaches: string[] // 替代方案
  }
}

/**
 * 调用TechnicalExecutor Agent
 */
export async function invokeTechnicalExecutor(
  input: TechnicalExecutorInput
): Promise<TechnicalExecutorOutput> {
  const { creativeProposal, constraints } = input

  // 1. 分析每个场景的技术需求
  const sceneAnalyses = creativeProposal.storyboardOutline.map(scene => ({
    scene,
    analysis: analyzeSceneTechnicalRequirements(scene),
  }))

  // 2. 为每个场景选择最佳引擎
  const scenePlans = sceneAnalyses.map(({ scene, analysis }) => {
    const engineSelection = selectGenerationEngine(analysis, constraints)

    return {
      sceneNumber: scene.sceneNumber,
      description: scene.description,
      generationPlan: {
        engine: engineSelection.primary,
        reason: engineSelection.reason,
        parameters: {
          resolution: (constraints?.quality === 'premium' ? '1080p' : '720p') as '720p' | '1080p',
          fps: 30 as 24 | 30 | 60,
          duration: scene.duration,
          style: (creativeProposal as any).visualStyle?.overallTone || 'natural',
          motion: analysis.motionIntensity,
        },
        fallback: {
          engine: engineSelection.fallback,
          reason: `备用方案：${engineSelection.fallback}`,
        },
      },
      expectedQuality: {
        visual: analysis.styleType === 'artistic' && engineSelection.primary === 'seedance' ? 9 : 7,
        motion: analysis.motionIntensity === 'fast' && engineSelection.primary === 'kling' ? 9 : 7,
        consistency: 8,
      },
      risks: {
        level: analysis.complexity === 'complex' ? 'high' : (analysis.complexity === 'medium' ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        issues: analysis.complexity === 'complex' ? ['场景复杂度高，可能生成失败'] : [],
        mitigation: analysis.complexity === 'complex' ? ['使用备用引擎', '简化场景描述'] : [],
      },
    }
  })

  // 3. 计算总体估算
  const totalDuration = creativeProposal.storyboardOutline.reduce((sum, s) => sum + s.duration, 0)
  const klingScenesCount = scenePlans.filter(p => p.generationPlan.engine === 'kling').length
  const seedanceScenesCount = scenePlans.filter(p => p.generationPlan.engine === 'seedance').length

  const estimatedTime = (klingScenesCount * 3 + seedanceScenesCount * 1.5) // 分钟
  const estimatedCost = klingScenesCount * 3 + seedanceScenesCount * 1 // 相对成本

  // 4. 确定策略
  let strategy: 'quality' | 'speed' | 'cost' | 'balanced' = 'balanced'
  if (constraints?.budget === 'low') strategy = 'cost'
  else if (constraints?.quality === 'premium') strategy = 'quality'
  else if (constraints?.deadline && constraints.deadline < estimatedTime / 60) strategy = 'speed'

  // 5. 检查是否有不可行的需求
  const infeasibleRequirements: string[] = []
  if (totalDuration > 180) {
    infeasibleRequirements.push('视频总时长超过3分钟，建议分段生成')
  }
  if (creativeProposal.technicalRequirements.complexity === 'complex') {
    infeasibleRequirements.push('部分场景复杂度过高，建议简化或分解')
  }

  return {
    executionPlan: {
      strategy,
      estimatedTime: Math.ceil(estimatedTime),
      estimatedCost,
      scenes: scenePlans,
      postProcessing: {
        tasks: ['concat', 'subtitle'],
        tool: 'remotion',
        estimatedTime: 2,
      },
    },
    ...(infeasibleRequirements.length > 0 && {
      feedbackToDirector: {
        infeasibleRequirements,
        suggestedAdjustments: [
          '建议缩短总时长到2分钟以内',
          '简化复杂场景的运动和特效',
        ],
        alternativeApproaches: [
          '分多个短视频制作，后期拼接',
          '使用静态图片+字幕代替部分复杂场景',
        ],
      },
    }),
  }
}

/**
 * 分析场景技术需求
 */
export function analyzeSceneTechnicalRequirements(scene: {
  description: string
  emotion: string
  visualFocus: string
  duration: number
}): {
  complexity: 'simple' | 'medium' | 'complex'
  motionIntensity: 'static' | 'slow' | 'medium' | 'fast'
  styleType: 'realistic' | 'artistic' | 'mixed'
  recommendedEngine: 'seedance' | 'kling'
  confidence: number // 0-1
} {
  const desc = scene.description.toLowerCase()

  // 1. 分析复杂度
  let complexity: 'simple' | 'medium' | 'complex' = 'simple'
  const complexityKeywords = ['多个', '复杂', '快速', '混乱', '变化', '切换']
  const simpleKeywords = ['静止', '静态', '单一', '简单', '固定', '缓慢', '特写', '细节']

  if (complexityKeywords.some(kw => desc.includes(kw))) complexity = 'complex'
  else if (!simpleKeywords.some(kw => desc.includes(kw))) complexity = 'medium'

  // 2. 分析运动强度
  let motionIntensity: 'static' | 'slow' | 'medium' | 'fast' = 'slow'
  const fastMotionKeywords = ['快速', '急速', '飞行', '奔跑', '追逐', '爆炸', '跳跃', '翻滚']
  const staticKeywords = ['静止', '定格', '静态', '不动', '展示']
  const slowKeywords = ['缓慢', '平缓', '轻柔', '漂浮', '慢慢', '静静', '轻轻']

  if (fastMotionKeywords.some(kw => desc.includes(kw))) motionIntensity = 'fast'
  else if (staticKeywords.some(kw => desc.includes(kw))) motionIntensity = 'static'
  else if (slowKeywords.some(kw => desc.includes(kw))) motionIntensity = 'slow'
  else motionIntensity = 'medium'

  // 3. 分析风格类型
  let styleType: 'realistic' | 'artistic' | 'mixed' = 'realistic'
  const artisticKeywords = ['动漫', '插画', '手绘', '水彩', '油画', '抽象', '梦幻', '幻想']
  const realisticKeywords = ['真实', '写实', '纪实', '实拍', '真人']

  if (artisticKeywords.some(kw => desc.includes(kw))) styleType = 'artistic'
  else if (realisticKeywords.some(kw => desc.includes(kw))) styleType = 'realistic'
  else if (scene.emotion.includes('梦幻') || scene.emotion.includes('幻想')) styleType = 'mixed'

  // 4. 推荐引擎
  let recommendedEngine: 'seedance' | 'kling' = 'seedance'
  let confidence = 0.7

  // Kling适用场景：写实 + 复杂运动 + 长时长
  if (styleType === 'realistic' && (motionIntensity === 'fast' || motionIntensity === 'medium') && scene.duration > 10) {
    recommendedEngine = 'kling'
    confidence = 0.85
  }
  // Seedance适用场景：艺术风格 + 简单运动 + 短时长
  else if (styleType === 'artistic' && motionIntensity !== 'fast' && scene.duration <= 15) {
    recommendedEngine = 'seedance'
    confidence = 0.9
  }
  // 其他情况：默认Seedance（成本较低）
  else {
    recommendedEngine = 'seedance'
    confidence = 0.6
  }

  return {
    complexity,
    motionIntensity,
    styleType,
    recommendedEngine,
    confidence,
  }
}

/**
 * 选择最佳生成引擎
 */
export function selectGenerationEngine(
  sceneAnalysis: ReturnType<typeof analyzeSceneTechnicalRequirements>,
  constraints?: TechnicalExecutorInput['constraints']
): {
  primary: 'seedance' | 'kling'
  fallback: 'seedance' | 'kling' | 'static'
  reason: string
} {
  // 基于约束和场景分析选择引擎

  // 成本优先 → Seedance
  if (constraints?.budget === 'low') {
    return {
      primary: 'seedance',
      fallback: 'static',
      reason: '成本预算有限，选择Seedance（成本较低）',
    }
  }

  // 质量优先 + 写实风格 → Kling
  if (constraints?.quality === 'premium' && sceneAnalysis.styleType === 'realistic') {
    return {
      primary: 'kling',
      fallback: 'seedance',
      reason: '高质量写实场景，选择Kling（质量最佳）',
    }
  }

  // 艺术风格 → Seedance
  if (sceneAnalysis.styleType === 'artistic') {
    return {
      primary: 'seedance',
      fallback: 'static',
      reason: '艺术风格场景，Seedance表现力更强',
    }
  }

  // 复杂运动 → Kling
  if (sceneAnalysis.motionIntensity === 'fast') {
    return {
      primary: 'kling',
      fallback: 'seedance',
      reason: '复杂快速运动，Kling处理能力更强',
    }
  }

  // 默认平衡选择
  return {
    primary: sceneAnalysis.recommendedEngine,
    fallback: sceneAnalysis.recommendedEngine === 'kling' ? 'seedance' : 'kling',
    reason: '基于场景分析的平衡选择',
  }
}
