---
name: tool-character-transform
version: 1.0.0
description: |
  人物形象风格转换。真人照片转为线稿/动漫/CG等风格，保留人物特征，
  绕过视频生成平台"不支持真人参考"的限制。
  触发场景：用户上传人物照片要生成视频、需要角色一致性。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 人物形象风格转换

## 为什么需要

Seedance/Kling 不支持直接用真人照片做参考生成视频。
解决方案：真人 → 风格化（保留五官体态） → 作为首帧参考 → 生成视频。

## 流程

```
1. 用户上传真人照片
2. 格式检查（HEIC/BMP → PNG 自动转换）
3. 选择风格（默认 cg_realistic）
4. dreamina image2image 转换
5. 输出风格化图片 → 用于视频生成参考
```

## 风格类型

| 风格 | 说明 | 推荐场景 |
|------|------|----------|
| lineart | 线稿 | 动画、概念视频 |
| anime | 动漫化 | 二次元视频 |
| cartoon3d | Pixar 3D | 卡通广告 |
| watercolor | 水彩 | 艺术片 |
| cyberpunk | 赛博朋克 | 科幻 |
| cg_realistic | CG写实 | 最接近真人，推荐默认 |

## 命令

```bash
dreamina image2image \
  --images="./person.jpg" \
  --prompt="Convert to photorealistic CG rendering, preserve all facial features..." \
  --model_version=5.0 \
  --ratio=1:1 \
  --resolution_type=2k \
  --poll=60
```

## 关键代码

- 转换: `src/lib/video/dreamina-image.ts` → `convertCharacterStyle()`
- Pipeline: `src/lib/ai/storyboard-engine.ts` → `prepareCharacterForVideo()`
- API: `src/app/api/character-style/route.ts`

## 迭代记录

- v1.0.0: 6种风格转换 + 格式自动处理
- 待迭代: 多角度参考图生成（正面/侧面/背面）、角色表情表
