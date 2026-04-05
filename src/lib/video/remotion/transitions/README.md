# Remotion 转场效果系统

基于 Remotion 的可扩展转场效果库。

## 架构

```
transitions/
├── types.ts                  # 类型定义和缓动函数
├── README.md                 # 本文档
├── TransitionFactory.tsx     # 转场工厂（动态选择转场组件）
├── FadeTransition.tsx        # 淡入淡出
├── SlideTransition.tsx       # 滑动
├── ZoomTransition.tsx        # 缩放
├── RotateTransition.tsx      # 旋转
└── WipeTransition.tsx        # 擦除
```

## 转场类型

| 类型 | 效果 | 参数 |
|------|------|------|
| **none** | 无转场 | - |
| **fade** | 淡入淡出 | duration, easing |
| **slide** | 滑动 | direction, duration, easing |
| **zoom** | 缩放 | zoomType, scale, origin, duration, easing |
| **rotate** | 旋转 | axis, angle, perspective, duration, easing |
| **wipe** | 擦除 | direction, duration, easing |

## 使用方式

### 1. 在分镜数据中配置

```typescript
const frame: StoryboardFrame = {
  // ... 其他字段
  transition: {
    type: 'slide',
    config: {
      direction: 'left',
      duration: 20,      // 帧数
      easing: 'ease-out'
    }
  }
}
```

### 2. 向后兼容（简单模式）

```typescript
const frame: StoryboardFrame = {
  // ... 其他字段
  transition: 'fade'  // 使用默认配置
}
```

### 3. 在 Remotion 组件中使用

```typescript
import { TransitionFactory } from './transitions/TransitionFactory'

<TransitionFactory
  config={frame.transition}
  progress={progress}
>
  <Content />
</TransitionFactory>
```

## 缓动函数

支持 7 种缓动函数：

- `linear` - 线性
- `ease-in` - 缓入（二次）
- `ease-out` - 缓出（二次）
- `ease-in-out` - 缓入缓出（二次）
- `ease-in-cubic` - 缓入（三次）
- `ease-out-cubic` - 缓出（三次）
- `ease-in-out-cubic` - 缓入缓出（三次）

## 性能考虑

- 使用 CSS `transform` 代替 `left/top`（GPU 加速）
- 避免触发重排（reflow）
- 转场时长建议 15-30 帧（0.5-1秒）
- 使用 `will-change` 提示浏览器优化

## 扩展自定义转场

1. 创建新组件实现 `TransitionProps` 接口
2. 在 `TransitionFactory` 中注册
3. 更新 `TransitionType` 类型
4. 添加配置接口

```typescript
// 示例：自定义转场
export const MyTransition: React.FC<TransitionProps> = ({
  children,
  progress,
  config,
}) => {
  const easedProgress = applyEasing(progress, config.easing)
  
  return (
    <div style={{
      opacity: easedProgress,
      // 自定义效果...
    }}>
      {children}
    </div>
  )
}
```

## 测试

```bash
# 测试所有转场效果
npx tsx scripts/test-transitions.ts --all

# 测试单个转场
npx tsx scripts/test-transitions.ts --type=slide
```
