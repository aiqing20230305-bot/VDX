# 上下文系统设计文档

## 核心理念

**"AI 要像人一样记住对话上下文，理解用户的回答是在回应之前的问题"**

## 问题背景

### 问题 1：上下文割裂
```
助手：你想要什么风格？
用户：真实风格
系统：❌ 不理解"真实风格"是在回答问题
```

### 问题 2：图片上传缺少对齐
```
当前：上传图片 → 自动分析 → 直接生成 ❌

问题：
- 没有展示分析结果
- 没有与用户确认对齐
- 用户无法修正系统的理解
```

## 解决方案

### 1. 上下文状态管理

```typescript
const [contextState, setContextState] = useState<{
  type: 'waiting_image_confirmation' | 'waiting_style' | null
  data?: Record<string, unknown>
}>({ type: null })
```

**核心状态类型**：
- `waiting_image_confirmation` - 等待用户确认图片分析
- `waiting_style` - 等待用户选择风格
- `waiting_duration` - 等待用户选择时长
- `null` - 无等待状态

### 2. 图片上传对齐流程

**优化后的流程**：
```
1. 用户上传图片
   ↓
2. AI 分析图片（人物/产品/场景）
   ↓
3. 展示分析结果：
   ✅ 已分析 3 张图片：
   
   🧑 **1 张人物图**
     1. 年轻女性，长发，微笑
   
   📦 **1 张产品图**  
     1. 智能手机，黑色，后置三摄
     **关键特征**：后置三摄排列为三角形、金属边框
   
   🏞️ **1 张场景图**
     1. 室内客厅，温馨氛围
   
   📝 **请确认**：
   - 这些分析准确吗？
   - 你想突出哪些元素？
   - 视频的主题是什么？
   ↓
4. 用户回复（两种路径）：
   
   路径 A - 确认：
   用户："对的" / "没错" / "准确"
   → 系统：好的！开始生成脚本...
   
   路径 B - 修正：
   用户："不对，产品是白色的，而且我想突出相机功能"
   → 系统：理解了，白色手机，主打相机。我重新理解...
   ↓
5. 基于确认/修正的理解推演脚本
```

### 3. 上下文检查逻辑

**优先级**（从高到低）：
```typescript
handleSend(message) {
  // 1️⃣ 优先检查上下文状态
  if (contextState.type === 'waiting_image_confirmation') {
    // 处理图片确认回复
    return
  }
  
  // 2️⃣ 检查分镜修改意图
  if (storyboard && isModificationIntent(message)) {
    // 处理分镜修改
    return
  }
  
  // 3️⃣ 检查脚本生成意图
  if (isScriptIntent(message)) {
    // 处理脚本生成
    return
  }
  
  // 4️⃣ 默认聊天
  streamChat(message)
}
```

### 4. 对话历史增强

**优化前**（只传递 10 条文本）：
```typescript
const history = messages
  .filter(m => m.type === 'text')
  .slice(-10)
```

**优化后**（15 条，包含 action）：
```typescript
const history = messages
  .filter(m => m.role !== 'system')
  .slice(-15) // 更长的历史
  .map(m => {
    // action 类型也转为文本，保留上下文
    if (m.type === 'action') {
      return { role: m.role, content: m.content }
    }
    return { role: m.role, content: m.content }
  })
```

## 实际使用场景

### 场景 1：图片上传确认
```
用户：[上传 3 张图片]
助手：✅ 已分析 3 张图片：
      🧑 1 张人物图：年轻女性...
      📦 1 张产品图：智能手机...
      🏞️ 1 张场景图：室内客厅...
      
      📝 请确认：这些分析准确吗？...

用户：对的，我想拍一个手机产品宣传视频
助手：好的！基于这些图片，我来生成视频方案...
      [进入选择比例/时长流程]
```

### 场景 2：修正分析
```
用户：[上传产品图]
助手：✅ 已分析 1 张产品图：
      黑色智能手机，后置三摄...

用户：不对，这是白色的，而且我想突出拍照功能
助手：理解了！白色手机，主打拍照功能。
      我会在脚本中强调相机性能和拍照场景...
      [继续引导]
```

### 场景 3：连续对话
```
助手：你想要什么风格？
用户：真实风格

系统理解：
✅ 检测到 contextState = 'waiting_style'  
✅ 用户回复"真实风格" = 选择了 realistic 风格
✅ 应用风格，继续下一步
```

## 技术细节

### 上下文状态存储
```typescript
interface ContextState {
  type: 'waiting_image_confirmation' | 'waiting_style' | null
  data?: {
    uploadData?: UploadResult      // 图片分析结果
    userMessage?: string           // 用户原始消息
    previousAction?: string        // 上一步操作
  }
}
```

### 确认意图识别
```typescript
const isConfirmation = (message: string) => {
  const lower = message.toLowerCase()
  return (
    lower.includes('对') || 
    lower.includes('是') || 
    lower.includes('没错') ||
    lower.includes('正确') ||
    lower.includes('准确') ||
    (!lower.includes('不对') && message.length < 50) // 短回复 + 无否定词
  )
}
```

## 优势

1. **更自然的对话** - 像人一样记住上下文
2. **用户可控** - 每一步都可以确认/修正
3. **透明度高** - 展示系统的理解，避免"黑盒"
4. **降低错误** - 对齐后再执行，减少理解偏差
5. **灵活进化** - 可随时通过对话调整方向

## 未来扩展

- [ ] 支持更多上下文类型（waiting_video_style, waiting_confirmation 等）
- [ ] 上下文历史记录（撤销/重做）
- [ ] 多轮确认对话
- [ ] 上下文可视化展示
- [ ] 智能上下文过期机制

## 迭代记录

**v1.0** (2026-04-05)
- ✅ 上下文状态管理
- ✅ 图片上传对齐流程
- ✅ 确认意图识别
- ✅ 对话历史增强（10→15条）
