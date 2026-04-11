/**
 * AgentCoordinator 测试套件
 * 测试双Agent协作系统的核心协调逻辑
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AgentCoordinator } from '../agent-coordinator'
import type { WorkflowMode } from '../agent-coordinator'

describe('AgentCoordinator', () => {
  describe('初始化', () => {
    it('应该创建auto模式的coordinator', () => {
      const coordinator = new AgentCoordinator('auto')
      const state = coordinator.getState()

      expect(state.mode).toBe('auto')
      expect(state.stage).toBe('understanding')
      expect(state.currentAgent).toBeNull()
    })

    it('应该创建collaborative模式的coordinator', () => {
      const coordinator = new AgentCoordinator('collaborative')
      const state = coordinator.getState()

      expect(state.mode).toBe('collaborative')
    })

    it('默认应该使用auto模式', () => {
      const coordinator = new AgentCoordinator()
      const state = coordinator.getState()

      expect(state.mode).toBe('auto')
    })
  })

  describe('用户输入路由', () => {
    let coordinator: AgentCoordinator

    beforeEach(() => {
      coordinator = new AgentCoordinator('auto')
    })

    it('应该识别选题输入并路由到ContentDirector', async () => {
      const result = await coordinator.handleUserInput({
        type: 'topic',
        content: {
          title: '猫咪日常vlog',
          description: '记录猫咪的日常生活',
          targetEmotion: '温馨可爱',
          duration: 30
        }
      })

      expect(result.agent).toBe('content-director')
      expect(result.shouldStream).toBe(true)

      const state = coordinator.getState()
      expect(state.stage).toBe('creative_planning')
      expect(state.currentAgent).toBe('content-director')
    })

    it('应该识别参考图片输入并路由到ContentDirector', async () => {
      const result = await coordinator.handleUserInput({
        type: 'image',
        content: {
          type: 'image',
          url: 'https://example.com/cat.jpg'
        }
      })

      expect(result.agent).toBe('content-director')
      expect(result.shouldStream).toBe(true)
    })

    it('在collaborative模式下应该要求用户确认', async () => {
      coordinator = new AgentCoordinator('collaborative')

      const result = await coordinator.handleUserInput({
        type: 'topic',
        content: {
          title: '产品宣传片',
          duration: 15
        }
      })

      expect(result.requiresConfirmation).toBe(true)
    })
  })

  describe('Agent切换', () => {
    let coordinator: AgentCoordinator

    beforeEach(() => {
      coordinator = new AgentCoordinator('auto')
    })

    it('ContentDirector完成后应该自动切换到TechnicalExecutor', async () => {
      // Step 1: 用户输入 → ContentDirector
      await coordinator.handleUserInput({
        type: 'topic',
        content: {
          title: '科技产品展示',
          duration: 20
        }
      })

      expect(coordinator.getState().currentAgent).toBe('content-director')

      // Step 2: 保存创意方案 → 自动触发TechnicalExecutor
      const creativeProposal = {
        coreIdea: '通过快速剪辑展现产品特性',
        narrative: {
          opening: '特写产品外观',
          development: '展示核心功能',
          climax: '性能测试高光时刻',
          ending: '品牌logo'
        },
        visualStyle: {
          overallTone: '科技感',
          colorPalette: '蓝白配色',
          composition: '对称构图',
          motion: '快速切换'
        },
        emotionalArc: ['好奇', '惊喜', '信任'],
        storyboardOutline: [
          {
            sceneNumber: 1,
            duration: 5,
            description: '产品旋转展示',
            emotion: '好奇',
            visualFocus: '产品外观细节'
          },
          {
            sceneNumber: 2,
            duration: 10,
            description: '功能演示',
            emotion: '惊喜',
            visualFocus: '操作界面'
          },
          {
            sceneNumber: 3,
            duration: 5,
            description: '品牌露出',
            emotion: '信任',
            visualFocus: 'logo特写'
          }
        ],
        technicalRequirements: {
          complexity: 'medium' as const,
          priorityElements: ['快速剪辑', '产品特写'],
          flexibleElements: ['背景音乐'],
          suggestedTechniques: ['Kling高质量', 'Remotion程序化转场']
        }
      }

      coordinator.saveCreativeProposal(creativeProposal)

      const state = coordinator.getState()
      expect(state.stage).toBe('technical_planning')
      expect(state.currentAgent).toBe('technical-executor')
      expect(state.data.creativeProposal).toEqual(creativeProposal)
    })
  })

  describe('工作流状态管理', () => {
    let coordinator: AgentCoordinator

    beforeEach(() => {
      coordinator = new AgentCoordinator('auto')
    })

    it('应该正确追踪工作流6个阶段', async () => {
      // Understanding
      expect(coordinator.getState().stage).toBe('understanding')

      // Creative Planning
      await coordinator.handleUserInput({
        type: 'topic',
        content: { title: '测试视频', duration: 10 }
      })
      expect(coordinator.getState().stage).toBe('creative_planning')

      // Technical Planning
      coordinator.saveCreativeProposal({
        coreIdea: 'test',
        narrative: { opening: '', development: '', climax: '', ending: '' },
        visualStyle: { overallTone: '', colorPalette: '', composition: '', motion: '' },
        emotionalArc: [],
        storyboardOutline: [],
        technicalRequirements: {
          complexity: 'simple',
          priorityElements: [],
          flexibleElements: [],
          suggestedTechniques: []
        }
      })
      expect(coordinator.getState().stage).toBe('technical_planning')

      // 后续阶段需要实际生成流程，暂时跳过
    })

    it('应该保存对话历史', async () => {
      const message = {
        id: 'test-msg-1',
        role: 'user' as const,
        type: 'text' as const,
        content: '测试消息',
        createdAt: new Date(),
      }

      coordinator.addToConversationHistory(message)

      const state = coordinator.getState()
      expect(state.conversationHistory.length).toBeGreaterThan(0)
      expect(state.conversationHistory[0]).toEqual(message)
    })
  })

  describe('Agent信息获取', () => {
    it('应该返回当前工作的Agent信息', async () => {
      const coordinator = new AgentCoordinator('auto')

      await coordinator.handleUserInput({
        type: 'topic',
        content: { title: '测试', duration: 10 }
      })

      const agentInfo = coordinator.getCurrentAgentInfo()

      expect(agentInfo).toBeDefined()
      expect(agentInfo?.id).toBe('content-director')
      expect(agentInfo?.name).toBe('内容架构师')
      expect(agentInfo?.avatar).toBe('🎬')
    })

    it('初始状态应该返回null', () => {
      const coordinator = new AgentCoordinator('auto')
      const agentInfo = coordinator.getCurrentAgentInfo()

      expect(agentInfo).toBeNull()
    })
  })
})
