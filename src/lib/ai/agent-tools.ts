/**
 * 超级视频Agent 工具集
 * 基于 Claude Tool Use 实现自动化流程编排
 */
import Anthropic from '@anthropic-ai/sdk'

/**
 * 工具定义：生成脚本
 */
export const generateScriptTool: Anthropic.Tool = {
  name: 'generate_script',
  description: `生成视频脚本。根据用户的选题、图片或音乐生成多个创意脚本变体。

使用场景：
- 用户说"我想做一个关于xxx的视频"
- 用户上传了图片或音乐
- 用户描述了视频创意

必需参数：
- topic 或 images 或 audioPath 至少提供一个

返回：
- 3个脚本变体，每个包含分场、解说词、视觉描述`,
  input_schema: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '视频主题或选题描述',
      },
      duration: {
        type: 'number',
        description: '视频时长（秒），默认30秒',
      },
      aspectRatio: {
        type: 'string',
        enum: ['9:16', '16:9', '1:1'],
        description: '画面比例，默认9:16',
      },
      style: {
        type: 'string',
        description: '视频风格（如：电影感、动画、写实等）',
      },
      images: {
        type: 'array',
        items: { type: 'string' },
        description: '参考图片路径数组',
      },
      audioPath: {
        type: 'string',
        description: '音乐文件路径（用于音乐视频）',
      },
    },
    required: [],
  },
}

/**
 * 工具定义：选择脚本
 */
export const selectScriptTool: Anthropic.Tool = {
  name: 'select_script',
  description: `选择一个脚本方案继续生成分镜。

使用场景：
- AI生成了多个脚本后，用户选择其中一个
- 用户说"选A"、"就用第一个"等

返回：
- 确认选择的脚本`,
  input_schema: {
    type: 'object',
    properties: {
      scriptIndex: {
        type: 'number',
        description: '脚本索引（0, 1, 2...）',
      },
    },
    required: ['scriptIndex'],
  },
}

/**
 * 工具定义：生成分镜
 */
export const generateStoryboardTool: Anthropic.Tool = {
  name: 'generate_storyboard',
  description: `根据选定的脚本生成分镜图。

使用场景：
- 用户已选择脚本，准备生成分镜
- 自动化流程中的中间步骤

必需：
- 必须先调用 select_script 选择脚本

返回：
- 完整的分镜板（12帧左右），每帧包含图片URL、提示词、时长`,
  input_schema: {
    type: 'object',
    properties: {
      variantMode: {
        type: 'boolean',
        description: '是否生成3种镜头语言变体供选择（默认false）',
      },
      referenceImages: {
        type: 'array',
        items: { type: 'string' },
        description: '参考图片路径（用于产品一致性）',
      },
    },
    required: [],
  },
}

/**
 * 工具定义：生成视频
 */
export const generateVideoTool: Anthropic.Tool = {
  name: 'generate_video',
  description: `根据分镜生成最终视频。

使用场景：
- 分镜已生成，用户确认后开始视频生成
- 自动化流程的最后一步

必需：
- 必须先完成分镜生成

参数：
- engine: 选择生成引擎
  - "seedance": 高质量，较慢（推荐）
  - "kling": 快速，5-10秒片段
  - "auto": 智能路由（根据场景复杂度自动选择）

返回：
- 视频生成任务ID，可用于查询进度`,
  input_schema: {
    type: 'object',
    properties: {
      engine: {
        type: 'string',
        enum: ['seedance', 'kling', 'auto'],
        description: '视频生成引擎，默认auto（智能路由）',
      },
    },
    required: [],
  },
}

/**
 * 工具定义：查询用户偏好
 */
export const askUserPreferenceTool: Anthropic.Tool = {
  name: 'ask_user_preference',
  description: `当需要用户做出选择或提供额外信息时，询问用户。

使用场景：
- 生成了多个方案，需要用户选择
- 需要用户确认某个决策
- 需要用户提供缺失的参数（如时长、风格）

重要：
- 每次只问一个问题
- 提供清晰的选项
- 问题简洁明了`,
  input_schema: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: '要询问的问题',
      },
      options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description: '选项标签',
            },
            value: {
              type: 'string',
              description: '选项值',
            },
          },
          required: ['label', 'value'],
        },
        description: '可选项列表（可选，不提供则为开放式问题）',
      },
    },
    required: ['question'],
  },
}

/**
 * 工具定义：分析上传内容
 */
export const analyzeUploadTool: Anthropic.Tool = {
  name: 'analyze_upload',
  description: `分析用户上传的图片或视频。

使用场景：
- 用户上传了图片，需要理解内容
- 用户上传了视频，需要分析风格、元素等

返回：
- 图片/视频的详细描述
- 建议的创作方向`,
  input_schema: {
    type: 'object',
    properties: {
      filePath: {
        type: 'string',
        description: '上传文件的本地路径',
      },
      fileType: {
        type: 'string',
        enum: ['image', 'video', 'audio'],
        description: '文件类型',
      },
    },
    required: ['filePath', 'fileType'],
  },
}

/**
 * 所有工具列表
 */
export const AGENT_TOOLS: Anthropic.Tool[] = [
  generateScriptTool,
  selectScriptTool,
  generateStoryboardTool,
  generateVideoTool,
  askUserPreferenceTool,
  analyzeUploadTool,
]

/**
 * 工具调用结果类型
 */
export interface ToolResult {
  toolUseId: string  // tool_use_id from Claude
  toolName: string
  result?: any
  error?: string
}
