---
name: 02-storyboard-generate
version: 1.1.0
description: |
  分镜图生成。将脚本转为分镜提示词，并用即梦生成分镜图片。支持文生图和图生图两种模式。
  触发场景：用户选定脚本后、要求生成分镜、需要可视化脚本内容。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 分镜图生成 Skill

## 流程

```
1. 接收脚本       →  Script 对象（含场景列表）
2. Claude 分镜化  →  每帧：画面描述 + 英文提示词 + 镜头角度 + 转场
3. 生成图片       →  dreamina text2image / image2image
4. 填充分镜       →  每帧 imageUrl 更新
5. 用户审核       →  可修改单帧提示词重新生成
```

## 两种图片生成模式

### 模式 A: 文生图（默认）
无参考图时，纯用提示词生成每帧分镜图片。
```
dreamina text2image --prompt="..." --ratio=16:9 --model_version=5.0 --poll=60
```

### 模式 B: 图生图（有参考图）
用户上传的参考图作为基础，叠加分镜提示词生成。
```
dreamina image2image --images="./ref.png" --prompt="..." --ratio=16:9 --poll=60
```

参考图自动分配给各帧（轮流或一一对应）。

## 图片格式处理

上传的图片可能是 HEIC/BMP/TIFF 等不支持的格式，自动转换：
```
sips -s format png input.heic --out output.png    # macOS
ffmpeg -i input.bmp output.png -y                  # 备选
```

## 人物一致性处理

当脚本包含人物角色时：
```
真人照片 → convertCharacterStyle(style) → 风格化参考图
→ 每帧提示词加入 "consistent character from reference"
```

支持风格：lineart / anime / cartoon3d / watercolor / cyberpunk / cg_realistic

## 帧数规则

每帧 3~5 秒，总帧数 = round(duration / 3.5)

| 时长 | 帧数 |
|------|------|
| 15s | 4~5 |
| 30s | 8~9 |
| 60s | 17 |
| 180s | 51 |
| 300s | 86 |

## 关键代码

- 分镜引擎: `src/lib/ai/storyboard-engine.ts`
- 图片生成: `src/lib/video/dreamina-image.ts`
- API: `src/app/api/storyboard/route.ts`
- 组件: `src/components/storyboard/StoryboardGrid.tsx`

## 迭代记录

- v1.0.0: 基础分镜提示词生成（无图片）
- v1.1.0: 集成 dreamina text2image + image2image 双模式，图片格式自动转换
- v1.2.0: 合成模式 — 每12帧合成1张提示词一次生图，大幅提速；3帧并行生成；仅支持9:16和16:9默认竖版
- v1.3.0: 上传图片智能分类（人物/产品/场景），描述注入分镜提示词
- v1.4.0: 分镜重新生成（全部/单帧/重新上传参考图/清除参考图）；人物生图默认竖版9:16
- 待迭代: 帧间一致性增强
