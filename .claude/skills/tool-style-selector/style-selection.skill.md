---
name: tool-style-selector
version: 1.0.0
description: |
  视频风格选择。在生成脚本前让用户选择视觉风格（真实/电影/动漫/3D/插画），
  风格贯穿脚本→分镜→视频全流程。
  触发场景：选完时长后、生成脚本前。
allowed-tools:
  - Read
  - Edit
  - Write
---

# 视频风格选择

## 流程位置

```
选题 → 选方向(9:16/16:9) → 选时长 → 选风格 → 生成脚本
```

## 风格选项

| ID | 名称 | 说明 |
|----|------|------|
| realistic | 📷 真实写实 | 真人实拍质感 |
| cinematic | 🎬 电影质感 | 电影级画面、调色 |
| anime | 🎨 动漫风格 | 日系/国漫 |
| cartoon | 🧊 3D卡通 | Pixar/皮克斯风 |
| commercial | ✏️ 扁平插画 | 商业插画风 |

## 风格如何贯穿

1. **脚本生成**：style 参数传入 Claude，影响创意方向
2. **分镜提示词**：Claude 的 style_base 统一风格关键词
3. **分镜图片**：dreamina 生图的风格提示词
4. **视频生成**：Seedance/Kling 的提示词包含风格约束

## 真实风格设备信息

真实风格的提示词包含完整的摄影设备参数：
```
shot on Sony A7IV with 35mm f/1.4 lens, natural lighting, shallow depth of field,
film grain, photorealistic, 8K resolution, RAW photo quality
```

电影风格：
```
shot on ARRI Alexa Mini with anamorphic lens, cinematic lighting,
Kodak film stock look, lens flare, bokeh
```

## 参数修改

选完风格后展示确认卡片，支持单独修改：
- 修改方向 → 重新选 9:16/16:9
- 修改时长 → 重新选时长
- 修改风格 → 重新选风格
- 确认生成 → 开始

## 关键代码

- 风格预设: `src/lib/ai/style-presets.ts`
- 选择 UI: `src/app/page.tsx` → `pick_style` + `confirm_generate`
- 分镜引擎: `src/lib/ai/storyboard-engine.ts` → `getStylePreset()` + `applyStyleToPrompt()`

## 迭代记录

- v1.0.0: 5种风格选择，贯穿脚本和分镜生成
- v1.1.0: 风格预设含设备/镜头信息；选完后确认卡片，支持单项修改
