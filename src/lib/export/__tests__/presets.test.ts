/**
 * 导出预设和预估测试
 */
import { describe, it, expect } from 'vitest'
import {
  EXPORT_PRESETS,
  estimateExport,
  recommendPreset,
  formatFileSize,
  formatRenderTime,
} from '../presets'
import type { ExportConfig, Frame } from '@/types/workspace'

describe('presets', () => {
  describe('EXPORT_PRESETS', () => {
    it('包含 3 个预设', () => {
      expect(EXPORT_PRESETS).toHaveLength(3)
    })

    it('每个预设有必需字段', () => {
      EXPORT_PRESETS.forEach(preset => {
        expect(preset.id).toBeDefined()
        expect(preset.name).toBeDefined()
        expect(preset.description).toBeDefined()
        expect(preset.icon).toBeDefined()
        expect(preset.videoSettings).toBeDefined()
        expect(preset.recommended).toBeDefined()
      })
    })

    it('只有一个推荐预设', () => {
      const recommended = EXPORT_PRESETS.filter(p => p.recommended)
      expect(recommended).toHaveLength(1)
      expect(recommended[0].id).toBe('balanced')
    })
  })

  describe('estimateExport', () => {
    const baseFrames: Frame[] = [
      {
        id: '1',
        index: 0,
        imageUrl: '/test1.jpg',
        imagePrompt: 'test',
        duration: 3,
        sceneDescription: 'Scene 1',
        cameraMove: 'static',
      },
      {
        id: '2',
        index: 1,
        imageUrl: '/test2.jpg',
        imagePrompt: 'test',
        duration: 3,
        sceneDescription: 'Scene 2',
        cameraMove: 'static',
      },
      {
        id: '3',
        index: 2,
        imageUrl: '/test3.jpg',
        imagePrompt: 'test',
        duration: 4,
        sceneDescription: 'Scene 3',
        cameraMove: 'static',
      },
    ]

    const baseConfig: ExportConfig = {
      preset: 'balanced',
      projectInfo: {
        title: 'Test Project',
        description: '',
      },
      videoSettings: {
        resolution: '1080p',
        fps: 30,
        format: 'mp4',
        quality: 80,
      },
      audioSettings: {
        enabled: false,
        source: 'none',
        volume: 80,
      },
      style: {
        theme: 'modern',
        mood: 'professional',
      },
    }

    it('计算视频总时长', () => {
      const estimate = estimateExport(baseFrames, baseConfig)

      expect(estimate.duration).toBe(10) // 3 + 3 + 4
    })

    it('预估渲染时间（1080p 30fps）', () => {
      const estimate = estimateExport(baseFrames, baseConfig)

      // 1080p 系数 2.0，视频 10s → 预期 20s
      expect(estimate.renderTime).toBe(20)
    })

    it('预估文件大小范围', () => {
      const estimate = estimateExport(baseFrames, baseConfig)

      expect(estimate.fileSizeMin).toBeGreaterThan(0)
      expect(estimate.fileSizeMax).toBeGreaterThan(estimate.fileSizeMin)

      // 10s 视频，1080p 30fps，比特率 10000Kbps
      // 预期: 10 * 10000 / 8 / 1024 ≈ 12MB
      // ±10% → 10.8MB - 13.2MB
      expect(estimate.fileSizeMin).toBeGreaterThan(10)
      expect(estimate.fileSizeMax).toBeLessThan(15)
    })

    it('720p 渲染更快', () => {
      const config720p: ExportConfig = {
        ...baseConfig,
        videoSettings: {
          ...baseConfig.videoSettings,
          resolution: '720p',
        },
      }

      const estimate720p = estimateExport(baseFrames, config720p)
      const estimate1080p = estimateExport(baseFrames, baseConfig)

      // 720p 系数 1.5，1080p 系数 2.0
      expect(estimate720p.renderTime).toBeLessThan(estimate1080p.renderTime)
    })

    it('4K 渲染最慢', () => {
      const config4K: ExportConfig = {
        ...baseConfig,
        videoSettings: {
          ...baseConfig.videoSettings,
          resolution: '4k',
        },
      }

      const estimate4K = estimateExport(baseFrames, config4K)
      const estimate1080p = estimateExport(baseFrames, baseConfig)

      // 4K 系数 3.5，1080p 系数 2.0
      expect(estimate4K.renderTime).toBeGreaterThan(estimate1080p.renderTime)
    })

    it('60fps 文件更大', () => {
      const config60fps: ExportConfig = {
        ...baseConfig,
        videoSettings: {
          ...baseConfig.videoSettings,
          fps: 60,
        },
      }

      const estimate60fps = estimateExport(baseFrames, config60fps)
      const estimate30fps = estimateExport(baseFrames, baseConfig)

      expect(estimate60fps.fileSizeMax).toBeGreaterThan(estimate30fps.fileSizeMax)
    })

    it('启用音频增加文件大小', () => {
      const configWithAudio: ExportConfig = {
        ...baseConfig,
        audioSettings: {
          enabled: true,
          source: 'preset',
          volume: 80,
        },
      }

      const estimateWithAudio = estimateExport(baseFrames, configWithAudio)
      const estimateWithoutAudio = estimateExport(baseFrames, baseConfig)

      expect(estimateWithAudio.fileSizeMax).toBeGreaterThan(estimateWithoutAudio.fileSizeMax)
    })

    it('高质量文件更大', () => {
      const configHighQuality: ExportConfig = {
        ...baseConfig,
        videoSettings: {
          ...baseConfig.videoSettings,
          quality: 100,
        },
      }

      const configLowQuality: ExportConfig = {
        ...baseConfig,
        videoSettings: {
          ...baseConfig.videoSettings,
          quality: 50,
        },
      }

      const estimateHigh = estimateExport(baseFrames, configHighQuality)
      const estimateLow = estimateExport(baseFrames, configLowQuality)

      expect(estimateHigh.fileSizeMax).toBeGreaterThan(estimateLow.fileSizeMax)
    })
  })

  describe('recommendPreset', () => {
    it('短视频（<30s）推荐快速导出', () => {
      const frames: Frame[] = [
        {
          id: '1',
          index: 0,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 5,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        },
        {
          id: '2',
          index: 1,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 5,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        },
      ] // 总时长 10s

      expect(recommendPreset(frames)).toBe('fast')
    })

    it('中等视频（30-120s）推荐平衡模式', () => {
      const frames: Frame[] = []
      for (let i = 0; i < 15; i++) {
        frames.push({
          id: `${i}`,
          index: i,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        })
      } // 总时长 60s

      expect(recommendPreset(frames)).toBe('balanced')
    })

    it('动态场景多（>40%）推荐高质量', () => {
      const frames: Frame[] = [
        {
          id: '1',
          index: 0,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'pan',
        },
        {
          id: '2',
          index: 1,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'zoom',
        },
        {
          id: '3',
          index: 2,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        },
        {
          id: '4',
          index: 3,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'rotate',
        },
        {
          id: '5',
          index: 4,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        },
      ] // 总时长 20s，3/5 动态帧 = 60%

      expect(recommendPreset(frames)).toBe('highQuality')
    })

    it('长视频且静态场景推荐平衡模式', () => {
      const frames: Frame[] = []
      for (let i = 0; i < 40; i++) {
        frames.push({
          id: `${i}`,
          index: i,
          imageUrl: '/test.jpg',
          imagePrompt: 'test',
          duration: 4,
          sceneDescription: 'Scene',
          cameraMove: 'static',
        })
      } // 总时长 160s，0% 动态

      expect(recommendPreset(frames)).toBe('balanced')
    })
  })

  describe('formatFileSize', () => {
    it('格式化小文件（<1MB）', () => {
      expect(formatFileSize(0.5)).toBe('512 KB')
    })

    it('格式化大文件（>1GB）', () => {
      expect(formatFileSize(1500)).toBe('1.46 GB')
    })

    it('保留一位小数', () => {
      expect(formatFileSize(123.456)).toBe('123.5 MB')
    })

    it('处理 0', () => {
      expect(formatFileSize(0)).toBe('0 KB')
    })
  })

  describe('formatRenderTime', () => {
    it('格式化秒数（<60s）', () => {
      expect(formatRenderTime(45)).toBe('约 45 秒')
    })

    it('格式化分钟数', () => {
      expect(formatRenderTime(90)).toBe('约 1 分 30 秒')
    })

    it('格式化整分钟', () => {
      expect(formatRenderTime(120)).toBe('约 2 分 0 秒')
    })

    it('处理 0', () => {
      expect(formatRenderTime(0)).toBe('约 0 秒')
    })
  })
})
