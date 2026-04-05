---
name: sys-product-lock
version: 1.0.0
description: |
  产品一致性引擎。深度分析产品图片，提取精确视觉特征，生成约束提示词，
  防止AI生成错误的产品外观（如手机摄像头数量错误、Logo变形）。
  触发场景：用户上传产品图片时自动分析。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 产品一致性引擎

## 问题

AI 生图/生视频时产品外观容易出错：
- 手机摄像头数量/排列错误（最常见）
- Logo 位置/样式变形
- 产品颜色/材质偏差
- 按键/接口位置不对

## 解决方案

```
上传产品图 → Claude 深度分析 → 提取精确特征
                              → 生成正面约束提示词
                              → 生成负面提示词（防止什么）
                              → 检测是否高风险产品
                              → 建议上传三视图
```

## 高风险产品

以下产品类型需要特别注意一致性：
- 智能手机（摄像头排列）
- 笔记本电脑（Logo、键盘）
- 手表（表盘、表冠）
- 相机（镜头、按键）
- 汽车（车标、大灯）
- 鞋子（Logo、鞋底）

## 三视图建议

对高风险产品，自动建议用户上传多角度图片：
- 手机：正面、背面、侧面
- 笔记本：打开、合盖
- 手表：正面、侧面

## 产品约束注入

分析结果 → 注入到脚本场景的 visual 描述 → Claude 生成分镜提示词时包含产品约束

```
positiveConstraint: "[PRODUCT: Honor 500, silver, triple camera in triangle layout...]"
negativeConstraint: "extra camera lens, wrong logo, distorted screen"
```

## 关键代码

- 引擎: `src/lib/ai/product-consistency.ts`
- 集成: `src/app/api/upload/route.ts`（上传时自动分析）
- 集成: `src/app/api/storyboard/route.ts`（注入约束）

## 迭代记录

- v1.0.0: 产品深度分析 + 特征锁定 + 负面提示词 + 高风险检测 + 三视图建议
- v1.1.0: 产品图贯穿全流程 — 分镜每帧image2image传入产品图，视频生成每帧multimodal2video传入全部产品图
