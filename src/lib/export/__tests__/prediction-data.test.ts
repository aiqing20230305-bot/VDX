/**
 * 预测数据收集测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  recordExportData,
  getExportRecords,
  clearExportRecords,
  getRecordStats,
  calculateSceneComplexity,
  extractTransitionTypes,
  type ExportFeatures,
  type ExportActuals,
} from '../prediction-data'

describe('prediction-data', () => {
  beforeEach(() => {
    clearExportRecords()
  })

  afterEach(() => {
    clearExportRecords()
  })

  describe('recordExportData', () => {
    it('记录单条导出数据', () => {
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

      const actuals: ExportActuals = {
        renderTime: 60,
        fileSize: 50 * 1024 * 1024,
        timestamp: Date.now(),
      }

      recordExportData(features, actuals)

      const records = getExportRecords()
      expect(records).toHaveLength(1)
      expect(records[0].features).toEqual(features)
      expect(records[0].actuals).toEqual(actuals)
      expect(records[0].id).toBeDefined()
    })

    it('记录多条数据', () => {
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
            fileSize: 50 * 1024 * 1024,
            timestamp: Date.now(),
          }
        )
      }

      const records = getExportRecords()
      expect(records).toHaveLength(5)
    })

    it('最多保留 100 条记录', () => {
      // 添加 120 条记录
      for (let i = 0; i < 120; i++) {
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

      const records = getExportRecords()
      expect(records).toHaveLength(100)
    })
  })

  describe('clearExportRecords', () => {
    it('清空所有记录', () => {
      // 添加 3 条记录
      for (let i = 0; i < 3; i++) {
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

      expect(getExportRecords()).toHaveLength(3)

      clearExportRecords()

      expect(getExportRecords()).toHaveLength(0)
    })
  })

  describe('getRecordStats', () => {
    it('无记录时返回空统计', () => {
      const stats = getRecordStats()

      expect(stats.count).toBe(0)
      expect(stats.avgRenderTime).toBe(0)
      expect(stats.avgFileSize).toBe(0)
      expect(stats.formatDistribution).toEqual({})
    })

    it('计算平均渲染时间和文件大小', () => {
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
          fileSize: 100 * 1024 * 1024,
          timestamp: Date.now(),
        }
      )

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
          renderTime: 80,
          fileSize: 150 * 1024 * 1024,
          timestamp: Date.now(),
        }
      )

      const stats = getRecordStats()

      expect(stats.count).toBe(2)
      expect(stats.avgRenderTime).toBe(70) // (60 + 80) / 2
      expect(stats.avgFileSize).toBe(125 * 1024 * 1024) // (100 + 150) / 2
    })

    it('统计格式分布', () => {
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
          fileSize: 100 * 1024 * 1024,
          timestamp: Date.now(),
        }
      )

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
          format: 'webm',
          quality: 80,
        },
        {
          renderTime: 60,
          fileSize: 100 * 1024 * 1024,
          timestamp: Date.now(),
        }
      )

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
          fileSize: 100 * 1024 * 1024,
          timestamp: Date.now(),
        }
      )

      const stats = getRecordStats()

      expect(stats.formatDistribution).toEqual({
        mp4: 2,
        webm: 1,
      })
    })
  })

  describe('calculateSceneComplexity', () => {
    it('无帧时返回 0', () => {
      expect(calculateSceneComplexity([])).toBe(0)
    })

    it('所有静态帧返回 0', () => {
      const frames = [
        { cameraMove: 'static', duration: 3 },
        { cameraMove: 'static', duration: 3 },
        { cameraMove: 'static', duration: 3 },
      ]

      expect(calculateSceneComplexity(frames)).toBe(0)
    })

    it('有相机移动时增加复杂度', () => {
      const frames = [
        { cameraMove: 'pan', duration: 3 },
        { cameraMove: 'static', duration: 3 },
        { cameraMove: 'zoom', duration: 3 },
      ]

      const complexity = calculateSceneComplexity(frames)

      // 2 个动态帧，每个 +1，总分 2
      // 最大分数 = 3 * 1.5 = 4.5
      // 复杂度 = 2 / 4.5 ≈ 0.44
      expect(complexity).toBeGreaterThan(0.4)
      expect(complexity).toBeLessThan(0.5)
    })

    it('短时长帧增加复杂度', () => {
      const frames = [
        { cameraMove: 'static', duration: 2 }, // 短帧 +0.5
        { cameraMove: 'static', duration: 3 },
        { cameraMove: 'static', duration: 5 },
      ]

      const complexity = calculateSceneComplexity(frames)

      // 1 个短帧，+0.5
      // 最大分数 = 3 * 1.5 = 4.5
      // 复杂度 = 0.5 / 4.5 ≈ 0.11
      expect(complexity).toBeGreaterThan(0.1)
      expect(complexity).toBeLessThan(0.15)
    })

    it('归一化到 0-1 范围', () => {
      const frames = [
        { cameraMove: 'pan', duration: 2 },
        { cameraMove: 'zoom', duration: 2 },
        { cameraMove: 'rotate', duration: 2 },
      ]

      const complexity = calculateSceneComplexity(frames)

      expect(complexity).toBeGreaterThanOrEqual(0)
      expect(complexity).toBeLessThanOrEqual(1)
    })
  })

  describe('extractTransitionTypes', () => {
    it('无帧时返回空数组', () => {
      expect(extractTransitionTypes([])).toEqual([])
    })

    it('提取转场类型', () => {
      const frames = [
        { transition: 'fade' },
        { transition: 'slide' },
        { transition: 'zoom' },
      ]

      const types = extractTransitionTypes(frames)

      expect(types).toEqual(['fade', 'slide', 'zoom'])
    })

    it('去重重复类型', () => {
      const frames = [
        { transition: 'fade' },
        { transition: 'slide' },
        { transition: 'fade' },
        { transition: 'fade' },
      ]

      const types = extractTransitionTypes(frames)

      expect(types).toEqual(['fade', 'slide'])
    })

    it('默认使用 fade', () => {
      const frames = [
        { /* no transition */ },
        { transition: 'slide' },
      ]

      const types = extractTransitionTypes(frames)

      expect(types).toContain('fade')
      expect(types).toContain('slide')
    })
  })
})
