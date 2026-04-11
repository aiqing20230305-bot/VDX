/**
 * TechnicalExecutor Agent 测试套件
 * 测试技术执行专家Agent的核心功能
 */
import { describe, it, expect } from 'vitest'
import {
  analyzeSceneTechnicalRequirements,
  selectGenerationEngine,
} from '../technical-executor'

describe('TechnicalExecutor Agent', () => {
  describe('analyzeSceneTechnicalRequirements', () => {
    it('应该识别复杂场景（多物体+快速运动）', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '多个产品快速切换展示，镜头快速推拉',
        emotion: '激动',
        visualFocus: '多个物体',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(result.complexity).toBe('complex')
      expect(result.motionIntensity).toBe('fast')
    })

    it('应该识别简单场景（单物体+静态）', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '产品静态展示，特写镜头',
        emotion: '平静',
        visualFocus: '产品细节',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(result.complexity).toBe('simple')
      expect(['static', 'slow']).toContain(result.motionIntensity)
    })

    it('应该识别中等复杂度场景', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '两个人物对话，轻微移动',
        emotion: '日常',
        visualFocus: '人物表情',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(result.complexity).toBe('medium')
    })

    it('应该根据关键词识别运动强度', () => {
      const fastScene = {
        sceneNumber: 1,
        duration: 3,
        description: '快速奔跑、跳跃、翻滚动作',
        emotion: '激烈',
        visualFocus: '动作',
      }

      const slowScene = {
        sceneNumber: 2,
        duration: 5,
        description: '慢慢走路，静静思考',
        emotion: '平静',
        visualFocus: '背景',
      }

      const fastResult = analyzeSceneTechnicalRequirements(fastScene)
      const slowResult = analyzeSceneTechnicalRequirements(slowScene)

      expect(fastResult.motionIntensity).toBe('fast')
      expect(slowResult.motionIntensity).toBe('slow')
    })

    it('应该返回推荐引擎', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '产品展示',
        emotion: '平静',
        visualFocus: '产品',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(['seedance', 'kling']).toContain(result.recommendedEngine)
    })

    it('应该识别风格类型', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '艺术风格的产品展示',
        emotion: '艺术',
        visualFocus: '产品',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(['realistic', 'artistic', 'mixed']).toContain(result.styleType)
    })

    it('应该提供置信度评分', () => {
      const scene = {
        sceneNumber: 1,
        duration: 5,
        description: '产品展示',
        emotion: '平静',
        visualFocus: '产品',
      }

      const result = analyzeSceneTechnicalRequirements(scene)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('selectGenerationEngine', () => {
    it('应该为成本有限选择Seedance', () => {
      const analysis = {
        complexity: 'simple' as const,
        motionIntensity: 'slow' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.9,
      }

      const result = selectGenerationEngine(analysis, { budget: 'low' })

      expect(result.primary).toBe('seedance')
      expect(result.reason).toContain('成本')
    })

    it('应该为高质量写实场景选择Kling', () => {
      const analysis = {
        complexity: 'complex' as const,
        motionIntensity: 'fast' as const,
        styleType: 'realistic' as const,
        recommendedEngine: 'kling' as const,
        confidence: 0.95,
      }

      const result = selectGenerationEngine(analysis, { quality: 'premium' })

      expect(result.primary).toBe('kling')
      expect(result.reason).toContain('质量')
    })

    it('应该为艺术风格选择Seedance', () => {
      const analysis = {
        complexity: 'medium' as const,
        motionIntensity: 'medium' as const,
        objectCount: 'few' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.88,
      }

      const result = selectGenerationEngine(analysis)

      expect(result.primary).toBe('seedance')
      expect(result.reason).toContain('艺术')
    })

    it('应该为快速运动选择Kling', () => {
      const analysis = {
        complexity: 'complex' as const,
        motionIntensity: 'fast' as const,
        objectCount: 'many' as const,
        styleType: 'realistic' as const,
        recommendedEngine: 'kling' as const,
        confidence: 0.92,
      }

      const result = selectGenerationEngine(analysis)

      expect(result.primary).toBe('kling')
      expect(result.reason).toContain('运动')
    })

    it('应该提供合理的fallback引擎', () => {
      const analysis = {
        complexity: 'medium' as const,
        motionIntensity: 'medium' as const,
        objectCount: 'few' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.85,
      }

      const result = selectGenerationEngine(analysis)

      expect(result.fallback).toBeDefined()
      expect(result.fallback).not.toBe(result.primary)
    })

    it('应该根据场景类型提供合理选择', () => {
      const artisticAnalysis = {
        complexity: 'simple' as const,
        motionIntensity: 'slow' as const,
        objectCount: 'single' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.9,
      }

      const realisticAnalysis = {
        complexity: 'complex' as const,
        motionIntensity: 'fast' as const,
        objectCount: 'many' as const,
        styleType: 'realistic' as const,
        recommendedEngine: 'kling' as const,
        confidence: 0.94,
      }

      const artisticResult = selectGenerationEngine(artisticAnalysis)
      const realisticResult = selectGenerationEngine(realisticAnalysis, { quality: 'premium' })

      // 艺术场景应该选Seedance
      expect(artisticResult.primary).toBe('seedance')

      // 写实场景应该选Kling
      expect(realisticResult.primary).toBe('kling')
    })

    it('应该包含选择原因说明', () => {
      const analysis = {
        complexity: 'medium' as const,
        motionIntensity: 'medium' as const,
        objectCount: 'few' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.87,
      }

      const result = selectGenerationEngine(analysis)

      expect(result.reason).toBeDefined()
      expect(result.reason.length).toBeGreaterThan(0)
    })

    it('应该使用推荐引擎作为默认选择', () => {
      const seedanceRecommended = {
        complexity: 'simple' as const,
        motionIntensity: 'slow' as const,
        objectCount: 'single' as const,
        styleType: 'artistic' as const,
        recommendedEngine: 'seedance' as const,
        confidence: 0.91,
      }

      const klingRecommended = {
        complexity: 'complex' as const,
        motionIntensity: 'fast' as const,
        objectCount: 'many' as const,
        styleType: 'realistic' as const,
        recommendedEngine: 'kling' as const,
        confidence: 0.93,
      }

      const seedanceResult = selectGenerationEngine(seedanceRecommended)
      const klingResult = selectGenerationEngine(klingRecommended)

      // 在没有特殊约束时，应该使用推荐引擎
      expect([seedanceResult.primary, seedanceResult.fallback]).toContain('seedance')
      expect([klingResult.primary, klingResult.fallback]).toContain('kling')
    })
  })
})
