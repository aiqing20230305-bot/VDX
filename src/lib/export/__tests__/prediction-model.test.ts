/**
 * ML 预测模型测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  trainModels,
  predictRenderTime,
  predictFileSize,
  isModelTrained,
  autoTrain,
  clearModels,
} from '../prediction-model'
import {
  recordExportData,
  getExportRecords,
  clearExportRecords,
  type ExportFeatures,
} from '../prediction-data'

describe('prediction-model', () => {
  beforeEach(() => {
    // 清空 localStorage 和模型
    clearExportRecords()
    clearModels()
  })

  afterEach(() => {
    clearExportRecords()
    clearModels()
  })

  describe('训练前状态', () => {
    it('模型未训练时返回 false', () => {
      expect(isModelTrained()).toBe(false)
    })

    it('预测渲染时间返回 null', () => {
      const features: ExportFeatures = {
        frameCount: 10,
        resolution: '1080p',
        fps: 30,
        videoDuration: 30,
        sceneComplexity: 0.5,
        transitionCount: 9,
        transitionTypes: ['fade'],
        hasAudio: true,
        hasSubtitles: false,
        hasWatermark: false,
        subtitleTrackCount: 0,
        format: 'mp4',
        quality: 80,
      }

      expect(predictRenderTime(features)).toBeNull()
    })

    it('预测文件大小返回 null', () => {
      const features: ExportFeatures = {
        frameCount: 10,
        resolution: '1080p',
        fps: 30,
        videoDuration: 30,
        sceneComplexity: 0.5,
        transitionCount: 9,
        transitionTypes: ['fade'],
        hasAudio: true,
        hasSubtitles: false,
        hasWatermark: false,
        subtitleTrackCount: 0,
        format: 'mp4',
        quality: 80,
      }

      expect(predictFileSize(features)).toBeNull()
    })
  })

  describe('数据不足时训练失败', () => {
    it('少于 10 条记录时训练失败', () => {
      // 添加 5 条记录
      for (let i = 0; i < 5; i++) {
        recordExportData(
          {
            frameCount: 10 + i,
            resolution: '1080p',
            fps: 30,
            videoDuration: 30 + i * 5,
            sceneComplexity: 0.5,
            transitionCount: 9 + i,
            transitionTypes: ['fade'],
            hasAudio: true,
            hasSubtitles: false,
            hasWatermark: false,
            subtitleTrackCount: 0,
            format: 'mp4',
            quality: 80,
          },
          {
            renderTime: 60 + i * 10,
            fileSize: 50 * 1024 * 1024 + i * 5 * 1024 * 1024,
            timestamp: Date.now(),
          }
        )
      }

      const result = trainModels()

      expect(result.success).toBe(false)
      expect(result.recordCount).toBe(5)
      expect(result.error).toContain('Not enough data')
      expect(isModelTrained()).toBe(false)
    })
  })

  describe('有足够数据时训练成功', () => {
    beforeEach(() => {
      // 添加 15 条模拟数据
      // 规律：渲染时间 ≈ 视频时长 * 2, 文件大小 ≈ 视频时长 * 10MB
      for (let i = 0; i < 15; i++) {
        const duration = 20 + i * 5 // 20, 25, 30, ... 90
        const renderTime = duration * 2 + (Math.random() - 0.5) * 10 // ±5s 噪声
        const fileSize = duration * 10 * 1024 * 1024 + (Math.random() - 0.5) * 5 * 1024 * 1024 // ±2.5MB

        recordExportData(
          {
            frameCount: Math.round(duration / 3),
            resolution: '1080p',
            fps: 30,
            videoDuration: duration,
            sceneComplexity: 0.5,
            transitionCount: Math.round(duration / 3) - 1,
            transitionTypes: ['fade'],
            hasAudio: true,
            hasSubtitles: false,
            hasWatermark: false,
            subtitleTrackCount: 0,
            format: 'mp4',
            quality: 80,
          },
          {
            renderTime,
            fileSize,
            timestamp: Date.now(),
          }
        )
      }
    })

    it('训练成功并标记已训练', () => {
      const result = trainModels()

      expect(result.success).toBe(true)
      expect(result.recordCount).toBe(15)
      expect(result.error).toBeUndefined()
      expect(isModelTrained()).toBe(true)
    })

    it('预测渲染时间返回合理值', () => {
      trainModels()

      const features: ExportFeatures = {
        frameCount: 20,
        resolution: '1080p',
        fps: 30,
        videoDuration: 60,
        sceneComplexity: 0.5,
        transitionCount: 19,
        transitionTypes: ['fade'],
        hasAudio: true,
        hasSubtitles: false,
        hasWatermark: false,
        subtitleTrackCount: 0,
        format: 'mp4',
        quality: 80,
      }

      const predicted = predictRenderTime(features)

      expect(predicted).not.toBeNull()
      expect(predicted!).toBeGreaterThan(0)
      // 预期：60s * 2 = 120s，允许 ±30% 误差
      expect(predicted!).toBeGreaterThan(80)
      expect(predicted!).toBeLessThan(160)
    })

    it('预测文件大小返回合理值', () => {
      trainModels()

      const features: ExportFeatures = {
        frameCount: 20,
        resolution: '1080p',
        fps: 30,
        videoDuration: 60,
        sceneComplexity: 0.5,
        transitionCount: 19,
        transitionTypes: ['fade'],
        hasAudio: true,
        hasSubtitles: false,
        hasWatermark: false,
        subtitleTrackCount: 0,
        format: 'mp4',
        quality: 80,
      }

      const predicted = predictFileSize(features)

      expect(predicted).not.toBeNull()
      expect(predicted!).toBeGreaterThan(0)
      // 预期：60s * 10MB = 600MB，允许 ±30% 误差
      const expectedMB = 600 * 1024 * 1024
      expect(predicted!).toBeGreaterThan(expectedMB * 0.7)
      expect(predicted!).toBeLessThan(expectedMB * 1.3)
    })
  })

  describe('autoTrain 自动训练', () => {
    it('数据不足时不训练', () => {
      // 只有 5 条记录
      for (let i = 0; i < 5; i++) {
        recordExportData(
          {
            frameCount: 10,
            resolution: '1080p',
            fps: 30,
            videoDuration: 30,
            sceneComplexity: 0.5,
            transitionCount: 9,
            transitionTypes: ['fade'],
            hasAudio: true,
            hasSubtitles: false,
            hasWatermark: false,
            subtitleTrackCount: 0,
            format: 'mp4',
            quality: 80,
          },
          {
            renderTime: 60,
            fileSize: 50 * 1024 * 1024,
            timestamp: Date.now(),
          }
        )
      }

      autoTrain()

      expect(isModelTrained()).toBe(false)
    })

    it('有足够数据且未训练时自动训练', () => {
      // 添加 12 条记录
      for (let i = 0; i < 12; i++) {
        recordExportData(
          {
            frameCount: 10,
            resolution: '1080p',
            fps: 30,
            videoDuration: 30 + i * 5,
            sceneComplexity: 0.5,
            transitionCount: 9,
            transitionTypes: ['fade'],
            hasAudio: true,
            hasSubtitles: false,
            hasWatermark: false,
            subtitleTrackCount: 0,
            format: 'mp4',
            quality: 80,
          },
          {
            renderTime: 60 + i * 10,
            fileSize: 50 * 1024 * 1024,
            timestamp: Date.now(),
          }
        )
      }

      autoTrain()

      expect(isModelTrained()).toBe(true)
    })

    it('已训练时不重复训练', () => {
      // 添加 12 条记录并训练
      for (let i = 0; i < 12; i++) {
        recordExportData(
          {
            frameCount: 10,
            resolution: '1080p',
            fps: 30,
            videoDuration: 30 + i * 5,
            sceneComplexity: 0.5,
            transitionCount: 9,
            transitionTypes: ['fade'],
            hasAudio: true,
            hasSubtitles: false,
            hasWatermark: false,
            subtitleTrackCount: 0,
            format: 'mp4',
            quality: 80,
          },
          {
            renderTime: 60 + i * 10,
            fileSize: 50 * 1024 * 1024,
            timestamp: Date.now(),
          }
        )
      }

      autoTrain()
      expect(isModelTrained()).toBe(true)

      // 再次调用不应报错
      autoTrain()
      expect(isModelTrained()).toBe(true)
    })
  })
})
