---
name: tool-image-classify
version: 1.0.0
description: |
  上传图片智能分类。用 Claude 视觉能力识别图片类型（人物/产品/场景），
  并提取描述信息，用于生成更精准的分镜提示词。
  触发场景：用户上传图片时自动分析。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 上传图片智能分类

## 流程

```
用户上传图片 → POST /api/upload → 保存到 public/uploads/
                                → Claude 视觉分析每张图
                                → 返回 { category, description }
```

## 分类类型

| category | 说明 | 下游处理 |
|----------|------|----------|
| character | 人物（真人/画像） | 风格转换 → 保持角色一致性 |
| product | 产品（商品/设备） | 融入分镜画面，确保产品特征准确 |
| scene | 场景/风景 | 作为画面风格和氛围参考 |

## 下游影响

分类结果影响分镜生成：
1. **人物描述** → 注入到脚本场景的 visual 中 → Claude 生成包含角色特征的提示词
2. **产品描述** → 同上，确保产品在分镜中被正确呈现
3. **人物图路径** → 传给 `fillStoryboardImages` 做风格转换
4. **所有图路径** → 作为 `referenceImages` 用于 image2image

## Claude 分析 Prompt

```
分析图片 → 返回 { category: "character|product|scene", description: "30字描述" }
```

## 关键代码

- API: `src/app/api/upload/route.ts`

## 迭代记录

- v1.0.0: Claude 视觉分类 + 描述提取 + 分类汇总反馈
