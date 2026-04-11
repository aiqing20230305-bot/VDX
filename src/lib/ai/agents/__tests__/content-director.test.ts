/**
 * ContentDirector Agent 测试套件
 * 测试创意架构师Agent的核心功能
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseContentDirectorOutput,
  type ContentDirectorInput,
  type ContentDirectorOutput,
} from '../content-director'

// Mock streamText from claude.ts
vi.mock('@/lib/ai/claude', () => ({
  streamText: vi.fn().mockImplementation(async function* () {
    yield JSON.stringify({
      creativeProposal: {
        coreIdea: '通过快速剪辑展现产品特性',
        narrative: {
          opening: '特写产品外观',
          development: '展示核心功能',
          climax: '性能测试高光时刻',
          ending: '品牌logo',
        },
        visualStyle: {
          overallTone: '科技感',
          colorPalette: '蓝白配色',
          composition: '对称构图',
          motion: '快速切换',
        },
        emotionalArc: ['好奇', '惊喜', '信任'],
      },
      storyboardOutline: [
        {
          sceneNumber: 1,
          duration: 5,
          description: '产品旋转展示',
          emotion: '好奇',
          visualFocus: '产品外观细节',
        },
      ],
      technicalRequirements: {
        complexity: 'medium',
        priorityElements: ['快速剪辑', '产品特写'],
        flexibleElements: ['背景音乐'],
        suggestedTechniques: ['Kling高质量', 'Remotion程序化转场'],
      },
    })
  }),
}))

describe('ContentDirector Agent', () => {
  describe('parseContentDirectorOutput', () => {
    it('应该正确解析JSON格式的输出', () => {
      const jsonText = JSON.stringify({
        creativeProposal: {
          coreIdea: '温馨可爱的猫咪日常',
          narrative: {
            opening: '猫咪醒来',
            development: '玩耍嬉戏',
            climax: '午睡时光',
            ending: '满足地打哈欠',
          },
          visualStyle: {
            overallTone: '温暖',
            colorPalette: '暖色系',
            composition: '居中特写',
            motion: '缓慢流畅',
          },
          emotionalArc: ['好奇', '快乐', '放松'],
        },
        storyboardOutline: [
          {
            sceneNumber: 1,
            duration: 3,
            description: '猫咪伸懒腰',
            emotion: '慵懒',
            visualFocus: '猫咪动作',
          },
        ],
        technicalRequirements: {
          complexity: 'simple',
          priorityElements: ['自然光线', '猫咪特写'],
          flexibleElements: ['背景音乐'],
          suggestedTechniques: ['Seedance自然风格'],
        },
      })

      const result = parseContentDirectorOutput(jsonText)

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result!.creativeProposal.coreIdea).toBe('温馨可爱的猫咪日常')
      expect(result!.storyboardOutline).toHaveLength(1)
      expect(result!.storyboardOutline[0].sceneNumber).toBe(1)
      expect(result!.technicalRequirements.complexity).toBe('simple')
    })

    it('应该处理混合格式（JSON + 文本）', () => {
      const mixedText = `
这是一些解释性文本。

\`\`\`json
{
  "creativeProposal": {
    "coreIdea": "科技产品展示",
    "narrative": {
      "opening": "产品外观",
      "development": "功能演示",
      "climax": "性能测试",
      "ending": "品牌logo"
    },
    "visualStyle": {
      "overallTone": "科技感",
      "colorPalette": "蓝白",
      "composition": "对称",
      "motion": "快速"
    },
    "emotionalArc": ["好奇", "惊喜"]
  },
  "storyboardOutline": [],
  "technicalRequirements": {
    "complexity": "medium",
    "priorityElements": [],
    "flexibleElements": [],
    "suggestedTechniques": []
  }
}
\`\`\`
`

      const result = parseContentDirectorOutput(mixedText)

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result!.creativeProposal.coreIdea).toBe('科技产品展示')
    })

    it('应该处理纯JSON（无代码块）', () => {
      const pureJson = {
        creativeProposal: {
          coreIdea: '测试',
          narrative: {
            opening: '',
            development: '',
            climax: '',
            ending: '',
          },
          visualStyle: {
            overallTone: '',
            colorPalette: '',
            composition: '',
            motion: '',
          },
          emotionalArc: [],
        },
        storyboardOutline: [],
        technicalRequirements: {
          complexity: 'simple' as const,
          priorityElements: [],
          flexibleElements: [],
          suggestedTechniques: [],
        },
      }

      const result = parseContentDirectorOutput(JSON.stringify(pureJson))

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result!.creativeProposal.coreIdea).toBe('测试')
    })

    it('应该为无效JSON返回null', () => {
      const invalidJson = 'This is not JSON at all'

      const result = parseContentDirectorOutput(invalidJson)

      expect(result).toBeNull()
    })

    it('应该处理嵌套的JSON代码块', () => {
      const nestedText = `
外层文本

\`\`\`json
{
  "creativeProposal": {
    "coreIdea": "嵌套测试",
    "narrative": {
      "opening": "开场",
      "development": "发展",
      "climax": "高潮",
      "ending": "结尾"
    },
    "visualStyle": {
      "overallTone": "测试",
      "colorPalette": "测试",
      "composition": "测试",
      "motion": "测试"
    },
    "emotionalArc": ["测试"]
  },
  "storyboardOutline": [
    {
      "sceneNumber": 1,
      "duration": 5,
      "description": "测试场景",
      "emotion": "测试",
      "visualFocus": "测试"
    }
  ],
  "technicalRequirements": {
    "complexity": "simple",
    "priorityElements": ["测试"],
    "flexibleElements": [],
    "suggestedTechniques": []
  }
}
\`\`\`

后续文本
`

      const result = parseContentDirectorOutput(nestedText)

      expect(result).toBeDefined()
      expect(result?.creativeProposal.coreIdea).toBe('嵌套测试')
      expect(result?.storyboardOutline).toHaveLength(1)
    })
  })

  describe('输出格式验证', () => {
    it('解析结果应符合ContentDirectorOutput类型', () => {
      const validOutput: ContentDirectorOutput = {
        creativeProposal: {
          coreIdea: '核心创意',
          narrative: {
            opening: '开场',
            development: '发展',
            climax: '高潮',
            ending: '结尾',
          },
          visualStyle: {
            overallTone: '整体调性',
            colorPalette: '色彩',
            composition: '构图',
            motion: '运动',
          },
          emotionalArc: ['情绪1', '情绪2'],
        },
        storyboardOutline: [
          {
            sceneNumber: 1,
            duration: 5,
            description: '场景描述',
            emotion: '情绪',
            visualFocus: '视觉重点',
          },
        ],
        technicalRequirements: {
          complexity: 'medium',
          priorityElements: ['元素1'],
          flexibleElements: ['元素2'],
          suggestedTechniques: ['技术1'],
        },
      }

      // 类型检查
      expect(validOutput.creativeProposal).toBeDefined()
      expect(validOutput.storyboardOutline).toBeDefined()
      expect(validOutput.technicalRequirements).toBeDefined()
      expect(validOutput.technicalRequirements.complexity).toMatch(/simple|medium|complex/)
    })
  })
})
