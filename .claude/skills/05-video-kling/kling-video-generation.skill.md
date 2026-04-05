---
name: 05-video-kling
version: 1.0.0
description: |
  可灵视频生成。通过可灵 API 生成视频片段，支持文生视频和图生视频。
  触发场景：用户选择可灵引擎、需要快速视频生成。
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
---

# 可灵视频生成

## 鉴权

JWT (HS256)：Access Key + Secret Key → token（30分钟有效）

```js
jwt.sign({ iss: AK, exp: now + 1800, nbf: now - 5 }, SK, { algorithm: 'HS256' })
```

## 关键配置

| 配置 | 值 |
|------|-----|
| 域名 | `api-beijing.klingai.com`（中国大陆必须） |
| 文生视频 | `POST /v1/videos/text2video` |
| 图生视频 | `POST /v1/videos/image2video` |
| 查询 | `GET /v1/videos/text2video/{task_id}` |
| 网络 | Node.js `https` 模块直连（绕过代理） |

## 参数

| 参数 | 值 |
|------|-----|
| model_name | kling-v1 / kling-v1-5 / kling-v2 |
| duration | '5' 或 '10' |
| aspect_ratio | 16:9 / 9:16 / 1:1 |
| mode | std / pro |
| cfg_scale | 0~1，默认 0.5 |

## 状态码

| code | 含义 |
|------|------|
| 0 | 成功 |
| 1002 | JWT 鉴权失败 |
| 1200 | 服务端内部错误（域名错误时常见） |

## 关键代码

`src/lib/video/kling.ts`

## 迭代记录

- v1.0.0: JWT鉴权 + text2video + image2video + 轮询 + 直连绕代理
- 已验证: 域名从 api.klingai.com → api-beijing.klingai.com，路径从 /generation → /text2video
