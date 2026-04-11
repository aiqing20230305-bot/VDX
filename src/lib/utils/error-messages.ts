/**
 * Error Message Utilities - 用户友好的错误消息
 * 将技术错误转换为可操作的用户提示
 */

export interface UserFriendlyError {
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
  }
}

/**
 * 将通用错误转换为用户友好的错误消息
 */
export function parseError(error: unknown): UserFriendlyError {
  const errorMessage = error instanceof Error ? error.message : String(error)

  // 网络错误
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      title: '网络连接失败',
      message: '请检查您的网络连接后重试',
      action: {
        label: '重试',
      },
    }
  }

  // 超时错误
  if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
    return {
      title: '请求超时',
      message: '服务响应时间过长，请稍后重试',
      action: {
        label: '重试',
      },
    }
  }

  // API 限流
  if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('限流')) {
    return {
      title: 'API 请求过于频繁',
      message: '请稍等片刻后再试，或联系管理员提升配额',
    }
  }

  // 认证错误
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('未授权')) {
    return {
      title: '认证失败',
      message: '请检查 API 密钥配置或重新登录',
    }
  }

  // 生成失败
  if (errorMessage.includes('生成失败') || errorMessage.includes('generation failed')) {
    return {
      title: '内容生成失败',
      message: '请尝试简化您的需求描述，或稍后重试',
      action: {
        label: '重新生成',
      },
    }
  }

  // 图片相关错误
  if (errorMessage.includes('图片') || errorMessage.includes('image')) {
    return {
      title: '图片处理失败',
      message: '请检查图片格式是否支持（PNG/JPG/WEBP），文件大小是否小于 10MB',
    }
  }

  // 视频相关错误
  if (errorMessage.includes('视频') || errorMessage.includes('video')) {
    return {
      title: '视频处理失败',
      message: '请检查视频格式是否支持，或尝试使用更短的视频片段',
    }
  }

  // 脚本生成错误
  if (errorMessage.includes('脚本') || errorMessage.includes('script')) {
    return {
      title: '脚本生成失败',
      message: '请提供更详细的需求描述，或尝试不同的主题',
      action: {
        label: '重新生成',
      },
    }
  }

  // 分镜生成错误
  if (errorMessage.includes('分镜') || errorMessage.includes('storyboard')) {
    return {
      title: '分镜生成失败',
      message: '请检查脚本内容是否完整，或尝试调整场景数量',
      action: {
        label: '重新生成',
      },
    }
  }

  // 存储错误
  if (errorMessage.includes('storage') || errorMessage.includes('存储') || errorMessage.includes('保存')) {
    return {
      title: '保存失败',
      message: '请检查浏览器存储空间是否充足',
    }
  }

  // 通用错误
  return {
    title: '操作失败',
    message: errorMessage || '发生未知错误，请重试或联系技术支持',
    action: {
      label: '重试',
    },
  }
}

/**
 * 成功消息模板
 */
export const successMessages = {
  scriptGenerated: {
    title: '脚本生成完成',
    message: '已为您生成视频脚本，正在生成分镜图...',
  },
  storyboardGenerated: {
    title: '分镜生成完成',
    message: '所有分镜图已生成，可以开始编辑或导出视频',
  },
  videoGenerated: {
    title: '视频生成完成',
    message: '视频已准备就绪，可以预览和下载',
  },
  projectSaved: {
    title: '项目已保存',
    message: '您的更改已自动保存',
  },
  exportStarted: {
    title: '开始导出',
    message: '正在渲染视频，请稍候...',
  },
  exportComplete: {
    title: '导出完成',
    message: '视频已成功导出，可以下载使用',
  },
}
