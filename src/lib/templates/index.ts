/**
 * 预设模板库
 * 提供快速开始的视频模板
 */

import type { Frame } from '@/types/workspace'

export type TemplateCategory =
  | 'commercial'    // 商业广告
  | 'creative'      // 创意内容
  | 'education'     // 教育教程
  | 'lifestyle'     // 生活记录
  | 'music'         // 音乐视频

export interface VideoTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  categoryLabel: string
  thumbnail: string
  duration: number         // 总时长（秒）
  frameCount: number       // 帧数
  tags: string[]
  frames: Omit<Frame, 'id' | 'index' | 'isGenerating'>[]  // 预设帧结构
}

/**
 * 预设模板数据
 */
export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // 商业广告类
  {
    id: 'product-promo-30s',
    name: '产品宣传片（30秒）',
    description: '快节奏展示产品核心卖点，适合社交媒体投放',
    category: 'commercial',
    categoryLabel: '商业广告',
    thumbnail: 'https://placehold.co/400x225/3b82f6/ffffff?text=Product+Promo',
    duration: 30,
    frameCount: 5,
    tags: ['产品', '快节奏', '社交媒体'],
    frames: [
      {
        imagePrompt: '产品特写镜头，极简背景，柔和光线',
        sceneDescription: '产品特写 - 吸引注意力的开场',
        duration: 5,
        cameraMove: '推镜，从整体到局部',
        imageUrl: 'https://placehold.co/1920x1080/3b82f6/ffffff?text=Product+Hero',
      },
      {
        imagePrompt: '人物使用产品的真实场景，自然光，生活化',
        sceneDescription: '使用场景 - 建立情感连接',
        duration: 6,
        cameraMove: '跟随镜头',
        imageUrl: 'https://placehold.co/1920x1080/8b5cf6/ffffff?text=Usage+Scene',
      },
      {
        imagePrompt: '产品核心功能演示，动态特效，科技感',
        sceneDescription: '功能展示 - 突出核心价值',
        duration: 7,
        cameraMove: '特写，旋转',
        imageUrl: 'https://placehold.co/1920x1080/06b6d4/ffffff?text=Feature+Demo',
      },
      {
        imagePrompt: '多角度产品展示，快速切换，动感十足',
        sceneDescription: '多角度展示 - 增强视觉冲击',
        duration: 6,
        cameraMove: '快速切换',
        imageUrl: 'https://placehold.co/1920x1080/10b981/ffffff?text=Multi-Angle',
      },
      {
        imagePrompt: '产品logo和购买信息，简洁明了，CTA明确',
        sceneDescription: 'CTA结尾 - 引导行动',
        duration: 6,
        cameraMove: '静止，居中',
        imageUrl: 'https://placehold.co/1920x1080/f59e0b/ffffff?text=CTA',
      },
    ],
  },
  {
    id: 'brand-story-60s',
    name: '品牌故事（60秒）',
    description: '讲述品牌理念和价值观，建立情感共鸣',
    category: 'commercial',
    categoryLabel: '商业广告',
    thumbnail: 'https://placehold.co/400x225/8b5cf6/ffffff?text=Brand+Story',
    duration: 60,
    frameCount: 10,
    tags: ['品牌', '故事化', '情感'],
    frames: [
      {
        imagePrompt: '品牌创始场景，温馨怀旧氛围',
        sceneDescription: '起源 - 一切开始的地方',
        duration: 6,
        cameraMove: '缓慢推进',
      },
      {
        imagePrompt: '团队工作场景，专注投入',
        sceneDescription: '坚持 - 背后的努力',
        duration: 6,
        cameraMove: '平移',
      },
      {
        imagePrompt: '产品研发过程，精益求精',
        sceneDescription: '匠心 - 对细节的追求',
        duration: 6,
        cameraMove: '特写',
      },
      {
        imagePrompt: '用户满意的笑容，真实反馈',
        sceneDescription: '信任 - 用户的认可',
        duration: 6,
        cameraMove: '固定镜头',
      },
      {
        imagePrompt: '品牌影响力扩散，全球视野',
        sceneDescription: '成长 - 更广的影响',
        duration: 6,
        cameraMove: '航拍',
      },
      {
        imagePrompt: '社会责任项目，公益行动',
        sceneDescription: '责任 - 回馈社会',
        duration: 6,
        cameraMove: '跟随',
      },
      {
        imagePrompt: '品牌未来愿景，科技感',
        sceneDescription: '展望 - 更好的明天',
        duration: 6,
        cameraMove: '推镜',
      },
      {
        imagePrompt: '核心价值观呈现，简洁有力',
        sceneDescription: '价值观 - 我们的信念',
        duration: 6,
        cameraMove: '静止',
      },
      {
        imagePrompt: '品牌社区，用户共创',
        sceneDescription: '共创 - 与用户一起',
        duration: 6,
        cameraMove: '环绕',
      },
      {
        imagePrompt: '品牌logo和slogan，情感升华',
        sceneDescription: '结尾 - 品牌印记',
        duration: 6,
        cameraMove: '淡入',
      },
    ],
  },
  {
    id: 'product-demo-45s',
    name: '产品功能演示（45秒）',
    description: '详细展示产品功能和使用方法，教育型内容',
    category: 'commercial',
    categoryLabel: '商业广告',
    thumbnail: 'https://placehold.co/400x225/06b6d4/ffffff?text=Product+Demo',
    duration: 45,
    frameCount: 8,
    tags: ['功能演示', '教育', '详细'],
    frames: [
      {
        imagePrompt: '产品包装开箱，精致细节',
        sceneDescription: '开箱 - 第一印象',
        duration: 5,
        cameraMove: '俯视',
      },
      {
        imagePrompt: '产品外观展示，360度旋转',
        sceneDescription: '外观 - 全方位展示',
        duration: 6,
        cameraMove: '旋转',
      },
      {
        imagePrompt: '功能一：界面截图，操作演示',
        sceneDescription: '功能1 - 核心特性',
        duration: 6,
        cameraMove: '特写',
      },
      {
        imagePrompt: '功能二：使用场景，实际效果',
        sceneDescription: '功能2 - 实用价值',
        duration: 6,
        cameraMove: '跟随',
      },
      {
        imagePrompt: '功能三：对比展示，优势明显',
        sceneDescription: '功能3 - 竞争优势',
        duration: 6,
        cameraMove: '分屏',
      },
      {
        imagePrompt: '用户评价，真实反馈',
        sceneDescription: '口碑 - 用户证言',
        duration: 5,
        cameraMove: '固定',
      },
      {
        imagePrompt: '价格和购买信息',
        sceneDescription: '价格 - 性价比',
        duration: 5,
        cameraMove: '静止',
      },
      {
        imagePrompt: '购买渠道和优惠信息',
        sceneDescription: 'CTA - 立即购买',
        duration: 6,
        cameraMove: '推镜',
      },
    ],
  },

  // 生活记录类
  {
    id: 'vlog-daily-90s',
    name: 'Vlog日常（90秒）',
    description: '记录日常生活片段，分享真实瞬间',
    category: 'lifestyle',
    categoryLabel: '生活记录',
    thumbnail: 'https://placehold.co/400x225/10b981/ffffff?text=Vlog+Daily',
    duration: 90,
    frameCount: 12,
    tags: ['Vlog', '日常', '生活'],
    frames: [
      {
        imagePrompt: '清晨阳光透过窗户',
        sceneDescription: '早晨 - 新的一天开始',
        duration: 6,
        cameraMove: '固定',
      },
      {
        imagePrompt: '早餐准备，温馨场景',
        sceneDescription: '早餐 - 美好时光',
        duration: 8,
        cameraMove: '俯视',
      },
      {
        imagePrompt: '出门准备，穿搭展示',
        sceneDescription: '出门 - 今日穿搭',
        duration: 7,
        cameraMove: '全身镜',
      },
      {
        imagePrompt: '通勤路上，城市风景',
        sceneDescription: '路上 - 街景',
        duration: 8,
        cameraMove: '手持跟随',
      },
      {
        imagePrompt: '咖啡店打卡，氛围感',
        sceneDescription: '咖啡时光',
        duration: 8,
        cameraMove: '特写',
      },
      {
        imagePrompt: '工作/学习场景',
        sceneDescription: '专注时刻',
        duration: 8,
        cameraMove: '固定',
      },
      {
        imagePrompt: '午餐美食拍摄',
        sceneDescription: '午餐 - 美食分享',
        duration: 7,
        cameraMove: '俯拍',
      },
      {
        imagePrompt: '下午活动，趣事记录',
        sceneDescription: '下午 - 有趣的事',
        duration: 8,
        cameraMove: '跟随',
      },
      {
        imagePrompt: '傍晚散步，夕阳',
        sceneDescription: '傍晚 - 放松',
        duration: 7,
        cameraMove: '平移',
      },
      {
        imagePrompt: '晚餐准备或外出',
        sceneDescription: '晚餐时间',
        duration: 8,
        cameraMove: '固定',
      },
      {
        imagePrompt: '夜晚放松，看书/追剧',
        sceneDescription: '夜晚 - 放松时光',
        duration: 8,
        cameraMove: '特写',
      },
      {
        imagePrompt: '结尾感悟，文字卡片',
        sceneDescription: '今日总结',
        duration: 7,
        cameraMove: '淡出',
      },
    ],
  },

  // 教育教程类
  {
    id: 'tutorial-60s',
    name: '教程讲解（60秒）',
    description: '分步骤讲解，适合技能教学和知识分享',
    category: 'education',
    categoryLabel: '教育教程',
    thumbnail: 'https://placehold.co/400x225/f59e0b/ffffff?text=Tutorial',
    duration: 60,
    frameCount: 10,
    tags: ['教程', '教育', '分步骤'],
    frames: [
      {
        imagePrompt: '标题卡片，课程主题',
        sceneDescription: '开场 - 今日主题',
        duration: 5,
        cameraMove: '静止',
      },
      {
        imagePrompt: '课程大纲，知识点预览',
        sceneDescription: '大纲 - 学习路径',
        duration: 5,
        cameraMove: '推镜',
      },
      {
        imagePrompt: '步骤一：基础概念讲解',
        sceneDescription: '基础 - 打好根基',
        duration: 7,
        cameraMove: '固定',
      },
      {
        imagePrompt: '步骤二：工具准备',
        sceneDescription: '准备 - 需要什么',
        duration: 6,
        cameraMove: '特写',
      },
      {
        imagePrompt: '步骤三：详细操作演示',
        sceneDescription: '演示 - 跟着做',
        duration: 8,
        cameraMove: '特写+跟随',
      },
      {
        imagePrompt: '步骤四：常见问题',
        sceneDescription: '避坑 - 注意事项',
        duration: 6,
        cameraMove: '分屏对比',
      },
      {
        imagePrompt: '步骤五：进阶技巧',
        sceneDescription: '进阶 - 更上一层',
        duration: 7,
        cameraMove: '特写',
      },
      {
        imagePrompt: '实战案例展示',
        sceneDescription: '案例 - 实际应用',
        duration: 6,
        cameraMove: '固定',
      },
      {
        imagePrompt: '总结回顾，知识点梳理',
        sceneDescription: '总结 - 重点回顾',
        duration: 5,
        cameraMove: '静止',
      },
      {
        imagePrompt: '结尾彩蛋，下期预告',
        sceneDescription: '彩蛋 - 下期见',
        duration: 5,
        cameraMove: '淡出',
      },
    ],
  },

  // 创意内容类
  {
    id: 'short-drama-30s',
    name: '短剧开场（30秒）',
    description: '剧情式开场，悬念吸引，适合短视频剧集',
    category: 'creative',
    categoryLabel: '创意内容',
    thumbnail: 'https://placehold.co/400x225/ef4444/ffffff?text=Short+Drama',
    duration: 30,
    frameCount: 6,
    tags: ['短剧', '剧情', '悬念'],
    frames: [
      {
        imagePrompt: '环境建立镜头，氛围渲染',
        sceneDescription: '环境 - 故事背景',
        duration: 5,
        cameraMove: '航拍',
      },
      {
        imagePrompt: '主角登场，人物特写',
        sceneDescription: '出场 - 主角亮相',
        duration: 5,
        cameraMove: '推镜',
      },
      {
        imagePrompt: '日常场景，平静表象',
        sceneDescription: '日常 - 暴风雨前的宁静',
        duration: 5,
        cameraMove: '跟随',
      },
      {
        imagePrompt: '转折点，突发事件',
        sceneDescription: '转折 - 冲突爆发',
        duration: 5,
        cameraMove: '快速推进',
      },
      {
        imagePrompt: '主角反应，情绪变化',
        sceneDescription: '反应 - 情绪高潮',
        duration: 5,
        cameraMove: '特写',
      },
      {
        imagePrompt: '悬念结尾，引发好奇',
        sceneDescription: '悬念 - 欲知后事',
        duration: 5,
        cameraMove: '定格',
      },
    ],
  },

  // 音乐视频类
  {
    id: 'mv-clip-60s',
    name: 'MV片段（60秒）',
    description: '音乐节奏同步的视觉呈现，适合MV和音乐短视频',
    category: 'music',
    categoryLabel: '音乐视频',
    thumbnail: 'https://placehold.co/400x225/a855f7/ffffff?text=Music+Video',
    duration: 60,
    frameCount: 15,
    tags: ['MV', '音乐', '节奏'],
    frames: [
      {
        imagePrompt: '黑屏，音乐前奏',
        sceneDescription: '前奏 - 积蓄情绪',
        duration: 4,
        cameraMove: '静止',
      },
      {
        imagePrompt: '歌手特写，开始演唱',
        sceneDescription: '主歌1 - 情绪铺垫',
        duration: 4,
        cameraMove: '推镜',
      },
      {
        imagePrompt: '场景切换，意境画面',
        sceneDescription: '画面1 - 意境渲染',
        duration: 4,
        cameraMove: '平移',
      },
      {
        imagePrompt: '歌手中景，情感释放',
        sceneDescription: '主歌2 - 情感递进',
        duration: 4,
        cameraMove: '固定',
      },
      {
        imagePrompt: '快节奏画面剪辑',
        sceneDescription: '节奏1 - 视觉冲击',
        duration: 4,
        cameraMove: '快速切换',
      },
      {
        imagePrompt: '副歌高潮，歌手全景',
        sceneDescription: '副歌1 - 情绪高潮',
        duration: 4,
        cameraMove: '环绕',
      },
      {
        imagePrompt: '特效画面，视觉震撼',
        sceneDescription: '特效1 - 视觉盛宴',
        duration: 4,
        cameraMove: '特效',
      },
      {
        imagePrompt: '歌手特写，深情演绎',
        sceneDescription: '情感 - 真挚表达',
        duration: 4,
        cameraMove: '特写',
      },
      {
        imagePrompt: '剧情画面，故事叙述',
        sceneDescription: '剧情 - 故事线',
        duration: 4,
        cameraMove: '跟随',
      },
      {
        imagePrompt: '第二段主歌',
        sceneDescription: '主歌3 - 再次积蓄',
        duration: 4,
        cameraMove: '推镜',
      },
      {
        imagePrompt: '桥段，情绪转折',
        sceneDescription: '桥段 - 情绪转折',
        duration: 4,
        cameraMove: '升降',
      },
      {
        imagePrompt: '最后副歌，能量爆发',
        sceneDescription: '副歌2 - 最高潮',
        duration: 4,
        cameraMove: '快速切换',
      },
      {
        imagePrompt: '尾奏画面，情感升华',
        sceneDescription: '尾奏 - 情感升华',
        duration: 4,
        cameraMove: '平移',
      },
      {
        imagePrompt: '歌手最后镜头',
        sceneDescription: '结尾 - 完美收官',
        duration: 4,
        cameraMove: '定格',
      },
      {
        imagePrompt: '黑屏淡出',
        sceneDescription: '淡出',
        duration: 4,
        cameraMove: '淡出',
      },
    ],
  },
]

/**
 * 按类别获取模板
 */
export function getTemplatesByCategory(category: TemplateCategory | 'all'): VideoTemplate[] {
  if (category === 'all') {
    return VIDEO_TEMPLATES
  }
  return VIDEO_TEMPLATES.filter(t => t.category === category)
}

/**
 * 按ID获取模板
 */
export function getTemplateById(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find(t => t.id === id)
}

/**
 * 获取所有类别
 */
export function getAllCategories(): Array<{ value: TemplateCategory | 'all', label: string }> {
  return [
    { value: 'all', label: '全部模板' },
    { value: 'commercial', label: '商业广告' },
    { value: 'creative', label: '创意内容' },
    { value: 'education', label: '教育教程' },
    { value: 'lifestyle', label: '生活记录' },
    { value: 'music', label: '音乐视频' },
  ]
}

/**
 * 将模板转换为实际可用的 Frame 数组
 */
export function templateToFrames(template: VideoTemplate): Frame[] {
  return template.frames.map((frame, index) => ({
    ...frame,
    id: `frame-${template.id}-${index}`,
    index,
    isGenerating: false,
  }))
}
